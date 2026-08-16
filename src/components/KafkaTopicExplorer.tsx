import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Checkbox,
  Classes,
  FormGroup,
  H4,
  H5,
  HTMLSelect,
  InputGroup,
  HTMLTable,
} from '@blueprintjs/core'
import {
  createKafkaTopic,
  listKafkaTopics,
  readKafkaTopicMessages,
  type KafkaTopicMessage,
} from '../api/kafka'
import type { ConnectionRecord } from '../types'

function KafkaTopicExplorer({ connections }: { connections: ConnectionRecord[] }) {
  const kafkaConnections = useMemo(
    () =>
      connections.filter(
        (connection) =>
          connection.protocol === 'kafka' &&
          typeof connection.config.brokers === 'string' &&
          connection.config.brokers.trim(),
      ),
    [connections],
  )

  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(kafkaConnections[0]?.id ?? '')
  const selectedConnection = kafkaConnections.find((connection) => connection.id === selectedConnectionId) ?? kafkaConnections[0]
  const [brokers, setBrokers] = useState<string>(String(selectedConnection?.config.brokers ?? ''))
  const [topics, setTopics] = useState<string[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [messages, setMessages] = useState<KafkaTopicMessage[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partition, setPartition] = useState('0')
  const [count, setCount] = useState('20')
  const [hideInternalTopics, setHideInternalTopics] = useState(true)
  const [createTopicName, setCreateTopicName] = useState('')
  const [createPartitions, setCreatePartitions] = useState('1')
  const [createReplicationFactor, setCreateReplicationFactor] = useState('1')
  const [creatingTopic, setCreatingTopic] = useState(false)
  const [createTopicError, setCreateTopicError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedConnectionId && kafkaConnections.length > 0) {
      setSelectedConnectionId(kafkaConnections[0].id)
    }
  }, [kafkaConnections, selectedConnectionId])

  useEffect(() => {
    if (selectedConnection) {
      setBrokers(String(selectedConnection.config.brokers ?? ''))
    }
  }, [selectedConnection])

  async function loadTopics() {
    setError(null)
    setTopics([])
    setSelectedTopic('')
    setMessages([])

    const normalizedBrokers = brokers.trim()
    if (!normalizedBrokers) {
      setError('Broker list is required to fetch Kafka topics.')
      return
    }

    setLoadingTopics(true)
    try {
      const topicList = await listKafkaTopics(selectedConnectionId, normalizedBrokers)
      setTopics(topicList)
      if (topicList.length === 0) {
        setError('Connected broker responded successfully but no topics were found.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Kafka topics')
    } finally {
      setLoadingTopics(false)
    }
  }

  async function loadMessages(topic: string) {
    setError(null)
    setCreateTopicError(null)
    setCreateTopicError(null)
    setCreateTopicError(null)
    setSelectedTopic(topic)
    setMessages([])

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

    setLoadingMessages(true)
    try {
      const payload = await readKafkaTopicMessages(
        selectedConnectionId,
        topic,
        parsedPartition,
        parsedCount,
        normalizedBrokers,
      )
      setMessages(payload.messages)
      if (payload.messages.length === 0) {
        setError('No messages were found for this topic.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load topic messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  async function handleCreateTopic() {
    setCreateTopicError(null)
    setError(null)

    const normalizedBrokers = brokers.trim()
    if (!normalizedBrokers) {
      setCreateTopicError('Broker list is required to create a topic.')
      return
    }
    const topic = createTopicName.trim()
    if (!topic) {
      setCreateTopicError('Topic name is required.')
      return
    }

    const partitions = Number(createPartitions)
    const replicationFactor = Number(createReplicationFactor)
    if (Number.isNaN(partitions) || partitions <= 0) {
      setCreateTopicError('Partitions must be a valid positive integer.')
      return
    }
    if (Number.isNaN(replicationFactor) || replicationFactor <= 0) {
      setCreateTopicError('Replication factor must be a valid positive integer.')
      return
    }

    setCreatingTopic(true)
    try {
      await createKafkaTopic(selectedConnectionId, topic, normalizedBrokers, partitions, replicationFactor)
      setCreateTopicName('')
      await loadTopics()
    } catch (err) {
      setCreateTopicError(err instanceof Error ? err.message : 'Failed to create Kafka topic')
    } finally {
      setCreatingTopic(false)
    }
  }

  const filteredTopics = useMemo(() => {
    return hideInternalTopics
      ? topics.filter((topic) => {
          const trimmed = topic.trim()
          return !(trimmed.startsWith('_') || trimmed.startsWith('.') || trimmed.startsWith('default') || trimmed.startsWith('connect-'))
        })
      : topics
  }, [hideInternalTopics, topics])

  const connectionOptions = kafkaConnections.map((connection) => (
    <option key={connection.id} value={connection.id}>
      {connection.name}
    </option>
  ))

  return (
    <Card className="glass-panel kafka-topic-explorer-card">
      <div className="page-header">
        <div>
          <H4>Kafka topic explorer</H4>
          <p className={Classes.TEXT_MUTED}>
            Choose a Kafka connection, list available topics, and view message contents.
          </p>
        </div>
        <Button
          icon="refresh"
          intent="primary"
          text="Reload topics"
          onClick={loadTopics}
          loading={loadingTopics}
        />
      </div>

      <FormGroup label="Kafka connection" labelFor="kafka-connection" inline>
        <HTMLSelect
          id="kafka-connection"
          fill
          value={selectedConnection?.id ?? ''}
          onChange={(event) => setSelectedConnectionId(event.target.value)}
        >
          {connectionOptions}
        </HTMLSelect>
      </FormGroup>

      <FormGroup label="Broker list" labelFor="kafka-brokers">
        <InputGroup
          id="kafka-brokers"
          fill
          value={brokers}
          onChange={(event) => setBrokers(event.target.value)}
          placeholder="localhost:9092,localhost:9093"
        />
      </FormGroup>

      <Card className="glass-panel kafka-topic-create-card">
        <H5>Create Kafka topic</H5>
        <p className={Classes.TEXT_MUTED}>Create a new topic directly on the selected Kafka cluster.</p>
        <div className="kafka-topic-row">
          <FormGroup label="Topic" labelFor="kafka-create-topic">
            <InputGroup
              id="kafka-create-topic"
              fill
              value={createTopicName}
              onChange={(event) => setCreateTopicName(event.target.value)}
              placeholder="my-topic"
            />
          </FormGroup>
          <FormGroup label="Partitions" labelFor="kafka-create-partitions">
            <InputGroup
              id="kafka-create-partitions"
              value={createPartitions}
              onChange={(event) => setCreatePartitions(event.target.value)}
              placeholder="1"
            />
          </FormGroup>
          <FormGroup label="Replication factor" labelFor="kafka-create-replication">
            <InputGroup
              id="kafka-create-replication"
              value={createReplicationFactor}
              onChange={(event) => setCreateReplicationFactor(event.target.value)}
              placeholder="1"
            />
          </FormGroup>
          <Button
            icon="add"
            intent="primary"
            text="Create topic"
            onClick={handleCreateTopic}
            loading={creatingTopic}
          />
        </div>
        {createTopicError ? <div className="error-text">{createTopicError}</div> : null}
      </Card>

      <Checkbox
        checked={hideInternalTopics}
        label="Hide internal Kafka topics"
        onChange={(event) => setHideInternalTopics(event.currentTarget.checked)}
      />

      <div className="kafka-topic-row">
        <FormGroup label="Partition" labelFor="kafka-partition">
          <InputGroup
            id="kafka-partition"
            value={partition}
            onChange={(event) => setPartition(event.target.value)}
            placeholder="0"
          />
        </FormGroup>
        <FormGroup label="Count" labelFor="kafka-count">
          <InputGroup
            id="kafka-count"
            value={count}
            onChange={(event) => setCount(event.target.value)}
            placeholder="20"
          />
        </FormGroup>
        <Button
          icon="refresh"
          minimal
          text="Refresh messages"
          onClick={() => selectedTopic && loadMessages(selectedTopic)}
          disabled={!selectedTopic}
          loading={loadingMessages}
        />
      </div>

      {error ? <div className="error-text">{error}</div> : null}

      {filteredTopics.length > 0 ? (
        <div className="topic-list">
          {filteredTopics.map((topic) => (
            <Button
              key={topic}
              minimal
              fill
              outlined
              intent={topic === selectedTopic ? 'primary' : 'none'}
              onClick={() => loadMessages(topic)}
            >
              {topic}
            </Button>
          ))}
        </div>
      ) : (
        <div className={Classes.TEXT_MUTED}>
          No topics loaded yet. Click reload to discover topics.
        </div>
      )}

      {selectedTopic ? (
        <div className="topic-messages-section">
          <div className="page-header">
            <div>
              <H5>Messages in {selectedTopic}</H5>
              <p className={Classes.TEXT_MUTED}>
                Showing up to {count} message(s) from partition {partition}.
              </p>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className={Classes.TEXT_MUTED}>No messages to display for this topic.</div>
          ) : (
            <HTMLTable striped interactive className="kafka-topic-message-table">
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
          )}
        </div>
      ) : null}
    </Card>
  )
}

export default KafkaTopicExplorer
