import { useState } from 'react'
import { Button, Card, Classes, FormGroup, H4, HTMLSelect, InputGroup, TextArea } from '@blueprintjs/core'
import { getProtocol, protocolOptions } from '../protocols'
import type { ConnectionInput } from '../types'

type ConnectionFormProps = {
  onSubmit: (connection: ConnectionInput) => Promise<void>
}

const defaultState: ConnectionInput = {
  id: '',
  name: '',
  protocol: 'http',
  config: {},
}

function ConnectionForm({ onSubmit }: ConnectionFormProps) {
  const [formState, setFormState] = useState(defaultState)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(formState)
      setFormState(defaultState)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleProtocolChange(nextProtocol: string) {
    // Swap the config fields over to the ones relevant for the new protocol,
    // dropping values tied to the previous protocol's fields.
    const nextFields = getProtocol(nextProtocol).fields
    const nextConfig: Record<string, unknown> = {}
    for (const field of nextFields) {
      nextConfig[field.key] = formState.config[field.key] ?? ''
    }
    setFormState((current) => ({ ...current, protocol: nextProtocol, config: nextConfig }))
  }

  const activeProtocol = getProtocol(formState.protocol)

  return (
    <Card>
      <form className="form-grid" onSubmit={handleSubmit}>
        <div>
          <H4>Create connection</H4>
          <p className={Classes.TEXT_MUTED}>Store a reusable backend connection profile.</p>
        </div>

        <FormGroup label="ID" labelFor="connection-id">
          <InputGroup
            id="connection-id"
            required
            value={formState.id}
            onChange={(event) => setFormState((current) => ({ ...current, id: event.target.value }))}
            placeholder="local-http"
          />
        </FormGroup>

        <FormGroup label="Name" labelFor="connection-name">
          <InputGroup
            id="connection-name"
            required
            value={formState.name}
            onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
            placeholder="Local API"
          />
        </FormGroup>

        <FormGroup label="Protocol" labelFor="connection-protocol">
          <HTMLSelect
            id="connection-protocol"
            fill
            value={formState.protocol}
            onChange={(event) => handleProtocolChange(event.target.value)}
            options={protocolOptions}
          />
        </FormGroup>

        {activeProtocol.fields.map((field) => (
          <FormGroup key={field.key} label={field.label} labelFor={`connection-${field.key}`}>
            {field.multiline ? (
              <TextArea
                id={`connection-${field.key}`}
                fill
                autoResize
                required
                value={typeof formState.config[field.key] === 'string' ? (formState.config[field.key] as string) : ''}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    config: { ...current.config, [field.key]: event.target.value },
                  }))
                }
                placeholder={field.placeholder}
              />
            ) : (
              <InputGroup
                id={`connection-${field.key}`}
                required
                value={typeof formState.config[field.key] === 'string' ? (formState.config[field.key] as string) : ''}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    config: { ...current.config, [field.key]: event.target.value },
                  }))
                }
                placeholder={field.placeholder}
              />
            )}
          </FormGroup>
        ))}

        <Button type="submit" intent="primary" loading={isSubmitting} text="Create connection" />
      </form>
    </Card>
  )
}

export default ConnectionForm
