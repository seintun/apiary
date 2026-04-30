import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')
const appJs = fs.readFileSync(path.join(projectRoot, 'dashboard', 'app.js'), 'utf8')
const stylesCss = fs.readFileSync(path.join(projectRoot, 'dashboard', 'styles.css'), 'utf8')

function extractReportBlock(code) {
  const startIdx = code.indexOf('function appendInlineDetails(tbody, scout, status){')
  if (startIdx === -1) return null
  let depth = 0
  for (let i = startIdx; i < code.length; i++) {
    if (code[i] === '{') depth++
    else if (code[i] === '}') {
      depth--
      if (depth === 0) return code.slice(startIdx, i + 1)
    }
  }
  return null
}

test('report preview only renders when report fields exist', () => {
  const block = extractReportBlock(appJs)
  assert.ok(block, 'Report detail block must exist')
  assert.ok(block.includes('reportSection'), 'Report section should be created in inline worker details')
  assert.ok(appJs.includes('scout.reportHeadline'), 'Preview should read canonical flat reportHeadline')
  assert.ok(appJs.includes('scout.reportBullets'), 'Preview should read canonical flat reportBullets')
})

test('report preview uses safe textContent rendering, not innerHTML', () => {
  const block = extractReportBlock(appJs)
  assert.ok(block, 'Report block must exist')
  assert.ok(block.includes("textEl('p', reportHeadline.trim(), 'report-headline')"), 'Headline must be rendered through textEl/textContent')
  assert.ok(block.includes("textEl('li', bullet)"), 'Bullets must be rendered through textEl/textContent')
  assert.ok(!block.includes('innerHTML'), 'Should not use innerHTML for report data')
})

test('report preview stays expanded on mobile', () => {
  assert.ok(stylesCss.includes('.report-content.collapsed{display:none}'), 'Preview may be manually collapsed')
  assert.ok(stylesCss.includes('.report-content.collapsed{display:block}'), 'Mobile CSS should force the report preview open')
  assert.ok(!appJs.includes("window.matchMedia('(max-width: 820px)')"), 'Report preview should not collapse via viewport script')
  assert.ok(appJs.includes('toggleBtn.onclick'), 'Toggle button must have click handler')
  assert.ok(appJs.includes('Show preview') && appJs.includes('Hide preview'), 'Toggle button text should update')
})

test('report preview limits bullets shown', () => {
  assert.ok(appJs.includes('reportBullets.slice(0,3)'), 'Preview should show max 3 bullets')
})

test('view full report button appears and links correctly', () => {
  assert.ok(appJs.includes('worker.html?run=') && appJs.includes('&worker='), 'Button must link to worker detail')
  assert.ok(appJs.includes('linkBtn.href'), 'Link href must be set')
  assert.ok(!appJs.includes('target=\'_blank\'') && !appJs.includes('target="_blank"'), 'Should stay in the same tab')
  assert.ok(appJs.includes('View full report'), 'Button text present')
})

test('all workers surface the full-detail CTA in inline detail cards', () => {
  const block = extractReportBlock(appJs)
  assert.ok(block?.includes("linkBtn.textContent='View full report →'"), 'Inline detail should always include the full-detail CTA')
  assert.ok(block?.includes('content.appendChild(linkBtn)'), 'CTA should be appended to every inline report preview')
})

test('no empty noise when report fields are absent', () => {
  const count = (appJs.match(/report-content/g) || []).length
  assert.equal(count, 1, 'report-content should appear exactly once, inside conditional')
})
