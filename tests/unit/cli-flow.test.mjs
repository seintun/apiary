import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const repo = path.resolve(new URL('../..', import.meta.url).pathname)

function cleanupRun(runId) {
  fs.rmSync(path.join(repo, 'runs', `${runId}.json`), { force: true })
  const registryPath = path.join(repo, 'runs', 'registry.json')
  if (fs.existsSync(registryPath)) {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
    registry.runs = (registry.runs || []).filter((run) => run.runId !== runId)
    registry.latestRunId = registry.runs[0]?.runId || null
    fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`)
  }
}

test('apiary-run CLI creates monitor-readable ledger', () => {
  const title = `CLI flow ${Date.now()}`
  const start = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'start', '--title', title], { cwd: repo, encoding: 'utf8' })
  assert.equal(start.status, 0, start.stderr)
  const runId = start.stdout.trim()
  assert.match(runId, /^run-/)

  let step = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'worker-start', '--run', runId, '--id', 'one', '--label', 'One worker', '--role', 'testWorker', '--model-role', 'cheapWorker'], { cwd: repo, encoding: 'utf8' })
  assert.equal(step.status, 0, step.stderr)
  step = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'worker-complete', '--run', runId, '--id', 'one', '--summary', 'Finished test worker'], { cwd: repo, encoding: 'utf8' })
  assert.equal(step.status, 0, step.stderr)

  const monitor = spawnSync(process.execPath, ['scripts/apiary-monitor.mjs', '--run', runId], { cwd: repo, encoding: 'utf8' })
  assert.equal(monitor.status, 0, monitor.stderr)
  assert.match(monitor.stdout, /One worker/)
  assert.match(monitor.stdout, /Finished/)

  cleanupRun(runId)
})

test('apiary-run reconcile maps completion outcomes back into worker state', () => {
  const title = `CLI reconcile flow ${Date.now()}`
  const start = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'start', '--title', title], { cwd: repo, encoding: 'utf8' })
  assert.equal(start.status, 0, start.stderr)
  const runId = start.stdout.trim()

  let step = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'worker-start', '--run', runId, '--id', 'phase-a', '--label', 'Phase A'], { cwd: repo, encoding: 'utf8' })
  assert.equal(step.status, 0, step.stderr)
  step = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'reconcile', '--run', runId, '--id', 'phase-a', '--outcome', 'success', '--summary', 'Subagent completed and reviewed'], { cwd: repo, encoding: 'utf8' })
  assert.equal(step.status, 0, step.stderr)

  const run = JSON.parse(fs.readFileSync(path.join(repo, 'runs', `${runId}.json`), 'utf8'))
  const scout = run.scouts.find((item) => item.id === 'phase-a')
  assert.equal(scout.status, 'done')
  assert.equal(scout.progress, 100)
  assert.equal(scout.summary, 'Subagent completed and reviewed')
  assert.ok(scout.completedAt)

  cleanupRun(runId)
})

test('apiary-run CLI writes canonical flat report fields with repeated bullets', () => {
  const title = `CLI report flow ${Date.now()}`
  const start = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'start', '--title', title], { cwd: repo, encoding: 'utf8' })
  assert.equal(start.status, 0, start.stderr)
  const runId = start.stdout.trim()

  const step = spawnSync(process.execPath, [
    'scripts/apiary-run.mjs', 'worker-start', '--run', runId, '--id', 'reporter', '--label', 'Reporter', '--role', 'testWorker',
    '--report-headline', 'Report ready',
    '--report-bullet', 'First bullet',
    '--report-bullet', 'Second bullet',
    '--report-path', 'reports/reporter.json',
    '--report-status', 'partial'
  ], { cwd: repo, encoding: 'utf8' })
  assert.equal(step.status, 0, step.stderr)

  const run = JSON.parse(fs.readFileSync(path.join(repo, 'runs', `${runId}.json`), 'utf8'))
  const scout = run.scouts.find((item) => item.id === 'reporter')
  assert.equal(scout.reportHeadline, 'Report ready')
  assert.deepEqual(scout.reportBullets, ['First bullet', 'Second bullet'])
  assert.equal(scout.reportPath, 'reports/reporter.json')
  assert.equal(scout.reportStatus, 'partial')
  assert.match(scout.reportUpdatedAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(scout.report, undefined, 'CLI must not write legacy nested scout.report')

  cleanupRun(runId)
})
