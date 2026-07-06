import ActionBuilder from '../components/ActionBuilder'
import { executeAction } from '../api/actions'
import { useStore } from '../state/store'
import type { ActionRequest } from '../types'

function ActionsPage() {
  const { connections, appendResult } = useStore()

  async function handleExecute(request: ActionRequest) {
    try {
      const result = await executeAction(request)
      appendResult(result)
    } catch (error) {
      appendResult({
        id: crypto.randomUUID(),
        source: 'action',
        status: 'error',
        summary: `Failed to execute action ${request.action}`,
        response: request,
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
          <p className="eyebrow">Actions</p>
          <h2>Build protocol actions</h2>
        </div>
        <p>Choose a connection, shape the payload, and execute single actions against the Wynbench agent.</p>
      </header>

      <ActionBuilder connections={connections} onExecute={handleExecute} />
    </section>
  )
}

export default ActionsPage
