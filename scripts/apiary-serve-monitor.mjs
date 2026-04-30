#!/usr/bin/env node
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve(new URL('..', import.meta.url).pathname)
const port = Number(process.argv[2] || process.env.PORT || 8765)
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8' }
http.createServer((req,res)=>{ const url = new URL(req.url, `http://localhost:${port}`); let file = url.pathname === '/' ? 'dashboard/index.html' : url.pathname.slice(1); const full = path.resolve(root, file); if(!full.startsWith(root)) { res.writeHead(403); return res.end('forbidden') } fs.readFile(full,(err,buf)=>{ if(err){ res.writeHead(404); return res.end('not found') } res.writeHead(200,{ 'content-type': types[path.extname(full)] || 'application/octet-stream' }); res.end(buf) }) }).listen(port,()=>console.log(`Apiary Hive Board: http://localhost:${port}`))
