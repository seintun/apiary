import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('dashboard avoids innerHTML for ledger-rendered fields', () => {
  const app = fs.readFileSync('dashboard/app.js', 'utf8')
  assert.equal(app.includes('innerHTML'), false)
  assert.match(app, /textContent/)
})

test('static server uses an allowlist and security headers', () => {
  const server = fs.readFileSync('scripts/apiary-serve-monitor.mjs', 'utf8')
  assert.match(server, /function allowed/)
  assert.match(server, /x-content-type-options/)
  assert.match(server, /127\.0\.0\.1/)
})
