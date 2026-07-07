const DEFAULT_HTTP_URL =
  import.meta.env.VITE_WYNBENCH_AGENT_HTTP_URL?.replace(/\/$/, '') ?? 'http://localhost:8080'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${DEFAULT_HTTP_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const rawBody = await response.text()
  const parsedBody = rawBody ? parseBody(rawBody) : null

  if (!response.ok) {
    throw new Error(getErrorMessage(parsedBody, response.statusText))
  }

  return parsedBody as T
}

export async function checkAgentHealth() {
  return requestJson<{ status: string; plugins: string[] }>('/health')
}

function parseBody(body: string) {
  try {
    return JSON.parse(body) as unknown
  } catch {
    return body
  }
}

function getErrorMessage(body: unknown, fallback: string) {
  if (typeof body === 'string' && body.trim()) {
    return body
  }

  if (isRecord(body) && typeof body.error === 'string') {
    return body.error
  }

  if (isRecord(body) && typeof body.message === 'string') {
    return body.message
  }

  return fallback || 'Agent request failed'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
