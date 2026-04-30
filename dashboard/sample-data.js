window.APIARY_SAMPLE_RUN = {
  "schemaVersion":"apiary.run.v1","runId":"sample","title":"Hive Board sample","status":"running","privacyMode":true,"updatedAt":new Date().toISOString(),"summary":{"total":4,"queued":0,"running":1,"waiting":1,"blocked":0,"done":2,"failed":0,"canceled":0,"stale":0},
  "scouts":[
    {"id":"ux","label":"UX scout","role":"uxScout","modelRole":"cheapScout","model":"demo-mini","status":"done","lastSeenAt":new Date().toISOString(),"progress":100,"summary":"Designed the Hive Board metaphor.","awaiting":null},
    {"id":"tech","label":"Tech scout","role":"techScout","modelRole":"cheapScout","model":"demo-mini","status":"running","lastSeenAt":new Date().toISOString(),"progress":55,"summary":"Building a no-dependency dashboard plan.","awaiting":null},
    {"id":"review","label":"Risk reviewer","role":"reviewer","modelRole":"reviewer","model":null,"status":"waiting_user","lastSeenAt":new Date().toISOString(),"progress":70,"summary":"Needs a privacy mode decision.","awaiting":"Choose whether details are hidden by default."},
    {"id":"docs","label":"Docs scout","role":"docsScout","modelRole":"balancedScout","model":"demo-mini","status":"done","lastSeenAt":new Date().toISOString(),"progress":100,"summary":"Drafted usage docs.","awaiting":null}
  ],
  "events":[{"ts":new Date().toISOString(),"severity":"warning","message":"Reviewer is waiting for a privacy mode decision."},{"ts":new Date().toISOString(),"severity":"success","message":"UX scout finished."}],"decisionAwaiting":"Confirm privacy mode default."
}
