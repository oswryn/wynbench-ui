import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Callout, Card, Classes, FormGroup, HTMLSelect, H4, TextArea } from '@blueprintjs/core'
import { getProtocol, protocolOptions } from '../protocols'
import type { ActionRequest, ConnectionRecord } from '../types'

type ActionBuilderProps = {
  connections: ConnectionRecord[]
  selectedPlugin?: string
  onExecute: (request: ActionRequest) => Promise<void>
}

function ActionBuilder({ connections, selectedPlugin, onExecute }: ActionBuilderProps) {
  const [connectionId, setConnectionId] = useState('')
  const [plugin, setPlugin] = useState(selectedPlugin ?? 'http')
  const [payload, setPayload] = useState(getProtocol(selectedPlugin ?? 'http').defaultActionPayload)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const navigate = useNavigate()
  const hasConnections = connections.length > 0

  useEffect(() => {
    if (selectedPlugin) {
      setPlugin(selectedPlugin)
      setPayload(getProtocol(selectedPlugin).defaultActionPayload)
    }
  }, [selectedPlugin])

  const isDisabled = useMemo(() => connections.length === 0 || isSubmitting, [connections.length, isSubmitting])

  function handlePluginChange(nextPlugin: string) {
    setPayload((current) =>
      current === getProtocol(plugin).defaultActionPayload ? getProtocol(nextPlugin).defaultActionPayload : current,
    )
    setPlugin(nextPlugin)
  }

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
    <Card className="glass-panel action-builder-card">
      <form className="form-grid" onSubmit={handleSubmit}>
        <div>
          <H4>Create a protocol action</H4>
          <p className={Classes.TEXT_MUTED}>
            Compose a request payload, choose a connection, and execute the action with the selected plugin.
          </p>
        </div>

        <FormGroup label="Connection" labelFor="action-connection">
          {hasConnections ? (
            <HTMLSelect
              id="action-connection"
              fill
              required
              disabled={isSubmitting}
              value={connectionId}
              onChange={(event) => setConnectionId(event.target.value)}
              options={[
                { value: '', label: 'Select a connection' },
                ...connections.map((connection) => ({ value: connection.id, label: connection.name })),
              ]}
            />
          ) : (
            <Button
              id="action-connection"
              fill
              minimal
              outlined
              intent="primary"
              icon="link"
              text="Create a connection first"
              onClick={() => navigate('/connections')}
            />
          )}
          {!hasConnections ? (
            <div className={Classes.TEXT_MUTED} style={{ marginTop: '0.5rem' }}>
              No saved connections exist yet. Create one to execute actions against a backend.
            </div>
          ) : null}
        </FormGroup>

        {!selectedPlugin ? (
          <FormGroup label="Plugin" labelFor="action-plugin">
            <HTMLSelect
              id="action-plugin"
              fill
              required
              disabled={isDisabled}
              value={plugin}
              onChange={(event) => handlePluginChange(event.target.value)}
              options={protocolOptions}
            />
          </FormGroup>
        ) : null}

        <FormGroup label="Action payload (JSON)" labelFor="action-payload">
          <TextArea
            id="action-payload"
            fill
            autoResize
            rows={12}
            disabled={isDisabled}
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
          />
        </FormGroup>

        {parseError ? <Callout intent="danger">{parseError}</Callout> : null}

        <Button type="submit" intent="primary" loading={isSubmitting} disabled={!hasConnections || isSubmitting} text="Execute request" />
      </form>
    </Card>
  )
}

export default ActionBuilder
