import { useState } from 'react'
import { Button, Card, Callout, Classes, FormGroup, H4, TextArea } from '@blueprintjs/core'
import { generateAvroSample } from '../utils/avro'

function KafkaDataGenerator() {
  const [schema, setSchema] = useState('')
  const [sample, setSample] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleGenerate() {
    setError(null)
    try {
      const generated = generateAvroSample(schema)
      setSample(generated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid schema')
      setSample('')
    }
  }

  return (
    <Card className="glass-panel kafka-data-generator-card">
      <div>
        <H4>Avro schema generator</H4>
        <p className={Classes.TEXT_MUTED}>Paste an Avro schema and generate a JSON payload sample that matches it.</p>
      </div>

      <FormGroup label="Avro schema (JSON)" labelFor="avro-schema">
        <TextArea
          id="avro-schema"
          fill
          autoResize
          rows={14}
          value={schema}
          onChange={(event) => setSchema(event.target.value)}
        />
      </FormGroup>

      <Button intent="primary" onClick={handleGenerate} text="Generate sample payload" />

      {error ? <Callout intent="danger" style={{ marginTop: '1rem' }}>{error}</Callout> : null}

      <FormGroup label="Generated JSON" labelFor="generated-json">
        <TextArea id="generated-json" fill autoResize rows={12} value={sample} readOnly />
      </FormGroup>
    </Card>
  )
}

export default KafkaDataGenerator
