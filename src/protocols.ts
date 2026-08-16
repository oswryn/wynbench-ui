// Per-protocol connection configuration field definitions. Each protocol
// defines which keys live under Connection.config and how they should be
// labeled/rendered in the UI, so the form and detail views can adapt
// dynamically instead of hardcoding a single "url" field.
export type ProtocolFieldOption = {
  value: string
  label: string
}

export type ProtocolFieldDef = {
  key: string
  label: string
  placeholder: string
  multiline?: boolean
  type?: 'text' | 'textarea' | 'select' | 'checkbox'
  options?: ProtocolFieldOption[]
  defaultValue?: string
}

export type ProtocolDef = {
  value: string
  label: string
  fields: ProtocolFieldDef[]
  actionFields?: ProtocolFieldDef[]
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
    actionFields: [
      { key: 'url', label: 'Request URL', placeholder: 'https://example.com/path' },
      {
        key: 'method',
        label: 'Method',
        placeholder: 'GET',
        type: 'select',
        defaultValue: 'GET',
        options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' },
          { value: 'DELETE', label: 'DELETE' },
        ],
      },
      { key: 'body', label: 'Request body', placeholder: '{"foo":"bar"}', multiline: true, type: 'textarea' },
    ],
    summary: (config) => (typeof config.url === 'string' && config.url ? config.url : 'custom config'),
    defaultActionPayload: '{\n  "url": "https://example.com",\n  "method": "GET"\n}',
  },
  {
    value: 'sql',
    label: 'SQL',
    fields: [
      {
        key: 'db_type',
        label: 'SQL dialect',
        placeholder: 'Select a SQL dialect',
        type: 'select',
        options: [
          { value: 'postgres', label: 'PostgreSQL' },
          { value: 'mssql', label: 'MSSQL / SQL Server' },
        ],
      },
      {
        key: 'connectionString',
        label: 'Connection string',
        placeholder: 'postgres://user:pass@host:port/dbname?sslmode=disable or sqlserver://user:pass@host:port?database=... ',
      },
    ],
    actionFields: [
      { key: 'query', label: 'SQL query', placeholder: 'SELECT 1', multiline: true, type: 'textarea' },
    ],
    summary: (config) => {
      const type = typeof config.db_type === 'string' && config.db_type ? config.db_type.toUpperCase() : 'SQL'
      const conn = typeof config.connectionString === 'string' && config.connectionString ? config.connectionString : 'custom config'
      return `${type}: ${conn}`
    },
    defaultActionPayload: '{\n  "db_type": "postgres",\n  "query": "SELECT 1"\n}',
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
    ],    actionFields: [
      {
        key: 'operation',
        label: 'Operation',
        placeholder: 'Select an operation',
        type: 'select',
        defaultValue: 'produce',
        options: [
          { value: 'produce', label: 'Send message' },
          { value: 'create_topic', label: 'Create topic' },
          { value: 'delete_topic', label: 'Delete topic' },
          { value: 'describe_topic', label: 'Describe topic' },
          { value: 'list_topics', label: 'List topics' },
        ],
      },
      { key: 'topic', label: 'Topic', placeholder: 'my-topic' },
      { key: 'key', label: 'Message key', placeholder: 'order-1' },
      { key: 'value', label: 'Message payload', placeholder: '{"message":"hello"}', multiline: true, type: 'textarea' },
      { key: 'create_if_missing', label: 'Create topic if missing', placeholder: '', type: 'checkbox', defaultValue: 'true' },
      { key: 'partitions', label: 'Partitions', placeholder: '1' },
      { key: 'replication_factor', label: 'Replication factor', placeholder: '1' },
    ],    summary: (config) => (typeof config.brokers === 'string' && config.brokers ? config.brokers : 'custom config'),
    defaultActionPayload:
      '{\n  "topic": "my-topic",\n  "key": "order-1",\n  "avro_schema": "{\\"type\\":\\"record\\",\\"name\\":\\"Example\\",\\"fields\\":[{\\"name\\":\\"message\\",\\"type\\":\\"string\\"}]}",\n  "value": {\n    \"message\": \"hello\"\n  }\n}',
  },
]

export function getProtocol(value: string): ProtocolDef {
  return protocols.find((protocol) => protocol.value === value) ?? protocols[0]
}

export const protocolOptions = protocols.map((protocol) => ({ value: protocol.value, label: protocol.label }))
