import WorkflowEditor from '../components/WorkflowEditor'
import { runWorkflow } from '../api/workflows'
import { useStore } from '../state/store'
import type { WorkflowRequest } from '../types'

function WorkflowsPage() {
  const { connections, appendResult } = useStore()

  async function handleRun(request: WorkflowRequest) {
    try {
      const result = await runWorkflow(request)
      appendResult(result)
    } catch (error) {
      appendResult({
        id: crypto.randomUUID(),
        source: 'workflow',
        status: 'error',
        summary: `Failed to run workflow ${request.name}`,
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
          <p className="eyebrow">Workflows</p>
          <h2>Compose multi-step runs</h2>
        </div>
        <p>Build reusable action sequences that can be sent to the agent in a single request.</p>
      </header>

      <WorkflowEditor connections={connections} onRun={handleRun} />
    </section>
  )
}

export default WorkflowsPage
