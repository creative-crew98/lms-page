// Paste into Apps Script opened from the destination Google Sheet.
// Update the existing web app deployment to a new version after pasting.
// Destination ID from the Google Sheet URL supplied in the screenshot.
const DEFAULT_SHEET_ID = "1qLws_hgMiXZvcRpfagSXUJdnfAGgclFuAODuY5Z1OsE";
function setup() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Open Apps Script from your Google Sheet first.");
  PropertiesService.getScriptProperties().setProperty("SHEET_ID", spreadsheet.getId());
  getLeadSheet();
}

function getLeadSheet() {
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID") || DEFAULT_SHEET_ID;
  const spreadsheet = SpreadsheetApp.openById(id);
  const sheet = spreadsheet.getSheetByName("Leads") || spreadsheet.insertSheet("Leads");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Event ID", "Name", "Phone", "Email", "Best time to call", "Message", "Role", "Current LMS", "Challenge", "Goal", "Student count", "Course type", "Priority", "Implementation timeline", "Lead segment", "Lead score"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse(e.postData.contents);
    if (![data.name, data.phone, data.email].every(function(value) {
      return typeof value === "string" && value.trim();
    })) throw new Error("Contact details are required.");
    const answers = data.answers || {};
    const fields = ["role", "currentLms", "challenge", "goal", "studentCount", "courseType", "priority", "implementationTimeline"];
    const safeText = function(value) {
      const text = String(value == null ? "" : value);
      if (text.length > 45000) throw new Error("Field is too long.");
      return /^[=+\-@\s]/.test(text) ? "'" + text : text;
    };
    const values = [data.eventId, data.name, data.phone, data.email, data.bestTimeToCall, data.message]
      .concat(fields.map(function(field) { return answers[field] || data[field] || ""; }))
      .concat([data.leadSegment, data.leadScore]).map(safeText);
    lock.waitLock(10000);
    const sheet = getLeadSheet();
    // A retry after a lost response should not create a duplicate lead.
    if (data.eventId && sheet.getLastRow() > 1) {
      const existing = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1)
        .createTextFinder(safeText(data.eventId)).matchEntireCell(true).useRegularExpression(false).findNext();
      if (existing) return jsonResponse({ success: true });
    }
    sheet.appendRow([new Date()].concat(values));
    SpreadsheetApp.flush();
    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
