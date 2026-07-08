import { requestJson } from './client'
import type { AgentResult, StoredWorkflow, WorkflowRequest } from '../types'

export async function listWorkflows(): Promise<StoredWorkflow[]> {
  const response = await requestJson<unknown>('/workflows')
  if (!Array.isArray(response)) {
    return []
  }

  return response
    .map((item) => normalizeWorkflow(item))
    .filter((workflow): workflow is StoredWorkflow => workflow !== null)
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
  await requestJson<unknown>(`/workflows/${workflowId}`, {
    method: 'DELETE',
  })
}

export async function updateWorkflow(
  workflowId: string,
  request: Pick<StoredWorkflow, 'name' | 'steps'>,
): Promise<StoredWorkflow> {
  const response = await requestJson<unknown>(`/workflows/${workflowId}`, {
    method: 'PUT',
    body: request,
  })

  const workflow = normalizeWorkflow(response)
  if (!workflow) {
    throw new Error('invalid workflow response')
  }

  return workflow
}

export async function runWorkflow(request: WorkflowRequest | { id: string }): Promise<AgentResult> {
  const response = await requestJson<unknown>('/workflows/run', {
    method: 'POST',
    body: request,
  })

  return normalizeWorkflowResult(response, 'workflow')
}

function normalizeWorkflow(item: unknown): StoredWorkflow | null {
  const record = asRecord(item)
  if (!record) {
    return null
  }

  const id = getString(record.id)
  const name = getString(record.name)
  const steps = Array.isArray(record.steps) ? record.steps : null
  if (!id || !name || steps === null) {
    return null
  }

  const normalizedSteps = steps.reduce<StoredWorkflow['steps']>((acc, step) => {
    const stepRecord = asRecord(step)
    if (!stepRecord) {
      return acc
    }

    const stepName = getString(stepRecord.name)
    const action = asRecord(stepRecord.action)
    if (!stepName || !action) {
      return acc
    }

    const plugin = getString(action.plugin)
    const params = action.params && typeof action.params === 'object' ? (action.params as Record<string, unknown>) : null
    if (!plugin || params === null) {
      return acc
    }

    acc.push({
      name: stepName,
      action: {
        plugin,
        connection_id: typeof action.connection_id === 'string' ? action.connection_id : undefined,
        params,
      },
    })

    return acc
  }, [])

  return {
    id,
    name,
    steps: normalizedSteps,
  }
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
