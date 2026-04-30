#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

export const APIARY_MODEL_ROLES = new Set([
  'cheapWorker',
  'balancedWorker',
  'strongJudge',
  'reviewer',
  'fallbackSafe',
])

const LEGACY_ROLE_ALIASES = new Map([
  ['cheapScout', 'cheapWorker'],
  ['balancedScout', 'balancedWorker'],
])

const DEFAULT_ROLE_POLICY = Object.freeze({
  prefer: 'default',
  required: false,
  fallbackToDefault: true,
})

const OMIT_MODEL_VALUES = new Set(['', 'auto', 'default', 'host-default', 'runtime-default', 'session-default'])

export function normalizeRole(role) {
  const canonical = LEGACY_ROLE_ALIASES.get(role) || role
  return APIARY_MODEL_ROLES.has(canonical) ? canonical : 'fallbackSafe'
}

export function normalizePolicy(rawPolicy = {}) {
  const policy = { ...DEFAULT_ROLE_POLICY, ...(rawPolicy || {}) }
  if (policy.model && !policy.prefer) policy.prefer = policy.model
  policy.required = policy.required === true
  policy.fallbackToDefault = policy.fallbackToDefault !== false
  return policy
}

export function shouldOmitModel(prefer) {
  if (prefer == null) return true
  if (Array.isArray(prefer)) return prefer.length === 0 || prefer.every((candidate) => shouldOmitModel(candidate))
  return OMIT_MODEL_VALUES.has(String(prefer).trim())
}

export function firstExplicitPreference(prefer) {
  if (!Array.isArray(prefer)) return shouldOmitModel(prefer) ? undefined : String(prefer).trim()
  const candidate = prefer.find((item) => !shouldOmitModel(item))
  return candidate == null ? undefined : String(candidate).trim()
}

export function resolveApiaryModel(config = {}, role = 'fallbackSafe') {
  const safeRole = normalizeRole(role)
  const legacyRole = safeRole === 'cheapWorker' ? 'cheapScout' : safeRole === 'balancedWorker' ? 'balancedScout' : safeRole
  const roleConfig = config?.apiary?.models?.[safeRole] ?? config?.apiary?.models?.[legacyRole] ?? config?.models?.[safeRole] ?? config?.models?.[legacyRole] ?? {}
  const policy = normalizePolicy(roleConfig)
  const model = firstExplicitPreference(policy.prefer)

  return {
    role: safeRole,
    model,
    required: policy.required,
    fallbackToDefault: policy.fallbackToDefault,
    omitModel: !model,
  }
}

export function buildSpawnOptions(baseOptions = {}, config = {}, role = 'fallbackSafe') {
  const resolved = resolveApiaryModel(config, role)
  const options = { ...baseOptions }
  if (resolved.model) options.model = resolved.model
  return { options, resolved }
}

export function shouldRetryWithDefault(error, resolved) {
  return Boolean(resolved?.model && !resolved.required && resolved.fallbackToDefault)
}

export async function spawnWithApiaryModel(spawnFn, baseOptions = {}, config = {}, role = 'fallbackSafe') {
  const { options, resolved } = buildSpawnOptions(baseOptions, config, role)
  try {
    return await spawnFn(options, resolved)
  } catch (error) {
    if (!shouldRetryWithDefault(error, resolved)) throw error
    const fallbackOptions = { ...baseOptions }
    delete fallbackOptions.model
    return spawnFn(fallbackOptions, { ...resolved, model: undefined, omitModel: true, retriedWithDefault: true })
  }
}

export function readJsonConfig(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return {}
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function printUsage() {
  console.log(`Usage: node scripts/model-router.mjs resolve <role> [config.json]\n\nPrints JSON describing the resolved Apiary model choice. YAML policies are documented in templates/model-policy.yaml; this tiny CLI accepts JSON for testability and shell use.`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , command, role = 'fallbackSafe', configPath] = process.argv
  if (command !== 'resolve') {
    printUsage()
    process.exit(command ? 1 : 0)
  }
  const config = readJsonConfig(configPath ? path.resolve(configPath) : '')
  console.log(JSON.stringify(resolveApiaryModel(config, role), null, 2))
}
