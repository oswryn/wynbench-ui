import { useState } from 'react'
import { Button, Card, Classes, FormGroup, H4, HTMLSelect, HTMLTable, InputGroup } from '@blueprintjs/core'
import type { KafkaTopicMessage } from '../api/kafka'
import { readKafkaTopicMessages } from '../api/kafka'

function KafkaTopicViewer() {
  const [brokers, setBrokers] = useState('')
  const [topic, setTopic] = useState('')
  const [partition, setPartition] = useState('0')
  const [count, setCount] = useState('20')
  const [messages, setMessages] = useState<KafkaTopicMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleFetch() {
    setError(null)
    setLoading(true)

    try {
      const result = await readKafkaTopicMessages('', topic, Number(partition), Number(count), brokers)
      setMessages(result.messages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div>
        <H4>Kafka topic preview</H4>
        <p className={Classes.TEXT_MUTED}>Fetch live messages from a topic using the selected broker list.</p>
      </div>

      <FormGroup label="Brokers" labelFor="kafka-brokers">
        <InputGroup id="kafka-brokers" fill value={brokers} onChange={(event) => setBrokers(event.target.value)} />
      </FormGroup>

      <FormGroup label="Topic" labelFor="kafka-topic">
        <InputGroup id="kafka-topic" fill value={topic} onChange={(event) => setTopic(event.target.value)} />
      </FormGroup>

      <div className="form-row">
        <FormGroup label="Partition" labelFor="kafka-partition">
          <HTMLSelect id="kafka-partition" value={partition} onChange={(event) => setPartition(event.target.value)} options={[
            { value: '0', label: '0' },
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
          ]} />
        </FormGroup>
        <FormGroup label="Count" labelFor="kafka-count">
          <InputGroup id="kafka-count" fill value={count} onChange={(event) => setCount(event.target.value)} />
        </FormGroup>
      </div>

      <Button intent="primary" loading={loading} onClick={handleFetch} text="Load messages" />

      {error ? <div className={Classes.INTENT_DANGER}>{error}</div> : null}

      <HTMLTable striped interactive className="kafka-message-table">
        <thead>
          <tr>
            <th>Offset</th>
            <th>Partition</th>
            <th>Key</th>
            <th>Value</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((message) => (
            <tr key={`${message.partition}-${message.offset}`}>
              <td>{message.offset}</td>
              <td>{message.partition}</td>
              <td>{message.key}</td>
              <td>{message.value}</td>
              <td>{message.time}</td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    </Card>
  )
}

export default KafkaTopicViewer
