import { requestJson } from './client'
import type { AgentResult, WorkflowRequest } from '../types'

export async function runWorkflow(request: WorkflowRequest): Promise<AgentResult> {
  const response = await requestJson<unknown>('/workflows/run', {
    method: 'POST',
    body: request,
  })

  return normalizeWorkflowResult(response, request.name)
}

function normalizeWorkflowResult(response: unknown, workflowName: string): AgentResult {
  const root = asRecord(response)
  const hasFailure = root?.success === false
  const status = hasFailure ? 'error' : 'success'
  const logs = toStringArray(root?.logs)
  const summary =
    getString(root?.summary) ??
    `Workflow ${workflowName} ${status === 'error' ? 'failed' : 'completed'}`

  return {
    id: crypto.randomUUID(),
    source: 'workflow',
    status,
    summary,
    response,
    logs,
    error: getString(root?.error) ?? undefined,
    timestamp: new Date().toISOString(),
  }
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}
