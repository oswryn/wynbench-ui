import { useEffect } from 'react'
import { Button, Card, Classes, H2, H3, NonIdealState } from '@blueprintjs/core'
import ConnectionForm from '../components/ConnectionForm'
import { createConnection, deleteConnection, listConnections } from '../api/connections'
import { getProtocol } from '../protocols'
import { useStore } from '../state/store'
import type { ConnectionInput } from '../types'

function ConnectionsPage() {
  const { connections, addConnection, setConnections, removeConnection, appendResult } = useStore()

  useEffect(() => {
    void listConnections()
      .then((items) => {
        setConnections(items)
      })
      .catch((error) => {
        appendResult({
          id: crypto.randomUUID(),
          source: 'connection',
          status: 'error',
          summary: 'Failed to load connections',
          response: null,
          logs: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        })
      })
  }, [appendResult, setConnections])

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
        logs: [
          `${connection.protocol.toUpperCase()} -> ${getProtocol(connection.protocol).summary(connection.config)}`,
        ],
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
          <p className={Classes.TEXT_MUTED}>Connections</p>
          <H2>Manage backend connections</H2>
        </div>
        <p>Create and maintain connection profiles used by actions and workflows.</p>
      </header>

      <div className="page-grid">
        <ConnectionForm onSubmit={handleCreate} />

        <Card>
          <div>
            <H3>Saved connections</H3>
            <p className={Classes.TEXT_MUTED}>
              {connections.length === 0 ? 'No connections yet.' : 'Review and remove existing connections.'}
            </p>
          </div>

          {connections.length === 0 ? (
            <NonIdealState icon="database" title="No connections" description="Create a connection to get started." />
          ) : (
            <div className="connection-list">
              {connections.map((connection) => (
                <Card key={connection.id} compact>
                  <div className="page-header">
                    <div>
                      <H3>{connection.name}</H3>
                      <p className={Classes.TEXT_MUTED}>
                        {connection.protocol.toUpperCase()} · {getProtocol(connection.protocol).summary(connection.config)}
                      </p>
                    </div>
                    <Button
                      variant="minimal"
                      intent="danger"
                      icon="trash"
                      text="Delete"
                      onClick={() => handleDelete(connection.id, connection.name)}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  )
}

export default ConnectionsPage
