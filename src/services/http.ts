export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  let result: unknown

  try {
    result = await response.json()
  } catch {
    throw new Error(`Il servizio ha restituito una risposta non valida (HTTP ${response.status}).`)
  }

  if (!response.ok) {
    const message =
      result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
        ? result.message
        : result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
          ? result.error
        : `Richiesta non riuscita (HTTP ${response.status}).`
    throw new Error(message)
  }

  return result as T
}

export function postJson<T>(url: string, body: object): Promise<T> {
  return requestJson<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
