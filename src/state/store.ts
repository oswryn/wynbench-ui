import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { checkAgentHealth } from '../api/client'
import { showResultToast } from '../toaster'
import type { AgentResult, ColorMode, ConnectionRecord, StoredWorkflow, StoreContextValue } from '../types'

const COLOR_MODE_KEY = 'wynbench.colorMode'

function getInitialColorMode(): ColorMode {
  const saved = globalThis.localStorage?.getItem(COLOR_MODE_KEY)

  if (saved === 'light' || saved === 'dark') {
    return saved
  }

  const prefersLight = globalThis.matchMedia?.('(prefers-color-scheme: light)').matches
  return prefersLight ? 'light' : 'dark'
}

type StoreState = {
  connections: ConnectionRecord[]
  workflows: StoredWorkflow[]
  results: AgentResult[]
  agentStatus: 'checking' | 'online' | 'offline'
  colorMode: ColorMode
}

type StoreAction =
  | { type: 'addConnection'; payload: ConnectionRecord }
  | { type: 'setConnections'; payload: ConnectionRecord[] }
  | { type: 'removeConnection'; payload: string }
  | { type: 'addWorkflow'; payload: StoredWorkflow }
  | { type: 'setWorkflows'; payload: StoredWorkflow[] }
  | { type: 'updateWorkflow'; payload: StoredWorkflow }
  | { type: 'removeWorkflow'; payload: string }
  | { type: 'appendResult'; payload: AgentResult }
  | { type: 'clearResults' }
  | { type: 'setAgentStatus'; payload: StoreState['agentStatus'] }
  | { type: 'setColorMode'; payload: ColorMode }

const initialState: StoreState = {
  connections: [],
  workflows: [],
  results: [],
  agentStatus: 'checking',
  colorMode: getInitialColorMode(),
}

const StoreContext = createContext<StoreContextValue | null>(null)

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'addConnection':
      return { ...state, connections: [...state.connections, action.payload] }
    case 'setConnections':
      return { ...state, connections: action.payload }
    case 'removeConnection':
      return { ...state, connections: state.connections.filter((connection) => connection.id !== action.payload) }
    case 'addWorkflow':
      return { ...state, workflows: [...state.workflows, action.payload] }
    case 'setWorkflows':
      return { ...state, workflows: action.payload }
    case 'updateWorkflow':
      return {
        ...state,
        workflows: state.workflows.map((workflow) =>
          workflow.id === action.payload.id ? action.payload : workflow,
        ),
      }
    case 'removeWorkflow':
      return { ...state, workflows: state.workflows.filter((workflow) => workflow.id !== action.payload) }
    case 'appendResult':
      return { ...state, results: [action.payload, ...state.results].slice(0, 25) }
    case 'clearResults':
      return { ...state, results: [] }
    case 'setAgentStatus':
      return { ...state, agentStatus: action.payload }
    case 'setColorMode':
      return { ...state, colorMode: action.payload }
    default:
      return state
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const appendResult = useCallback((result: AgentResult) => {
    dispatch({ type: 'appendResult', payload: result })
    void showResultToast(result)
  }, [dispatch])

  useEffect(() => {
    dispatch({ type: 'setAgentStatus', payload: 'checking' })

    void checkAgentHealth()
      .then(() => {
        dispatch({ type: 'setAgentStatus', payload: 'online' })
      })
      .catch((error) => {
        dispatch({ type: 'setAgentStatus', payload: 'offline' })
        appendResult({
          id: crypto.randomUUID(),
          source: 'agent',
          status: 'error',
          summary: 'Agent health check failed',
          response: null,
          logs: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        })
      })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('bp6-dark', state.colorMode === 'dark')
  }, [state.colorMode])

  const addConnection = useCallback((connection: ConnectionRecord) => dispatch({ type: 'addConnection', payload: connection }), [dispatch])
  const setConnections = useCallback((connections: ConnectionRecord[]) => dispatch({ type: 'setConnections', payload: connections }), [dispatch])
  const removeConnection = useCallback((connectionId: string) => dispatch({ type: 'removeConnection', payload: connectionId }), [dispatch])
  const addWorkflow = useCallback((workflow: StoredWorkflow) => dispatch({ type: 'addWorkflow', payload: workflow }), [dispatch])
  const setWorkflows = useCallback((workflows: StoredWorkflow[]) => dispatch({ type: 'setWorkflows', payload: workflows }), [dispatch])
  const updateWorkflow = useCallback((workflow: StoredWorkflow) => dispatch({ type: 'updateWorkflow', payload: workflow }), [dispatch])
  const removeWorkflow = useCallback((workflowId: string) => dispatch({ type: 'removeWorkflow', payload: workflowId }), [dispatch])
  const clearResults = useCallback(() => dispatch({ type: 'clearResults' }), [dispatch])
  const setAgentStatus = useCallback((status: StoreState['agentStatus']) => dispatch({ type: 'setAgentStatus', payload: status }), [dispatch])
  const setColorMode = useCallback((mode: ColorMode) => {
    globalThis.localStorage.setItem(COLOR_MODE_KEY, mode)
    dispatch({ type: 'setColorMode', payload: mode })
  }, [dispatch])

  const value = useMemo<StoreContextValue>(
    () => ({
      connections: state.connections,
      workflows: state.workflows,
      results: state.results,
      agentStatus: state.agentStatus,
      colorMode: state.colorMode,
      addConnection,
      setConnections,
      setAgentStatus,
      removeConnection,
      addWorkflow,
      setWorkflows,
      updateWorkflow,
      removeWorkflow,
      appendResult,
      clearResults,
      setColorMode,
    }),
    [state.connections, state.workflows, state.results, state.agentStatus, state.colorMode, addConnection, setConnections, setAgentStatus, removeConnection, addWorkflow, setWorkflows, updateWorkflow, removeWorkflow, appendResult, clearResults, setColorMode],
  )

  return createElement(StoreContext.Provider, { value }, children)
}

export function useStore() {
  const value = useContext(StoreContext)

  if (!value) {
    throw new Error('StoreProvider is required')
  }

  return value
}
