#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const STATUSES = new Set(['queued','running','waiting_tool','waiting_user','blocked','retrying','done','failed','canceled','stale'])
export const EVENT_TYPES = new Set(['state','log','heartbeat','warning','error','artifact','decision'])
export const SEVERITIES = new Set(['info','success','warning','danger'])
const ROOT = path.resolve(new URL('..', import.meta.url).pathname)
const RUNS_DIR = path.join(ROOT, 'runs')
const REGISTRY_PATH = path.join(RUNS_DIR, 'registry.json')

function now() { return new Date().toISOString() }
function slug(input) { return String(input || 'apiary-run').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48) || 'apiary-run' }
function parseArgs(argv) {
  const out = { _: [] }
  for (let i=0;i<argv.length;i++) {
    const a=argv[i]
    if (a.startsWith('--')) {
      const k=a.slice(2)
      const n=argv[i+1]
      if (!n || n.startsWith('--')) out[k]=true
      else out[k]=argv[++i]
    } else out._.push(a)
  }
  return out
}
function ensureRunsDir() { fs.mkdirSync(RUNS_DIR, { recursive: true }) }
function atomicWrite(file, data) {
  ensureRunsDir()
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`)
  fs.renameSync(tmp, file)
}
function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
function runPath(runId) { return path.join(RUNS_DIR, `${runId}.json`) }
function registryPathFor(runId) { return `runs/${runId}.json` }
function event(type, message, scoutId = null, severity = 'info') {
  if (!EVENT_TYPES.has(type)) throw new Error(`Invalid event type: ${type}`)
  if (!SEVERITIES.has(severity)) throw new Error(`Invalid severity: ${severity}`)
  return { id: `evt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`, ts: now(), type, severity, scoutId, message: message || '' }
}
export function summarize(scouts = []) {
  const summary = { total: scouts.length, queued:0, running:0, waiting:0, blocked:0, done:0, failed:0, canceled:0, stale:0 }
  for (const s of scouts) {
    if (s.status === 'waiting_tool' || s.status === 'waiting_user') summary.waiting++
    else if (summary[s.status] != null) summary[s.status]++
  }
  return summary
}
function deriveRunStatus(run) {
  if (['failed','canceled','done','blocked','waiting_user'].includes(run.status)) return run.status
  const scouts = run.scouts || []
  if (scouts.some(s => s.status === 'failed')) return 'failed'
  if (scouts.some(s => s.status === 'blocked')) return 'blocked'
  if (scouts.some(s => s.status === 'waiting_user')) return 'waiting_user'
  if (scouts.length && scouts.every(s => s.status === 'done')) return 'done'
  if (scouts.some(s => ['running','retrying','waiting_tool','queued'].includes(s.status))) return 'running'
  return run.status || 'running'
}
function loadRun(runId) {
  const run = readJson(runPath(runId), null)
  if (!run) throw new Error(`Run not found: ${runId}`)
  return run
}
function saveRun(run) {
  run.updatedAt = now()
  run.summary = summarize(run.scouts)
  run.status = deriveRunStatus(run)
  if (run.status === 'done' && !run.completedAt) run.completedAt = run.updatedAt
  atomicWrite(runPath(run.runId), run)
  updateRegistry(run)
  return run
}
function updateRegistry(run) {
  const registry = readJson(REGISTRY_PATH, { schemaVersion: 'apiary.registry.v1', generatedAt: now(), latestRunId: null, runs: [] })
  const entry = { runId: run.runId, title: run.title, status: run.status, createdAt: run.createdAt, updatedAt: run.updatedAt, path: registryPathFor(run.runId), summary: run.summary || summarize(run.scouts) }
  const idx = registry.runs.findIndex(r => r.runId === run.runId)
  if (idx >= 0) registry.runs[idx] = entry
  else registry.runs.unshift(entry)
  registry.runs.sort((a,b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  registry.latestRunId = registry.runs[0]?.runId || run.runId
  registry.generatedAt = now()
  atomicWrite(REGISTRY_PATH, registry)
}
function requireStatus(status) { if (!STATUSES.has(status)) throw new Error(`Invalid status: ${status}`); return status }
function upsertScout(run, scout) {
  const idx = run.scouts.findIndex(s => s.id === scout.id)
  if (idx >= 0) run.scouts[idx] = { ...run.scouts[idx], ...scout, lastSeenAt: now() }
  else run.scouts.push(scout)
}
function usage() {
  console.log(`Usage: apiary-run <command> [options]\nCommands: start, scout-start, scout-update, scout-complete, scout-fail, event, complete\nUse --json for machine-readable output.`)
}
export function handle(argv) {
  const args = parseArgs(argv)
  const cmd = args._[0]
  if (!cmd || cmd === 'help') return { text: usage() }
  ensureRunsDir()
  if (cmd === 'start') {
    const title = args.title || 'Apiary run'
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\..*/, '').replace('T','-')
    const runId = args.id || `run-${stamp}-${slug(title)}`
    const t = now()
    const run = { schemaVersion:'apiary.run.v1', runId, title, status:'running', privacyMode: args['privacy-mode'] !== 'false', createdAt:t, updatedAt:t, completedAt:null, coordinator:{ adapter: args.adapter || 'manual', label: args.coordinator || 'Coordinator' }, summary: summarize([]), scouts:[], events:[event('state', `Run started: ${title}`)], decisionAwaiting:null }
    atomicWrite(runPath(runId), run); updateRegistry(run)
    return { run, output: args.json ? JSON.stringify({ runId, path: registryPathFor(runId) }) : runId }
  }
  const runId = args.run
  if (!runId) throw new Error('--run is required')
  const run = loadRun(runId)
  if (cmd === 'scout-start') {
    const id = args.id || args.label || `scout-${run.scouts.length+1}`
    const t = now()
    upsertScout(run, { id, label: args.label || id, role: args.role || 'scout', modelRole: args['model-role'] || 'default', model: args.model || null, status: requireStatus(args.status || 'running'), sessionKey: args['session-key'] || null, startedAt: t, lastSeenAt: t, completedAt: null, progress: Number(args.progress ?? 0), summary: args.summary || '', awaiting: args.awaiting || null, artifactPaths: [] })
    run.events.push(event('state', `Scout started: ${args.label || id}`, id))
    return { run: saveRun(run) }
  }
  if (cmd === 'scout-update' || cmd === 'scout-complete' || cmd === 'scout-fail') {
    const id = args.id; if (!id) throw new Error('--id is required')
    const scout = run.scouts.find(s => s.id === id); if (!scout) throw new Error(`Scout not found: ${id}`)
    const status = cmd === 'scout-complete' ? 'done' : cmd === 'scout-fail' ? 'failed' : requireStatus(args.status || scout.status)
    scout.status = status; scout.lastSeenAt = now(); scout.progress = Number(args.progress ?? (status === 'done' ? 100 : scout.progress ?? 0))
    if (args.summary) scout.summary = args.summary
    if (args.awaiting !== undefined) scout.awaiting = args.awaiting || null
    if (status === 'done' || status === 'failed' || status === 'canceled') scout.completedAt = now()
    run.events.push(event(status === 'failed' ? 'error' : 'state', args.message || `Scout ${status}: ${scout.label}`, id, status === 'failed' ? 'danger' : status === 'done' ? 'success' : 'info'))
    return { run: saveRun(run) }
  }
  if (cmd === 'event') {
    run.events.push(event(args.type || 'log', args.message || '', args['scout-id'] || null, args.severity || 'info'))
    return { run: saveRun(run) }
  }
  if (cmd === 'complete') {
    run.status = args.status ? requireStatus(args.status) : 'done'
    run.completedAt = now()
    run.events.push(event('state', args.message || `Run ${run.status}`, null, run.status === 'done' ? 'success' : 'info'))
    return { run: saveRun(run) }
  }
  throw new Error(`Unknown command: ${cmd}`)
}
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = handle(process.argv.slice(2))
    if (result?.output) console.log(result.output)
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
