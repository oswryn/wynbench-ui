import ConnectionForm from '../components/ConnectionForm'
import { createConnection, deleteConnection } from '../api/connections'
import { useStore } from '../state/store'
import type { ConnectionInput } from '../types'

function ConnectionsPage() {
  const { connections, addConnection, removeConnection, appendResult } = useStore()

  async function handleCreate(input: ConnectionInput) {
    try {
      const connection = await createConnection(input)
      addConnection(connection)
      appendResult({
        id: crypto.randomUUID(),
        source: 'connection',
        status: 'success',
        summary: `Created connection ${connection.name}`,
        response: connection,
        logs: [`${connection.protocol.toUpperCase()} -> ${connection.endpoint}`],
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      appendResult({
        id: crypto.randomUUID(),
        source: 'connection',
        status: 'error',
        summary: `Failed to create connection ${input.name}`,
        response: null,
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  async function handleDelete(connectionId: string, connectionName: string) {
    try {
      await deleteConnection(connectionId)
      removeConnection(connectionId)
      appendResult({
        id: crypto.randomUUID(),
        source: 'connection',
        status: 'info',
        summary: `Deleted connection ${connectionName}`,
        response: { connectionId },
        logs: [],
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      appendResult({
        id: crypto.randomUUID(),
        source: 'connection',
        status: 'error',
        summary: `Failed to delete connection ${connectionName}`,
        response: null,
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Connections</p>
          <h2>Manage agent targets</h2>
        </div>
        <p>Save protocol endpoints that the Wynbench UI can use for actions and workflows.</p>
      </header>

      <div className="page-grid">
        <ConnectionForm onSubmit={handleCreate} />

        <section className="panel">
          <div className="section-heading">
            <h2>Saved connections</h2>
            <p>{connections.length === 0 ? 'No connections yet.' : 'Review and remove existing connections.'}</p>
          </div>

          <div className="connection-list">
            {connections.map((connection) => (
              <article key={connection.id} className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h3>{connection.name}</h3>
                    <p>
                      {connection.protocol.toUpperCase()} · {connection.endpoint}
                    </p>
                  </div>
                  <button type="button" className="ghost-button" onClick={() => handleDelete(connection.id, connection.name)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export default ConnectionsPage
