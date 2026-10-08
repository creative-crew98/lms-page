// Copy this file into the existing Google Sheet's Apps Script project.
// Update the landing-page endpoint constant if this web app deployment changes.
// Requires CRM receiver secrets in Script Properties for sheet-to-CRM sync.
var CRM_SHEET_SYNC_BATCH = 10;

function syncSheetLeadsToCrm() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    var properties = PropertiesService.getScriptProperties();
    var sheetId =
      properties.getProperty("CRM_SOURCE_SHEET_ID") ||
      properties.getProperty("SHEET_ID");
    var sheetName = properties.getProperty("CRM_SOURCE_SHEET_NAME") || "Leads";
    if (!sheetId)
      throw new Error("Set CRM_SOURCE_SHEET_ID in Script properties.");
    var sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
    if (!sheet) throw new Error("Could not find the configured leads sheet.");
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    if (lastRow < 2 || lastColumn < 1) return;

    var headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
    var normalized = headers.map(function (value) {
      return crmSheetNormalizeHeader_(value);
    });
    var statusColumn = normalized.indexOf("crmdelivery");
    if (statusColumn < 0) statusColumn = normalized.indexOf("crmsyncstatus");
    if (statusColumn < 0) {
      statusColumn = lastColumn;
      sheet.getRange(1, statusColumn + 1).setValue("CRM delivery");
      headers.push("CRM delivery");
      normalized.push("crmdelivery");
      lastColumn++;
    }

    var processed = 0;
    for (var end = lastRow; end >= 2 && processed < CRM_SHEET_SYNC_BATCH; ) {
      var start = Math.max(2, end - 199);
      var rows = sheet
        .getRange(start, 1, end - start + 1, lastColumn)
        .getDisplayValues();
      for (
        var i = rows.length - 1;
        i >= 0 && processed < CRM_SHEET_SYNC_BATCH;
        i--
      ) {
        var rowNumber = start + i;
        var existingStatus = String(rows[i][statusColumn] || "")
          .trim()
          .toLowerCase();
        var stageColumn = normalized.indexOf("submissionstage");
        var submissionStage = stageColumn >= 0
          ? String(rows[i][stageColumn] || "").trim().toLowerCase()
          : "";
        // New staged leads must finish the questionnaire before CRM delivery.
        // Blank stages are older rows and retain the existing sync behavior.
        if (
          submissionStage &&
          submissionStage !== "completed" &&
          submissionStage !== "booked"
        )
          continue;
        if (
          existingStatus.indexOf("delivered") >= 0 ||
          existingStatus === "synced"
        )
          continue;
        if (
          rows[i].every(function (value) {
            return !String(value || "").trim();
          })
        )
          continue;
        var lead = crmSheetBuildLead_(headers, normalized, rows[i], properties);
        if (!lead.name || !lead.phone) {
          sheet
            .getRange(rowNumber, statusColumn + 1)
            .setValue("Skipped - missing name or phone");
          continue;
        }
        processed++;
        var result = crmSheetSendLead_(lead, properties);
        sheet
          .getRange(rowNumber, statusColumn + 1)
          .setValue(
            result.delivered ? "Delivered to CRM" : "Pending - " + result.error,
          );
      }
      end = start - 1;
    }
  } finally {
    lock.releaseLock();
  }
}

function crmSheetBuildLead_(headers, normalized, row, properties) {
  function value(names) {
    for (var i = 0; i < names.length; i++) {
      var index = normalized.indexOf(names[i]);
      if (index >= 0 && row[index]) return String(row[index]).trim();
    }
    return "";
  }
  var firstName = value(["firstname", "givenname"]);
  var lastName = value(["lastname", "familyname", "surname"]);
  var name =
    value(["name", "fullname", "leadname", "contactname"]) ||
    [firstName, lastName].filter(Boolean).join(" ");
  var answers = {};
  var rawAnswers = value(["answers", "responses", "formanswers"]);
  if (rawAnswers) {
    try {
      var parsed = JSON.parse(rawAnswers);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
        answers = parsed;
      else if (Array.isArray(parsed))
        parsed.forEach(function (item) {
          if (item && item.question)
            answers[String(item.question)] = String(item.answer || "");
        });
    } catch (ignored) {
      /* Individual answer columns below remain available. */
    }
  }
  var reserved = {
    timestamp: 1,
    submittedat: 1,
    createdat: 1,
    eventid: 1,
    leadid: 1,
    name: 1,
    fullname: 1,
    leadname: 1,
    contactname: 1,
    firstname: 1,
    givenname: 1,
    lastname: 1,
    familyname: 1,
    surname: 1,
    phone: 1,
    phonenumber: 1,
    mobile: 1,
    mobileno: 1,
    contactnumber: 1,
    email: 1,
    emailaddress: 1,
    source: 1,
    leadsource: 1,
    crmstatus: 1,
    crmdelivery: 1,
    crmsyncstatus: 1,
    submissionstage: 1,
    status: 1,
  };
  normalized.forEach(function (header, index) {
    if (!header || reserved[header] || !String(row[index] || "").trim()) return;
    answers[headers[index]] = String(row[index]).trim();
  });
  return {
    name: name,
    phone: value([
      "phone",
      "phonenumber",
      "mobile",
      "mobileno",
      "contactnumber",
    ]),
    email: value(["email", "emailaddress"]),
    answers: answers,
    source:
      value(["source", "leadsource"]) ||
      properties.getProperty("CRM_LEAD_SOURCE") ||
      "Landing page",
    status: "new",
  };
}

function crmSheetSendLead_(lead, properties) {
  var endpoint = properties.getProperty("CRM_LEAD_RECEIVER_URL");
  var secret = properties.getProperty("CRM_LEAD_INGEST_SECRET");
  if (!endpoint || !secret)
    return { delivered: false, error: "CRM connection is not configured" };
  if (
    !/^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/super-worker$/i.test(
      endpoint,
    )
  )
    return { delivered: false, error: "CRM receiver URL is invalid" };
  try {
    var response = UrlFetchApp.fetch(endpoint, {
      method: "post",
      contentType: "application/json",
      muteHttpExceptions: true,
      headers: { Authorization: "Bearer " + secret },
      payload: JSON.stringify(lead),
    });
    var body = JSON.parse(response.getContentText() || "{}");
    if (
      response.getResponseCode() >= 200 &&
      response.getResponseCode() < 300 &&
      body.success === true
    )
      return { delivered: true };
    return { delivered: false, error: "HTTP " + response.getResponseCode() };
  } catch (error) {
    console.error("Lead sync failed: " + error.message);
    return { delivered: false, error: "receiver unavailable" };
  }
}

function crmSheetNormalizeHeader_(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function installCrmSheetSync() {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === "syncSheetLeadsToCrm";
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });
  ScriptApp.newTrigger("syncSheetLeadsToCrm")
    .timeBased()
    .everyMinutes(5)
    .create();
  syncSheetLeadsToCrm();
}

// Paste into Apps Script opened from the destination Google Sheet.
// Update the existing web app deployment to a new version after pasting.
// Destination ID from the Google Sheet URL supplied in the screenshot.
const DEFAULT_SHEET_ID = "1qLws_hgMiXZvcRpfagSXUJdnfAGgclFuAODuY5Z1OsE";
const BOOKING_TIMES = ["10:30", "12:00", "13:30", "15:00", "16:30", "18:00"];
const BOOKING_ZONE = "Asia/Kolkata";
function bookingDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || ""))
    throw new Error("Choose a valid booking date.");
  const day = new Date(value + "T00:00:00+05:30");
  if (
    isNaN(day.getTime()) ||
    Utilities.formatDate(day, BOOKING_ZONE, "yyyy-MM-dd") !== value
  )
    throw new Error("Choose a valid booking date.");
  return day;
}
function bookingCell(value, pattern) {
  return value instanceof Date
    ? Utilities.formatDate(value, BOOKING_ZONE, pattern)
    : String(value || "").replace(/^'/, "");
}
function bookedSlots(sheet) {
  if (sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 18, sheet.getLastRow() - 1, 2)
    .getValues()
    .map(function (row) {
      return {
        date: bookingCell(row[0], "yyyy-MM-dd"),
        time: bookingCell(row[1], "HH:mm"),
      };
    })
    .filter(function (slot) {
      return slot.date && slot.time;
    });
}
function slotAllowed(date, time, now) {
  const day = bookingDay(date);
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  const today = Utilities.formatDate(now, BOOKING_ZONE, "yyyy-MM-dd");
  const horizon = new Date(bookingDay(today).getTime() + 30 * 86400000);
  return (
    weekday !== 0 &&
    BOOKING_TIMES.indexOf(time) !== -1 &&
    day >= bookingDay(today) &&
    day <= horizon &&
    new Date(date + "T" + time + ":00+05:30") > now
  );
}
function doGet(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!e || e.parameter.action !== "availability")
      throw new Error("Unknown request.");
    const now = new Date(),
      today = Utilities.formatDate(now, BOOKING_ZONE, "yyyy-MM-dd");
    const start = e.parameter.start || today;
    const end =
      e.parameter.end ||
      Utilities.formatDate(
        new Date(bookingDay(start).getTime() + 13 * 86400000),
        BOOKING_ZONE,
        "yyyy-MM-dd",
      );
    const first = bookingDay(start),
      last = bookingDay(end);
    if (
      first < bookingDay(today) ||
      last < first ||
      last - first > 30 * 86400000 ||
      last - bookingDay(today) > 30 * 86400000
    )
      throw new Error("Choose dates within the next 30 days.");
    lock.waitLock(10000);
    const taken = bookedSlots(getLeadSheet());
    const dates = [];
    for (
      let instant = first.getTime();
      instant <= last.getTime();
      instant += 86400000
    ) {
      const date = Utilities.formatDate(
        new Date(instant),
        BOOKING_ZONE,
        "yyyy-MM-dd",
      );
      if (new Date(date + "T12:00:00Z").getUTCDay() === 0) continue;
      dates.push({
        date: date,
        times: BOOKING_TIMES.filter(function (time) {
          return (
            slotAllowed(date, time, now) &&
            !taken.some(function (slot) {
              return slot.date === date && slot.time === time;
            })
          );
        }),
      });
    }
    return jsonResponse({
      success: true,
      timezone: BOOKING_ZONE,
      dates: dates,
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
function setup() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet)
    throw new Error("Open Apps Script from your Google Sheet first.");
  PropertiesService.getScriptProperties().setProperty(
    "SHEET_ID",
    spreadsheet.getId(),
  );
  getLeadSheet();
}

function getLeadSheet() {
  const id =
    PropertiesService.getScriptProperties().getProperty("SHEET_ID") ||
    DEFAULT_SHEET_ID;
  const spreadsheet = SpreadsheetApp.openById(id);
  const sheet =
    spreadsheet.getSheetByName("Leads") || spreadsheet.insertSheet("Leads");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Event ID",
      "Name",
      "Phone",
      "Email",
      "Best time to call",
      "Message",
      "Role",
      "Current LMS",
      "Challenge",
      "Goal",
      "Student count",
      "Course type",
      "Priority",
      "Implementation timeline",
      "Lead segment",
      "Lead score",
    ]);
    sheet.setFrozenRows(1);
  }
  const bookingHeaders = sheet.getRange(1, 18, 1, 2).getValues()[0];
  if (
    bookingHeaders.some(function (value, index) {
      return (
        value && value !== ["Booking date (IST)", "Booking time (IST)"][index]
      );
    })
  )
    throw new Error(
      "Columns R and S must be empty or contain the booking headers. Move other data before setup.",
    );
  if (!bookingHeaders[0] || !bookingHeaders[1])
    sheet
      .getRange(1, 18, 1, 2)
      .setValues([["Booking date (IST)", "Booking time (IST)"]]);
  const crmHeader = sheet.getRange(1, 20).getValue();
  if (crmHeader && crmHeader !== "CRM delivery")
    throw new Error("Column T is reserved for CRM delivery status. Move other data before setup.");
  if (!crmHeader) sheet.getRange(1, 20).setValue("CRM delivery");
  const stageHeader = sheet.getRange(1, 21).getValue();
  if (stageHeader && stageHeader !== "Submission stage")
    throw new Error("Column U is reserved for submission stage. Move other data before setup.");
  if (!stageHeader) sheet.getRange(1, 21).setValue("Submission stage");
  return sheet;
}

function findLeadRow_(sheet, leadId) {
  if (sheet.getLastRow() < 2) return null;
  return sheet.getRange(2, 2, sheet.getLastRow() - 1, 1)
    .createTextFinder(leadId).matchEntireCell(true).useRegularExpression(false).findNext();
}

function mergeLeadData_(sheet, rowNumber, data, leadId, fields) {
  const current = sheet.getRange(rowNumber, 1, 1, 21).getValues()[0];
  function safeText(value) {
    const text = String(value == null ? "" : value);
    if (text.length > 45000) throw new Error("Field is too long.");
    return /^[=+\-@\s]/.test(text) ? "'" + text : text;
  }
  function setIfProvided(column, value) {
    if (value !== undefined && value !== null && String(value).trim() !== "") current[column - 1] = safeText(value);
  }
  current[0] = current[0] || new Date();
  current[1] = safeText(leadId);
  setIfProvided(3, data.name);
  setIfProvided(4, data.phone);
  setIfProvided(5, data.email);
  setIfProvided(6, data.bestTimeToCall);
  setIfProvided(7, data.message);
  fields.forEach(function(field, index) {
    const value = data.answers && data.answers[field] !== undefined ? data.answers[field] : data[field];
    setIfProvided(8 + index, value);
  });
  setIfProvided(16, data.leadSegment);
  setIfProvided(17, data.leadScore);
  if (data.bookingDate && data.bookingTime) {
    current[17] = safeText(data.bookingDate);
    current[18] = safeText(data.bookingTime);
  }
  const requestedStage = data.action === "book" ? "booked" : String(data.submissionStage || "contact").toLowerCase();
  const stageRank = { "": 0, contact: 1, answers: 2, completed: 3, booked: 4 };
  if (stageRank[requestedStage] === undefined) throw new Error("Unknown submission stage.");
  const previousStage = String(current[20] || "").toLowerCase();
  if ((stageRank[requestedStage] || 0) >= (stageRank[previousStage] || 0)) current[20] = safeText(requestedStage);
  sheet.getRange(rowNumber, 1, 1, 19).setValues([current.slice(0, 19)]);
  sheet.getRange(rowNumber, 21).setValue(current[20]);
  return current;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse(e.postData.contents);
    const answers = data.answers || {};
    const fields = [
      "role",
      "currentLms",
      "challenge",
      "goal",
      "studentCount",
      "courseType",
      "priority",
      "implementationTimeline",
    ];
    const leadId = data.leadId || data.eventId;
    if (!leadId || typeof leadId !== "string" || leadId.length > 200)
      throw new Error("Lead identifier is required.");
    lock.waitLock(10000);
    const sheet = getLeadSheet();
    if (data.action === "book") {
      if (![data.name, data.phone, data.email].every(function (value) {
        return typeof value === "string" && value.trim();
      })) throw new Error("Contact details are required.");
      if (
        fields.some(function (field) {
          return !answers[field] || typeof answers[field] !== "string";
        })
      )
        throw new Error("Complete all eight questions first.");
      const previous = findLeadRow_(sheet, leadId);
      if (previous) {
        const slot = sheet.getRange(previous.getRow(), 18, 1, 2).getValues()[0];
        if (slot[0] && slot[1])
          return jsonResponse({
            success: true,
            booked: true,
            date: bookingCell(slot[0], "yyyy-MM-dd"),
            time: bookingCell(slot[1], "HH:mm"),
            duplicate: true,
          });
      }
      if (!slotAllowed(data.bookingDate, data.bookingTime, new Date()))
        throw new Error(
          "Choose a future Monday-Saturday time slot within 30 days.",
        );
      if (
        bookedSlots(sheet).some(function (slot) {
          return (
            slot.date === data.bookingDate && slot.time === data.bookingTime
          );
        })
      )
        return jsonResponse({
          success: false,
          code: "SLOT_TAKEN",
          error:
            "That time was just booked. Please choose another available slot.",
        });
      const rowNumber = previous ? previous.getRow() : sheet.getLastRow() + 1;
      if (!previous) sheet.getRange(rowNumber, 1).setValue(new Date());
      mergeLeadData_(sheet, rowNumber, data, leadId, fields);
      SpreadsheetApp.flush();
      return jsonResponse({
        success: true,
        booked: true,
        date: data.bookingDate,
        time: data.bookingTime,
      });
    }
    if (data.submissionStage === "completed") {
      if (![data.name, data.phone, data.email].every(function (value) {
        return typeof value === "string" && value.trim();
      })) throw new Error("Contact details are required.");
      if (fields.some(function (field) {
        return !answers[field] || typeof answers[field] !== "string";
      })) throw new Error("Complete all eight questions first.");
    } else {
      const hasContactOrMessage = [data.name, data.phone, data.email, data.message]
        .some(function (value) { return typeof value === "string" && value.trim(); });
      const hasAnswer = fields.some(function (field) {
        const value = answers[field] !== undefined ? answers[field] : data[field];
        return value !== undefined && value !== null && String(value).trim();
      });
      if (!hasContactOrMessage && !hasAnswer)
        throw new Error("Add contact details or an answer before saving.");
    }

    const existing = findLeadRow_(sheet, leadId);
    const rowNumber = existing ? existing.getRow() : sheet.getLastRow() + 1;
    if (!existing) sheet.getRange(rowNumber, 1).setValue(new Date());
    mergeLeadData_(sheet, rowNumber, data, leadId, fields);
    SpreadsheetApp.flush();
    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
