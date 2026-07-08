// Per-protocol connection configuration field definitions. Each protocol
// defines which keys live under Connection.config and how they should be
// labeled/rendered in the UI, so the form and detail views can adapt
// dynamically instead of hardcoding a single "url" field.
export type ProtocolFieldDef = {
  key: string
  label: string
  placeholder: string
  multiline?: boolean
}

export type ProtocolDef = {
  value: string
  label: string
  fields: ProtocolFieldDef[]
  /** Short human-readable summary of a connection's config for list views. */
  summary: (config: Record<string, unknown>) => string
  /** Example action params JSON shown as the default in the action/step payload editor. */
  defaultActionPayload: string
}

export const protocols: ProtocolDef[] = [
  {
    value: 'http',
    label: 'HTTP',
    fields: [{ key: 'url', label: 'Base URL', placeholder: 'https://example.com' }],
    summary: (config) => (typeof config.url === 'string' && config.url ? config.url : 'custom config'),
    defaultActionPayload: '{\n  "url": "https://example.com",\n  "method": "GET"\n}',
  },
  {
    value: 'sql',
    label: 'SQL',
    fields: [
      {
        key: 'connectionString',
        label: 'Connection string',
        placeholder: 'Server=localhost;Database=app;User Id=sa;Password=...;',
      },
    ],
    summary: (config) =>
      typeof config.connectionString === 'string' && config.connectionString ? config.connectionString : 'custom config',
    defaultActionPayload: '{\n  "query": "SELECT 1"\n}',
  },
  {
    value: 'kafka',
    label: 'Kafka',
    fields: [
      {
        key: 'brokers',
        label: 'Broker list',
        placeholder: 'localhost:9092,localhost:9093',
      },
    ],
    summary: (config) => (typeof config.brokers === 'string' && config.brokers ? config.brokers : 'custom config'),
    defaultActionPayload: '{\n  "topic": "my-topic",\n  "key": "order-1",\n  "value": "{\\"hello\\":\\"world\\"}"\n}',
  },
]

export function getProtocol(value: string): ProtocolDef {
  return protocols.find((protocol) => protocol.value === value) ?? protocols[0]
}

export const protocolOptions = protocols.map((protocol) => ({ value: protocol.value, label: protocol.label }))
