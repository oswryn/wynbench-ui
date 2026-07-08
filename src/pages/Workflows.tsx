import { useEffect, useState } from 'react'
import { Button, Card, Classes, H2, H3, NonIdealState } from '@blueprintjs/core'
import WorkflowEditor from '../components/WorkflowEditor'
import { deleteWorkflow, listWorkflows, runWorkflow, updateWorkflow } from '../api/workflows'
import { useStore } from '../state/store'
import type { StoredWorkflow, WorkflowRequest } from '../types'

function WorkflowsPage() {
  const { connections, workflows, setWorkflows, updateWorkflow: updateWorkflowInStore, removeWorkflow, appendResult } = useStore()
  const [editingWorkflow, setEditingWorkflow] = useState<StoredWorkflow | null>(null)

  useEffect(() => {
    void listWorkflows()
      .then(setWorkflows)
      .catch((error) => {
        appendResult({
          id: crypto.randomUUID(),
          source: 'workflow',
          status: 'error',
          summary: 'Failed to load workflows',
          response: null,
          logs: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        })
      })
  }, [appendResult, setWorkflows])

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

  async function handleRunStored(id: string) {
    try {
      const result = await runWorkflow({ id })
      appendResult(result)
    } catch (error) {
      appendResult({
        id: crypto.randomUUID(),
        source: 'workflow',
        status: 'error',
        summary: `Failed to run stored workflow ${id}`,
        response: { id },
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  async function handleEdit(workflow: StoredWorkflow) {
    setEditingWorkflow(workflow)
  }

  async function handleSave(workflow: StoredWorkflow) {
    try {
      const updated = await updateWorkflow(workflow.id, { name: workflow.name, steps: workflow.steps })
      updateWorkflowInStore(updated)
      setEditingWorkflow(null)
      appendResult({
        id: crypto.randomUUID(),
        source: 'workflow',
        status: 'success',
        summary: `Updated workflow ${updated.name}`,
        response: updated,
        logs: [`Workflow ${updated.id} updated`],
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      appendResult({
        id: crypto.randomUUID(),
        source: 'workflow',
        status: 'error',
        summary: `Failed to save workflow ${workflow.id}`,
        response: workflow,
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  async function handleCancelEdit() {
    setEditingWorkflow(null)
  }

  async function handleDelete(id: string) {
    try {
      await deleteWorkflow(id)
      removeWorkflow(id)
      appendResult({
        id: crypto.randomUUID(),
        source: 'workflow',
        status: 'info',
        summary: `Deleted workflow ${id}`,
        response: { id },
        logs: [],
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      appendResult({
        id: crypto.randomUUID(),
        source: 'workflow',
        status: 'error',
        summary: `Failed to delete workflow ${id}`,
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
          <p className={Classes.TEXT_MUTED}>Workflows</p>
          <H2>Compose multi-step runs</H2>
        </div>
        <p>Create reusable step sequences and run them in a single request.</p>
      </header>

      <div className="page-grid workflow-page-grid">
        <WorkflowEditor
          connections={connections}
          onRun={handleRun}
          onSave={handleSave}
          onCancelEdit={handleCancelEdit}
          editingWorkflow={editingWorkflow}
        />

        <Card className="glass-panel workflow-sidebar">
          <div>
            <H3>Stored workflows</H3>
            <p className={Classes.TEXT_MUTED}>
              {workflows.length === 0 ? 'No stored workflows yet.' : 'Run or delete workflows saved on the agent.'}
            </p>
          </div>

          {workflows.length === 0 ? (
            <NonIdealState icon="flow-linear" title="No workflows" description="Create a workflow in the agent and refresh." />
          ) : (
            <div className="workflow-list">
              {workflows.map((workflow) => (
                <Card key={workflow.id} compact>
                  <div className="page-header">
                    <div>
                      <H3>{workflow.name}</H3>
                      <p className={Classes.TEXT_MUTED}>{workflow.steps.length} step(s)</p>
                    </div>
                    <div className="row-actions">
                      <Button intent="primary" minimal text="Run" onClick={() => handleRunStored(workflow.id)} />
                      <Button intent="warning" minimal text="Edit" onClick={() => handleEdit(workflow)} />
                      <Button intent="danger" minimal text="Delete" onClick={() => handleDelete(workflow.id)} />
                    </div>
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

export default WorkflowsPage
