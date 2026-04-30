#!/usr/bin/env node
import fs from 'node:fs'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const target = process.argv[2] || '.apiary.local.json'
const rl = readline.createInterface({ input, output })

async function ask(question, fallback) {
  const answer = (await rl.question(`${question} ${fallback ? `[${fallback}] ` : ''}`)).trim()
  return answer || fallback
}

const optimize = (await ask('Optimize Apiary model roles? y/N', 'N')).toLowerCase().startsWith('y')
const models = {}

for (const role of ['cheapScout', 'balancedScout', 'strongJudge', 'reviewer']) {
  const fallback = optimize ? (role.includes('Scout') ? 'auto' : 'default') : 'default'
  const prefer = await ask(`${role} preference (auto/default/model-name)`, fallback)
  models[role] = {
    prefer,
    required: false,
    fallbackToDefault: true,
  }
}
models.fallbackSafe = { prefer: 'default', required: false, fallbackToDefault: true }

const config = { apiary: { models } }
fs.writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`)
rl.close()
console.log(`Wrote ${target}. Keep this file local/private; public Apiary works without it.`)
