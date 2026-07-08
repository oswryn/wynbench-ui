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

export type StoredWorkflow = WorkflowRequest & {
  id: string
  createdAt?: string
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

export type ColorMode = 'light' | 'dark'

export type StoreContextValue = {
  connections: ConnectionRecord[]
  workflows: StoredWorkflow[]
  results: AgentResult[]
  agentStatus: 'checking' | 'online' | 'offline'
  colorMode: ColorMode
  addConnection: (connection: ConnectionRecord) => void
  setConnections: (connections: ConnectionRecord[]) => void
  setAgentStatus: (status: 'checking' | 'online' | 'offline') => void
  removeConnection: (connectionId: string) => void
  addWorkflow: (workflow: StoredWorkflow) => void
  setWorkflows: (workflows: StoredWorkflow[]) => void
  updateWorkflow: (workflow: StoredWorkflow) => void
  removeWorkflow: (workflowId: string) => void
  appendResult: (result: AgentResult) => void
  clearResults: () => void
  setColorMode: (mode: ColorMode) => void
}
