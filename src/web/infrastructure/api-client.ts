import type {
  ChatMessage,
  OpenTerminalRequest,
  TerminalInfo,
  WebState,
} from '../../domain/model.ts'

/** Falha devolvida pelo servidor, com mensagem pronta para mostrar na tela. */
export class ApiError extends Error {}

let tokenRequest: Promise<string> | null = null

/** O servidor sorteia um token a cada início; a página o busca uma vez e o reenvia sempre. */
function loadToken(): Promise<string> {
  tokenRequest ??= fetch('/api/token', { cache: 'no-store' })
    .then((response) => response.json())
    .then((body: { token: string }) => body.token)
    .catch((error: unknown) => {
      tokenRequest = null
      throw error
    })
  return tokenRequest
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(path, {
      ...init,
      cache: 'no-store',
      headers: {
        'x-trama-token': await loadToken(),
        ...(init.body ? { 'content-type': 'application/json' } : {}),
      },
    })
    // O servidor reiniciou e trocou o token: busca o novo e tenta mais uma vez.
    if (response.status === 401 && attempt === 1) {
      tokenRequest = null
      continue
    }
    const body = await response.json()
    if (!response.ok) throw new ApiError(body.error ?? 'A Trama não conseguiu atender o pedido.')
    return body as T
  }
}

export const fetchState = () => call<WebState>('/api/state')

export const fetchConversation = (pid: number) => call<ChatMessage[]>(`/api/conversations/${pid}`)

export const openTerminal = (request: OpenTerminalRequest) =>
  call<TerminalInfo>('/api/terminals', { method: 'POST', body: JSON.stringify(request) })

export const closeTerminal = (id: string) =>
  call<{ closed: true }>(`/api/terminals/${id}`, { method: 'DELETE' })

export async function terminalSocketUrl(id: string): Promise<string> {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${location.host}/api/terminals/${id}/socket?token=${await loadToken()}`
}
