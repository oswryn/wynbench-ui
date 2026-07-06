import { useState } from 'react'
import type { ConnectionInput } from '../types'

type ConnectionFormProps = {
  onSubmit: (connection: ConnectionInput) => Promise<void>
}

const defaultState: ConnectionInput = {
  name: '',
  endpoint: '',
  protocol: 'http',
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
        <span>Name</span>
        <input
          required
          value={formState.name}
          onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
          placeholder="Local Wynbench agent"
        />
      </label>

      <label>
        <span>Endpoint</span>
        <input
          required
          value={formState.endpoint}
          onChange={(event) => setFormState((current) => ({ ...current, endpoint: event.target.value }))}
          placeholder="http://localhost:8000"
        />
      </label>

      <label>
        <span>Protocol</span>
        <select
          value={formState.protocol}
          onChange={(event) => setFormState((current) => ({ ...current, protocol: event.target.value }))}
        >
          <option value="http">HTTP</option>
          <option value="ws">WebSocket</option>
          <option value="grpc">gRPC</option>
        </select>
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Create connection'}
      </button>
    </form>
  )
}

export default ConnectionForm
