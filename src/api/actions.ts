import { requestJson } from './client'
import type { ActionRequest, AgentResult, ResultStatus } from '../types'

export async function executeAction(request: ActionRequest): Promise<AgentResult> {
  const response = await requestJson<unknown>('/actions/execute', {
    method: 'POST',
    body: request,
  })

  return normalizeAgentResult(response, 'action', request.plugin)
}

function normalizeAgentResult(response: unknown, source: AgentResult['source'], label: string): AgentResult {
  const root = asRecord(response)
  const nestedResult = asRecord(root?.result)
  const status = resolveStatus(
    nestedResult?.status ?? root?.status,
    nestedResult?.success ?? root?.success,
  )
  const logs = toStringArray(nestedResult?.logs ?? root?.logs)
  const error = getString(nestedResult?.error ?? root?.error)
  const summary =
    getString(nestedResult?.summary ?? root?.summary) ??
    `${source === 'action' ? 'Action' : 'Workflow'} ${label} ${status === 'error' ? 'failed' : 'completed'}`

  return {
    id: crypto.randomUUID(),
    source,
    status,
    summary,
    response: nestedResult?.response ?? root?.response ?? response,
    logs,
    error: error ?? undefined,
    timestamp: new Date().toISOString(),
  }
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function resolveStatus(value: unknown, success?: unknown): ResultStatus {
  if (value === 'error') {
    return 'error'
  }
  if (value === 'info') {
    return 'info'
  }
  if (success === false) {
    return 'error'
  }
  return 'success'
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}
