function processExcelData(extractedData) {
  try {
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
    var fileName = "Export_STWD_" + timestamp;
    
    // Create new spreadsheet
    var ss = SpreadsheetApp.create(fileName);
    var targetFolder = null;
    
    // Optional: Move to a specific folder if needed, e.g., the root or a standard folder target.
    
    // Create sheets and paste data
    var createdSheets = [];
    var csvFiles = [];
    
    for (var sheetName in extractedData) {
      var data = extractedData[sheetName];
      if (!data || data.length === 0) continue;
      
      var sheet = ss.insertSheet(sheetName);
      // Data might have different row lengths, let's normalize or simply write it
      var numRows = data.length;
      var numCols = Math.max.apply(null, data.map(function(row) { return row.length; }));
      
      // Ensure rectangular array
      var cleanData = data.map(function(row) {
        var newRow = new Array(numCols);
        for (var i = 0; i < numCols; i++) {
          newRow[i] = row[i] !== undefined ? row[i] : "";
        }
        return newRow;
      });
      
      sheet.getRange(1, 1, numRows, numCols).setValues(cleanData);
      createdSheets.push(sheetName);
      csvFiles.push(sheetName + ".csv"); // Mock CSV files for return
    }
    
    // Remove the default "Sheet1" or "Foglio1"
    var defaultSheets = ss.getSheets();
    for (var i = 0; i < defaultSheets.length; i++) {
      var sName = defaultSheets[i].getName();
      if (sName !== "DATI_YTD" && sName !== "DatiLPG" && createdSheets.indexOf(sName) === -1) {
        ss.deleteSheet(defaultSheets[i]);
      }
    }
    
    return {
      success: true,
      spreadsheetUrl: ss.getUrl(),
      csvFiles: csvFiles,
      message: "Data processed successfully"
    };
  } catch (error) {
    return {
      success: false,
      message: "Error processing excel data: " + error.toString()
    };
  }
}
