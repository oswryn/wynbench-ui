import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { checkAgentHealth } from '../api/client'
import type { AgentResult, ConnectionRecord, StoreContextValue } from '../types'

type StoreState = {
  connections: ConnectionRecord[]
  results: AgentResult[]
  agentStatus: 'checking' | 'online' | 'offline'
}

type StoreAction =
  | { type: 'addConnection'; payload: ConnectionRecord }
  | { type: 'setConnections'; payload: ConnectionRecord[] }
  | { type: 'removeConnection'; payload: string }
  | { type: 'appendResult'; payload: AgentResult }
  | { type: 'setAgentStatus'; payload: StoreState['agentStatus'] }

const initialState: StoreState = {
  connections: [],
  results: [],
  agentStatus: 'checking',
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
    case 'appendResult':
      return { ...state, results: [action.payload, ...state.results].slice(0, 25) }
    case 'setAgentStatus':
      return { ...state, agentStatus: action.payload }
    default:
      return state
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    dispatch({ type: 'setAgentStatus', payload: 'checking' })

    void checkAgentHealth()
      .then(() => {
        dispatch({ type: 'setAgentStatus', payload: 'online' })
      })
      .catch((error) => {
        dispatch({ type: 'setAgentStatus', payload: 'offline' })
        dispatch({
          type: 'appendResult',
          payload: {
            id: crypto.randomUUID(),
            source: 'agent',
            status: 'error',
            summary: 'Agent health check failed',
            response: null,
            logs: [],
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        })
      })
  }, [])

  const value = useMemo<StoreContextValue>(
    () => ({
      connections: state.connections,
      results: state.results,
      agentStatus: state.agentStatus,
      addConnection: (connection) => dispatch({ type: 'addConnection', payload: connection }),
      setConnections: (connections) => dispatch({ type: 'setConnections', payload: connections }),
      removeConnection: (connectionId) => dispatch({ type: 'removeConnection', payload: connectionId }),
      appendResult: (result) => dispatch({ type: 'appendResult', payload: result }),
    }),
    [state.agentStatus, state.connections, state.results],
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
