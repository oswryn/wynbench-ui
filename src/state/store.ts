import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { connectAgentSocket } from '../api/client'
import type { AgentResult, ConnectionRecord, StoreContextValue } from '../types'

type StoreState = {
  connections: ConnectionRecord[]
  results: AgentResult[]
  socketStatus: 'connecting' | 'connected' | 'disconnected'
}

type StoreAction =
  | { type: 'addConnection'; payload: ConnectionRecord }
  | { type: 'removeConnection'; payload: string }
  | { type: 'appendResult'; payload: AgentResult }
  | { type: 'setSocketStatus'; payload: StoreState['socketStatus'] }

const initialState: StoreState = {
  connections: [],
  results: [],
  socketStatus: 'connecting',
}

const StoreContext = createContext<StoreContextValue | null>(null)

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'addConnection':
      return { ...state, connections: [...state.connections, action.payload] }
    case 'removeConnection':
      return { ...state, connections: state.connections.filter((connection) => connection.id !== action.payload) }
    case 'appendResult':
      return { ...state, results: [action.payload, ...state.results].slice(0, 25) }
    case 'setSocketStatus':
      return { ...state, socketStatus: action.payload }
    default:
      return state
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    dispatch({ type: 'setSocketStatus', payload: 'connecting' })

    try {
      const socket = connectAgentSocket({
        onOpen: () => dispatch({ type: 'setSocketStatus', payload: 'connected' }),
        onClose: () => dispatch({ type: 'setSocketStatus', payload: 'disconnected' }),
        onError: (message) => {
          dispatch({ type: 'setSocketStatus', payload: 'disconnected' })
          dispatch({
            type: 'appendResult',
            payload: {
              id: crypto.randomUUID(),
              source: 'agent',
              status: 'error',
              summary: 'WebSocket stream unavailable',
              response: null,
              logs: [],
              error: message,
              timestamp: new Date().toISOString(),
            },
          })
        },
        onMessage: (payload) =>
          dispatch({
            type: 'appendResult',
            payload: normalizeSocketResult(payload),
          }),
      })

      return () => socket.close()
    } catch (error) {
      dispatch({ type: 'setSocketStatus', payload: 'disconnected' })
      dispatch({
        type: 'appendResult',
        payload: {
          id: crypto.randomUUID(),
          source: 'agent',
          status: 'error',
          summary: 'WebSocket setup failed',
          response: null,
          logs: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      })
    }

    return undefined
  }, [])

  const value = useMemo<StoreContextValue>(
    () => ({
      connections: state.connections,
      results: state.results,
      socketStatus: state.socketStatus,
      addConnection: (connection) => dispatch({ type: 'addConnection', payload: connection }),
      removeConnection: (connectionId) => dispatch({ type: 'removeConnection', payload: connectionId }),
      appendResult: (result) => dispatch({ type: 'appendResult', payload: result }),
    }),
    [state.connections, state.results, state.socketStatus],
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

function normalizeSocketResult(payload: unknown): AgentResult {
  const record = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : null
  const status = record?.status === 'error' ? 'error' : record?.status === 'info' ? 'info' : 'success'
  const logs = Array.isArray(record?.logs) ? record.logs.filter((entry): entry is string => typeof entry === 'string') : []

  return {
    id: crypto.randomUUID(),
    source: 'agent',
    status,
    summary: typeof record?.summary === 'string' ? record.summary : 'Received WebSocket event',
    response: record?.payload ?? payload,
    logs,
    error: typeof record?.error === 'string' ? record.error : undefined,
    timestamp: new Date().toISOString(),
  }
}
