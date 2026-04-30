/** Worker detail page — Apiary Protocol dashboard. */
const $ = (id) => document.getElementById(id)

function getParam(name) { return new URLSearchParams(window.location.search).get(name) || null }
async function fetchJSON(url) { const res = await fetch(url, { cache:'no-store' }); if(!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`); return res.json() }
function setText(el, text) { if(el) el.textContent = String(text ?? '') }
function clear(el) { if(el) while(el.firstChild) el.removeChild(el.firstChild) }

function age(iso){ if(!iso) return '—'; const s=Math.max(0,Math.round((Date.now()-new Date(iso))/1000)); if(s<60)return `${s}s ago`; const m=Math.round(s/60); return m<60?`${m}m ago`:`${Math.round(m/60)}h ago` }
function duration(start,end){ if(!start) return '—'; const ms=Math.max(0,new Date(end||Date.now())-new Date(start)); const s=Math.round(ms/1000); if(s<60)return `${s}s`; const m=Math.floor(s/60), r=s%60; if(m<60)return r?`${m}m ${r}s`:`${m}m`; const h=Math.floor(m/60); return `${h}h ${m%60}m` }
function statusLabel(status){ return ({queued:'Queued',running:'Gathering',waiting_tool:'Waiting on tool',waiting_user:'Waiting for you',blocked:'Blocked',retrying:'Trying again',done:'Finished',failed:'Failed',canceled:'Canceled',stale:'Quiet too long'})[status] || status || 'Queued' }
function workerIcon(worker){ const key=`${worker?.role||''} ${worker?.label||''} ${worker?.id||''}`; const patterns=[[/queen|main|coordinator|dexter/i,'👑'],[/ux|design/i,'🎨🐝'],[/risk|review|security|devil|advers/i,'🛡️🐝'],[/doc|write/i,'📚🐝'],[/tech|code|impl|engineer/i,'🛠️🐝'],[/research|evidence/i,'🔎🐝'],[/adapt|map/i,'🧭🐝'],[/safety/i,'🦺🐝'],[/reliab|test|verify/i,'✅🐝']]; return patterns.find(([re])=>re.test(key))?.[1] || '🐝' }

function safeHref(href){
  if(!href) return null
  const value = String(href)
  try {
    const url = new URL(value, window.location.href)
    if(url.protocol === 'http:' || url.protocol === 'https:') return url.href
  } catch {}
  if(value.startsWith('../') || value.startsWith('./') || (!value.startsWith('/') && !value.includes('://'))) return value
  return null
}
function createSafeLink(href, label){ const a=document.createElement('a'); const safe=safeHref(href); a.textContent=String(label || href || 'artifact'); if(safe) a.href=safe; else { a.href='#'; a.textContent='[invalid link]' } return a }
function normalizeReportPath(reportPath){ if(!reportPath) return null; const p=String(reportPath); if(p.startsWith('../') || p.startsWith('./')) return p; return `../${p.replace(/^\/+/, '')}` }
function textList(values){ return Array.isArray(values) ? values.filter((v)=>v != null && v !== '') : (values ? [values] : []) }
function renderItems(containerId, items, {links=true, empty='None recorded'} = {}){
  const el=$(containerId); clear(el)
  const values = textList(items)
  if(!values.length){ el.textContent=empty; el.classList.add('no-data'); return }
  el.classList.remove('no-data')
  for(const item of values){
    const li=document.createElement('li')
    const value = typeof item === 'string' ? item : (item?.label || item?.name || item?.path || item?.url || JSON.stringify(item))
    if(links && typeof item === 'object' && item){ li.appendChild(createSafeLink(item.url || item.path, value)) }
    else if(links && typeof item === 'string'){ const safe = safeHref(item); li.appendChild(safe ? createSafeLink(item, value) : document.createTextNode(value)) }
    else li.textContent = value
    el.appendChild(li)
  }
}
async function loadRun(runId){
  const registry = await fetchJSON('../runs/registry.json').catch(()=>null)
  const entry = registry?.runs?.find((r)=>r.runId===runId)
  const path = entry?.path ? `../${entry.path}` : `../runs/${runId}.json`
  return fetchJSON(path)
}

function renderTextList(containerId, items, empty){ const el=$(containerId); clear(el); const values=textList(items); if(!values.length){ el.textContent=empty; el.classList.add('no-data'); return } el.classList.remove('no-data'); for(const item of values){ const p=document.createElement('p'); p.textContent=String(item); el.appendChild(p) } }
function renderLog(containerId, events){
  const ol=$(containerId); clear(ol)
  if(!events?.length){ const li=document.createElement('li'); li.textContent='No log entries'; ol.appendChild(li); return }
  for(const evt of events.slice(-50).reverse()){ const li=document.createElement('li'); const strong=document.createElement('strong'); strong.textContent=evt.severity || 'info'; li.append(strong, document.createTextNode(` · ${evt.ts ? new Date(evt.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'} · ${evt.summary || evt.message || 'Event'}`)); ol.appendChild(li) }
}

function reportField(worker, key, fallback){ return worker.reportData?.[key] ?? fallback }
function deriveWorkerDetailView(worker, run, reportData, reportLoadError){
  const report = reportData && !reportData.risks?.some?.((r)=>String(r).startsWith('Full report unavailable:')) ? reportData : null
  const reportStatus = worker.reportStatus || report?.reportStatus || report?.status || (reportData?.risks?.some?.((r)=>String(r).includes('Full report unavailable')) ? 'missing' : null)
  const hasReport = !!report
  const source = hasReport ? (reportData?.doing || reportData?.accomplished || reportData?.findings ? 'hybrid' : 'full-report') : 'ledger-derived'
  const freshness = reportLoadError ? 'missing-report' : (worker.reportUpdatedAt && worker.lastSeenAt && new Date(worker.reportUpdatedAt) < new Date(worker.lastSeenAt) ? 'stale-report' : (hasReport ? 'fresh' : 'derived-only'))
  const summary = report?.summary || worker.summary || (worker.status === 'done' ? 'Work completed.' : 'Worker details derived from ledger.')
  return {
    title: worker.reportHeadline || report?.headline || worker.label || worker.id || 'Worker',
    summary,
    doing: report?.doing || worker.summary || (worker.status === 'done' ? 'Work completed' : 'Idle'),
    accomplished: report?.accomplished || (worker.status === 'done' ? [worker.summary || 'Work completed successfully.'] : []),
    findings: report?.findings || (hasReport ? [] : [worker.summary ? `Ledger summary: ${worker.summary}` : 'No report artifact recorded.']),
    artifacts: report?.artifacts || worker.artifactPaths || [],
    filesTouched: report?.filesTouched || [],
    nextSteps: report?.nextSteps || (worker.awaiting ? [worker.awaiting] : []),
    risks: report?.risks || (reportLoadError ? [`Missing report artifact: ${reportLoadError.message}`] : (!hasReport ? ['No structured report artifact was recorded.'] : [])),
    source,
    reportStatus,
    freshness,
    reportLoadError,
    sourceLabel: source === 'ledger-derived' ? 'Derived from ledger' : (source === 'hybrid' ? 'Hybrid: report + ledger' : 'Full report'),
    freshnessLabel: freshness === 'missing-report' ? 'Missing report' : freshness === 'stale-report' ? 'Stale report' : freshness === 'derived-only' ? 'Derived only' : 'Fresh',
  }
}
function renderWorker(worker, run){
  const view = deriveWorkerDetailView(worker, run, worker.reportData, worker.reportLoadError)
  setText($('workerIcon'), workerIcon(worker))
  setText($('workerTitle'), view.title)
  const statusBits=[worker.role || 'worker', worker.resolvedModel || worker.model || 'runtime-default']
  if(view.sourceLabel) statusBits.push(view.sourceLabel)
  if(worker.reportUpdatedAt) statusBits.push(`updated ${age(worker.reportUpdatedAt)}`)
  setText($('workerMeta'), statusBits.join(' · '))
  setText($('workerStatus'), statusLabel(worker.status))
  setText($('workerSource'), view.sourceLabel)
  setText($('workerFreshness'), view.freshnessLabel)
  setText($('workerSummary'), view.summary)
  setText($('workerDoing'), view.doing)
  setText($('workerStarted'), worker.startedAt ? new Date(worker.startedAt).toLocaleString() : '—')
  setText($('workerSeen'), age(worker.lastSeenAt))
  setText($('workerElapsed'), duration(worker.startedAt, worker.completedAt))
  setText($('workerAwaiting'), worker.awaiting || '—')
  renderTextList('workerAccomplished', view.accomplished, 'Not yet completed')
  renderTextList('workerFindings', view.findings, 'No findings recorded')
  renderItems('workerArtifacts', view.artifacts)
  renderItems('workerFiles', view.filesTouched, {links:false, empty:'No files recorded'})
  renderItems('workerNextSteps', view.nextSteps, {links:false, empty:'None recorded'})
  renderItems('workerRisks', view.risks, {links:false, empty:'None recorded'})
  renderLog('workerLog', (run.events || []).filter((e)=>e.scoutId === worker.id))
  setText($('workerIdDisplay'), worker.id)
  setText($('workerSourceCopy'), view.sourceLabel)
  $('worker-detail').classList.remove('hidden')
}

async function loadAndRender(){
  const runId=getParam('run'), workerId=getParam('worker')
  if(!runId || !workerId){ const p=document.createElement('p'); p.textContent='Missing run or worker parameter. '; const a=createSafeLink('index.html','Back to dashboard'); clear($('loading')); $('loading').append(p,a); return }
  try{
    const run=await loadRun(runId)
    const worker=(run.scouts || []).find((w)=>w.id===workerId)
    if(!worker){ $('loading').classList.add('hidden'); $('not-found').classList.remove('hidden'); return }
    const reportPath = worker.reportPath || worker.report?.path
    if(reportPath){ worker.reportData = await fetchJSON(normalizeReportPath(reportPath)).catch((error)=>{ worker.reportLoadError = error; return null }) }
    $('loading').classList.add('hidden')
    renderWorker(worker, run)
  }catch(error){ clear($('loading')); const p=document.createElement('p'); p.textContent=`Error loading worker: ${error.message}`; $('loading').appendChild(p) }
}

function init(){ loadAndRender(); setInterval(()=>{ if(!document.hidden) loadAndRender() }, 3000) }
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init()
