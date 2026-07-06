export type ResultStatus = 'success' | 'error' | 'info'

export type ConnectionInput = {
  name: string
  endpoint: string
  protocol: string
}

export type ConnectionRecord = ConnectionInput & {
  id: string
  createdAt: string
}

export type ActionRequest = {
  connectionId: string
  action: string
  payload: unknown
}

export type WorkflowStep = {
  action: string
  payload: unknown
}

export type WorkflowRequest = {
  name: string
  connectionId: string
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
  socketStatus: 'connecting' | 'connected' | 'disconnected'
  addConnection: (connection: ConnectionRecord) => void
  removeConnection: (connectionId: string) => void
  appendResult: (result: AgentResult) => void
}
