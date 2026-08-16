import { useMemo } from 'react'
import { Button, Breadcrumbs, Card, Classes, H2, H4 } from '@blueprintjs/core'
import { useSearchParams } from 'react-router-dom'
import ActionBuilder from '../components/ActionBuilder'
import KafkaActionPane from '../components/KafkaActionPane'
import { executeAction } from '../api/actions'
import { getProtocol } from '../protocols'
import { useStore } from '../state/store'
import type { ActionRequest } from '../types'

type ActionOption = {
  key: string
  label: string
  plugin: string
  defaultPayload: string
  overrides?: Record<string, unknown>
}

const actionOptions: ActionOption[] = [
  {
    key: 'http',
    label: 'HTTP',
    plugin: 'http',
    defaultPayload: getProtocol('http').defaultActionPayload,
  },
  {
    key: 'kafka',
    label: 'Kafka',
    plugin: 'kafka',
    defaultPayload: getProtocol('kafka').defaultActionPayload,
  },
  {
    key: 'sql-postgres',
    label: 'SQL / Postgres',
    plugin: 'sql',
    defaultPayload: '{\n  "db_type": "postgres",\n  "query": "SELECT 1"\n}',
    overrides: { db_type: 'postgres' },
  },
  {
    key: 'sql-mssql',
    label: 'SQL / MSSQL',
    plugin: 'sql',
    defaultPayload: '{\n  "db_type": "mssql",\n  "query": "SELECT 1"\n}',
    overrides: { db_type: 'mssql' },
  },
]

function ActionsPage() {
  const { connections, appendResult } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedAction = searchParams.get('mode')
  const activeAction = useMemo(
    () => (selectedAction ? actionOptions.find((option) => option.key === selectedAction) : undefined),
    [selectedAction],
  )

  function setActionMode(mode?: string) {
    if (!mode) {
      setSearchParams({})
    } else {
      setSearchParams({ mode })
    }
  }

  async function handleExecute(request: ActionRequest) {
    try {
      const result = await executeAction(request)
      appendResult(result)
    } catch (error) {
      appendResult({
        id: crypto.randomUUID(),
        source: 'action',
        status: 'error',
        summary: `Failed to execute ${request.plugin} action`,
        response: request,
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  const breadcrumbs = selectedAction
    ? [
        { href: '/actions', text: 'Actions' },
        { href: `/actions?mode=${selectedAction}`, text: activeAction?.label ?? selectedAction, current: true },
      ]
    : [{ href: '/actions', text: 'Actions', current: true }]

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className={Classes.TEXT_MUTED}>Actions</p>
          <H2>Build protocol actions</H2>
          <Breadcrumbs items={breadcrumbs} className="breadcrumbs" />
        </div>
        <p>Choose a workflow to start and execute actions against a saved connection.</p>
      </header>

      {selectedAction ? (
        <div className="page-grid">
          {activeAction?.plugin === 'kafka' ? (
            <KafkaActionPane connections={connections} onExecute={handleExecute} />
          ) : (
            <ActionBuilder
              selectedPlugin={activeAction?.plugin ?? 'http'}
              defaultPayload={activeAction?.defaultPayload}
              forcedParams={activeAction?.overrides}
              connections={connections}
              onExecute={handleExecute}
            />
          )}
        </div>
      ) : (
        <div className="action-root-grid">
          {actionOptions.map((option) => (
            <Card key={option.key} className="action-root-card" elevation={2}>
              <H4>{option.label}</H4>
              <p className={Classes.TEXT_MUTED}>
                {option.plugin === 'kafka'
                  ? 'Publish and monitor Kafka topics in one place.'
                  : option.plugin === 'sql'
                  ? `Run ${option.label} queries using stored SQL connections.`
                  : 'Execute HTTP actions against a configured endpoint.'}
              </p>
              <Button intent="primary" onClick={() => setActionMode(option.key)}>
                Start {option.label}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

export default ActionsPage
