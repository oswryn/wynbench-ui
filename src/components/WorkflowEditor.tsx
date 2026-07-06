import { useState } from 'react'
import type { ConnectionRecord, WorkflowRequest } from '../types'

type WorkflowEditorProps = {
  connections: ConnectionRecord[]
  onRun: (request: WorkflowRequest) => Promise<void>
}

function WorkflowEditor({ connections, onRun }: WorkflowEditorProps) {
  const [name, setName] = useState('')
  const [connectionId, setConnectionId] = useState('')
  const [steps, setSteps] = useState([
    {
      id: crypto.randomUUID(),
      action: 'ping',
      payload: '{\n  "input": ""\n}',
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  function updateStep(stepId: string, field: 'action' | 'payload', value: string) {
    setSteps((current) => current.map((step) => (step.id === stepId ? { ...step, [field]: value } : step)))
  }

  function addStep() {
    setSteps((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        action: '',
        payload: '{\n  "input": ""\n}',
      },
    ])
  }

  function removeStep(stepId: string) {
    setSteps((current) => current.filter((step) => step.id !== stepId))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setParseError(null)

    let parsedSteps: WorkflowRequest['steps']

    try {
      parsedSteps = steps.map((step) => ({
        action: step.action,
        payload: JSON.parse(step.payload),
      }))
    } catch {
      setParseError('Each workflow step payload must be valid JSON.')
      return
    }

    setIsSubmitting(true)

    try {
      await onRun({
        name,
        connectionId,
        steps: parsedSteps,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="panel form-grid" onSubmit={handleSubmit}>
      <div className="section-heading">
        <h2>Compose a workflow</h2>
        <p>Chain multiple actions into a repeatable execution plan.</p>
      </div>

      <label>
        <span>Workflow name</span>
        <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Daily smoke test" />
      </label>

      <label>
        <span>Connection</span>
        <select required value={connectionId} onChange={(event) => setConnectionId(event.target.value)}>
          <option value="">{connections.length === 0 ? 'Create a connection first' : 'Select a connection'}</option>
          {connections.map((connection) => (
            <option key={connection.id} value={connection.id}>
              {connection.name}
            </option>
          ))}
        </select>
      </label>

      <div className="step-list">
        {steps.map((step, index) => (
          <section key={step.id} className="subpanel">
            <div className="subpanel-header">
              <h3>Step {index + 1}</h3>
              <button type="button" className="ghost-button" onClick={() => removeStep(step.id)} disabled={steps.length === 1}>
                Remove
              </button>
            </div>

            <label>
              <span>Action</span>
              <input
                required
                value={step.action}
                onChange={(event) => updateStep(step.id, 'action', event.target.value)}
                placeholder="fetch-status"
              />
            </label>

            <label>
              <span>Payload</span>
              <textarea
                rows={8}
                value={step.payload}
                onChange={(event) => updateStep(step.id, 'payload', event.target.value)}
              />
            </label>
          </section>
        ))}
      </div>

      <div className="row-actions">
        <button type="button" className="ghost-button" onClick={addStep}>
          Add step
        </button>
        <button type="submit" disabled={connections.length === 0 || isSubmitting}>
          {isSubmitting ? 'Running…' : 'Run workflow'}
        </button>
      </div>

      {parseError ? <p className="status-error">{parseError}</p> : null}
    </form>
  )
}

export default WorkflowEditor
