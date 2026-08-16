import { Card, Classes, H4 } from '@blueprintjs/core'
import ActionBuilder from './ActionBuilder'
import KafkaAdminPanel from './KafkaAdminPanel'
import KafkaDataGenerator from './KafkaDataGenerator'
import type { ActionRequest, ConnectionRecord } from '../types'

type KafkaActionPaneProps = {
  connections: ConnectionRecord[]
  onExecute: (request: ActionRequest) => Promise<void>
}

function KafkaActionPane({ connections, onExecute }: KafkaActionPaneProps) {
  const hasKafkaConnection = connections.some((connection) => connection.protocol === 'kafka')

  return (
    <div className="page-grid">
      <ActionBuilder selectedPlugin="kafka" connections={connections} onExecute={onExecute} />
      <div className="kafka-action-sidepanel">
        <Card className="glass-panel kafka-action-intro-card">
          <div className="page-header">
            <div>
              <H4>Kafka administration</H4>
              <p className={Classes.TEXT_MUTED}>Use the Kafka plugin to discover topics, manage clusters, and inspect message contents.</p>
            </div>
          </div>
        </Card>

        {hasKafkaConnection ? (
          <KafkaAdminPanel connections={connections} />
        ) : (
          <Card className="glass-panel kafka-action-empty-card">
            <p className={Classes.TEXT_MUTED}>
              No Kafka connection is configured yet. Add a Kafka connection to enable topic discovery and administration.
            </p>
          </Card>
        )}

        <KafkaDataGenerator />
      </div>
    </div>
  )
}

export default KafkaActionPane
