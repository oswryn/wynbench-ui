import { requestJson } from './client'
import type { ConnectionInput, ConnectionRecord } from '../types'

export async function createConnection(input: ConnectionInput): Promise<ConnectionRecord> {
  const response = await requestJson<unknown>('/connections', {
    method: 'POST',
    body: input,
  })

  const root = getRecord(response)
  const source = getRecord(root?.connection) ?? root

  return {
    id: getString(source?.id) ?? crypto.randomUUID(),
    name: getString(source?.name) ?? input.name,
    endpoint: getString(source?.endpoint) ?? input.endpoint,
    protocol: getString(source?.protocol) ?? input.protocol,
    createdAt: getString(source?.createdAt) ?? new Date().toISOString(),
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
