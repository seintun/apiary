import test from 'node:test'
import assert from 'node:assert/strict'

// Allowed scout properties per run-ledger.schema.json
const SCOUT_REQUIRED = ['id', 'label', 'role', 'status', 'startedAt', 'lastSeenAt']
const SCOUT_ALLOWED = [
  ...SCOUT_REQUIRED,
  'modelRole', 'model', 'resolvedModel', 'sessionKey', 'completedAt',
  'progress', 'summary', 'awaiting', 'artifactPaths',
  'reportHeadline', 'reportBullets', 'reportPath', 'reportUpdatedAt', 'reportStatus'
]

const RUN_REQUIRED = ['schemaVersion', 'runId', 'title', 'status', 'createdAt', 'updatedAt', 'scouts', 'events']

/**
 * Validate a run object against the ledger schema (simplified)
 * Returns array of error messages, empty if valid
 */
function validateRun(run) {
  const errors = []

  // Top-level required fields
  for (const field of RUN_REQUIRED) {
    if (run[field] === undefined) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  // Scouts validation
  if (!Array.isArray(run.scouts)) {
    errors.push('scouts must be an array')
  } else {
    run.scouts.forEach((scout, idx) => {
      // Required scout fields
      for (const field of SCOUT_REQUIRED) {
        if (scout[field] === undefined) {
          errors.push(`Scout ${idx}: missing required field ${field}`)
        }
      }

      // No extra properties allowed
      const scoutKeys = Object.keys(scout)
      for (const key of scoutKeys) {
        if (!SCOUT_ALLOWED.includes(key)) {
          errors.push(`Scout ${idx}: unexpected property ${key}`)
        }
      }

      // Report field type checks
      if (scout.reportHeadline !== undefined) {
        if (typeof scout.reportHeadline !== 'string') {
          errors.push(`Scout ${idx}: reportHeadline must be a string`)
        }
      }
      if (scout.reportBullets !== undefined) {
        if (!Array.isArray(scout.reportBullets)) {
          errors.push(`Scout ${idx}: reportBullets must be an array`)
        } else if (scout.reportBullets.some(b => typeof b !== 'string')) {
          errors.push(`Scout ${idx}: reportBullets must contain only strings`)
        } else if (scout.reportBullets.length > 5) {
          errors.push(`Scout ${idx}: reportBullets max 5 items`)
        }
      }
      if (scout.reportPath !== undefined && typeof scout.reportPath !== 'string') {
        errors.push(`Scout ${idx}: reportPath must be a string`)
      }
      if (scout.reportUpdatedAt !== undefined && typeof scout.reportUpdatedAt !== 'string') {
        errors.push(`Scout ${idx}: reportUpdatedAt must be a string`)
      }
      if (scout.reportStatus !== undefined && !['partial', 'final'].includes(scout.reportStatus)) {
        errors.push(`Scout ${idx}: reportStatus must be 'partial' or 'final'`)
      }
    })
  }

  return errors
}

// Old fixture - no report fields (backward compatible)
const oldFixture = {
  schemaVersion: 'apiary.run.v1',
  runId: 'run-old-test',
  title: 'Old format run',
  status: 'done',
  privacyMode: false,
  createdAt: '2026-04-30T00:00:00.000Z',
  updatedAt: '2026-04-30T00:04:00.000Z',
  completedAt: '2026-04-30T00:04:00.000Z',
  coordinator: { adapter: 'test', label: 'Tester' },
  summary: { total: 1, queued: 0, running: 0, waiting: 0, blocked: 0, done: 1, failed: 0, canceled: 0, stale: 0 },
  scouts: [
    {
      id: 'worker1',
      label: 'Worker 1',
      role: 'research',
      modelRole: 'default',
      model: null,
      resolvedModel: null,
      status: 'done',
      sessionKey: null,
      startedAt: '2026-04-30T00:00:30.000Z',
      lastSeenAt: '2026-04-30T00:04:00.000Z',
      completedAt: '2026-04-30T00:04:00.000Z',
      progress: 100,
      summary: 'Completed research',
      awaiting: null,
      artifactPaths: []
    }
  ],
  events: [
    { id: 'evt-1', ts: '2026-04-30T00:00:00.000Z', type: 'state', severity: 'info', scoutId: null, message: 'Run started' },
    { id: 'evt-2', ts: '2026-04-30T00:04:00.000Z', type: 'state', severity: 'success', scoutId: 'worker1', message: 'Worker done' }
  ],
  decisionAwaiting: null
}

// New fixture - includes report fields
const newFixture = {
  schemaVersion: 'apiary.run.v1',
  runId: 'run-new-test',
  title: 'New format run with report',
  status: 'done',
  privacyMode: false,
  createdAt: '2026-04-30T00:00:00.000Z',
  updatedAt: '2026-04-30T00:04:00.000Z',
  completedAt: '2026-04-30T00:04:00.000Z',
  coordinator: { adapter: 'test', label: 'Tester' },
  summary: { total: 1, queued: 0, running: 0, waiting: 0, blocked: 0, done: 1, failed: 0, canceled: 0, stale: 0 },
  scouts: [
    {
      id: 'worker1',
      label: 'Worker 1',
      role: 'research',
      modelRole: 'default',
      model: null,
      resolvedModel: null,
      status: 'done',
      sessionKey: null,
      startedAt: '2026-04-30T00:00:30.000Z',
      lastSeenAt: '2026-04-30T00:04:00.000Z',
      completedAt: '2026-04-30T00:04:00.000Z',
      progress: 100,
      summary: 'Completed research',
      awaiting: null,
      artifactPaths: [],
      reportHeadline: 'Research findings summary',
      reportBullets: ['Found evidence A', 'Found evidence B', 'Key insight identified'],
      reportPath: 'reports/run-new-test-worker1.json',
      reportUpdatedAt: '2026-04-30T00:04:00.000Z',
      reportStatus: 'final'
    }
  ],
  events: [
    { id: 'evt-1', ts: '2026-04-30T00:00:00.000Z', type: 'state', severity: 'info', scoutId: null, message: 'Run started' },
    { id: 'evt-2', ts: '2026-04-30T00:04:00.000Z', type: 'state', severity: 'success', scoutId: 'worker1', message: 'Worker done' }
  ],
  decisionAwaiting: null
}

test('old fixture validates against schema', () => {
  const errors = validateRun(oldFixture)
  assert.equal(errors.length, 0, `Unexpected validation errors: ${errors.join('; ')}`)
})

test('new fixture with report fields validates against schema', () => {
  const errors = validateRun(newFixture)
  assert.equal(errors.length, 0, `Unexpected validation errors: ${errors.join('; ')}`)
})

test('invalid reportStatus fails validation', () => {
  const invalid = JSON.parse(JSON.stringify(newFixture))
  invalid.scouts[0].reportStatus = 'invalid'
  const errors = validateRun(invalid)
  assert.ok(errors.length > 0, 'Expected validation error for invalid reportStatus')
  assert.ok(errors[0].includes('reportStatus'))
})

test('too many bullets fails validation', () => {
  const invalid = JSON.parse(JSON.stringify(newFixture))
  invalid.scouts[0].reportBullets = ['a', 'b', 'c', 'd', 'e', 'f']
  const errors = validateRun(invalid)
  assert.ok(errors.length > 0, 'Expected validation error for >5 bullets')
})

test('reportStatus "partial" is valid', () => {
  const partial = JSON.parse(JSON.stringify(newFixture))
  partial.scouts[0].reportStatus = 'partial'
  const errors = validateRun(partial)
  assert.equal(errors.length, 0, `Partial status should be valid, got: ${errors.join('; ')}`)
})

test('reportHeadline type must be string', () => {
  const invalid = JSON.parse(JSON.stringify(newFixture))
  invalid.scouts[0].reportHeadline = 123
  const errors = validateRun(invalid)
  assert.ok(errors.some(e => e.includes('reportHeadline') && e.includes('string')))
})

test('reportPath must be string', () => {
  const invalid = JSON.parse(JSON.stringify(newFixture))
  delete invalid.scouts[0].reportStatus
  invalid.scouts[0].reportPath = null
  const errors = validateRun(invalid)
  assert.ok(errors.some(e => e.includes('reportPath')))
})

test('mix of present and absent report fields validates (partial report)', () => {
  const partialReport = JSON.parse(JSON.stringify(newFixture))
  delete partialReport.scouts[0].reportBullets
  delete partialReport.scouts[0].reportPath
  delete partialReport.scouts[0].reportUpdatedAt
  delete partialReport.scouts[0].reportStatus
  const errors = validateRun(partialReport)
  assert.equal(errors.length, 0, `Partial report fields should be valid: ${errors.join('; ')}`)
})