const $ = (id) => document.getElementById(id)
const labels = { queued:'Queued', running:'Gathering', waiting_tool:'Waiting on tool', waiting_user:'Waiting for you', waiting_model:'Waiting for model', needs_review:'Needs review', needs_tests:'Needs tests', blocked:'Blocked', retrying:'Trying again', done:'Finished', failed:'Failed', canceled:'Canceled', stale:'Quiet too long' }
const icons = { queued:'○', running:'🐝', waiting_tool:'🛠️', waiting_user:'👋', waiting_model:'⏳', needs_review:'🔎', needs_tests:'🧪', blocked:'⚠️', retrying:'↻', done:'✓', failed:'✕', canceled:'−', stale:'…' }
const toneIcons = { good:'✓', bad:'!', warning:'!', waiting:'⏳', running:'↻', decision:'💡', dispatch:'↗', log:'i', info:'i', done:'✓', blocked:'!', failed:'✕', stale:'…' }
const eventKindLabels = {
  'task.created':'Task born', 'command.sent':'Command issued', 'decision.made':'Decision made', 'worker.dispatched':'Worker dispatched',
  'run.started':'Worker started', 'run.log':'Worker log', 'run.completed':'Worker completed', 'run.failed':'Worker failed', 'artifact.created':'Artifact saved',
  state:'Hive signal', success:'Success', warning:'Warning', error:'Problem', info:'Info'
}
const workerTypeIcons = [
  [/queen|main|coordinator|dexter/i, '👑'], [/ux|design/i, '🎨🐝'], [/risk|review|security|devil|advers/i, '🛡️🐝'],
  [/doc|write/i, '📚🐝'], [/tech|code|impl|engineer/i, '🛠️🐝'], [/research|evidence/i, '🔎🐝'], [/adapt|map/i, '🧭🐝'],
  [/safety/i, '🦺🐝'], [/reliab|test|verify/i, '✅🐝'],
]
function workerIcon(worker){ const key=`${worker?.role||''} ${worker?.label||''} ${worker?.id||''}`; return workerTypeIcons.find(([re])=>re.test(key))?.[1] || '🐝' }
const activeStatuses = new Set(['queued','running','waiting_tool','retrying','waiting_model','needs_review','needs_tests'])
const STALE_AFTER_MS = 5 * 60 * 1000
let currentRun = null, selectedId = null, privacy = false, healthFilter = 'all', historyFilter = 'all', historyScroll = { all:0, active:0, done:0 }, chipScroll = 0, runRegistry = [], selectedRunId = null, eventFilter = 'all', lastRunUpdatedAt = 0, lastUserViewportAction = 0
const AUTO_REFRESH_PAUSE_MS = 15000
function age(iso){ if(!iso) return '—'; const s=Math.max(0,Math.round((Date.now()-new Date(iso))/1000)); if(s<60)return `${s}s ago`; const m=Math.round(s/60); return m<60?`${m}m ago`:`${Math.round(m/60)}h ago` }

function dateKey(iso){ if(!iso) return 'unknown'; return new Date(iso).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}) }
function clockTime(iso){ if(!iso) return '—'; return new Date(iso).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}) }
function eventStamp(iso){ return clockTime(iso) }
function appendDateBreak(list, key){ const li=document.createElement('li'); li.className='date-break'; li.textContent=key; list.appendChild(li) }
function duration(start,end){ if(!start) return '—'; const ms=Math.max(0,new Date(end||Date.now())-new Date(start)); const s=Math.round(ms/1000); if(s<60)return `${s}s`; const m=Math.floor(s/60), r=s%60; if(m<60)return r?`${m}m ${r}s`:`${m}m`; const h=Math.floor(m/60); return `${h}h ${m%60}m` }
function isStale(scout){ return scout?.lastSeenAt && activeStatuses.has(scout.status) && !scout.awaiting && Date.now() - new Date(scout.lastSeenAt).getTime() > STALE_AFTER_MS }
function displayStatus(scout){ return isStale(scout) ? 'stale' : (scout?.status || 'queued') }

function cleanSummary(text){
  return String(text||'')
    .replace(/^Run started:\s*/i,'Started: ')
}
function displayWorkerLabel(worker){ return String(worker?.label || worker?.id || 'Worker').replace(/\s+worker$/i, '') }
function shortModel(worker){ const model=worker?.resolvedModel||worker?.model||'runtime-default'; return String(model).replace(/^openai-codex\//,'').replace(/^github-copilot\//,'').replace(/^vercel-ai-gateway\//,'').replace(/^openrouter\//,'') }
function displayWorkerRole(worker){ return String(worker?.role || 'worker').replace(/Worker$/i, '') || 'worker' }
function textEl(tag, text, className){ const el=document.createElement(tag); if(className) el.className=className; el.textContent=text ?? ''; return el }
function clear(el){ if(el) while(el.firstChild) el.removeChild(el.firstChild) }
function flashButton(button, message){ button.classList.remove('clicked'); void button.offsetWidth; button.classList.add('clicked'); button.dataset.feedback = message; clearTimeout(button.__feedbackTimer); button.__feedbackTimer=setTimeout(()=>{ button.classList.remove('clicked'); delete button.dataset.feedback }, 900) }
function runPath(entry){ return entry?.path ? `../${entry.path}` : `../runs/${entry.runId}.json` }
async function fetchRun(entry){ return fetch(runPath(entry),{cache:'no-store'}).then(r=>{ if(!r.ok) throw new Error(`run ${entry.runId}`); return r.json() }) }
function noteViewportAction(){ lastUserViewportAction = Date.now() }
function shouldPauseAutoRefresh(){ return selectedId || Date.now() - lastUserViewportAction < AUTO_REFRESH_PAUSE_MS }
async function loadRun(runId=selectedRunId){
  try{
    const reg=await fetch('../runs/registry.json',{cache:'no-store'}).then(r=>{ if(!r.ok) throw new Error('registry'); return r.json() })
    const candidates = (reg.runs || []).slice(0, 24)
    const checked = await Promise.all(candidates.map(async (entry) => {
      try { return { entry, run: await fetchRun(entry) } } catch { return null }
    }))
    const available = checked.filter(Boolean)
    runRegistry = available.map(({entry, run}) => ({ ...entry, title: entry.title || run.title, status: entry.status || run.status, updatedAt: entry.updatedAt || run.updatedAt, createdAt: entry.createdAt || run.createdAt }))
    const selected = available.find(({entry, run}) => entry.runId===runId || run.runId===runId) || available[0]
    if(!selected) throw new Error('empty registry')
    currentRun = selected.run
    selectedRunId = currentRun.runId
  }catch{ currentRun=window.APIARY_SAMPLE_RUN; runRegistry=[{runId:currentRun.runId,title:currentRun.title,status:currentRun.status,updatedAt:currentRun.updatedAt,path:'sample'}]; selectedRunId=currentRun.runId }
  privacy = false
  render()
}

function pulseLiveIndicator(updatedAt){
  const indicator=$('liveIndicator'); if(!indicator) return
  const stamp = updatedAt ? new Date(updatedAt).getTime() : Date.now()
  if(stamp && stamp > lastRunUpdatedAt){
    lastRunUpdatedAt = stamp
    indicator.classList.remove('pollinated')
    void indicator.offsetWidth
    indicator.classList.add('pollinated')
  }
}

function statusClass(s){ return ['waiting_tool','waiting_user'].includes(s)?s:s||'queued' }
function summaryWithStale(run){ const scouts=run.scouts||[]; return { total:scouts.length, running:scouts.filter(s=>['running','queued','retrying'].includes(displayStatus(s))).length, waiting:scouts.filter(s=>['waiting_tool','waiting_user'].includes(displayStatus(s))).length, blocked:scouts.filter(s=>['blocked','failed'].includes(displayStatus(s))).length, done:scouts.filter(s=>['done','canceled'].includes(displayStatus(s))).length, stale:scouts.filter(isStale).length } }
function normalizeEvent(evt, run=currentRun){
  const scout=(run?.scouts||[]).find(s=>s.id===evt.scoutId)
  const kind=evt.kind || evt.eventKind || evt.type || evt.severity || 'info'
  return { ...evt, kind, taskId:evt.taskId || run?.taskId || run?.runId || 'current-task', runId:evt.runId || run?.runId, actorType:evt.actorType || (evt.scoutId ? 'worker' : 'main'), actorName:evt.actorName || (scout ? displayWorkerLabel(scout) : run?.coordinator?.label || 'Queen/Main'), summary:evt.summary || evt.message || evt.payload?.summary || '' }
}
function taskForRun(run){
  const events=(run.events||[]).map(e=>normalizeEvent(e, run))
  const workers=run.scouts||[]
  const status=run.status || (workers.some(w=>activeStatuses.has(w.status)) ? 'running' : 'done')
  return { id:run.taskId||run.runId||'sample', title:run.taskTitle||run.title||'Untitled task', projectId:run.projectId||'apiary', status, updatedAt:run.updatedAt||run.completedAt||run.createdAt, creator:run.creator||run.coordinator?.label||'Dexter', events, workers }
}
function eventTone(kind, severity){ if(/fail|error|blocked/.test(kind)||severity==='error') return 'bad'; if(/warn|retry/.test(kind)||severity==='warning') return 'warning'; if(/decision|command/.test(kind)) return 'decision'; if(/dispatch|started/.test(kind)) return 'dispatch'; if(/completed|success|done/.test(kind)||severity==='success') return 'good'; if(/log|state|info/.test(kind)) return 'log'; return 'info' }
function statusTone(status){ if(['done'].includes(status)) return 'good'; if(['failed','blocked'].includes(status)) return 'bad'; if(['waiting_tool','waiting_user','waiting_model','needs_review','needs_tests','retrying'].includes(status)) return 'warning'; if(['running','queued'].includes(status)) return 'running'; if(status==='stale') return 'stale'; return 'info' }
function statusBadge(status, extra=''){ const tone=statusTone(status); const label=labels[status]||status||'Queued'; return `${toneIcons[tone]||icons[status]||'i'} ${label}${extra}` }
function severityBadge(severity='info', kind='info'){ const tone=eventTone(kind, severity); const label=eventKindLabels[severity] || eventKindLabels[kind] || severity || 'Info'; return `${toneIcons[tone]||'i'} ${label}` }
function setToneClass(el, prefix, tone){ if(!el) return; for(const name of ['good','bad','warning','running','waiting','stale','info','decision','dispatch','log']) el.classList.remove(`${prefix}-${name}`); el.classList.add(`${prefix}-${tone}`) }

function stableRender(){
  const x=window.scrollX
  const y=window.scrollY
  render()
  requestAnimationFrame(()=>window.scrollTo(x,y))
}
function render(){ const run=currentRun; if(!run) return; const workers=run.scouts||[]; const sum=summaryWithStale(run); $('countRunning').textContent=sum.running||0; $('countWaiting').textContent=sum.waiting||0; $('countBlocked').textContent=sum.blocked||0; $('countDone').textContent=sum.done||0; renderHealthCards(sum); $('runTitle').textContent=run.title; $('runMeta').textContent=`${labels[run.status]||run.status} · updated ${age(run.updatedAt)}`; $('decision').classList.toggle('hidden',!run.decisionAwaiting); $('decision').textContent=run.decisionAwaiting?`Waiting for you: ${run.decisionAwaiting}`:''; renderRunHistory(); renderTaskProvenance(taskForRun(run)); renderHealthWorkers(workers); renderEvents(run.events||[]); renderDetails(workers.find(s=>s.id===selectedId)); $('lastRefresh').textContent=`Refreshed ${new Date().toLocaleTimeString()}`; pulseLiveIndicator(run.updatedAt) }
function filterKind(worker){ const status=displayStatus(worker); if(['waiting_tool','waiting_user','waiting_model','needs_review','needs_tests'].includes(status)) return 'waiting'; if(status==='blocked'||status==='failed') return 'blocked'; if(status==='done'||status==='canceled') return 'done'; return 'running' }
function visibleWorkers(workers){ return healthFilter==='all' ? workers : workers.filter(w=>filterKind(w)===healthFilter) }
function renderHealthCards(sum){
  for(const card of document.querySelectorAll('.health-card')){ const filter=card.dataset.filter; const count=sum[filter]||0; card.classList.toggle('selected', healthFilter===filter); setToneClass(card, 'tone', filter==='done'?'good':filter==='blocked'?'bad':filter==='waiting'?'warning':'running'); card.disabled=count===0; card.setAttribute('aria-pressed', healthFilter===filter ? 'true':'false'); card.setAttribute('aria-label', `${labels[filter]||filter}: ${count}. ${healthFilter===filter ? 'Selected filter' : 'Filter workers'}`) }
  const label={all:'All workers',running:'Gathering workers',waiting:'Waiting workers',blocked:'Blocked workers',done:'Finished workers'}[healthFilter]||'Workers'
  $('healthFilterLabel').textContent=label; $('healthCol2').textContent=healthFilter==='all' ? 'State' : 'Model'; $('healthCol3').textContent=healthFilter==='all' ? 'Seen' : 'Time'
}
function appendInlineDetails(tbody, scout, status){
  const detail=document.createElement('tr'); detail.className='inline-detail-row'; const td=document.createElement('td'); td.colSpan=3; const box=document.createElement('div'); box.className='inline-detail'
  const facts=document.createElement('div'); facts.className='inline-facts'; const items=[['State', labels[status]||status],['Role', displayWorkerRole(scout)],['Model', `${scout.modelRole||'default'} → ${scout.resolvedModel||scout.model||'runtime-default (unresolved)'}`],['Seen', age(scout.lastSeenAt)],['Time', duration(scout.startedAt, scout.completedAt)],['Awaiting', scout.awaiting||'—']]
  for(const [label,value] of items){ const item=document.createElement('div'); item.className='inline-fact'; item.append(textEl('span', label), textEl('strong', value)); facts.appendChild(item) }
  const summary=document.createElement('p'); summary.className='inline-summary'; summary.textContent=scout.summary||'No summary yet.'; box.append(facts, summary)
  const ev=scoutEvents(scout); if(ev.length){ const list=document.createElement('ol'); list.className='inline-events'; for(const evt of ev.slice(0,3)){ const li=document.createElement('li'); li.className=`tone-${eventTone(evt.kind||evt.type||'log', evt.severity)}`; li.append(textEl('strong', severityBadge(evt.severity, evt.kind||evt.type||'log')), document.createTextNode(` · ${eventStamp(evt.ts)} · ${cleanSummary(evt.message||evt.summary||'')}`)); list.appendChild(li) } box.appendChild(list) }

  const legacyReport = scout.report || (currentRun?.reports && currentRun.reports[scout.id]) || {}
  const reportHeadline = scout.reportHeadline || legacyReport.headline || ''
  const reportBullets = Array.isArray(scout.reportBullets) ? scout.reportBullets : (Array.isArray(legacyReport.bullets) ? legacyReport.bullets : [])
  const hasReportHeadline = reportHeadline.trim().length > 0
  const hasReportBullets = reportBullets.length > 0
  {
    const reportSection=document.createElement('div'); reportSection.className='inline-report'
    const toggleBtn=document.createElement('button'); toggleBtn.type='button'; toggleBtn.className='report-toggle'; toggleBtn.textContent='Show preview'
    const content=document.createElement('div'); content.className='report-content'
    if(hasReportHeadline) content.appendChild(textEl('p', reportHeadline.trim(), 'report-headline'))
    if(hasReportBullets){ const ul=document.createElement('ul'); ul.className='report-bullets'; for(const bullet of reportBullets.slice(0,3)){ ul.appendChild(textEl('li', bullet)) } content.appendChild(ul) }
    if(!hasReportHeadline && !hasReportBullets) content.appendChild(textEl('p', 'Open the full worker page for all recorded facts, timeline entries, artifacts, and next-step fields.', 'report-meta'))
    const meta=[]; if(scout.reportStatus || legacyReport.status) meta.push(`Report: ${scout.reportStatus || legacyReport.status}`); if(scout.reportUpdatedAt) meta.push(`updated ${age(scout.reportUpdatedAt)}`); if(meta.length) content.appendChild(textEl('p', meta.join(' · '), 'report-meta'))
    const fullUrl = `worker.html?run=${encodeURIComponent(currentRun?.runId || selectedRunId || '')}&worker=${encodeURIComponent(scout.id)}`
    const linkBtn=document.createElement('a'); linkBtn.href=fullUrl; linkBtn.className='report-link'; linkBtn.textContent='View full report →'
    content.appendChild(linkBtn)
    reportSection.append(toggleBtn, content); box.appendChild(reportSection)
    toggleBtn.textContent='Hide preview'
    toggleBtn.onclick=()=>{ const isCollapsed = content.classList.toggle('collapsed'); toggleBtn.textContent = isCollapsed ? 'Show preview' : 'Hide preview' }
  }

  td.appendChild(box); detail.appendChild(td); tbody.appendChild(detail)
}
function scoutEvents(scout){ return (currentRun?.events||[]).filter(e=>e.scoutId===scout?.id).slice(-5).reverse() }
function renderHealthWorkers(scouts){
  const tbody=$('healthWorkers'); clear(tbody); const shown=visibleWorkers(scouts)
  for(const scout of shown){ const status=displayStatus(scout); const tr=document.createElement('tr'); tr.className=`${statusClass(status)}${scout.id===selectedId?' selected':''}`; tr.tabIndex=0; tr.setAttribute('role','button'); tr.setAttribute('aria-expanded', scout.id===selectedId ? 'true' : 'false'); tr.setAttribute('aria-label', `${displayWorkerLabel(scout)}: ${labels[status]||status}, last seen ${age(scout.lastSeenAt)}`); tr.onclick=()=>{ selectedId = selectedId===scout.id ? null : scout.id; stableRender() }; tr.onkeydown=(event)=>{ if(event.key==='Enter'||event.key===' '){ event.preventDefault(); tr.click() } }
    const name=document.createElement('td'); name.append(textEl('span', workerIcon(scout), 'health-icon'), document.createTextNode(` ${displayWorkerLabel(scout)}`)); const middle=document.createElement('td'); if(healthFilter==='all'){ const chip=textEl('span', statusBadge(status), `status-chip tone-${statusTone(status)}`); middle.appendChild(chip) } else { middle.textContent=shortModel(scout); middle.classList.add('model-cell') } const last=textEl('td', healthFilter==='all' ? age(scout.lastSeenAt) : duration(scout.startedAt, scout.completedAt)); tr.append(name,middle,last); tbody.appendChild(tr); if(scout.id===selectedId) appendInlineDetails(tbody, scout, status) }
  if(!shown.length){ const tr=document.createElement('tr'); const td=textEl('td', scouts.length ? 'No workers in this state' : 'No workers yet'); td.colSpan=3; tr.appendChild(td); tbody.appendChild(tr) }
}
function historyKind(entry){ const status=entry.status||'running'; return ['done','failed','canceled'].includes(status) ? 'done' : 'active' }
function saveHistoryScroll(){ const list=$('runHistory'); if(list) historyScroll[historyFilter]=list.scrollLeft }
function restoreHistoryScroll(list){ requestAnimationFrame(()=>{ list.scrollLeft=historyScroll[historyFilter]||0 }) }
function renderRunHistory(){
  const list=$('runHistory'); if(!list) return; const priorScroll=list.scrollLeft; historyScroll[historyFilter]=Math.max(historyScroll[historyFilter]||0, priorScroll||0); clear(list)
  for(const tab of document.querySelectorAll('.history-tab')){ const selected=tab.dataset.historyFilter===historyFilter; tab.classList.toggle('selected', selected); tab.setAttribute('aria-pressed', selected?'true':'false') }
  const entries=runRegistry.filter(entry=>historyFilter==='all'||historyKind(entry)===historyFilter).slice(0,12)
  for(const entry of entries){ const btn=document.createElement('button'); btn.type='button'; btn.className=`run-pill${entry.runId===selectedRunId?' selected':''}`; const stamp=entry.updatedAt||entry.createdAt; const shortId=String(entry.runId||'run').replace(/^run-/,'').slice(0,18); btn.setAttribute('aria-pressed', entry.runId===selectedRunId ? 'true':'false'); btn.title=`${entry.title||entry.runId} — ${entry.runId} — ${stamp ? new Date(stamp).toLocaleString() : 'unknown time'}`; btn.onclick=()=>{ saveHistoryScroll(); loadRun(entry.runId) }; btn.classList.add(`tone-${statusTone(entry.status||'running')}`); btn.append(textEl('strong', entry.title||entry.runId), textEl('span', `${shortId} · ${statusBadge(entry.status||'running')} · ${age(stamp)}`)); list.appendChild(btn) }
  if(!entries.length) list.appendChild(textEl('p', 'No task trails in this tab yet.', 'empty-history'))
  list.onscroll=saveHistoryScroll
  restoreHistoryScroll(list)
}
function renderTaskProvenance(task){
  if(!task) return
  $('taskTitle').textContent=task.title; $('taskMeta').textContent=`${task.creator} created this · ${labels[task.status]||task.status} · ${dateKey(task.updatedAt)} ${clockTime(task.updatedAt)}`
  renderWorkerChips(task.workers); renderTaskFilters(task); renderTaskTimeline(task)
}
function saveChipScroll(){ const wrap=$('workerChips'); if(wrap) chipScroll=wrap.scrollLeft }
function restoreChipScroll(wrap){ requestAnimationFrame(()=>{ wrap.scrollLeft=chipScroll||0; const selected=selectedId ? wrap.querySelector(`[data-worker=\"${CSS.escape(selectedId)}\"]`) : null; if(selected) selected.scrollIntoView({block:'nearest', inline:'center', behavior:'instant'}) }) }
function renderWorkerChips(workers){ const wrap=$('workerChips'); if(!wrap) return; chipScroll=Math.max(chipScroll||0, wrap.scrollLeft||0); clear(wrap); const queen=document.createElement('button'); queen.type='button'; queen.className='chip queen'; queen.dataset.tip='Queen/Main is the coordinator: it decides, dispatches workers, and synthesizes the final answer.'; queen.textContent='👑 Queen/Main'; queen.onclick=()=>{ saveChipScroll(); selectedId=null; stableRender() }; wrap.appendChild(queen); for(const worker of workers){ const chip=document.createElement('button'); chip.type='button'; chip.className=`chip ${statusClass(displayStatus(worker))}${worker.id===selectedId?' selected':''}`; chip.dataset.worker=worker.id; chip.dataset.tip=`${displayWorkerLabel(worker)} worked on this task. Tap to focus logs and detail.`; chip.onclick=()=>{ saveChipScroll(); selectedId=worker.id; stableRender() }; chip.textContent=`${workerIcon(worker)} ${displayWorkerLabel(worker)} · ${icons[displayStatus(worker)]||''}`; wrap.appendChild(chip) } wrap.onscroll=saveChipScroll; restoreChipScroll(wrap) }
function renderTaskFilters(task){ const eventSelect=$('eventFilter'); if(!eventSelect) return; eventSelect.value=eventFilter }
function renderTaskTimeline(task){
  const list=$('taskTimeline'); clear(list)
  let events=task.events.length ? task.events : [{kind:'task.created', ts:currentRun.createdAt||currentRun.updatedAt, actorName:task.creator, summary:'Task appeared in the hive ledger.'}]
  if(eventFilter!=='all') events=events.filter(e=>eventTone(e.kind,e.severity)===eventFilter || e.kind===eventFilter)
  let lastDate=null
  for(const evt of events.slice().sort((a,b)=>new Date(a.ts||0)-new Date(b.ts||0))){
    const currentDate=dateKey(evt.ts)
    if(currentDate!==lastDate){ appendDateBreak(list, currentDate); lastDate=currentDate }
    const li=document.createElement('li'); const tone=eventTone(evt.kind, evt.severity)
    li.className=`prov-event ${tone} tone-${tone}`
    const progressIcon = tone==='good' ? '🏆' : tone==='dispatch' ? '⚡️' : tone==='running' ? '⚡️' : tone==='decision' ? '💡' : tone==='bad' ? '⚠️' : (evt.scoutId?'🐝':'👑')
    const dot=textEl('span', progressIcon, 'event-dot')
    const body=document.createElement('div'); body.className='event-body'
    const top=document.createElement('div'); top.className='event-top'; const kindBadge=textEl('strong', severityBadge(evt.severity, evt.kind), `event-badge tone-${tone}`); top.append(kindBadge, textEl('span', `${evt.actorName||evt.actorType||'Hive'} · ${eventStamp(evt.ts)}`))
    const summary=textEl('p', privacy && /log/.test(evt.kind) ? 'Log available — hide-details mode is on.' : cleanSummary(evt.summary || 'No summary recorded yet.'))
    body.append(top, summary)
    if(evt.payload || evt.artifactPaths?.length){ const details=document.createElement('details'); const s=textEl('summary', 'Details'); const pre=textEl('pre', JSON.stringify({payload:evt.payload, artifacts:evt.artifactPaths}, null, 2)); details.append(s, pre); body.appendChild(details) }
    li.append(dot, body); list.appendChild(li)
  }
}
function renderDetails(scout){ if(!scout){ $('detailTitle').textContent='Pick a cell'; $('detailStatus').textContent='No worker selected'; setToneClass($('detailStatus'), 'tone', 'info'); $('detailRole').textContent='—'; $('detailModel').textContent='—'; $('detailSeen').textContent='—'; $('detailElapsed').textContent='—'; $('detailSummary').textContent='Tap a worker cell to inspect status, model, elapsed time, and recent events.'; $('detailAwaiting').textContent='—'; clear($('detailEvents')); $('detailEventCount').textContent='0 events'; return } const status=displayStatus(scout); $('detailTitle').textContent=displayWorkerLabel(scout); $('detailStatus').textContent=statusBadge(status); setToneClass($('detailStatus'), 'tone', statusTone(status)); $('detailRole').textContent=displayWorkerRole(scout); $('detailModel').textContent=`${scout.modelRole||'default'} → ${scout.resolvedModel||scout.model||'runtime-default (unresolved)'}`; $('detailSeen').textContent=age(scout.lastSeenAt); $('detailElapsed').textContent=duration(scout.startedAt, scout.completedAt); $('detailSummary').textContent=privacy && !selectedId ? 'Privacy mode hides details until selected.' : (scout.summary||'No summary yet.'); $('detailAwaiting').textContent=scout.awaiting||'—'; const ev=scoutEvents(scout); $('detailEventCount').textContent=`${ev.length} event${ev.length===1?'':'s'}`; const list=$('detailEvents'); clear(list); for(const evt of ev){ const li=document.createElement('li'); li.className=`tone-${eventTone(evt.kind||evt.type||'log', evt.severity)}`; li.append(textEl('strong', severityBadge(evt.severity, evt.kind||evt.type||'log')), document.createTextNode(` · ${eventStamp(evt.ts)} · ${cleanSummary(evt.message||evt.summary||'')}`)); list.appendChild(li) } }
function renderEvents(events){ const list=$('events'); clear(list); let lastDate=null; for(const evt of events.slice(-6).reverse()){ const currentDate=dateKey(evt.ts); if(currentDate!==lastDate){ appendDateBreak(list, currentDate); lastDate=currentDate } const li=document.createElement('li'); li.className=`tone-${eventTone(evt.kind||evt.type||'log', evt.severity)}`; li.append(textEl('strong', severityBadge(evt.severity, evt.kind||evt.type||'log')), document.createTextNode(` · ${eventStamp(evt.ts)} · ${cleanSummary(evt.message||evt.summary||'')}`)); list.appendChild(li) } }
function hideHelp(){ $('helpBubble').classList.add('hidden'); $('helpBubble').textContent='' }
function showHelp(text){ const bubble=$('helpBubble'); bubble.textContent=text; bubble.classList.remove('hidden'); clearTimeout(window.__helpTimer); window.__helpTimer=setTimeout(hideHelp,5500) }
$('refreshBtn').onclick=async()=>{ flashButton($('refreshBtn'),'Refreshing…'); $('refreshBtn').classList.add('loading'); await loadRun(); $('refreshBtn').classList.remove('loading'); flashButton($('refreshBtn'),'Updated') }
$('eventFilter')?.addEventListener('change',(event)=>{ eventFilter=event.target.value; render() })
document.addEventListener('click',(event)=>{ const trigger=event.target.closest('[data-tip]'); if(trigger){ event.preventDefault(); event.stopPropagation(); showHelp(trigger.dataset.tip) } else if(!event.target.closest('#helpBubble')) hideHelp() })
document.addEventListener('keydown',(event)=>{ if(event.key==='Escape') hideHelp() })
for(const card of document.querySelectorAll('.health-card')) card.onclick=()=>{ if(card.disabled) return; healthFilter = healthFilter===card.dataset.filter ? 'all' : card.dataset.filter; selectedId=null; render() }
for(const tab of document.querySelectorAll('.history-tab')) tab.onclick=()=>{ saveHistoryScroll(); const next=tab.dataset.historyFilter||'all'; historyFilter=next; if(historyScroll[next]==null) historyScroll[next]=0; render() }
for(const eventName of ['scroll','wheel','touchstart','touchmove','keydown']) window.addEventListener(eventName, noteViewportAction, { passive:true })
document.addEventListener('visibilitychange',()=>{ if(!document.hidden && !shouldPauseAutoRefresh()) loadRun() }); loadRun(); setInterval(()=>{ if(!document.hidden && !shouldPauseAutoRefresh()) loadRun() },3000)
