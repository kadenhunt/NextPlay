/** Empty string = same-origin (Vite dev proxy to backend). Override for direct backend URL. */
const DEFAULT_API_BASE_URL = ''

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configured && configured.length > 0) {
    return configured.replace(/\/+$/, '')
  }
  return DEFAULT_API_BASE_URL
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const base = getApiBaseUrl()
  const url = base
    ? new URL(`${base}${path}`)
    : new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

export class HttpApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpApiError'
    this.status = status
  }
}

export async function getJson<TResponse>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<TResponse> {
  const requestUrl = buildUrl(path, query)

  const response = await fetch(requestUrl, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      body = null
    }
  }

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Request failed with status ${response.status}`
    throw new HttpApiError(message, response.status)
  }

  return body as TResponse
}

export async function postJson<TResponse, TBody extends Record<string, unknown>>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  const base = getApiBaseUrl()
  const requestUrl = base
    ? `${base}${path}`
    : new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173').toString()

  const response = await fetch(requestUrl, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown
    } catch {
      parsed = null
    }
  }

  if (!response.ok) {
    const message =
      parsed && typeof parsed === 'object' && 'message' in parsed && typeof parsed.message === 'string'
        ? parsed.message
        : `Request failed with status ${response.status}`
    throw new HttpApiError(message, response.status)
  }

  if (response.status === 204 || !text) {
    return undefined as TResponse
  }

  return parsed as TResponse
}
