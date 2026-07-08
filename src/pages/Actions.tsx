import { useState } from 'react'
import { Classes, H2, Tab, Tabs, type TabId } from '@blueprintjs/core'
import ActionBuilder from '../components/ActionBuilder'
import KafkaActionPane from '../components/KafkaActionPane'
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
        summary: `Failed to execute ${request.plugin} action`,
        response: request,
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  const [selectedTab, setSelectedTab] = useState<TabId>('http')

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className={Classes.TEXT_MUTED}>Actions</p>
          <H2>Build protocol actions</H2>
        </div>
        <p>Select a plugin tab, choose a connection, and execute a single action.</p>
      </header>

      <Tabs
        id="actions-tabs"
        selectedTabId={selectedTab}
        onChange={(next: TabId) => setSelectedTab(next)}
      >
        <Tab id="http" title="HTTP" panel={<ActionBuilder selectedPlugin="http" connections={connections} onExecute={handleExecute} />} />
        <Tab id="sql" title="SQL" panel={<ActionBuilder selectedPlugin="sql" connections={connections} onExecute={handleExecute} />} />
        <Tab id="kafka" title="Kafka" panel={<KafkaActionPane connections={connections} onExecute={handleExecute} />} />
      </Tabs>
    </section>
  )
}

export default ActionsPage
