import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const repo = path.resolve(new URL('../..', import.meta.url).pathname)

test('apiary-run CLI creates monitor-readable ledger', () => {
  const title = `CLI flow ${Date.now()}`
  const start = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'start', '--title', title], { cwd: repo, encoding: 'utf8' })
  assert.equal(start.status, 0, start.stderr)
  const runId = start.stdout.trim()
  assert.match(runId, /^run-/)

  let step = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'scout-start', '--run', runId, '--id', 'one', '--label', 'One scout', '--role', 'testScout', '--model-role', 'cheapScout'], { cwd: repo, encoding: 'utf8' })
  assert.equal(step.status, 0, step.stderr)
  step = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'scout-complete', '--run', runId, '--id', 'one', '--summary', 'Finished test scout'], { cwd: repo, encoding: 'utf8' })
  assert.equal(step.status, 0, step.stderr)

  const monitor = spawnSync(process.execPath, ['scripts/apiary-monitor.mjs', '--run', runId], { cwd: repo, encoding: 'utf8' })
  assert.equal(monitor.status, 0, monitor.stderr)
  assert.match(monitor.stdout, /One scout/)
  assert.match(monitor.stdout, /Finished/)

  fs.rmSync(path.join(repo, 'runs', `${runId}.json`), { force: true })
})
