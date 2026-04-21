const DEFAULT_API_BASE_URL = 'http://localhost:4000'

function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  return configured && configured.length > 0 ? configured.replace(/\/+$/, '') : DEFAULT_API_BASE_URL
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(`${getApiBaseUrl()}${path}`)

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
  console.log('[httpClient] GET', requestUrl)

  let response: Response

  try {
    response = await fetch(requestUrl, {
      headers: {
        Accept: 'application/json',
      },
    })
  } catch (error) {
    console.error('[httpClient] network failure', requestUrl, error)
    throw error
  }

  const text = await response.text()
  const body = text ? JSON.parse(text) : null

  if (!response.ok) {
    console.error('[httpClient] http failure', requestUrl, response.status, body)
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Request failed with status ${response.status}`
    throw new HttpApiError(message, response.status)
  }

  console.log('[httpClient] success', requestUrl, body)
  return body as TResponse
}
