import { useMemo, useState } from 'react'
import type { ActionRequest, ConnectionRecord } from '../types'

type ActionBuilderProps = {
  connections: ConnectionRecord[]
  onExecute: (request: ActionRequest) => Promise<void>
}

function ActionBuilder({ connections, onExecute }: ActionBuilderProps) {
  const [connectionId, setConnectionId] = useState('')
  const [plugin, setPlugin] = useState('http')
  const [payload, setPayload] = useState('{\n  "url": "https://example.com",\n  "method": "GET"\n}')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const isDisabled = useMemo(() => connections.length === 0 || isSubmitting, [connections.length, isSubmitting])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setParseError(null)

    let parsedPayload: unknown

    try {
      parsedPayload = JSON.parse(payload)
    } catch {
      setParseError('Payload must be valid JSON.')
      return
    }

    setIsSubmitting(true)

    try {
      await onExecute({
        plugin,
        connection_id: connectionId || undefined,
        params: typeof parsedPayload === 'object' && parsedPayload !== null ? (parsedPayload as Record<string, unknown>) : {},
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="panel form-grid" onSubmit={handleSubmit}>
      <div className="section-heading">
        <h2>Build an action</h2>
        <p>Compose a single protocol action and execute it against the selected connection.</p>
      </div>

      <label>
        <span>Connection</span>
        <select
          required
          disabled={isDisabled}
          value={connectionId}
          onChange={(event) => setConnectionId(event.target.value)}
        >
          <option value="">{connections.length === 0 ? 'Create a connection first' : 'Select a connection'}</option>
          {connections.map((connection) => (
            <option key={connection.id} value={connection.id}>
              {connection.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Plugin</span>
        <select
          required
          disabled={isDisabled}
          value={plugin}
          onChange={(event) => setPlugin(event.target.value)}
        >
          <option value="http">HTTP</option>
          <option value="sql">SQL</option>
        </select>
      </label>

      <label>
        <span>Params (JSON)</span>
        <textarea
          rows={10}
          disabled={isDisabled}
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
        />
      </label>

      {parseError ? <p className="status-error">{parseError}</p> : null}

      <button type="submit" disabled={isDisabled}>
        {isSubmitting ? 'Executing…' : 'Execute action'}
      </button>
    </form>
  )
}

export default ActionBuilder
