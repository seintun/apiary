import test from 'node:test'
import assert from 'node:assert/strict'
import { formatRun } from '../../scripts/apiary-monitor.mjs'

test('formatRun renders workers and resolved model route', () => {
  const text = formatRun({ title:'Demo', status:'running', updatedAt:new Date().toISOString(), summary:{total:1,done:0,running:1,waiting:0,blocked:0}, scouts:[{role:'uxWorker', label:'UX worker', modelRole:'reviewer', model:null, resolvedModel:'openai-codex/gpt-5.5', status:'running', progress:40}], events:[{ts:new Date().toISOString(), severity:'info', message:'Started'}] })
  assert.match(text, /APIARY HIVE/)
  assert.match(text, /openai-codex\/gpt-5…/)
  assert.match(text, /UX worker/)
})
