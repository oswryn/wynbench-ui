import { requestJson } from './client'
import type { ConnectionRecord, StoredWorkflow } from '../types'

export type ConfigSnapshot = {
  connections: ConnectionRecord[]
  workflows: StoredWorkflow[]
}

export async function exportConfig(): Promise<ConfigSnapshot> {
  return requestJson<ConfigSnapshot>('/config/export')
}

export async function importConfig(snapshot: ConfigSnapshot): Promise<ConfigSnapshot> {
  return requestJson<ConfigSnapshot>('/config/import', {
    method: 'POST',
    body: snapshot,
  })
}

export async function getConfigPath(): Promise<string> {
  const response = await requestJson<{ path: string }>('/config/path')
  return response.path
}
