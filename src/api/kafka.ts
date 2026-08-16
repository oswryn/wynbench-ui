import { executeAction } from './actions'

export type KafkaTopicMessage = {
  offset: number
  partition: number
  key: string
  value: string
  headers: Record<string, string>
  time: string
}

export type KafkaBroker = {
  host: string
  port: number
  id: number
  rack?: string
}

export type KafkaTopicPartitionDetails = {
  partition: number
  leader: KafkaBroker
  replicas: KafkaBroker[]
  isr: KafkaBroker[]
}

export type KafkaTopicDetails = {
  topic: string
  controller: string
  controller_id: number
  partitions: KafkaTopicPartitionDetails[]
}

export async function createKafkaTopic(
  connectionId: string,
  topic: string,
  brokers?: string,
  partitions?: number,
  replicationFactor?: number,
): Promise<void> {
  const params: Record<string, unknown> = {
    operation: 'create_topic',
    topic,
  }
  if (brokers) params.brokers = brokers
  if (partitions !== undefined) params.partitions = partitions
  if (replicationFactor !== undefined) params.replication_factor = replicationFactor

  const result = await executeAction({
    plugin: 'kafka',
    connection_id: connectionId,
    params,
  })

  if (result.status === 'error') {
    throw new Error(result.error ?? 'Failed to create Kafka topic')
  }
}

export async function describeKafkaTopic(
  connectionId: string,
  topic: string,
  brokers?: string,
): Promise<KafkaTopicDetails> {
  const params: Record<string, unknown> = {
    operation: 'describe_topic',
    topic,
  }
  if (brokers) params.brokers = brokers

  const result = await executeAction({
    plugin: 'kafka',
    connection_id: connectionId,
    params,
  })

  if (result.status === 'error') {
    throw new Error(result.error ?? 'Failed to describe Kafka topic')
  }

  return result.response as KafkaTopicDetails
}

export async function deleteKafkaTopic(
  connectionId: string,
  topic: string,
  brokers?: string,
): Promise<void> {
  const params: Record<string, unknown> = {
    operation: 'delete_topic',
    topic,
  }
  if (brokers) params.brokers = brokers

  const result = await executeAction({
    plugin: 'kafka',
    connection_id: connectionId,
    params,
  })

  if (result.status === 'error') {
    throw new Error(result.error ?? 'Failed to delete Kafka topic')
  }
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
