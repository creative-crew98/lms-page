const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../google-apps-script/Code.gs'), 'utf8');
function fixture() {
  const rows = [], now = Date.parse('2026-10-07T04:00:00Z'); let locked = false;
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } }
  function range(row, col, height = 1, width = 1) {
    assert.ok(locked, 'Sheet access must occur under the script lock');
    return { getValue: () => rows[row - 1]?.[col - 1] || '', getValues: () => Array.from({length: height}, (_,i) => Array.from({length: width}, (_,j) => rows[row+i-1]?.[col+j-1] || '')), setValues: values => { values.forEach((cells,i) => { rows[row+i-1] ||= []; cells.forEach((value,j) => rows[row+i-1][col+j-1] = value); }); }, createTextFinder: value => { const finder = {matchEntireCell: () => finder, useRegularExpression: () => finder, findNext: () => { const index = rows.findIndex((cells,i) => i >= row-1 && i < row-1+height && cells[col-1] === value); return index < 0 ? null : { getRow: () => index+1 }; }}; return finder; } };
  }
  const sheet = { getLastRow: () => rows.length, appendRow: row => {assert.ok(locked); rows.push(row);}, setFrozenRows: () => {}, getRange: range };
  const context = vm.createContext({ Date: Clock, SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush: () => assert.ok(locked) }, PropertiesService: {getScriptProperties: () => ({getProperty: () => 'fixture'})}, LockService: {getScriptLock: () => ({waitLock: () => { assert.equal(locked, false); locked = true; }, hasLock: () => locked, releaseLock: () => { locked = false; }})}, Utilities: {formatDate: (date,zone,pattern) => { const shifted = new Date(date.getTime() + 19800000).toISOString(); return pattern === 'HH:mm' ? shifted.slice(11,16) : shifted.slice(0,10); }}, ContentService: {MimeType: {JSON: 'json'}, createTextOutput: text => ({setMimeType: () => JSON.parse(text)})} });
  vm.runInContext(source, context);
  return { context, rows, post: data => context.doPost({postData:{contents:JSON.stringify(data)}}), available: (start='2026-10-07',end='2026-10-13') => context.doGet({parameter:{action:'availability',start,end}}) };
}
const answers = Object.fromEntries(['role','currentLms','challenge','goal','studentCount','courseType','priority','implementationTimeline'].map(key => [key,'Answer']));
const lead = (id,date='2026-10-08',time='10:30') => ({name:'Test Owner',phone:'+919876543210',email:'test@example.com',answers,leadId:id,submissionStage:'completed',action:'book',bookingDate:date,bookingTime:time});
test('Mon-Sat offers six IST slots, omits Sunday and excludes booked times', () => {
 const f=fixture(); const result=f.available(); assert.equal(result.success,true); assert.equal(result.dates.some(day=>day.date==='2026-10-11'),false); assert.equal(result.dates.find(day=>day.date==='2026-10-08').times.length,6);
 assert.equal(f.post(lead('first')).booked,true);
 assert.equal(f.available().dates.find(day=>day.date==='2026-10-08').times.includes('10:30'),false);
 assert.equal(f.rows[1][17],'2026-10-08'); assert.equal(f.rows[1][18],'10:30'); assert.equal(f.rows[1][2],'Test Owner');
});
test('slot conflicts are rejected, same-lead retries are idempotent, other days remain available', () => {
 const f=fixture(); assert.equal(f.post(lead('first')).success,true); assert.equal(f.post(lead('second')).code,'SLOT_TAKEN'); assert.equal(f.rows.length,2);
 const repeated=f.post(lead('first')); assert.equal(repeated.duplicate,true); assert.equal(f.rows.length,2);
 assert.equal(f.post(lead('second','2026-10-09')).success,true); assert.equal(f.rows.length,3);
});
test('existing completed contact row receives booking without a duplicate and formula values stay escaped', () => {
 const f=fixture(); const data=lead('existing'); delete data.action; data.name='=malicious'; assert.equal(f.post(data).success,true); assert.equal(f.rows.length,2);
 assert.equal(f.post({...data,action:'book'}).success,true); assert.equal(f.rows.length,2); assert.equal(f.rows[1][2],"'=malicious");
});
test('invalid dates, Sundays, past times, unsupported times and incomplete answers cannot reserve', () => {
 const f=fixture(); assert.equal(f.post(lead('sunday','2026-10-11')).success,false); assert.equal(f.post(lead('invalid','2026-02-30')).success,false); assert.equal(f.post(lead('time','2026-10-08','11:00')).success,false); assert.equal(f.post(lead('past','2026-10-06')).success,false); assert.equal(f.post({...lead('missing'),answers:{role:'Owner'}}).success,false); assert.equal(f.available('2026-10-01').success,false); assert.equal(f.rows.length,1);
 const now=f.context.slotAllowed('2026-10-07','10:30',new Date('2026-10-07T05:01:00Z')); assert.equal(now,false);
});
