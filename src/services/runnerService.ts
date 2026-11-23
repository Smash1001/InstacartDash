import type { Runner } from '../types'
import { backend } from './backend'

const MAX_NAME_LENGTH = 60

export function validateRunnerName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (!name) throw new Error('Name is required.')
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`)
  }
  return name
}

const byName = (a: Runner, b: Runner) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })

export async function listRunners(): Promise<Runner[]> {
  return (await backend.listRunners()).sort(byName)
}

export async function listActiveRunners(): Promise<Runner[]> {
  return (await listRunners()).filter((r) => r.is_active)
}

export function createRunner(name: string): Promise<Runner> {
  return backend.createRunner(validateRunnerName(name))
}

/**
 * Rename and/or (de)activate a runner. Runners are never hard-deleted —
 * deactivation hides them from the leaderboard but keeps their history.
 */
export function updateRunner(
  id: string,
  patch: { name?: string; is_active?: boolean },
): Promise<Runner> {
  const clean = { ...patch }
  if (clean.name !== undefined) clean.name = validateRunnerName(clean.name)
  return backend.updateRunner(id, clean)
}
