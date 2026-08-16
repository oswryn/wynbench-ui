import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Classes,
  FormGroup,
  H4,
  HTMLSelect,
  InputGroup,
  HTMLTable,
} from '@blueprintjs/core'
import {
  createKafkaTopic,
  deleteKafkaTopic,
  describeKafkaTopic,
  listKafkaTopics,
  readKafkaTopicMessages,
  type KafkaTopicDetails,
  type KafkaTopicMessage,
} from '../api/kafka'
import type { ConnectionRecord } from '../types'

type KafkaAdminPanelProps = {
  connections: ConnectionRecord[]
}

function KafkaAdminPanel({ connections }: KafkaAdminPanelProps) {
  const [selectedConnectionId, setSelectedConnectionId] = useState('')
  const [brokers, setBrokers] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [topicDetails, setTopicDetails] = useState<KafkaTopicDetails | null>(null)
  const [messages, setMessages] = useState<KafkaTopicMessage[]>([])
  const [partition, setPartition] = useState('0')
  const [count, setCount] = useState('20')
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicPartitions, setNewTopicPartitions] = useState('1')
  const [newTopicReplication, setNewTopicReplication] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topicError, setTopicError] = useState<string | null>(null)

  const kafkaConnections = useMemo(
    () =>
      connections.filter(
        (connection) => connection.protocol === 'kafka' && typeof connection.config.brokers === 'string',
      ),
    [connections],
  )

  useEffect(() => {
    if (kafkaConnections.length > 0 && !selectedConnectionId) {
      setSelectedConnectionId(kafkaConnections[0].id)
    }
  }, [kafkaConnections, selectedConnectionId])

  useEffect(() => {
    const current = kafkaConnections.find((connection) => connection.id === selectedConnectionId)
    if (current) {
      setBrokers(String(current.config.brokers ?? ''))
    }
  }, [kafkaConnections, selectedConnectionId])

  async function loadTopics() {
    setError(null)
    setTopicDetails(null)
    setSelectedTopic('')
    setMessages([])
    const normalizedBrokers = brokers.trim()
    if (!normalizedBrokers) {
      setError('Broker list is required to fetch topics.')
      return
    }

    setLoading(true)
    try {
      const topicList = await listKafkaTopics(selectedConnectionId, normalizedBrokers)
      setTopics(topicList)
      if (topicList.length === 0) {
        setError('No topics were found on the broker.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load topics.')
    } finally {
      setLoading(false)
    }
  }

  async function loadTopicDetails(topic: string) {
    setError(null)
    setTopicDetails(null)
    setSelectedTopic(topic)

    const normalizedBrokers = brokers.trim()
    if (!normalizedBrokers) {
      setError('Broker list is required to load topic details.')
      return
    }

    setLoading(true)
    try {
      const details = await describeKafkaTopic(selectedConnectionId, topic, normalizedBrokers)
      setTopicDetails(details)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load topic details.')
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(topic: string) {
    setError(null)
    const normalizedBrokers = brokers.trim()
    if (!normalizedBrokers) {
      setError('Broker list is required to read topic messages.')
      return
    }

    const parsedPartition = Number(partition)
    const parsedCount = Number(count)
    if (Number.isNaN(parsedPartition) || parsedPartition < 0) {
      setError('Partition must be a valid non-negative integer.')
      return
    }
    if (Number.isNaN(parsedCount) || parsedCount <= 0) {
      setError('Count must be a valid positive integer.')
      return
    }

    setLoading(true)
    try {
      const payload = await readKafkaTopicMessages(
        selectedConnectionId,
        topic,
        parsedPartition,
        parsedCount,
        normalizedBrokers,
      )
      setMessages(payload.messages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load topic messages.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTopic() {
    setTopicError(null)
    const normalizedBrokers = brokers.trim()
    if (!normalizedBrokers) {
      setTopicError('Broker list is required to create a topic.')
      return
    }
    const topicName = newTopicName.trim()
    if (!topicName) {
      setTopicError('Topic name is required.')
      return
    }
    const partitions = Number(newTopicPartitions)
    const replicationFactor = Number(newTopicReplication)
    if (Number.isNaN(partitions) || partitions <= 0) {
      setTopicError('Partitions must be a valid positive integer.')
      return
    }
    if (Number.isNaN(replicationFactor) || replicationFactor <= 0) {
      setTopicError('Replication factor must be a valid positive integer.')
      return
    }

    setLoading(true)
    try {
      await createKafkaTopic(selectedConnectionId, topicName, normalizedBrokers, partitions, replicationFactor)
      setNewTopicName('')
      setNewTopicPartitions('1')
      setNewTopicReplication('1')
      await loadTopics()
    } catch (err) {
      setTopicError(err instanceof Error ? err.message : 'Failed to create topic.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteTopic(topic: string) {
    setError(null)
    if (!window.confirm(`Delete Kafka topic ${topic}? This cannot be undone.`)) {
      return
    }
    setLoading(true)
    try {
      await deleteKafkaTopic(selectedConnectionId, topic, brokers.trim())
      setTopics((current) => current.filter((t) => t !== topic))
      if (selectedTopic === topic) {
        setSelectedTopic('')
        setTopicDetails(null)
        setMessages([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete topic.')
    } finally {
      setLoading(false)
    }
  }

  if (kafkaConnections.length === 0) {
    return (
      <Card className="glass-panel kafka-admin-card">
        <H4>Kafka administration</H4>
        <p className={Classes.TEXT_MUTED}>No Kafka connection is configured yet. Add a Kafka connection to enable Kafka admin actions.</p>
      </Card>
    )
  }

  return (
    <Card className="glass-panel kafka-admin-card">
      <H4>Kafka administration</H4>
      <FormGroup label="Kafka connection" labelFor="kafka-connection" inline>
        <HTMLSelect
          id="kafka-connection"
          fill
          value={selectedConnectionId}
          onChange={(event) => setSelectedConnectionId(event.target.value)}
        >
          {kafkaConnections.map((connection) => (
            <option key={connection.id} value={connection.id}>
              {connection.name}
            </option>
          ))}
        </HTMLSelect>
      </FormGroup>

      <FormGroup label="Broker list" labelFor="kafka-admin-brokers">
        <InputGroup
          id="kafka-admin-brokers"
          fill
          value={brokers}
          onChange={(event) => setBrokers(event.target.value)}
          placeholder="localhost:9092,localhost:9093"
        />
      </FormGroup>

      <div className="kafka-topic-row">
        <Button onClick={loadTopics} intent="primary" loading={loading}>
          Refresh topics
        </Button>
      </div>

      {error ? <div className="error-text">{error}</div> : null}

      <div className="topic-list">
        {topics.map((topic) => (
          <Card key={topic} className="glass-panel kafka-topic-item">
            <div className="topic-item-header">
              <strong>{topic}</strong>
              <div className="topic-item-actions">
                <Button minimal text="Details" onClick={() => loadTopicDetails(topic)} />
                <Button minimal intent="danger" text="Delete" onClick={() => handleDeleteTopic(topic)} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="glass-panel kafka-admin-card">
        <H4>Create topic</H4>
        <FormGroup label="Topic name" labelFor="kafka-create-topic">
          <InputGroup
            id="kafka-create-topic"
            fill
            value={newTopicName}
            onChange={(event) => setNewTopicName(event.target.value)}
            placeholder="my-topic"
          />
        </FormGroup>
        <div className="kafka-topic-row">
          <FormGroup label="Partitions" labelFor="kafka-create-partitions">
            <InputGroup
              id="kafka-create-partitions"
              value={newTopicPartitions}
              onChange={(event) => setNewTopicPartitions(event.target.value)}
            />
          </FormGroup>
          <FormGroup label="Replication factor" labelFor="kafka-create-replication">
            <InputGroup
              id="kafka-create-replication"
              value={newTopicReplication}
              onChange={(event) => setNewTopicReplication(event.target.value)}
            />
          </FormGroup>
          <Button intent="primary" onClick={handleCreateTopic} loading={loading}>
            Create topic
          </Button>
        </div>
        {topicError ? <div className="error-text">{topicError}</div> : null}
      </Card>

      {topicDetails ? (
        <Card className="glass-panel kafka-admin-card">
          <H4>Topic details</H4>
          <p>
            <strong>Controller:</strong> {topicDetails.controller} (ID {topicDetails.controller_id})
          </p>
          <HTMLTable striped>
            <thead>
              <tr>
                <th>Partition</th>
                <th>Leader</th>
                <th>Replicas</th>
                <th>ISR</th>
              </tr>
            </thead>
            <tbody>
              {topicDetails.partitions.map((partitionInfo) => (
                <tr key={partitionInfo.partition}>
                  <td>{partitionInfo.partition}</td>
                  <td>{partitionInfo.leader.host}:{partitionInfo.leader.port}</td>
                  <td>{partitionInfo.replicas.map((broker) => broker.id).join(', ')}</td>
                  <td>{partitionInfo.isr.map((broker) => broker.id).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
          <div className="kafka-topic-row">
            <FormGroup label="Partition" labelFor="kafka-admin-partition">
              <InputGroup
                id="kafka-admin-partition"
                value={partition}
                onChange={(event) => setPartition(event.target.value)}
              />
            </FormGroup>
            <FormGroup label="Count" labelFor="kafka-admin-count">
              <InputGroup
                id="kafka-admin-count"
                value={count}
                onChange={(event) => setCount(event.target.value)}
              />
            </FormGroup>
            <Button intent="primary" onClick={() => loadMessages(topicDetails.topic)} loading={loading}>
              Load messages
            </Button>
          </div>
        </Card>
      ) : null}

      {messages.length > 0 ? (
        <Card className="glass-panel kafka-admin-card">
          <H4>Messages</H4>
          <HTMLTable striped className="kafka-topic-message-table">
            <thead>
              <tr>
                <th>Offset</th>
                <th>Partition</th>
                <th>Key</th>
                <th>Value</th>
                <th>Headers</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={`${message.partition}-${message.offset}`}>
                  <td>{message.offset}</td>
                  <td>{message.partition}</td>
                  <td>{message.key}</td>
                  <td>
                    <pre className="kafka-topic-message-value">{message.value}</pre>
                  </td>
                  <td>
                    <pre className="kafka-topic-message-value">{JSON.stringify(message.headers, null, 2)}</pre>
                  </td>
                  <td>{message.time}</td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </Card>
      ) : null}
    </Card>
  )
}

export default KafkaAdminPanel
