// Paste this file into a new Google Apps Script project and set SPREADSHEET_ID.
// Deploy it as a Web app: Execute as "Me", access "Anyone".
const SPREADSHEET_ID = "15wYQlag52Di2q2PC2sa364AihvtS33WjhxIFSyKBwYg";
const SHEET_NAME = 'RSVP';
const EXCEL_FILE_NAME = 'Ответы RSVP.xlsx';

function doPost(event) {
  const payload = JSON.parse(event.postData.contents || '{}');
  if (!payload.name || !payload.phone || !payload.attendance) {
    return json_({ ok: false, error: 'Required fields are missing' });
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Дата и время', 'Имя и фамилия', 'Телефон', 'Присутствие', 'Компания', 'Гости']);
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    new Date(),
    payload.name,
    payload.phone,
    payload.attendance === 'yes' ? 'Да' : 'Нет',
    payload.company === 'with-guests' ? 'С гостями' : 'Один / одна',
    (payload.guests || []).join('; '),
  ]);
  sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  sheet.autoResizeColumns(1, 6);
  exportExcel_(spreadsheet.getId());
  return json_({ ok: true });
}

function exportExcel_(spreadsheetId) {
  const properties = PropertiesService.getScriptProperties();
  const oldFileId = properties.getProperty('EXCEL_FILE_ID');
  if (oldFileId) {
    try { DriveApp.getFileById(oldFileId).setTrashed(true); } catch (error) {}
  }
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
  const blob = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
  }).getBlob().setName(EXCEL_FILE_NAME);
  const file = DriveApp.createFile(blob);
  properties.setProperty('EXCEL_FILE_ID', file.getId());
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
