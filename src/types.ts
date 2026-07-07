export type ResultStatus = 'success' | 'error' | 'info'

export type ConnectionInput = {
  id: string
  name: string
  protocol: string
  config: Record<string, unknown>
}

export type ConnectionRecord = ConnectionInput & {
  createdAt?: string
}

export type ActionRequest = {
  plugin: string
  connection_id?: string
  params: Record<string, unknown>
}

export type WorkflowStep = {
  name: string
  action: ActionRequest
}

export type WorkflowRequest = {
  name: string
  steps: WorkflowStep[]
}

export type AgentResult = {
  id: string
  source: 'connection' | 'action' | 'workflow' | 'agent'
  status: ResultStatus
  summary: string
  response: unknown
  logs: string[]
  error?: string
  timestamp: string
}

export type StoreContextValue = {
  connections: ConnectionRecord[]
  results: AgentResult[]
  agentStatus: 'checking' | 'online' | 'offline'
  addConnection: (connection: ConnectionRecord) => void
  setConnections: (connections: ConnectionRecord[]) => void
  removeConnection: (connectionId: string) => void
  appendResult: (result: AgentResult) => void
}
