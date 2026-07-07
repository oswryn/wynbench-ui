import { useState } from 'react'
import type { ConnectionInput } from '../types'

type ConnectionFormProps = {
  onSubmit: (connection: ConnectionInput) => Promise<void>
}

const defaultState: ConnectionInput = {
  id: '',
  name: '',
  protocol: 'http',
  config: {
    url: '',
  },
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

  return (
    <form className="panel form-grid" onSubmit={handleSubmit}>
      <div className="section-heading">
        <h2>Create connection</h2>
        <p>Register an agent target with a protocol and endpoint.</p>
      </div>

      <label>
        <span>ID</span>
        <input
          required
          value={formState.id}
          onChange={(event) => setFormState((current) => ({ ...current, id: event.target.value }))}
          placeholder="local-http"
        />
      </label>

      <label>
        <span>Name</span>
        <input
          required
          value={formState.name}
          onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
          placeholder="Local Wynbench agent"
        />
      </label>

      <label>
        <span>Config URL</span>
        <input
          required
          value={typeof formState.config.url === 'string' ? formState.config.url : ''}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              config: {
                ...current.config,
                url: event.target.value,
              },
            }))
          }
          placeholder="https://example.com"
        />
      </label>

      <label>
        <span>Protocol</span>
        <select
          value={formState.protocol}
          onChange={(event) => setFormState((current) => ({ ...current, protocol: event.target.value }))}
        >
          <option value="http">HTTP</option>
          <option value="sql">SQL</option>
        </select>
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Create connection'}
      </button>
    </form>
  )
}

export default ConnectionForm
