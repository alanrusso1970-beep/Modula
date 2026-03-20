/**
 * Backend code for Google Apps Script.
 * To use this, create a new Google Apps Script project and paste this code into Code.gs.
 */

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
    const data = JSON.parse(e.postData.contents);
    const result = processExcelData(data);
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
 * Utility to convert a sheet to CSV string
 */
function convertSheetToCsv(sheet) {
  const data = sheet.getDataRange().getValues();
  let csv = "";
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      let cellValue = data[i][j].toString();
      if (cellValue.includes(",") || cellValue.includes("\"") || cellValue.includes("\n")) {
        cellValue = "\"" + cellValue.replace(/"/g, "\"\"") + "\"";
      }
      csv += cellValue + (j < data[i].length - 1 ? "," : "");
    }
    csv += "\n";
  }
  return csv;
}

/**
 * Serves the HTML file (for GAS Web App)
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Excel to Google Sheets Converter')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
