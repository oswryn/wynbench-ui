import { Card, Classes, H4 } from '@blueprintjs/core'
import ActionBuilder from './ActionBuilder'
import KafkaTopicExplorer from './KafkaTopicExplorer'
import type { ActionRequest, ConnectionRecord } from '../types'

type KafkaActionPaneProps = {
  connections: ConnectionRecord[]
  onExecute: (request: ActionRequest) => Promise<void>
}

function KafkaActionPane({ connections, onExecute }: KafkaActionPaneProps) {
  const hasKafkaConnection = connections.some((connection) => connection.protocol === 'kafka')

  return (
    <div className="page-grid">
      <div className="grid-column">
        <ActionBuilder selectedPlugin="kafka" connections={connections} onExecute={onExecute} />
      </div>
      <div className="grid-column">
        <Card className="glass-panel">
          <div className="page-header">
            <div>
              <H4>Kafka monitoring</H4>
              <p className={Classes.TEXT_MUTED}>Use the Kafka plugin to discover topics and inspect message contents.</p>
            </div>
          </div>
          {hasKafkaConnection ? (
            <KafkaTopicExplorer connections={connections} />
          ) : (
            <div className={Classes.TEXT_MUTED}>
              No Kafka connection is configured yet. Add a Kafka connection to enable topic discovery and message inspection.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default KafkaActionPane
