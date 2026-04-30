import test from 'node:test'
import assert from 'node:assert/strict'
import { formatRun } from '../../scripts/apiary-monitor.mjs'

test('formatRun renders scouts and host-default route', () => {
  const text = formatRun({ title:'Demo', status:'running', updatedAt:new Date().toISOString(), summary:{total:1,done:0,running:1,waiting:0,blocked:0}, scouts:[{role:'uxScout', label:'UX scout', modelRole:'reviewer', model:null, status:'running', progress:40}], events:[{ts:new Date().toISOString(), severity:'info', message:'Started'}] })
  assert.match(text, /APIARY HIVE/)
  assert.match(text, /host-default/)
  assert.match(text, /UX scout/)
})
