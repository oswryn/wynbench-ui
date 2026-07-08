const ENV_HTTP_URL = import.meta.env.VITE_WYNBENCH_AGENT_HTTP_URL?.replace(/\/$/, '')
const FALLBACK_HTTP_URL = 'http://localhost:8080'
const AGENT_URL_OVERRIDE_KEY = 'wynbench.agentHttpUrl'
const AGENT_PORT_CANDIDATES = [8080, 9090, 8000, 5050]

let resolvedHttpUrl: string | null = ENV_HTTP_URL ?? null

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = await resolveAgentHttpUrl()
  const response = await fetch(`${baseUrl}${path}`, {
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

export async function testBackendConnection(rawUrl?: string) {
  const normalized = normalizeUrl(rawUrl)
  const urlToTest = normalized ?? (await resolveAgentHttpUrl())

  try {
    const ok = await probeAgentHealth(urlToTest)
    return {
      ok,
      url: urlToTest,
      message: ok ? 'Connection successful' : 'Health endpoint did not respond successfully',
    }
  } catch (error) {
    return {
      ok: false,
      url: urlToTest,
      message: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

export function getManualAgentHttpUrl() {
  if (typeof window === 'undefined') {
    return null
  }

  const value = window.localStorage.getItem(AGENT_URL_OVERRIDE_KEY)
  return normalizeUrl(value)
}

export function setManualAgentHttpUrl(rawUrl: string) {
  if (typeof window === 'undefined') {
    return
  }

  const normalized = normalizeUrl(rawUrl)
  if (!normalized) {
    window.localStorage.removeItem(AGENT_URL_OVERRIDE_KEY)
  } else {
    window.localStorage.setItem(AGENT_URL_OVERRIDE_KEY, normalized)
  }

  resolvedHttpUrl = null
}

export async function resolveAgentHttpUrl(): Promise<string> {
  if (resolvedHttpUrl) {
    return resolvedHttpUrl
  }

  const manualUrl = getManualAgentHttpUrl()
  if (manualUrl) {
    resolvedHttpUrl = manualUrl
    return manualUrl
  }

  if (ENV_HTTP_URL) {
    resolvedHttpUrl = ENV_HTTP_URL
    return ENV_HTTP_URL
  }

  const candidates = getAgentUrlCandidates()
  for (const candidate of candidates) {
    if (await probeAgentHealth(candidate)) {
      resolvedHttpUrl = candidate
      return candidate
    }
  }

  resolvedHttpUrl = FALLBACK_HTTP_URL
  return FALLBACK_HTTP_URL
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

function normalizeUrl(rawUrl: string | null | undefined) {
  if (!rawUrl) {
    return null
  }

  const trimmed = rawUrl.trim().replace(/\/$/, '')
  return trimmed || null
}

function getAgentUrlCandidates() {
  const candidates = new Set<string>()

  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    candidates.add(`${window.location.protocol}//${window.location.host}`)
    for (const port of AGENT_PORT_CANDIDATES) {
      candidates.add(`${window.location.protocol}//${window.location.hostname}:${port}`)
    }
  }

  for (const port of AGENT_PORT_CANDIDATES) {
    candidates.add(`http://localhost:${port}`)
    candidates.add(`http://127.0.0.1:${port}`)
  }

  candidates.add(FALLBACK_HTTP_URL)
  return Array.from(candidates)
}

async function probeAgentHealth(baseUrl: string) {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), 900)
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
    return response.ok
  } catch {
    return false
  } finally {
    globalThis.clearTimeout(timeout)
  }
}
