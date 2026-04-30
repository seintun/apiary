#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const ROOT = path.resolve(new URL('..', import.meta.url).pathname)
const RUNS_DIR = path.join(ROOT, 'runs')
const REGISTRY_PATH = path.join(RUNS_DIR, 'registry.json')
const ICONS = { queued:'○', running:'✦', waiting_tool:'◔', waiting_user:'?', blocked:'!', retrying:'↻', done:'✓', failed:'✕', canceled:'−', stale:'…' }
const LABELS = { queued:'Queued', running:'Gathering', waiting_tool:'Waiting/tool', waiting_user:'Waiting/you', blocked:'Blocked', retrying:'Trying again', done:'Finished', failed:'Failed', canceled:'Canceled', stale:'Quiet too long' }
function parseArgs(argv) { const out={_:[]}; for(let i=0;i<argv.length;i++){const a=argv[i]; if(a.startsWith('--')){const k=a.slice(2); const n=argv[i+1]; if(!n||n.startsWith('--')) out[k]=true; else out[k]=argv[++i]} else out._.push(a)} return out }
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch (error) { throw new Error(`Cannot read ${file}: ${error.message}`) } }
function relAge(iso) { const sec=Math.max(0, Math.round((Date.now()-new Date(iso).getTime())/1000)); if(sec<60) return `${sec}s`; const min=Math.round(sec/60); if(min<60) return `${min}m`; return `${Math.round(min/60)}h` }
function pct(n) { return `${Math.max(0, Math.min(100, Number(n)||0)).toString().padStart(3)}%` }
function line(char='─', width=88){ return char.repeat(width) }
function truncate(s, n){ s=String(s||''); return s.length>n ? `${s.slice(0,n-1)}…` : s }
function loadRun(runId) {
  const registry = fs.existsSync(REGISTRY_PATH) ? readJson(REGISTRY_PATH) : null
  const id = runId || registry?.latestRunId || registry?.runs?.[0]?.runId
  if (!id) throw new Error('No Apiary runs found yet.')
  return readJson(path.join(RUNS_DIR, `${id}.json`))
}
export function formatRun(run) {
  const s = run.summary || {}
  const rows = []
  rows.push(`🐝 APIARY HIVE — ${run.title}`)
  rows.push(`Status: ${LABELS[run.status] || run.status} · ${s.done||0}/${s.total||0} done · ${s.running||0} running · ${s.waiting||0} waiting · ${s.blocked||0} blocked · updated ${relAge(run.updatedAt)} ago`)
  if (run.decisionAwaiting) rows.push(`Awaiting: ${run.decisionAwaiting}`)
  rows.push(line())
  rows.push(`${'ROLE'.padEnd(14)} ${'WORKER'.padEnd(24)} ${'MODEL ROLE'.padEnd(14)} ${'MODEL/ROUTE'.padEnd(20)} ${'STATUS'.padEnd(15)} PROG`)
  rows.push(line())
  for (const worker of run.workers || run.scouts || []) {
    const model = worker.resolvedModel || worker.model || 'runtime-default (unresolved)'
    rows.push(`${truncate(worker.role,13).padEnd(14)} ${truncate(worker.label,23).padEnd(24)} ${truncate(worker.modelRole||'default',13).padEnd(14)} ${truncate(model,19).padEnd(20)} ${(ICONS[worker.status]||'·')} ${truncate(LABELS[worker.status]||worker.status,12).padEnd(13)} ${pct(worker.progress)}`)
    if (worker.awaiting) rows.push(`  ↳ awaiting: ${worker.awaiting}`)
  }
  rows.push(line())
  rows.push('Recent events:')
  for (const evt of (run.events || []).slice(-5).reverse()) rows.push(`  ${relAge(evt.ts).padStart(4)} ago · ${evt.severity.padEnd(7)} · ${truncate(evt.message,70)}`)
  return rows.join('\n')
}
async function main() {
  const args = parseArgs(process.argv.slice(2))
  const render = () => console.log(formatRun(loadRun(args.run)))
  if (args.watch) {
    const interval = Math.max(1, Number(args.interval || 3))
    while (true) { process.stdout.write('\x1Bc'); render(); await delay(interval*1000) }
  } else render()
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e.message); process.exit(1) })
