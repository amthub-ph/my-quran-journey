const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const mod=new Module('push-schedule');
mod._compile(ts.transpileModule(fs.readFileSync('lib/push-schedule.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,'push-schedule.js');
const {dueOccurrence}=mod.exports;
const reminder={id:1,user_id:'test',title:'Reading',reminder_time:'05:21:00',days_of_week:[5],timezone:'Asia/Manila',enabled:true,created_at:'2026-10-15T20:00:00Z'};
test('Manila Friday reminder fires at the correct UTC minute',()=>assert.equal(dueOccurrence(reminder,Date.parse('2026-10-15T21:21:30Z')),'2026-10-16/05:21'));
test('delayed scheduler catches up within five minutes',()=>assert.equal(dueOccurrence(reminder,Date.parse('2026-10-15T21:25:30Z')),'2026-10-16/05:21'));
test('does not send old, future, disabled, or wrong-day reminders',()=>{
 for(const instant of ['2026-10-15T21:20:00Z','2026-10-15T21:26:00Z','2026-10-16T21:21:00Z']) assert.equal(dueOccurrence(reminder,Date.parse(instant)),null);
 assert.equal(dueOccurrence({...reminder,enabled:false},Date.parse('2026-10-15T21:21:00Z')),null);
});
test('new reminder cannot backfill an occurrence before it was saved',()=>assert.equal(dueOccurrence({...reminder,created_at:'2026-10-15T21:22:00Z'},Date.parse('2026-10-15T21:23:00Z')),null));
test('repeated DST hour has one delivery identity',()=>{
 const dst={...reminder,timezone:'America/New_York',reminder_time:'01:30',days_of_week:[0]};
 assert.equal(dueOccurrence(dst,Date.parse('2026-11-01T05:30:00Z')),dueOccurrence(dst,Date.parse('2026-11-01T06:30:00Z')));
});
