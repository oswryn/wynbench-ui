import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Callout,
  Card,
  Checkbox,
  Classes,
  FormGroup,
  H4,
  HTMLSelect,
  InputGroup,
  TextArea,
} from '@blueprintjs/core'
import { getProtocol, protocolOptions } from '../protocols'
import type { ActionRequest, ConnectionRecord } from '../types'

type ActionBuilderProps = {
  connections: ConnectionRecord[]
  selectedPlugin?: string
  defaultPayload?: string
  forcedParams?: Record<string, unknown>
  onExecute: (request: ActionRequest) => Promise<void>
}

type FormValues = Record<string, string>

function ActionBuilder({
  connections,
  selectedPlugin,
  defaultPayload,
  forcedParams,
  onExecute,
}: ActionBuilderProps) {
  const [connectionId, setConnectionId] = useState('')
  const [plugin, setPlugin] = useState(selectedPlugin ?? 'http')
  const [advancedPayload, setAdvancedPayload] = useState('')
  const [formValues, setFormValues] = useState<FormValues>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const navigate = useNavigate()
  const hasConnections = connections.length > 0

  const protocol = getProtocol(plugin)
  const actionFields = protocol.actionFields ?? []

  const pluginConnections = useMemo(
    () => connections.filter((connection) => connection.protocol === plugin),
    [connections, plugin],
  )

  const operation = formValues.operation ?? 'produce'

  function shouldRenderField(field: typeof actionFields[number]) {
    if (operation === 'produce') {
      return true
    }
    if (operation === 'create_topic') {
      return field.key === 'operation' || field.key === 'topic' || field.key === 'partitions' || field.key === 'replication_factor'
    }
    if (operation === 'delete_topic' || operation === 'describe_topic') {
      return field.key === 'operation' || field.key === 'topic'
    }
    if (operation === 'list_topics') {
      return field.key === 'operation'
    }
    return true
  }

  useEffect(() => {
    if (selectedPlugin) {
      setPlugin(selectedPlugin)
    }
  }, [selectedPlugin])

  useEffect(() => {
    const values: FormValues = {}
    actionFields.forEach((field) => {
      values[field.key] = field.defaultValue ?? ''
    })
    setFormValues(values)
    setAdvancedPayload(actionFields.length > 0 ? '' : defaultPayload ?? protocol.defaultActionPayload)
  }, [plugin, defaultPayload, protocol.defaultActionPayload])

  useEffect(() => {
    if (pluginConnections.length > 0 && !pluginConnections.some((c) => c.id === connectionId)) {
      setConnectionId(pluginConnections[0].id)
    }
    if (pluginConnections.length === 0 && connectionId) {
      setConnectionId('')
    }
  }, [pluginConnections, connectionId])

  const isDisabled = useMemo(() => pluginConnections.length === 0 || isSubmitting, [pluginConnections.length, isSubmitting])

  function handlePluginChange(nextPlugin: string) {
    const nextProtocol = getProtocol(nextPlugin)
    setPlugin(nextPlugin)
    const values: FormValues = {}
    nextProtocol.actionFields?.forEach((field) => {
      values[field.key] = field.defaultValue ?? ''
    })
    setFormValues(values)
    setAdvancedPayload(nextProtocol.actionFields?.length ? '' : nextProtocol.defaultActionPayload)
  }

  function handleFieldChange(key: string, value: string) {
    setFormValues((current) => ({ ...current, [key]: value }))
  }

  function buildParams() {
    const params: Record<string, unknown> = {}

    if (actionFields.length > 0) {
      actionFields.forEach((field) => {
        const raw = formValues[field.key]?.trim()
        if (!raw) {
          return
        }
        params[field.key] = raw
      })
    } else {
      if (!advancedPayload.trim()) {
        throw new Error('Payload is required for this action.')
      }
      const parsedPayload = JSON.parse(advancedPayload)
      if (typeof parsedPayload !== 'object' || parsedPayload === null) {
        throw new Error('Payload must be an object.')
      }
      Object.assign(params, parsedPayload)
    }

    if (advancedPayload.trim() && actionFields.length > 0) {
      try {
        const overrides = JSON.parse(advancedPayload)
        if (typeof overrides !== 'object' || overrides === null) {
          throw new Error('Advanced overrides must be a JSON object.')
        }
        Object.assign(params, overrides)
      } catch {
        throw new Error('Advanced overrides must be valid JSON.')
      }
    }

    if (forcedParams) {
      Object.assign(params, forcedParams)
    }

    return params
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setParseError(null)

    let params: Record<string, unknown>
    try {
      params = buildParams()
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Invalid request values.')
      return
    }

    setIsSubmitting(true)

    try {
      await onExecute({
        plugin,
        connection_id: connectionId || undefined,
        params,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const showForm = actionFields.length > 0

  return (
    <Card className="glass-panel action-builder-card">
      <form className="form-grid" onSubmit={handleSubmit}>
        <div>
          <H4>Create a protocol action</H4>
          <p className={Classes.TEXT_MUTED}>
            Complete the request form, choose a connection, and execute the action.
          </p>
        </div>

        <FormGroup label="Connection" labelFor="action-connection">
          {hasConnections ? (
            pluginConnections.length > 0 ? (
              <HTMLSelect
                id="action-connection"
                fill
                required
                disabled={isSubmitting}
                value={connectionId}
                onChange={(event) => setConnectionId(event.target.value)}
                options={[
                  { value: '', label: 'Select a connection' },
                  ...pluginConnections.map((connection) => ({ value: connection.id, label: connection.name })),
                ]}
              />
            ) : (
              <div className={Classes.TEXT_MUTED} style={{ marginTop: '0.5rem' }}>
                No saved {plugin.toUpperCase()} connections exist yet. Create one on the Connections page to execute {plugin.toUpperCase()} actions.
              </div>
            )
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

        {showForm ? (
          actionFields
            .filter((field) => shouldRenderField(field))
            .map((field) => (
              <FormGroup key={field.key} label={field.label} labelFor={`action-field-${field.key}`}>
                {field.type === 'select' ? (
                  <HTMLSelect
                    id={`action-field-${field.key}`}
                    fill
                    disabled={isDisabled}
                    value={formValues[field.key] ?? ''}
                    onChange={(event) => handleFieldChange(field.key, event.target.value)}
                    options={
                      field.options?.map((option) => ({ value: option.value, label: option.label })) ?? []
                    }
                  />
                ) : field.type === 'checkbox' ? (
                  <Checkbox
                    id={`action-field-${field.key}`}
                    disabled={isDisabled}
                    checked={formValues[field.key] === 'true'}
                    onChange={(event) => handleFieldChange(field.key, event.currentTarget.checked ? 'true' : 'false')}
                  />
                ) : field.multiline ? (
                  <TextArea
                    id={`action-field-${field.key}`}
                    fill
                    autoResize
                    rows={field.key === 'query' ? 8 : 6}
                    disabled={isDisabled}
                    value={formValues[field.key] ?? ''}
                    onChange={(event) => handleFieldChange(field.key, event.target.value)}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <InputGroup
                    id={`action-field-${field.key}`}
                    fill
                    disabled={isDisabled}
                    value={formValues[field.key] ?? ''}
                    onChange={(event) => handleFieldChange(field.key, event.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </FormGroup>
            ))
        ) : (
          <FormGroup label="Action payload (JSON)" labelFor="action-payload">
            <TextArea
              id="action-payload"
              fill
              autoResize
              rows={12}
              disabled={isDisabled}
              value={advancedPayload}
              onChange={(event) => setAdvancedPayload(event.target.value)}
            />
          </FormGroup>
        )}

        {showForm ? (
          <FormGroup label="Advanced overrides (JSON)" labelFor="action-advanced-overrides">
            <TextArea
              id="action-advanced-overrides"
              fill
              autoResize
              rows={6}
              disabled={isDisabled}
              value={advancedPayload}
              onChange={(event) => setAdvancedPayload(event.target.value)}
              placeholder="Optional JSON overrides for advanced parameters"
            />
          </FormGroup>
        ) : null}

        {parseError ? <Callout intent="danger">{parseError}</Callout> : null}

        <Button
          type="submit"
          intent="primary"
          loading={isSubmitting}
          disabled={pluginConnections.length === 0 || isSubmitting}
          text="Execute request"
        />
      </form>
    </Card>
  )
}

export default ActionBuilder
