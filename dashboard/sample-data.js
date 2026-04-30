const now = Date.now()
const iso = (minsAgo) => new Date(now - minsAgo * 60 * 1000).toISOString()
window.APIARY_SAMPLE_RUN = {
  "schemaVersion":"apiary.run.v1",
  "runId":"sample-task-provenance",
  "projectId":"apiary-dashboard",
  "taskId":"task-provenance-v1",
  "title":"Build task provenance v1",
  "taskTitle":"Task Provenance: who ordered it, who worked it, what happened",
  "status":"running",
  "privacyMode":true,
  "createdAt":iso(42),
  "updatedAt":iso(1),
  "coordinator":{"adapter":"openclaw","label":"Dexter"},
  "summary":{"total":4,"queued":0,"running":1,"waiting":1,"blocked":0,"done":2,"failed":0,"canceled":0,"stale":0},
  "scouts":[
    {"id":"ux","label":"UX worker","role":"ux/design","modelRole":"cheapWorker","model":"demo-mini","status":"done","startedAt":iso(38),"completedAt":iso(20),"lastSeenAt":iso(20),"progress":100,"summary":"Designed a timeline-first trail with friendly chips and expandable details.","awaiting":null},
    {"id":"data","label":"Data model worker","role":"architecture/data-model","modelRole":"balancedWorker","model":"demo-mini","status":"done","startedAt":iso(36),"completedAt":iso(18),"lastSeenAt":iso(18),"progress":100,"summary":"Recommended append-only provenance events with task, run, actor, and payload fields.","awaiting":null},
    {"id":"build","label":"Build worker","role":"implementation/frontend","modelRole":"cheapWorker","model":"demo-mini","status":"running","startedAt":iso(15),"lastSeenAt":iso(1),"progress":64,"summary":"Wiring the task history panel, worker chips, and event filters.","awaiting":null},
    {"id":"review","label":"Risk reviewer","role":"reviewer/privacy","modelRole":"reviewer","model":null,"status":"waiting_user","startedAt":iso(14),"lastSeenAt":iso(2),"progress":70,"summary":"Checking that logs are summarized by default and tooltips explain privacy limits.","awaiting":"Confirm how much raw log detail to show by default."}
  ],
  "events":[
    {"ts":iso(42),"kind":"task.created","severity":"info","actorType":"main","actorName":"Dexter","summary":"Rickie asked to build v1 of task provenance for the dashboard."},
    {"ts":iso(40),"kind":"decision.made","severity":"info","actorType":"main","actorName":"Dexter","summary":"Use a timeline-first design: useful before fancy graph views.","payload":{"rationale":"Easy to understand on mobile and preserves detail."}},
    {"ts":iso(38),"kind":"worker.dispatched","severity":"info","scoutId":"ux","actorType":"worker","summary":"UX worker assigned to make the trail understandable and fun."},
    {"ts":iso(36),"kind":"worker.dispatched","severity":"info","scoutId":"data","actorType":"worker","summary":"Data model worker assigned to define provenance fields."},
    {"ts":iso(20),"kind":"run.completed","severity":"success","scoutId":"ux","actorType":"worker","summary":"UX worker finished the chip + timeline interaction model."},
    {"ts":iso(18),"kind":"run.completed","severity":"success","scoutId":"data","actorType":"worker","summary":"Data model worker finished the event envelope."},
    {"ts":iso(15),"kind":"worker.dispatched","severity":"info","scoutId":"build","actorType":"worker","summary":"Build worker started implementing the dashboard v1."},
    {"ts":iso(2),"kind":"run.log","severity":"warning","scoutId":"review","actorType":"worker","summary":"Reviewer flagged that privacy mode is display-only, so the UI should say that clearly."},
    {"ts":iso(1),"kind":"run.log","severity":"info","scoutId":"build","actorType":"worker","summary":"History panel and provenance timeline are being rendered from ledger events."}
  ],
  "decisionAwaiting":null
}
