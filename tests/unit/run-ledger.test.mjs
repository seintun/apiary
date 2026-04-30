import test from 'node:test'
import assert from 'node:assert/strict'
import { summarize, STATUSES } from '../../scripts/apiary-run.mjs'

test('status enum includes monitor states', () => {
  for (const status of ['queued','running','waiting_tool','waiting_user','blocked','retrying','done','failed','canceled','stale']) assert.equal(STATUSES.has(status), true)
})

test('summarize groups waiting states and counts terminal states', () => {
  const summary = summarize([
    { status: 'running' }, { status: 'waiting_tool' }, { status: 'waiting_user' }, { status: 'blocked' }, { status: 'done' }, { status: 'failed' }, { status: 'stale' }
  ])
  assert.deepEqual(summary, { total: 7, queued:0, running:1, waiting:2, blocked:1, done:1, failed:1, canceled:0, stale:1 })
})

test('sweep-stale marks old active workers stale', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const { spawnSync } = await import('node:child_process')
  const repo = path.resolve(new URL('../..', import.meta.url).pathname)
  const start = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'start', '--title', `Stale sweep ${Date.now()}`], { cwd: repo, encoding: 'utf8' })
  assert.equal(start.status, 0, start.stderr)
  const runId = start.stdout.trim()
  const add = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'worker-start', '--run', runId, '--id', 'old', '--label', 'Old worker'], { cwd: repo, encoding: 'utf8' })
  assert.equal(add.status, 0, add.stderr)
  const file = path.join(repo, 'runs', `${runId}.json`)
  const run = JSON.parse(fs.readFileSync(file, 'utf8'))
  run.scouts[0].lastSeenAt = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  fs.writeFileSync(file, `${JSON.stringify(run, null, 2)}\n`)
  const sweep = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'sweep-stale', '--run', runId, '--older-than-minutes', '5'], { cwd: repo, encoding: 'utf8' })
  assert.equal(sweep.status, 0, sweep.stderr)
  const swept = JSON.parse(fs.readFileSync(file, 'utf8'))
  assert.equal(swept.scouts[0].status, 'stale')
  assert.match(swept.events.at(-1).message, /marked stale/i)
  fs.rmSync(file, { force: true })
  const registryPath = path.join(repo, 'runs', 'registry.json')
  if (fs.existsSync(registryPath)) {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
    registry.runs = (registry.runs || []).filter((entry) => entry.runId !== runId)
    registry.latestRunId = registry.runs[0]?.runId || null
    registry.generatedAt = new Date().toISOString()
    fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`)
  }
})
