import { Link } from 'react-router-dom'
import { Button, Card, Classes, H1, Tag, H5, H6, type IntentProps } from '@blueprintjs/core'
import type { IconName } from '@blueprintjs/icons'
import { useStore } from '../state/store'

const quickLinks: { to: string; label: string; icon: IconName; description: string }[] = [
  { to: '/connections', label: 'Connections', icon: 'link', description: 'Manage reusable backend connection profiles.' },
  { to: '/actions', label: 'Actions', icon: 'build', description: 'Build and execute a single protocol action.' },
  { to: '/kafka-admin', label: 'Kafka admin', icon: 'database', description: 'Manage topics, inspect partitions, and delete Kafka topics.' },
  { to: '/workflows', label: 'Workflows', icon: 'exchange', description: 'Compose ordered steps into a single run.' },
]

function HomePage() {
  const { connections, workflows, results, agentStatus } = useStore()

  const statusIntent: IntentProps['intent'] =
    agentStatus === 'online' ? 'success' : agentStatus === 'offline' ? 'danger' : 'none'

  const kafkaConnections = connections.filter((connection) => connection.protocol === 'kafka')

  return (
    <section className="page">
      <header className="home-hero">
        <div className="brand-dot home-hero-dot" aria-hidden="true" />
        <H1>Wynbench</H1>
        <p className={Classes.TEXT_MUTED}>
          A local workbench console for testing protocol connections, actions, workflows, and Kafka topics.
        </p>
        <div className="row-actions">
          <Tag intent={statusIntent} minimal>
            Backend: {agentStatus}
          </Tag>
          <Tag minimal>{connections.length} connections</Tag>
          <Tag minimal>{workflows.length} workflows</Tag>
          <Tag minimal>{results.length} recent results</Tag>
        </div>
      </header>

      <div className="dashboard-grid">
        <Card className="glass-panel dashboard-card">
          <H5>Quick actions</H5>
          <p className={Classes.TEXT_MUTED}>Jump straight to the workspaces you use most.</p>
          <div className="dashboard-actions">
            {quickLinks.map((item) => (
              <Link key={item.to} to={item.to} className="dashboard-action-link">
                <Button outlined fill minimal icon={item.icon} text={item.label} />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="glass-panel dashboard-card">
          <H5>Kafka connections</H5>
          <p className={Classes.TEXT_MUTED}>
            See broker connections and inspect topic contents from the Actions dashboard.
          </p>
          {kafkaConnections.length === 0 ? (
            <div className={Classes.TEXT_MUTED}>No Kafka connections found. Create one on Connections.</div>
          ) : (
            <div className="dashboard-list">
              {kafkaConnections.map((connection) => (
                <div key={connection.id} className="dashboard-list-item">
                  <H6>{connection.name}</H6>
                  <p className={Classes.TEXT_MUTED}>{String(connection.config.brokers)}</p>
                </div>
              ))}
            </div>
          )}
          <div className="dashboard-footer">
            <Link to="/actions" className="dashboard-action-link">
              <Button intent="primary" text="Build Kafka action" />
            </Link>
          </div>
        </Card>

        <Card className="glass-panel dashboard-card">
          <H5>Workflow summary</H5>
          <p className={Classes.TEXT_MUTED}>
            Build, save, and execute workflows from the Workflows page.
          </p>
          <div className="dashboard-stats">
            <div>
              <strong>{workflows.length}</strong>
              <p className={Classes.TEXT_MUTED}>stored workflows</p>
            </div>
            <div>
              <strong>{results.length}</strong>
              <p className={Classes.TEXT_MUTED}>recent results</p>
            </div>
          </div>
          <div className="dashboard-footer">
            <Link to="/workflows" className="dashboard-action-link">
              <Button outlined intent="primary" text="Edit workflows" />
            </Link>
          </div>
        </Card>
      </div>
    </section>
  )
}

export default HomePage
