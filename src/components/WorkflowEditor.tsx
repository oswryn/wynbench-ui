import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Callout,
  Card,
  Classes,
  FormGroup,
  H4,
  H5,
  HTMLSelect,
  InputGroup,
  TextArea,
} from '@blueprintjs/core'
import { protocolOptions, getProtocol } from '../protocols'
import type { ConnectionRecord, StoredWorkflow, WorkflowRequest } from '../types'

type LocalStep = {
  id: string
  name: string
  plugin: string
  payload: string
}

type WorkflowEditorProps = {
  connections: ConnectionRecord[]
  onRun: (request: WorkflowRequest) => Promise<void>
  onSave?: (workflow: StoredWorkflow) => Promise<void>
  editingWorkflow?: StoredWorkflow | null
  onCancelEdit?: () => void
}

function WorkflowEditor({ connections, onRun, onSave, editingWorkflow, onCancelEdit }: WorkflowEditorProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [connectionId, setConnectionId] = useState('')
  const [workflowId, setWorkflowId] = useState('')
  const [steps, setSteps] = useState<LocalStep[]>([
    {
      id: crypto.randomUUID(),
      name: 'step-1',
      plugin: 'http',
      payload: getProtocol('http').defaultActionPayload,
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  useEffect(() => {
    if (editingWorkflow) {
      setWorkflowId(editingWorkflow.id)
      setName(editingWorkflow.name)
      setConnectionId(editingWorkflow.steps[0]?.action.connection_id ?? '')
      setSteps(
        editingWorkflow.steps.map((step) => ({
          id: crypto.randomUUID(),
          name: step.name,
          plugin: step.action.plugin,
          payload: JSON.stringify(step.action.params ?? {}, null, 2),
        })),
      )
      return
    }

    setWorkflowId('')
    setName('')
    setConnectionId('')
    setSteps([
      {
        id: crypto.randomUUID(),
        name: 'step-1',
        plugin: 'http',
        payload: getProtocol('http').defaultActionPayload,
      },
    ])
  }, [editingWorkflow])

  function updateStep(stepId: string, field: 'name' | 'plugin' | 'payload', value: string) {
    setSteps((current) => current.map((step) => (step.id === stepId ? { ...step, [field]: value } : step)))
  }

  function updateStepPlugin(stepId: string, nextPlugin: string) {
    setSteps((current) =>
      current.map((step) => {
        if (step.id !== stepId) {
          return step
        }
        const payload =
          step.payload === getProtocol(step.plugin).defaultActionPayload
            ? getProtocol(nextPlugin).defaultActionPayload
            : step.payload
        return { ...step, plugin: nextPlugin, payload }
      }),
    )
  }

  function addStep() {
    setSteps((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: '',
        plugin: 'http',
        payload: getProtocol('http').defaultActionPayload,
      },
    ])
  }

  function removeStep(stepId: string) {
    setSteps((current) => current.filter((step) => step.id !== stepId))
  }

  function buildRequest(): WorkflowRequest | null {
    try {
      return {
        name,
        steps: steps.map((step) => ({
          name: step.name,
          action: {
            plugin: step.plugin,
            connection_id: connectionId || undefined,
            params: JSON.parse(step.payload),
          },
        })),
      }
    } catch {
      setParseError('Each workflow step payload must be valid JSON.')
      return null
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setParseError(null)

    const request = buildRequest()
    if (!request) {
      return
    }

    setIsSubmitting(true)
    try {
      await onRun(request)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSave() {
    if (!onSave || !editingWorkflow) {
      return
    }

    setParseError(null)

    const request = buildRequest()
    if (!request) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSave({
        id: workflowId,
        name: request.name,
        createdAt: editingWorkflow.createdAt,
        steps: request.steps,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <form className="form-grid" onSubmit={handleSubmit}>
        <div>
          <H4>{editingWorkflow ? 'Edit workflow' : 'Compose a workflow'}</H4>
          <p className={Classes.TEXT_MUTED}>Define ordered steps and run them as one request.</p>
        </div>

        <FormGroup label="Workflow name" labelFor="workflow-name">
          <InputGroup
            id="workflow-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Daily smoke test"
          />
        </FormGroup>

        <FormGroup label="Connection" labelFor="workflow-connection">
          {connections.length > 0 ? (
            <HTMLSelect
              id="workflow-connection"
              fill
              required
              value={connectionId}
              onChange={(event) => setConnectionId(event.target.value)}
              options={[
                { value: '', label: 'Select a connection' },
                ...connections.map((connection) => ({ value: connection.id, label: connection.name })),
              ]}
            />
          ) : (
            <Button
              id="workflow-connection"
              fill
              minimal
              outlined
              intent="primary"
              icon="link"
              text="Create a connection first"
              onClick={() => navigate('/connections')}
            />
          )}
          {connections.length === 0 ? (
            <div className={Classes.TEXT_MUTED} style={{ marginTop: '0.5rem' }}>
              No saved connections exist yet. Create one to run workflows.
            </div>
          ) : null}
        </FormGroup>

        <div className="step-list">
          {steps.map((step, index) => (
            <Card key={step.id} compact>
              <div className="page-header">
                <H5>Step {index + 1}</H5>
                <Button
                  variant="minimal"
                  intent="danger"
                  icon="trash"
                  text="Remove"
                  onClick={() => removeStep(step.id)}
                  disabled={steps.length === 1}
                />
              </div>

              <FormGroup label="Step name" labelFor={`step-name-${step.id}`}>
                <InputGroup
                  id={`step-name-${step.id}`}
                  required
                  value={step.name}
                  onChange={(event) => updateStep(step.id, 'name', event.target.value)}
                  placeholder="fetch-status"
                />
              </FormGroup>

              <FormGroup label="Plugin" labelFor={`step-plugin-${step.id}`}>
                <HTMLSelect
                  id={`step-plugin-${step.id}`}
                  fill
                  value={step.plugin}
                  onChange={(event) => updateStepPlugin(step.id, event.target.value)}
                  options={protocolOptions}
                />
              </FormGroup>

              <FormGroup label="Params (JSON)" labelFor={`step-payload-${step.id}`}>
                <TextArea
                  id={`step-payload-${step.id}`}
                  fill
                  autoResize
                  rows={8}
                  value={step.payload}
                  onChange={(event) => updateStep(step.id, 'payload', event.target.value)}
                />
              </FormGroup>
            </Card>
          ))}
        </div>

        <div className="row-actions">
          <Button variant="outlined" icon="plus" text="Add step" onClick={addStep} />
          {editingWorkflow && onSave ? (
            <Button
              variant="outlined"
              icon="floppy-disk"
              text="Save workflow"
              onClick={handleSave}
              disabled={connections.length === 0}
            />
          ) : null}
          {editingWorkflow && onCancelEdit ? (
            <Button variant="minimal" text="Cancel" onClick={onCancelEdit} />
          ) : null}
          <Button
            type="submit"
            intent="primary"
            loading={isSubmitting}
            disabled={connections.length === 0}
            text="Run workflow"
          />
        </div>

        {parseError ? <Callout intent="danger">{parseError}</Callout> : null}
      </form>
    </Card>
  )
}

export default WorkflowEditor
