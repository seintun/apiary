const $ = (id) => document.getElementById(id)
const labels = { queued:'Queued', running:'Gathering', waiting_tool:'Waiting on tool', waiting_user:'Waiting for you', blocked:'Blocked', retrying:'Trying again', done:'Finished', failed:'Failed', canceled:'Canceled', stale:'Quiet too long' }
const icons = { queued:'○', running:'🐝', waiting_tool:'🛠️', waiting_user:'👋', blocked:'⚠️', retrying:'↻', done:'🍯', failed:'✕', canceled:'−', stale:'…' }
const workerTypeIcons = [
  [/ux|design/i, '🎨🐝'],
  [/risk|review|security|devil|advers/i, '🛡️🐝'],
  [/doc|write/i, '📚🐝'],
  [/tech|code|impl|engineer/i, '🛠️🐝'],
  [/research|evidence/i, '🔎🐝'],
  [/adapt|map/i, '🧭🐝'],
  [/safety/i, '🦺🐝'],
  [/reliab|test|verify/i, '✅🐝'],
]
function workerIcon(worker){ const key=`${worker?.role||''} ${worker?.label||''} ${worker?.id||''}`; return workerTypeIcons.find(([re])=>re.test(key))?.[1] || '🐝' }
const activeStatuses = new Set(['queued','running','waiting_tool','waiting_user','retrying'])
const STALE_AFTER_MS = 5 * 60 * 1000
let currentRun = null, selectedId = null, privacy = true, healthFilter = 'all'
function age(iso){ if(!iso) return '—'; const s=Math.max(0,Math.round((Date.now()-new Date(iso))/1000)); if(s<60)return `${s}s ago`; const m=Math.round(s/60); return m<60?`${m}m ago`:`${Math.round(m/60)}h ago` }
function duration(start,end){ if(!start) return '—'; const ms=Math.max(0,new Date(end||Date.now())-new Date(start)); const s=Math.round(ms/1000); if(s<60)return `${s}s`; const m=Math.floor(s/60), r=s%60; if(m<60)return r?`${m}m ${r}s`:`${m}m`; const h=Math.floor(m/60); return `${h}h ${m%60}m` }
function isStale(scout){ return scout?.lastSeenAt && activeStatuses.has(scout.status) && Date.now() - new Date(scout.lastSeenAt).getTime() > STALE_AFTER_MS }
function displayStatus(scout){ return isStale(scout) ? 'stale' : (scout?.status || 'queued') }
function scoutEvents(scout){ return (currentRun?.events||[]).filter(e=>e.scoutId===scout?.id).slice(-5).reverse() }

function displayWorkerLabel(worker){
  return String(worker?.label || worker?.id || 'Worker').replace(/\s+worker$/i, '')
}

function shortModel(worker){
  const model=worker?.resolvedModel||worker?.model||'runtime-default'
  return String(model).replace(/^openai-codex\//,'').replace(/^github-copilot\//,'').replace(/^vercel-ai-gateway\//,'').replace(/^openrouter\//,'')
}
function displayWorkerRole(worker){
  return String(worker?.role || 'worker').replace(/Worker$/i, '') || 'worker'
}
function textEl(tag, text, className){ const el=document.createElement(tag); if(className) el.className=className; el.textContent=text ?? ''; return el }
function clear(el){ while(el.firstChild) el.removeChild(el.firstChild) }
function flashButton(button, message){
  button.classList.remove('clicked')
  void button.offsetWidth
  button.classList.add('clicked')
  button.dataset.feedback = message
  clearTimeout(button.__feedbackTimer)
  button.__feedbackTimer=setTimeout(()=>{ button.classList.remove('clicked'); delete button.dataset.feedback }, 900)
}
async function loadRun(){ try{ const reg=await fetch('../runs/registry.json',{cache:'no-store'}).then(r=>{ if(!r.ok) throw new Error('registry'); return r.json() }); let lastError=null; for(const entry of reg.runs||[]){ try{ currentRun=await fetch(`../${entry.path}`,{cache:'no-store'}).then(r=>{ if(!r.ok) throw new Error(`run ${entry.runId}`); return r.json() }); lastError=null; break }catch(err){ lastError=err } } if(!currentRun || lastError) throw lastError || new Error('empty registry') }catch{ currentRun=window.APIARY_SAMPLE_RUN } privacy = currentRun.privacyMode !== false; render() }
function statusClass(s){ return ['waiting_tool','waiting_user'].includes(s)?s:s||'queued' }
function summaryWithStale(run){ const scouts=run.scouts||[]; return { total:scouts.length, running:scouts.filter(s=>displayStatus(s)==='running'||displayStatus(s)==='queued'||displayStatus(s)==='retrying').length, waiting:scouts.filter(s=>displayStatus(s)==='waiting_tool'||displayStatus(s)==='waiting_user').length, blocked:scouts.filter(s=>displayStatus(s)==='blocked'||displayStatus(s)==='failed').length, done:scouts.filter(s=>displayStatus(s)==='done'||displayStatus(s)==='canceled').length, stale:scouts.filter(isStale).length } }
function render(){ const run=currentRun; if(!run) return; const workers=run.scouts||[]; const sum=summaryWithStale(run); $('countRunning').textContent=sum.running||0; $('countWaiting').textContent=sum.waiting||0; $('countBlocked').textContent=sum.blocked||0; $('countDone').textContent=sum.done||0; renderHealthCards(sum); $('runTitle').textContent=run.title; $('runMeta').textContent=`${labels[run.status]||run.status} · updated ${age(run.updatedAt)}`; $('privacyToggle').textContent=`Privacy: ${privacy?'on':'off'}`; $('privacyToggle').setAttribute('aria-pressed', privacy ? 'true' : 'false'); $('decision').classList.toggle('hidden',!run.decisionAwaiting); $('decision').textContent=run.decisionAwaiting?`Waiting for you: ${run.decisionAwaiting}`:''; renderHealthWorkers(workers); renderEvents(run.events||[]); renderDetails(workers.find(s=>s.id===selectedId)) ; $('lastRefresh').textContent=`Refreshed ${new Date().toLocaleTimeString()}` }


function filterKind(worker){
  const status=displayStatus(worker)
  if(status==='waiting_tool'||status==='waiting_user') return 'waiting'
  if(status==='blocked'||status==='failed') return 'blocked'
  if(status==='done'||status==='canceled') return 'done'
  return 'running'
}
function visibleWorkers(workers){ return healthFilter==='all' ? workers : workers.filter(w=>filterKind(w)===healthFilter) }
function renderHealthCards(sum){
  for(const card of document.querySelectorAll('.health-card')){
    const filter=card.dataset.filter
    const count=sum[filter]||0
    card.classList.toggle('selected', healthFilter===filter)
    card.disabled=count===0
    card.setAttribute('aria-pressed', healthFilter===filter ? 'true':'false')
    card.setAttribute('aria-label', `${labels[filter]||filter}: ${count}. ${healthFilter===filter ? 'Selected filter' : 'Filter workers'}`)
  }
  const label={all:'All workers',running:'Gathering workers',waiting:'Waiting workers',blocked:'Blocked workers',done:'Finished workers'}[healthFilter]||'Workers'
  $('healthFilterLabel').textContent=label
  $('healthCol2').textContent=healthFilter==='all' ? 'State' : 'Model'
  $('healthCol3').textContent=healthFilter==='all' ? 'Seen' : 'Time'
}

function appendInlineDetails(tbody, scout, status){
  const detail=document.createElement('tr')
  detail.className='inline-detail-row'
  const td=document.createElement('td')
  td.colSpan=3
  const box=document.createElement('div')
  box.className='inline-detail'
  const facts=document.createElement('div')
  facts.className='inline-facts'
  const items=[
    ['State', labels[status]||status],
    ['Role', displayWorkerRole(scout)],
    ['Model', `${scout.modelRole||'default'} → ${scout.resolvedModel||scout.model||'runtime-default (unresolved)'}`],
    ['Seen', age(scout.lastSeenAt)],
    ['Time', duration(scout.startedAt, scout.completedAt)],
    ['Awaiting', scout.awaiting||'—'],
  ]
  for(const [label,value] of items){
    const item=document.createElement('div')
    item.className='inline-fact'
    item.append(textEl('span', label), textEl('strong', value))
    facts.appendChild(item)
  }
  const summary=document.createElement('p')
  summary.className='inline-summary'
  summary.textContent=scout.summary||'No summary yet.'
  box.append(facts, summary)
  const ev=scoutEvents(scout)
  if(ev.length){
    const list=document.createElement('ol')
    list.className='inline-events'
    for(const evt of ev.slice(0,3)){
      const li=document.createElement('li')
      li.append(textEl('strong', evt.severity||'info'), document.createTextNode(` · ${age(evt.ts)} · ${evt.message||''}`))
      list.appendChild(li)
    }
    box.appendChild(list)
  }
  td.appendChild(box)
  detail.appendChild(td)
  tbody.appendChild(detail)
}
function renderHealthWorkers(scouts){
  const tbody=$('healthWorkers'); clear(tbody)
  const shown=visibleWorkers(scouts)
  for(const scout of shown){
    const status=displayStatus(scout)
    const tr=document.createElement('tr')
    tr.className=`${statusClass(status)}${scout.id===selectedId?' selected':''}`
    tr.tabIndex=0
    tr.setAttribute('role','button')
    tr.setAttribute('aria-expanded', scout.id===selectedId ? 'true' : 'false')
    tr.setAttribute('aria-label', `${displayWorkerLabel(scout)}: ${labels[status]||status}, last seen ${age(scout.lastSeenAt)}`)
    tr.onclick=()=>{ selectedId = selectedId===scout.id ? null : scout.id; render() }
    tr.onkeydown=(event)=>{ if(event.key==='Enter'||event.key===' '){ event.preventDefault(); tr.click() } }
    const name=document.createElement('td')
    name.append(textEl('span', workerIcon(scout), 'health-icon'), document.createTextNode(` ${displayWorkerLabel(scout)}`))
    const middle=textEl('td', healthFilter==='all' ? (labels[status]||status) : shortModel(scout))
    if(healthFilter!=='all') middle.className='model-cell'
    const last=textEl('td', healthFilter==='all' ? age(scout.lastSeenAt) : duration(scout.startedAt, scout.completedAt))
    tr.append(name,middle,last)
    tbody.appendChild(tr)
    if(scout.id===selectedId) appendInlineDetails(tbody, scout, status)
  }
  if(!shown.length){
    const tr=document.createElement('tr'); const td=textEl('td', scouts.length ? 'No workers in this state' : 'No workers yet'); td.colSpan=3; tr.appendChild(td); tbody.appendChild(tr)
  }
}
function renderHive(scouts){ const hive=$('hive'); clear(hive); for(const scout of scouts){ const status=displayStatus(scout); const btn=document.createElement('button'); btn.className=`cell ${statusClass(status)}${scout.id===selectedId?' selected':''}`; btn.type='button'; const hex=document.createElement('span'); hex.className='hex'; const content=document.createElement('span'); content.className='cell-content'; content.append(textEl('span', status === 'done' ? '🍯' : workerIcon(scout), 'bee'), textEl('strong', displayWorkerLabel(scout))); const small=textEl('small', `${labels[status]||status} · ${scout.progress||0}%`); content.appendChild(small); btn.append(hex, content); btn.onclick=()=>{selectedId=scout.id; render()}; hive.appendChild(btn) } }
function renderDetails(scout){ if(!scout){ $('detailTitle').textContent='Pick a cell'; $('detailStatus').textContent='No worker selected'; $('detailRole').textContent='—'; $('detailModel').textContent='—'; $('detailSeen').textContent='—'; $('detailElapsed').textContent='—'; $('detailSummary').textContent='Tap a worker cell to inspect status, model, elapsed time, and recent events.'; $('detailAwaiting').textContent='—'; clear($('detailEvents')); $('detailEventCount').textContent='0 events'; return } const status=displayStatus(scout); $('detailTitle').textContent=displayWorkerLabel(scout); $('detailStatus').textContent=labels[status]||status; $('detailRole').textContent=displayWorkerRole(scout); $('detailModel').textContent=`${scout.modelRole||'default'} → ${scout.resolvedModel||scout.model||'runtime-default (unresolved)'}`; $('detailSeen').textContent=age(scout.lastSeenAt); $('detailElapsed').textContent=duration(scout.startedAt, scout.completedAt); $('detailSummary').textContent=privacy && !selectedId ? 'Privacy mode hides details until selected.' : (scout.summary||'No summary yet.'); $('detailAwaiting').textContent=scout.awaiting||'—'; const ev=scoutEvents(scout); $('detailEventCount').textContent=`${ev.length} event${ev.length===1?'':'s'}`; const list=$('detailEvents'); clear(list); for(const evt of ev){ const li=document.createElement('li'); li.append(textEl('strong', evt.severity||'info'), document.createTextNode(` · ${age(evt.ts)} · ${evt.message||''}`)); list.appendChild(li) } }
function renderEvents(events){ const list=$('events'); clear(list); for(const evt of events.slice(-6).reverse()){ const li=document.createElement('li'); li.append(textEl('strong', evt.severity||'info'), document.createTextNode(` · ${age(evt.ts)} · ${evt.message||''}`)); list.appendChild(li) } }
function renderMotionToggle(){ const on=document.body.classList.contains('focus-mode'); $('motionToggle').textContent=on ? 'Focus: on' : 'Focus: off'; $('motionToggle').setAttribute('aria-pressed', on ? 'true' : 'false') }
$('refreshBtn').onclick=async()=>{ flashButton($('refreshBtn'),'Refreshing…'); $('refreshBtn').textContent='Refreshing…'; await loadRun(); $('refreshBtn').textContent='Refresh'; flashButton($('refreshBtn'),'Updated') }; $('privacyToggle').onclick=()=>{ privacy=!privacy; render(); flashButton($('privacyToggle'), privacy ? 'Privacy on' : 'Privacy off') }; $('motionToggle').onclick=()=>{ document.body.classList.toggle('focus-mode'); renderMotionToggle(); flashButton($('motionToggle'), document.body.classList.contains('focus-mode') ? 'Focus on' : 'Focus off') }; renderMotionToggle(); document.addEventListener('visibilitychange',()=>{ if(!document.hidden) loadRun() }); loadRun(); setInterval(()=>{ if(!document.hidden) loadRun() },3000)
function hideHelp(){ $('helpBubble').classList.add('hidden'); $('helpBubble').textContent='' }
function showHelp(text){ const bubble=$('helpBubble'); bubble.textContent=text; bubble.classList.remove('hidden'); clearTimeout(window.__helpTimer); window.__helpTimer=setTimeout(hideHelp,5500) }
document.addEventListener('click',(event)=>{ const trigger=event.target.closest('[data-tip]'); if(trigger){ event.preventDefault(); event.stopPropagation(); showHelp(trigger.dataset.tip) } else if(!event.target.closest('#helpBubble')) hideHelp() })
document.addEventListener('keydown',(event)=>{ if(event.key==='Escape') hideHelp() })

for(const card of document.querySelectorAll('.health-card')) card.onclick=()=>{ if(card.disabled) return; healthFilter = healthFilter===card.dataset.filter ? 'all' : card.dataset.filter; selectedId=null; render() }
