import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { readJson } from '../../scripts/apiary-run.mjs'

const repo = path.resolve(new URL('../..', import.meta.url).pathname)

test('complete refuses unfinished scouts unless forced', () => {
  const title = `Complete guard ${Date.now()}`
  const start = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'start', '--title', title], { cwd: repo, encoding: 'utf8' })
  const runId = start.stdout.trim()
  spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'scout-start', '--run', runId, '--id', 'unfinished', '--label', 'Unfinished', '--role', 'test'], { cwd: repo })
  const blocked = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'complete', '--run', runId], { cwd: repo, encoding: 'utf8' })
  assert.notEqual(blocked.status, 0)
  assert.match(blocked.stderr, /unfinished scouts/)
  const forced = spawnSync(process.execPath, ['scripts/apiary-run.mjs', 'complete', '--run', runId, '--force'], { cwd: repo, encoding: 'utf8' })
  assert.equal(forced.status, 0, forced.stderr)
  const run = JSON.parse(fs.readFileSync(path.join(repo, 'runs', `${runId}.json`), 'utf8'))
  assert.equal(run.status, 'done')
  fs.rmSync(path.join(repo, 'runs', `${runId}.json`), { force: true })
})

test('readJson returns fallback for malformed JSON when fallback is supplied', () => {
  const file = path.join(repo, 'runs', `bad-${Date.now()}.json`)
  fs.writeFileSync(file, '{ nope')
  assert.deepEqual(readJson(file, { ok: false }), { ok: false })
  fs.rmSync(file, { force: true })
})
