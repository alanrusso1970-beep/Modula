/**
 * BACKEND FUELCARE - VERSION 3.1 (LPG BUGFIX)
 */

var LOG_DOC_ID = "104DUbUscAeEV0DcONzW7nT7unnxkKcQo2GWm-s1Tq0I";

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) throw new Error("Nessun dato");
    var payload = JSON.parse(e.postData.contents);
    var result;
    if (payload.action === 'read') {
      result = getAllRealTimeData(payload.pbl);
    } else if (payload.DATI_YTD || payload.DatiLPG) {
      // Se il payload contiene dati estratti dall'Excel
      result = processExcelData(payload);
    } else {
      result = { success: false, message: "Azione non supportata." };
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({success: false, message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllRealTimeData(targetPbl) {
  try {
    var cache = CacheService.getScriptCache();
    var cacheKey = "realtime_" + targetPbl;
    var cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log("Cache Hit: Data for " + targetPbl);
      return JSON.parse(cachedData);
    }

    var props = PropertiesService.getScriptProperties();
    var latestFileId = props.getProperty("LATEST_FILE_ID");
    var latestFileTimestamp = props.getProperty("LATEST_FILE_TIME");
    var now = new Date().getTime();
    
    var latestFile = null;
    
    // Se non abbiamo un ID o se sono passati più di 10 minuti, cerchiamo il file
    if (!latestFileId || !latestFileTimestamp || (now - parseInt(latestFileTimestamp)) > 600000) {
      console.log("Searching Drive for latest file...");
      var fileIterator = DriveApp.searchFiles("title contains 'Export_STWD_'");
      var latestDate = 0;
      while (fileIterator.hasNext()) {
        var file = fileIterator.next();
        var created = file.getDateCreated().getTime();
        if (created > latestDate) { latestDate = created; latestFile = file; }
      }
      if (latestFile) {
        props.setProperty("LATEST_FILE_ID", latestFile.getId());
        props.setProperty("LATEST_FILE_TIME", now.toString());
      }
    } else {
      console.log("Using cached file ID: " + latestFileId);
      latestFile = DriveApp.getFileById(latestFileId);
    }

    if (!latestFile) return { success: false, message: "File non trovato." };
    var ss = SpreadsheetApp.open(latestFile);
    var allData = [];

    // Estrazione Petrol
    allData = allData.concat(fetchFromSheet(ss, "DATI_YTD", targetPbl, false));
    // Estrazione GPL
    allData = allData.concat(fetchFromSheet(ss, "DatiLPG", targetPbl, true));

    var result = { success: true, pbl: targetPbl, data: allData };
    
    // Salva in cache per 10 minuti (600 secondi)
    cache.put(cacheKey, JSON.stringify(result), 600);
    
    return result;
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function fetchFromSheet(ss, sheetName, targetPbl, isLPG) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0];
  var normalize = function(h) { return h ? h.toString().trim().toUpperCase().replace(/[\s\._-]/g, '') : ""; };
  var cleanPbl = function(p) { return p ? p.toString().trim().replace(/^0+/, '') : ""; };
  
  var pblIdx = -1, prodIdx = -1, mesiIdx = -1, sellinIdx = -1, sellinPYIdx = -1;
  for (var i = 0; i < headers.length; i++) {
    var h = normalize(headers[i]);
    if (h === "PBL" || h === "CODICE") pblIdx = i;
    if (h === "PRODOTTO" || h === "PRODUCT") prodIdx = i;
    if (h === "MESI" || h === "MESE" || h === "MONTH") mesiIdx = i;
    if (h === "SELLIN") sellinIdx = i;
    if (h === "SELLINPY" || h === "SELLINPY-1") sellinPYIdx = i;
  }

  // Fallback colonne N, O, P per GPL
  if (isLPG) {
    if (mesiIdx === -1) mesiIdx = 13; // N
    if (sellinPYIdx === -1) sellinPYIdx = 14; // O
    if (sellinIdx === -1) sellinIdx = 15; // P
  }

  var targetPblClean = cleanPbl(targetPbl);

  return data.slice(1).filter(function(row) {
    if (pblIdx !== -1) return cleanPbl(row[pblIdx]) === targetPblClean;
    return row.some(function(cell) { return cleanPbl(cell) === targetPblClean; });
  }).map(function(row) {
    return {
      mese: row[mesiIdx] || "N/A",
      // FORZIAMO "GPL" se siamo nel foglio LPG per sincronizzarlo con la Dashboard
      prodotto: isLPG ? "GPL" : (row[prodIdx] || "N/A"),
      sellin: parseFloat((row[sellinIdx]||"").toString().replace(',', '.')) || 0,
      sellinPY: parseFloat((row[sellinPYIdx]||"").toString().replace(',', '.')) || 0,
      self: !isLPG ? (parseFloat((row[15]||"").toString().replace(',', '.')) || 0) : 0,
      servito: !isLPG ? (parseFloat((row[17]||"").toString().replace(',', '.')) || 0) : 0
    };
  });
}

function processExcelData(extractedData) {
  try {
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
    var fileName = "Export_STWD_" + timestamp;
    
    // Crea un nuovo spreadsheet
    var ss = SpreadsheetApp.create(fileName);
    
    var createdSheets = [];
    var csvFiles = [];
    
    for (var sheetName in extractedData) {
      var data = extractedData[sheetName];
      if (!data || data.length === 0) continue;
      
      var sheet = ss.insertSheet(sheetName);
      
      // Assicurati che i dati siano una matrice rettangolare
      var numRows = data.length;
      var numCols = Math.max.apply(null, data.map(function(row) { return (row && row.length) ? row.length : 0; }));
      
      var cleanData = data.map(function(row) {
        var newRow = new Array(numCols);
        for (var i = 0; i < numCols; i++) {
          newRow[i] = (row && row[i] !== undefined) ? row[i] : "";
        }
        return newRow;
      });
      
      sheet.getRange(1, 1, numRows, numCols).setValues(cleanData);
      createdSheets.push(sheetName);
      csvFiles.push(fileName + "_" + sheetName + ".csv");
    }
    
    // Rimuovi il foglio predefinito 1 se vuoto
    var defaultSheets = ss.getSheets();
    for (var i = 0; i < defaultSheets.length; i++) {
      var sName = defaultSheets[i].getName();
      if (sName !== "DATI_YTD" && sName !== "DatiLPG" && createdSheets.indexOf(sName) === -1) {
        ss.deleteSheet(defaultSheets[i]);
      }
    }
    
    // Aggiorna immediatamente la proprietà del file più recente
    var props = PropertiesService.getScriptProperties();
    props.setProperty("LATEST_FILE_ID", ss.getId());
    props.setProperty("LATEST_FILE_TIME", new Date().getTime().toString());
    
    // Pulisci la cache generale per forzare il refresh al prossimo accesso
    CacheService.getScriptCache().removeAll(["LATEST_FILE_ID"]); // Non necessario se usiamo solo PropertiesService per l'ID, ma utile se avessimo cache globale

    return {
      success: true,
      spreadsheetUrl: ss.getUrl(),
      csvFiles: csvFiles,
      message: "Dati Excel elaborati con successo"
    };
  } catch (error) {
    return {
      success: false,
      message: "Errore durante l'elaborazione dei dati Excel: " + error.toString()
    };
  }
}