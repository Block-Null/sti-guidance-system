type ApiResponse<T> = {
  data: T
  ok: true
} | {
  error: string
  ok: false
}

export async function postJson<T>(
  url: string,
  body: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  let payload: unknown = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const error =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "Request failed."

    return { error, ok: false }
  }

  return {
    data: (payload ?? {}) as T,
    ok: true,
  }
}

export function createClientRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`
}
