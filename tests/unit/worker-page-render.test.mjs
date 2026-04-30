import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const workerJs = fs.readFileSync(path.join(root, 'dashboard/worker.js'), 'utf8')
const workerHtml = fs.readFileSync(path.join(root, 'dashboard/worker.html'), 'utf8')

const expectedSections = [
  'workerDoing',
  'workerAccomplished',
  'workerFindings',
  'workerArtifacts',
  'workerFiles',
  'workerNextSteps',
  'workerRisks',
  'workerLog'
]

test('worker page references all required report sections', () => {
  for (const section of expectedSections) {
    const referenced = workerJs.includes(`'${section}'`) || workerJs.includes(`"${section}"`)
    assert.ok(referenced, `Section ${section} should be referenced for rendering`)
  }
})

test('worker page uses textContent/createElement instead of unsafe HTML rendering', () => {
  assert.ok(workerJs.includes('el.textContent = String(text ??') || workerJs.includes('.textContent='), 'Dynamic text should use textContent')
  assert.ok(!workerJs.includes('innerHTML ='), 'Worker JS should avoid direct innerHTML assignment')
})

test('worker page derives a detail view model', () => {
  assert.ok(workerJs.includes('function deriveWorkerDetailView(worker, run, reportData, reportLoadError)'), 'deriveWorkerDetailView should exist')
  assert.ok(workerJs.includes('workerSourceCopy'), 'Snapshot should display the source label')
  assert.ok(workerJs.includes('workerFreshness'), 'Snapshot should display freshness')
})

test('safe links are protocol checked', () => {
  assert.ok(workerJs.includes('function safeHref(href)'), 'safeHref function must be defined')
  assert.ok(workerJs.includes("url.protocol === 'http:'") && workerJs.includes("url.protocol === 'https:'"), 'Only http/https URLs should be allowed')
})

test('worker report fetch handles missing file gracefully', () => {
  assert.ok(workerJs.includes('const reportPath = worker.reportPath || worker.report?.path'), 'Conditional fetch should check canonical and legacy reportPath')
  assert.ok(workerJs.includes('worker.reportLoadError = error'), 'Missing report fetch should be tracked')
  assert.ok(workerJs.includes('Missing report artifact'), 'Missing report should degrade to a visible risk')
})

test('report data is merged without overwriting core worker fields', () => {
  assert.ok(workerJs.includes('worker.reportData = await fetchJSON'), 'Report data should be assigned to worker.reportData property')
  assert.ok(workerJs.includes('deriveWorkerDetailView(worker, run, worker.reportData, worker.reportLoadError)'), 'Detail view should be derived from merged report data')
  assert.ok(workerJs.includes("report?.findings || (hasReport ? []"), 'Findings should fall back from report data without clobbering worker data')
  assert.ok(workerJs.includes("report?.artifacts || worker.artifactPaths || []"), 'Artifacts should fall back from report data without clobbering worker data')
})

test('all report sections render with fallback to empty state', () => {
  assert.ok(workerJs.includes('No findings recorded') && workerJs.includes('None recorded'), 'Sections should have empty state fallback')
})

test('report artifacts render as safe links', () => {
  assert.ok(workerJs.includes('renderItems('), 'renderItems function should be used for artifacts')
  assert.ok(workerJs.includes("document.createElement('a')"), 'Artifact links should be created with createElement')
})

test('files touched render as text not links', () => {
  assert.ok(workerJs.includes("renderItems('workerFiles', view.filesTouched, {links:false"), 'Files touched should be rendered as text')
})

test('ledger-derived fallback avoids repeating the same summary in every section', () => {
  assert.ok(workerJs.includes('function derivedDoing(worker)'), 'Current focus should be derived separately from the summary')
  assert.ok(workerJs.includes('Completion recorded in the run ledger'), 'Completed work should not repeat the snapshot summary verbatim')
  assert.ok(workerJs.includes('function eventSummariesFor(worker, run)'), 'Findings should come from worker events, not a repeated ledger summary')
  assert.ok(!workerJs.includes('Ledger summary:'), 'Findings should not duplicate the snapshot summary with a prefix')
})

test('worker page back link returns to dashboard', () => {
  assert.ok(workerHtml.includes('href="index.html"'), 'Worker page should have a back link to dashboard index.html')
})

test('worker page polls for updates', () => {
  assert.ok(workerJs.includes('setInterval(()=>{ if(!document.hidden) loadAndRender() }, 3000)'), 'Worker page should poll while visible')
})

test('full report page renders all expected sections', () => {
  for (const section of expectedSections) {
    assert.ok(workerHtml.includes(`id="${section}"`), `Expected section element '${section}' should exist in worker.html`)
  }
})
