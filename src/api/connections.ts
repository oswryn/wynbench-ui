import { requestJson } from './client'
import type { ConnectionInput, ConnectionRecord } from '../types'

export async function listConnections(): Promise<ConnectionRecord[]> {
  const response = await requestJson<unknown>('/connections')
  if (!Array.isArray(response)) {
    return []
  }

  return response
    .map((entry) => normalizeConnection(entry))
    .filter((connection): connection is ConnectionRecord => connection !== null)
}

export async function createConnection(input: ConnectionInput): Promise<ConnectionRecord> {
  const response = await requestJson<unknown>('/connections', {
    method: 'POST',
    body: input,
  })

  return normalizeConnection(response) ?? {
    ...input,
    createdAt: new Date().toISOString(),
  }
}

export async function deleteConnection(connectionId: string) {
  await requestJson<unknown>(`/connections/${connectionId}`, {
    method: 'DELETE',
  })
}

function getRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function normalizeConnection(value: unknown): ConnectionRecord | null {
  const record = getRecord(value)
  if (!record) {
    return null
  }

  const id = getString(record.id)
  const protocol = getString(record.protocol)
  if (!id || !protocol) {
    return null
  }

  return {
    id,
    name: getString(record.name) ?? id,
    protocol,
    config: getRecord(record.config) ?? {},
    createdAt: getString(record.created_at) ?? getString(record.createdAt) ?? undefined,
  }
}
