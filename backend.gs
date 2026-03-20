/**
 * Backend code for Google Apps Script.
 * Optimized for performance using CacheService and PropertiesService.
 */

const CACHE_TTL = 3600; // 1 hour
const PROPERTIES = PropertiesService.getScriptProperties();

function processExcelData(data) {
  try {
    const timestamp = new Date().toLocaleString('it-IT', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    }).replace(/[/, :]/g, '_');
    
    // 1. Create a new Spreadsheet
    const spreadsheetName = `Export_STWD_${timestamp}`;
    const ss = SpreadsheetApp.create(spreadsheetName);
    const ssId = ss.getId();
    
    // Store as latest file
    PROPERTIES.setProperty('LATEST_FILE_ID', ssId);
    
    // 2. Import data into tabs
    const sheetsToProcess = ['DATI_YTD', 'DatiLPG'];
    
    sheetsToProcess.forEach(sheetName => {
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
    });
    
    // Remove the default "Foglio1" if it's empty and not one of our targets
    const defaultSheet = ss.getSheetByName('Foglio1') || ss.getSheetByName('Sheet1');
    if (defaultSheet && !sheetsToProcess.includes(defaultSheet.getName())) {
      ss.deleteSheet(defaultSheet);
    }
    
    // 3. Export as .csv files in the Drive root
    const csvFiles = [];
    sheetsToProcess.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        const csvContent = convertSheetToCsv(sheet);
        const fileName = `${sheetName}_${timestamp}.csv`;
        const file = DriveApp.createFile(fileName, csvContent, MimeType.CSV);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        csvFiles.push(fileName);
      }
    });

    // 4. Set Spreadsheet permissions
    const spreadsheetFile = DriveApp.getFileById(ssId);
    spreadsheetFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Clear cache as data has changed
    CacheService.getScriptCache().removeAll(['all_data', 'latest_file_info']);
    
    return {
      success: true,
      spreadsheetUrl: ss.getUrl(),
      csvFiles: csvFiles,
      message: "Conversione completata con successo."
    };
    
  } catch (error) {
    return {
      success: false,
      message: "Errore nel backend: " + error.toString()
    };
  }
}

/**
 * Handle POST requests from external sources (e.g., Cloudflare Workers)
 */
function doPost(e) {
  try {
    const contents = e.postData.contents;
    // Debounced or conditional logging could be better, but keeping it for now
    logToSheet("Incoming Request", contents.substring(0, 500) + "...");
    
    const payload = JSON.parse(contents);
    let result;

    if (payload.action === 'read') {
      result = getRealTimeData(payload.pbl);
    } else {
      result = processExcelData(payload);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Errore doPost: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Searches for the latest "Export_STWD_" file and extracts data for a specific PBL.
 * Uses CacheService for near-instant response on repeated queries.
 * Uses PropertiesService to avoid searching Drive repeatedly.
 */
function getRealTimeData(targetPbl) {
  const cache = CacheService.getScriptCache();
  const cacheKey = "pbl_" + targetPbl;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  try {
    let latestFile = null;
    const storedId = PROPERTIES.getProperty('LATEST_FILE_ID');
    
    if (storedId) {
      try {
        latestFile = DriveApp.getFileById(storedId);
        if (latestFile.isTrashed()) latestFile = null;
      } catch (e) {
        latestFile = null;
      }
    }

    if (!latestFile) {
      const fileIterator = DriveApp.searchFiles("title contains 'Export_STWD_' and trashed = false");
      let latestDate = 0;

      while (fileIterator.hasNext()) {
        const file = fileIterator.next();
        const created = file.getDateCreated().getTime();
        if (created > latestDate) {
          latestDate = created;
          latestFile = file;
        }
      }
      
      if (latestFile) {
        PROPERTIES.setProperty('LATEST_FILE_ID', latestFile.getId());
      }
    }

    if (!latestFile) {
      return { success: false, message: "Nessun file 'Export_STWD_' trovato su Google Drive." };
    }

    const ss = SpreadsheetApp.open(latestFile);
    const sheet = ss.getSheetByName("DATI_YTD");
    
    if (!sheet) {
      return { success: false, message: "Foglio 'DATI_YTD' non trovato nell'ultimo export." };
    }

    // Cache the whole sheet data for 10 minutes to speed up different PBL lookups
    let allValues;
    const sheetCache = cache.get("all_sheet_values");
    if (sheetCache) {
      allValues = JSON.parse(sheetCache);
    } else {
      allValues = sheet.getDataRange().getValues();
      try {
        // Only cache if it's not too big (GAS cache limit is 100KB per entry)
        const stringified = JSON.stringify(allValues);
        if (stringified.length < 90000) {
          cache.put("all_sheet_values", stringified, 600);
        }
      } catch (e) {}
    }

    const headers = allValues[0];
    
    // Find column indices
    const headerMap = headers.reduce((acc, h, i) => {
      acc[h.toString().trim().toUpperCase()] = i;
      return acc;
    }, {});

    const colPbl = headerMap["PBL"] ?? 0;
    const colProdotto = headerMap["PRODOTTO"] ?? 12;
    const colMesi = headerMap["MESI"] ?? 13;
    const colSellin = headerMap["SELLIN"] ?? 15;
    const colServito = headerMap["SERVITO"] ?? 17;
    const colSellinPY = headerMap["SELLINPY"] ?? 18;

    const target = targetPbl.toString().trim();
    const filteredRows = allValues.slice(1).filter(row => {
      if (!row[colPbl]) return false;
      const rowPbl = row[colPbl].toString().trim();
      return rowPbl === target || parseInt(rowPbl, 10) === parseInt(target, 10);
    });

    if (filteredRows.length === 0) {
      return { 
        success: false, 
        message: `PBL "${targetPbl}" non trovato nel file: ${latestFile.getName()}.` 
      };
    }

    const dashboardData = filteredRows.map(row => ({
      mese: row[colMesi],
      prodotto: row[colProdotto],
      sellin: parseFloat(row[colSellin]) || 0,
      servito: parseFloat(row[colServito]) || 0,
      sellinPY: parseFloat(row[colSellinPY]) || 0
    }));

    const result = {
      success: true,
      pbl: targetPbl,
      fileName: latestFile.getName(),
      data: dashboardData
    };

    // Cache the result for this specific PBL
    cache.put(cacheKey, JSON.stringify(result), CACHE_TTL);

    return result;

  } catch (error) {
    return { success: false, message: "Errore nel recupero dati: " + error.toString() };
  }
}

/**
 * Utility to convert a sheet to CSV string - Optimized
 */
function convertSheetToCsv(sheet) {
  const data = sheet.getDataRange().getValues();
  return data.map(row => 
    row.map(cell => {
      let cellValue = cell.toString();
      if (cellValue.includes(",") || cellValue.includes("\"") || cellValue.includes("\n")) {
        return "\"" + cellValue.replace(/"/g, "\"\"") + "\"";
      }
      return cellValue;
    }).join(",")
  ).join("\n");
}

/**
 * Serves the HTML file
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Excel to Google Sheets Converter')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Optimized logging
 */
function logToSheet(type, message) {
  // Only log if it's not a standard read request to save time, or use a threshold
  if (type === "Debug Info") return; 
  
  try {
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      const storedLogId = PROPERTIES.getProperty('LOG_FILE_ID');
      if (storedLogId) {
        ss = SpreadsheetApp.openById(storedLogId);
      } else {
        const files = DriveApp.getFilesByName("MODULA_Debug_Logs");
        if (files.hasNext()) {
          ss = SpreadsheetApp.open(files.next());
        } else {
          ss = SpreadsheetApp.create("MODULA_Debug_Logs");
        }
        PROPERTIES.setProperty('LOG_FILE_ID', ss.getId());
      }
    }
    
    let sheet = ss.getSheetByName("Logs");
    if (!sheet) sheet = ss.insertSheet("Logs");
    
    sheet.appendRow([new Date(), type, message]);
  } catch (e) {}
}
