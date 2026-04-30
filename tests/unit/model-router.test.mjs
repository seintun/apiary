import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSpawnOptions,
  resolveApiaryModel,
  shouldRetryWithDefault,
  spawnWithApiaryModel,
} from '../../scripts/model-router.mjs'

test('no config omits explicit model', () => {
  const resolved = resolveApiaryModel({}, 'cheapWorker')
  assert.equal(resolved.role, 'cheapWorker')
  assert.equal(resolved.model, undefined)
  assert.equal(resolved.omitModel, true)
})

test('soft preferred model is applied', () => {
  const config = { apiary: { models: { cheapWorker: { prefer: 'local-small' } } } }
  const { options, resolved } = buildSpawnOptions({ task: 'inspect files' }, config, 'cheapWorker')
  assert.equal(options.model, 'local-small')
  assert.equal(resolved.required, false)
})

test('auto/default preferences omit model', () => {
  for (const prefer of ['auto', 'default', 'host-default', null]) {
    const config = { apiary: { models: { reviewer: { prefer } } } }
    assert.equal(resolveApiaryModel(config, 'reviewer').model, undefined)
  }
})

test('unknown role falls back safely', () => {
  const resolved = resolveApiaryModel({}, 'weirdRole')
  assert.equal(resolved.role, 'fallbackSafe')
  assert.equal(resolved.model, undefined)
})

test('soft preferred model failure retries once with host default', async () => {
  const calls = []
  const config = { apiary: { models: { cheapWorker: { prefer: 'flaky-model' } } } }
  const result = await spawnWithApiaryModel(async (options, resolved) => {
    calls.push({ options, resolved })
    if (calls.length === 1) throw new Error('provider down')
    return 'ok'
  }, { task: 'compare docs' }, config, 'cheapWorker')

  assert.equal(result, 'ok')
  assert.equal(calls.length, 2)
  assert.equal(calls[0].options.model, 'flaky-model')
  assert.equal(calls[1].options.model, undefined)
  assert.equal(calls[1].resolved.retriedWithDefault, true)
})

test('required preferred model failure does not fallback', async () => {
  const config = { apiary: { models: { reviewer: { prefer: 'must-use', required: true } } } }
  await assert.rejects(
    spawnWithApiaryModel(async () => { throw new Error('unavailable') }, { task: 'review' }, config, 'reviewer'),
    /unavailable/,
  )
})

test('retry predicate respects required and fallback flag', () => {
  assert.equal(shouldRetryWithDefault(new Error('x'), { model: 'm', required: false, fallbackToDefault: true }), true)
  assert.equal(shouldRetryWithDefault(new Error('x'), { model: 'm', required: true, fallbackToDefault: true }), false)
  assert.equal(shouldRetryWithDefault(new Error('x'), { model: 'm', required: false, fallbackToDefault: false }), false)
  assert.equal(shouldRetryWithDefault(new Error('x'), { model: undefined, required: false, fallbackToDefault: true }), false)
})


test('air-gapped default policy never requires an explicit model', () => {
  for (const role of ['cheapWorker', 'balancedWorker', 'strongJudge', 'reviewer', 'fallbackSafe']) {
    const resolved = resolveApiaryModel({}, role)
    assert.equal(resolved.model, undefined)
    assert.equal(resolved.required, false)
    assert.equal(resolved.fallbackToDefault, true)
  }
})

test('ordered preferences choose first explicit model but still fallback softly', () => {
  const config = { apiary: { models: { cheapWorker: { prefer: ['auto', 'local-small', 'cloud-small'] } } } }
  const resolved = resolveApiaryModel(config, 'cheapWorker')
  assert.equal(resolved.model, 'local-small')
  assert.equal(resolved.required, false)
  assert.equal(resolved.fallbackToDefault, true)
})

test('all default-like ordered preferences omit model for host/local runtime', () => {
  const config = { apiary: { models: { cheapWorker: { prefer: ['auto', 'default', 'host-default'] } } } }
  assert.equal(resolveApiaryModel(config, 'cheapWorker').model, undefined)
})

test('legacy scout model roles normalize to worker roles', () => {
  const config = { apiary: { models: { cheapScout: { prefer: 'legacy-small' } } } }
  const resolved = resolveApiaryModel(config, 'cheapScout')
  assert.equal(resolved.role, 'cheapWorker')
  assert.equal(resolved.model, 'legacy-small')
})
