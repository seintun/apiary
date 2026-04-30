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
