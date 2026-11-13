import fs from 'node:fs'
import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import path from 'node:path'
import { WebSocketServer } from 'ws'
import type {
  ChatMessage,
  OpenTerminalRequest,
  TerminalInfo,
  WebState,
} from '../../domain/model.ts'
import { UseCaseError, type UseCaseErrorKind } from '../application/errors.ts'
import type { TerminalGateway } from '../application/ports.ts'
import { isAuthorized, isLocalRequest, type RequestFacts, type SecurityPolicy } from './security.ts'

export interface HttpDeps {
  policy: SecurityPolicy
  distDir: string
  terminals: TerminalGateway
  getWebState: () => WebState
  getConversation: (pid: number) => ChatMessage[]
  openTerminal: (request: OpenTerminalRequest) => TerminalInfo
  closeTerminal: (id: string) => void
  /** Recebe as falhas inesperadas, que não devem ser mostradas ao usuário. */
  logError: (error: unknown) => void
}

const STATUS_BY_ERROR: Record<UseCaseErrorKind, number> = {
  invalid: 400,
  conflict: 409,
  'not-found': 404,
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
}

const MAX_BODY_BYTES = 16 * 1024
const header = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

function factsOf(request: IncomingMessage, url: URL): RequestFacts {
  return {
    host: request.headers.host,
    origin: header(request.headers.origin),
    fetchSite: header(request.headers['sec-fetch-site']),
    // O navegador não deixa definir cabeçalhos em WebSocket, então lá o token vem na URL.
    token: header(request.headers['x-trama-token']) ?? url.searchParams.get('token') ?? undefined,
  }
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  response.end(JSON.stringify(body))
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new UseCaseError('invalid', 'Pedido grande demais.')
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new UseCaseError('invalid', 'O pedido não é um JSON válido.')
  }
}

export function createHttpServer(deps: HttpDeps): http.Server {
  const { policy } = deps

  async function handleApi(request: IncomingMessage, response: ServerResponse, url: URL) {
    const route = `${request.method} ${url.pathname}`

    // A página pede o token ao carregar. Outra origem não consegue ler esta resposta.
    if (route === 'GET /api/token') return sendJson(response, 200, { token: policy.token })
    if (!isAuthorized(policy, factsOf(request, url))) {
      return sendJson(response, 401, { error: 'Sessão da Trama expirada. Recarregue a página.' })
    }

    if (route === 'GET /api/state') return sendJson(response, 200, deps.getWebState())
    if (route === 'POST /api/terminals') {
      const body = (await readJson(request)) as OpenTerminalRequest
      return sendJson(response, 201, deps.openTerminal(body))
    }
    const conversation = route.match(/^GET \/api\/conversations\/(\d+)$/)
    if (conversation) return sendJson(response, 200, deps.getConversation(Number(conversation[1])))
    const terminal = route.match(/^DELETE \/api\/terminals\/([0-9a-f]+)$/)
    if (terminal) {
      deps.closeTerminal(terminal[1])
      return sendJson(response, 200, { closed: true })
    }
    return sendJson(response, 404, { error: 'Rota desconhecida.' })
  }

  function serveStatic(response: ServerResponse, pathname: string) {
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1)
    const file = path.resolve(deps.distDir, relative)
    const insideDist = file.startsWith(deps.distDir + path.sep)
    if (!insideDist || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      response.end(
        pathname === '/'
          ? 'A interface ainda não foi compilada. Rode `npm run build`.'
          : 'Não encontrado.',
      )
      return
    }
    response.writeHead(200, {
      'content-type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream',
      'cache-control':
        relative === 'index.html' ? 'no-store' : 'public, max-age=31536000, immutable',
    })
    fs.createReadStream(file).pipe(response)
  }

  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://local')
    if (!isLocalRequest(policy, factsOf(request, url))) {
      response.writeHead(403).end()
      return
    }
    if (!url.pathname.startsWith('/api/')) {
      serveStatic(response, url.pathname)
      return
    }
    handleApi(request, response, url).catch((error: unknown) => {
      if (error instanceof UseCaseError) {
        sendJson(response, STATUS_BY_ERROR[error.kind], { error: error.message })
      } else {
        deps.logError(error)
        sendJson(response, 500, { error: 'Erro interno da Trama.' })
      }
    })
  })

  attachTerminalSockets(server, deps)
  return server
}

/** Liga o navegador a um terminal: teclas em um sentido, a tela no outro. */
function attachTerminalSockets(server: http.Server, deps: HttpDeps): void {
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 })

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '/', 'http://local')
    const id = url.pathname.match(/^\/api\/terminals\/([0-9a-f]+)\/socket$/)?.[1]
    if (!id || !isAuthorized(deps.policy, factsOf(request, url))) {
      socket.destroy()
      return
    }

    sockets.handleUpgrade(request, socket, head, (client) => {
      const send = (message: object) => {
        if (client.readyState === client.OPEN) client.send(JSON.stringify(message))
      }
      const attachment = deps.terminals.attach(id, {
        onData: (data) => send({ type: 'output', data }),
        onExit: () => {
          send({ type: 'exit' })
          client.close()
        },
      })
      if (!attachment) {
        send({ type: 'exit' })
        client.close()
        return
      }
      if (attachment.backlog) send({ type: 'output', data: attachment.backlog })

      client.on('message', (raw) => {
        let message: { type?: unknown; data?: unknown; cols?: unknown; rows?: unknown }
        try {
          message = JSON.parse(raw.toString())
        } catch {
          return
        }
        if (message.type === 'input' && typeof message.data === 'string') {
          attachment.write(message.data)
        } else if (message.type === 'resize') {
          const cols = Math.trunc(Number(message.cols))
          const rows = Math.trunc(Number(message.rows))
          if (cols >= 2 && cols <= 500 && rows >= 2 && rows <= 300) attachment.resize(cols, rows)
        }
      })
      client.on('close', () => attachment.detach())
    })
  })
}
