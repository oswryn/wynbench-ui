import { executeAction } from './actions'

export type KafkaTopicMessage = {
  offset: number
  partition: number
  key: string
  value: string
  headers: Record<string, string>
  time: string
}

export async function listKafkaTopics(connectionId: string, brokers?: string): Promise<string[]> {
  const params: Record<string, unknown> = { operation: 'list_topics' }
  if (brokers) {
    params.brokers = brokers
  }

  const result = await executeAction({
    plugin: 'kafka',
    connection_id: connectionId,
    params,
  })

  const payload = result.response as { data?: Record<string, unknown> }
  return Array.isArray(payload?.data?.topics) ? (payload.data!.topics as string[]) : []
}

export async function readKafkaTopicMessages(
  connectionId: string,
  topic: string,
  partition?: number,
  count?: number,
  brokers?: string,
): Promise<{ messages: KafkaTopicMessage[] }> {
  const params: Record<string, unknown> = {
    operation: 'read_messages',
    topic,
  }
  if (partition !== undefined) params.partition = partition
  if (count !== undefined) params.count = count
  if (brokers) params.brokers = brokers

  const result = await executeAction({
    plugin: 'kafka',
    connection_id: connectionId,
    params,
  })

  const payload = result.response as { data?: Record<string, unknown> }
  const messages = Array.isArray(payload?.data?.messages) ? (payload.data!.messages as KafkaTopicMessage[]) : []
  return { messages }
}
