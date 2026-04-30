#!/usr/bin/env node
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { handle as handleApiaryRun } from './apiary-run.mjs'
const root = path.resolve(new URL('..', import.meta.url).pathname)
const port = Number(process.argv[2] || process.env.PORT || 8765)
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8' }
function allowed(urlPath) {
  if (urlPath === '/') return 'dashboard/index.html'
  const clean = urlPath.replace(/^\/+/, '')
  if (/^dashboard\/[A-Za-z0-9._-]+$/.test(clean)) return clean
  if (clean === 'runs/registry.json') return clean
  if (/^runs\/run-[A-Za-z0-9._-]+\.json$/.test(clean)) return clean
  return null
}
http.createServer((req,res)=>{
  const url = new URL(req.url, `http://localhost:${port}`)
  if (url.pathname === '/runs/registry.json' || /^\/runs\/run-[A-Za-z0-9._-]+\.json$/.test(url.pathname)) {
    const runId = url.pathname.match(/\/runs\/(run-[A-Za-z0-9._-]+)\.json$/)?.[1]
    if (runId) {
      try { handleApiaryRun(['sweep-stale', '--run', runId, '--older-than-minutes', process.env.APIARY_STALE_MINUTES || '5']) } catch {}
    }
  }
  const file = allowed(url.pathname)
  if(!file){ res.writeHead(404, {'content-type':'text/plain; charset=utf-8'}); return res.end('not found') }
  const full = path.resolve(root, file)
  if(!full.startsWith(root)) { res.writeHead(403); return res.end('forbidden') }
  fs.readFile(full,(err,buf)=>{
    if(err){ res.writeHead(404, {'content-type':'text/plain; charset=utf-8'}); return res.end('not found') }
    res.writeHead(200,{ 'content-type': types[path.extname(full)] || 'application/octet-stream', 'x-content-type-options':'nosniff', 'referrer-policy':'no-referrer', 'cache-control':'no-store, max-age=0' })
    res.end(buf)
  })
}).listen(port,'127.0.0.1',()=>console.log(`Honey ComBoard: http://127.0.0.1:${port}`))
