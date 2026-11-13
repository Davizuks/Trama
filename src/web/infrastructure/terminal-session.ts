import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { terminalSocketUrl } from './api-client.ts'

const RECONNECT_MS = 1500

type ServerMessage = { type: 'output'; data: string } | { type: 'exit' }

/**
 * A tela de um terminal da Trama no navegador. Vive fora do React porque precisa sobreviver quando
 * a janela muda de lugar (do grafo para a tela cheia): quem a exibe só adota o elemento `host`.
 */
export class TerminalSession {
  readonly host = document.createElement('div')
  readonly #id: string
  readonly #terminal = new Terminal({
    fontFamily: 'ui-monospace, "DejaVu Sans Mono", "Liberation Mono", Menlo, monospace',
    fontSize: 13,
    cursorBlink: true,
    scrollback: 5000,
    theme: {
      background: '#141615',
      foreground: '#e8e6e0',
      cursor: '#e8e6e0',
      selectionBackground: '#3d4f7a',
    },
  })
  readonly #fit = new FitAddon()
  #socket: WebSocket | null = null
  #retry: ReturnType<typeof setTimeout> | undefined
  #opened = false
  #ended = false

  constructor(id: string) {
    this.#id = id
    this.host.className = 'terminal-host'
    this.#terminal.loadAddon(this.#fit)
    this.#terminal.onData((data) => this.#send({ type: 'input', data }))
    void this.#connect()
  }

  /** Coloca a tela dentro de `container`, tirando-a de onde estava. */
  mount(container: HTMLElement): void {
    container.appendChild(this.host)
    if (!this.#opened) {
      this.#terminal.open(this.host)
      this.#opened = true
    }
    this.fit()
  }

  /** Ajusta colunas e linhas ao espaço disponível e avisa o processo do novo tamanho. */
  fit(): void {
    if (!this.#opened || !this.host.isConnected || this.host.clientWidth === 0) return
    this.#fit.fit()
    this.#send({ type: 'resize', cols: this.#terminal.cols, rows: this.#terminal.rows })
  }

  focus(): void {
    this.#terminal.focus()
  }

  dispose(): void {
    this.#ended = true
    clearTimeout(this.#retry)
    this.#socket?.close()
    this.#terminal.dispose()
    this.host.remove()
  }

  async #connect(): Promise<void> {
    if (this.#ended) return
    let socket: WebSocket
    try {
      socket = new WebSocket(await terminalSocketUrl(this.#id))
    } catch {
      this.#scheduleReconnect()
      return
    }
    this.#socket = socket

    socket.addEventListener('open', () => {
      // O servidor reenvia a tela inteira a cada conexão; limpar evita texto duplicado.
      this.#terminal.reset()
      this.fit()
    })
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as ServerMessage
      if (message.type === 'output') {
        this.#terminal.write(message.data)
      } else {
        this.#ended = true
        this.#terminal.write('\r\n\x1b[2m[chat encerrado]\x1b[0m\r\n')
      }
    })
    socket.addEventListener('close', () => this.#scheduleReconnect())
  }

  #scheduleReconnect(): void {
    if (this.#ended) return
    clearTimeout(this.#retry)
    this.#retry = setTimeout(() => void this.#connect(), RECONNECT_MS)
  }

  #send(message: object): void {
    if (this.#socket?.readyState === WebSocket.OPEN) this.#socket.send(JSON.stringify(message))
  }
}

const sessions = new Map<string, TerminalSession>()

/** As telas abertas, uma por terminal, criadas na primeira vez em que alguém precisa delas. */
export const terminalSessions = {
  get(id: string): TerminalSession {
    let session = sessions.get(id)
    if (!session) {
      session = new TerminalSession(id)
      sessions.set(id, session)
    }
    return session
  },

  /** Descarta as telas de terminais que não existem mais. */
  retainOnly(ids: Iterable<string>): void {
    const alive = new Set(ids)
    for (const [id, session] of sessions) {
      if (alive.has(id)) continue
      session.dispose()
      sessions.delete(id)
    }
  },
}
