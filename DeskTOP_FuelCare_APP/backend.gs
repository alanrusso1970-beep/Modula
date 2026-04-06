/**
 * Backend code for Google Apps Script.
 * Optimized for performance using CacheService and PropertiesService.
 */

const CACHE_TTL = 3600; // 1 hour [cite: 1, 2]
const PROPERTIES = PropertiesService.getScriptProperties(); [cite: 2]

function processExcelData(data) {
  try {
    const timestamp = new Date().toLocaleString('it-IT', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    }).replace(/[/, :]/g, '_'); [cite: 2]

    const spreadsheetName = `Export_STWD_${timestamp}`; [cite: 3]
    const ss = SpreadsheetApp.create(spreadsheetName); [cite: 3]
    const ssId = ss.getId(); [cite: 4]
    
    PROPERTIES.setProperty('LATEST_FILE_ID', ssId); [cite: 4]

    const sheetsToProcess = ['DATI_YTD', 'DatiLPG']; [cite: 5]
    sheetsToProcess.forEach(sheetName => { [cite: 6]
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      } else {
        sheet.clear();
      }
      
      const sheetData = data[sheetName];
      if (sheetData && sheetData.length > 0) {
        sheet.getRange(1, 1, sheetData.length, sheetData[0].length).setValues(sheetData);
      }
    }); [cite: 6]

    const defaultSheet = ss.getSheetByName('Foglio1') || ss.getSheetByName('Sheet1'); [cite: 7, 8]
    if (defaultSheet && !sheetsToProcess.includes(defaultSheet.getName())) {
      ss.deleteSheet(defaultSheet); [cite: 8, 9]
    }
    
    const csvFiles = []; [cite: 9]
    sheetsToProcess.forEach(sheetName => { [cite: 10]
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        const csvContent = convertSheetToCsv(sheet);
        const fileName = `${sheetName}_${timestamp}.csv`;
        const file = DriveApp.createFile(fileName, csvContent, MimeType.CSV);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        csvFiles.push(fileName);
      }
    }); [cite: 10]

    const spreadsheetFile = DriveApp.getFileById(ssId); [cite: 11]
    spreadsheetFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); [cite: 11]

    CacheService.getScriptCache().removeAll(['all_data', 'latest_file_info']); [cite: 12]
    return {
      success: true,
      spreadsheetUrl: ss.getUrl(),
      csvFiles: csvFiles,
      message: "Conversione completata con successo."
    }; [cite: 13, 14]
    
  } catch (error) {
    return {
      success: false,
      message: "Errore nel backend: " + error.toString()
    }; [cite: 14, 15]
  }
}

/**
 * Handle POST requests from external sources
 */
function doPost(e) {
  try {
    const contents = e.postData.contents; [cite: 15]
    const payload = JSON.parse(contents); [cite: 17]

    // Esegue il log solo se non è un'azione di lettura per risparmiare tempo [cite: 18]
    if (payload.action !== 'read') { [cite: 18]
      logToSheet("Incoming Request", contents.substring(0, 500) + "..."); [cite: 18, 19]
    }

    let result;
    if (payload.action === 'read') { [cite: 20]
      result = getRealTimeData(payload.pbl); [cite: 20]
    } else {
      result = processExcelData(payload); [cite: 21]
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON); [cite: 22]
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Errore doPost: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON); [cite: 23, 24]
  }
}

function getRealTimeData(targetPbl) {
  const cache = CacheService.getScriptCache(); [cite: 26]
  const cacheKey = "pbl_" + targetPbl; [cite: 26]
  const cachedData = cache.get(cacheKey); [cite: 26]

  if (cachedData) {
    return JSON.parse(cachedData); [cite: 27]
  }

  try {
    let latestFile = null;
    const storedId = PROPERTIES.getProperty('LATEST_FILE_ID'); [cite: 28]
    
    if (storedId) {
      try {
        latestFile = DriveApp.getFileById(storedId);
        if (latestFile.isTrashed()) latestFile = null; [cite: 29]
      } catch (e) {
        latestFile = null; [cite: 29, 30]
      }
    }

    if (!latestFile) {
      const fileIterator = DriveApp.searchFiles("title contains 'Export_STWD_' and trashed = false"); [cite: 30]
      let latestDate = 0;

      while (fileIterator.hasNext()) {
        const file = fileIterator.next();
        const created = file.getDateCreated().getTime(); [cite: 31, 32]
        if (created > latestDate) {
          latestDate = created;
          latestFile = file; [cite: 32, 33]
        }
      }
      
      if (latestFile) {
        PROPERTIES.setProperty('LATEST_FILE_ID', latestFile.getId()); [cite: 33, 34]
      }
    }

    if (!latestFile) {
      return { success: false, message: "Nessun file 'Export_STWD_' trovato su Google Drive." }; [cite: 34, 35]
    }

    const ss = SpreadsheetApp.open(latestFile); [cite: 35]
    const sheet = ss.getSheetByName("DATI_YTD"); [cite: 35]
    if (!sheet) {
      return { success: false, message: "Foglio 'DATI_YTD' non trovato nell'ultimo export." }; [cite: 36]
    }

    let allValues;
    const sheetCache = cache.get("all_sheet_values"); [cite: 38]
    if (sheetCache) {
      allValues = JSON.parse(sheetCache); [cite: 38]
    } else {
      allValues = sheet.getDataRange().getValues(); [cite: 39]
      try {
        const stringified = JSON.stringify(allValues);
        if (stringified.length < 90000) {
          cache.put("all_sheet_values", stringified, 600); [cite: 40, 41]
        }
      } catch (e) {}
    }

    const headers = allValues[0]; [cite: 42]
    const headerMap = headers.reduce((acc, h, i) => {
      acc[h.toString().trim().toUpperCase()] = i;
      return acc;
    }, {}); [cite: 43]

    const colPbl = headerMap["PBL"] ?? 0; [cite: 44]
    const colProdotto = headerMap["PRODOTTO"] ?? 12;
    const colMesi = headerMap["MESI"] ?? 13; [cite: 44]
    const colSellin = headerMap["SELLIN"] ?? 15; [cite: 45]
    const colServito = headerMap["SERVITO"] ?? 17;
    const colSellinPY = headerMap["SELLINPY"] ?? 18; [cite: 45]

    const target = targetPbl.toString().trim(); [cite: 46]
    const filteredRows = allValues.slice(1).filter(row => {
      if (!row[colPbl]) return false;
      const rowPbl = row[colPbl].toString().trim();
      return rowPbl === target || parseInt(rowPbl, 10) === parseInt(target, 10);
    }); [cite: 46]

    if (filteredRows.length === 0) {
      return { 
        success: false, 
        message: `PBL "${targetPbl}" non trovato nel file: ${latestFile.getName()}.` 
      }; [cite: 47]
    }

    const dashboardData = filteredRows.map(row => ({
      mese: row[colMesi],
      prodotto: row[colProdotto],
      sellin: parseFloat(row[colSellin]) || 0,
      servito: parseFloat(row[colServito]) || 0,
      sellinPY: parseFloat(row[colSellinPY]) || 0
    })); [cite: 48]

    const result = {
      success: true,
      pbl: targetPbl,
      fileName: latestFile.getName(),
      data: dashboardData
    }; [cite: 49]
    cache.put(cacheKey, JSON.stringify(result), CACHE_TTL); [cite: 50]

    return result;
  } catch (error) {
    return { success: false, message: "Errore nel recupero dati: " + error.toString() }; [cite: 51]
  }
}

function convertSheetToCsv(sheet) {
  const data = sheet.getDataRange().getValues(); [cite: 52]
  return data.map(row => 
    row.map(cell => {
      let cellValue = cell.toString();
      if (cellValue.includes(",") || cellValue.includes("\"") || cellValue.includes("\n")) {
        return "\"" + cellValue.replace(/"/g, "\"\"") + "\"";
      }
      return cellValue;
    }).join(",")
  ).join("\n"); [cite: 53]
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Excel to Google Sheets Converter')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); [cite: 54, 55]
}

function logToSheet(type, message) {
  if (type === "Debug Info") return; [cite: 55]
  try {
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      const storedLogId = PROPERTIES.getProperty('LOG_FILE_ID'); [cite: 56]
      if (storedLogId) {
        ss = SpreadsheetApp.openById(storedLogId); [cite: 57]
      } else {
        const files = DriveApp.getFilesByName("MODULA_Debug_Logs"); [cite: 58]
        if (files.hasNext()) {
          ss = SpreadsheetApp.open(files.next()); [cite: 59]
        } else {
          ss = SpreadsheetApp.create("MODULA_Debug_Logs"); [cite: 60]
        }
        PROPERTIES.setProperty('LOG_FILE_ID', ss.getId()); [cite: 61]
      }
    }
    
    let sheet = ss.getSheetByName("Logs"); [cite: 62]
    if (!sheet) sheet = ss.insertSheet("Logs"); [cite: 63]
    
    sheet.appendRow([new Date(), type, message]); [cite: 63]
  } catch (e) {}
}