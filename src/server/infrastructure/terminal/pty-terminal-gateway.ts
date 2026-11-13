import { randomBytes } from 'node:crypto'
import * as pty from '@lydell/node-pty'
import type { Role, TerminalInfo } from '../../../domain/model.ts'
import type {
  TerminalAttachment,
  TerminalGateway,
  TerminalListener,
} from '../../application/ports.ts'

/** Quanto do que o terminal escreveu fica guardado para redesenhar a tela de quem reconecta. */
const BACKLOG_CHARS = 400_000

/**
 * Variáveis que o Claude Code define para os próprios processos filhos. Se vazassem para um chat
 * novo (quando a Trama é iniciada de dentro de um chat), ele se comportaria como sessão aninhada.
 */
const INHERITED_SESSION_VARS = /^(CLAUDECODE$|CLAUDE_PID$|CLAUDE_EFFORT$|CLAUDE_CODE_)/

interface RunningTerminal {
  info: TerminalInfo
  process: pty.IPty
  backlog: string[]
  backlogChars: number
  listeners: Set<TerminalListener>
}

/** Roda o Claude Code em pseudo-terminais e repassa a tela para quem estiver conectado. */
export class PtyTerminalGateway implements TerminalGateway {
  readonly #claudeBin: string
  readonly #running = new Map<string, RunningTerminal>()

  constructor(claudeBin: string) {
    this.#claudeBin = claudeBin
  }

  list(): TerminalInfo[] {
    return [...this.#running.values()].map((terminal) => terminal.info)
  }

  open(options: { cwd: string; role: Role | null; args: string[] }): TerminalInfo {
    const id = randomBytes(4).toString('hex')
    const child = pty.spawn(this.#claudeBin, options.args, {
      name: 'xterm-256color',
      cols: 100,
      rows: 30,
      cwd: options.cwd,
      env: { ...cleanEnv(), TERM: 'xterm-256color', COLORTERM: 'truecolor' },
    })
    const terminal: RunningTerminal = {
      info: { id, cwd: options.cwd, pid: child.pid, role: options.role },
      process: child,
      backlog: [],
      backlogChars: 0,
      listeners: new Set(),
    }
    this.#running.set(id, terminal)

    child.onData((data) => {
      terminal.backlog.push(data)
      terminal.backlogChars += data.length
      while (terminal.backlogChars > BACKLOG_CHARS && terminal.backlog.length > 1) {
        terminal.backlogChars -= terminal.backlog.shift()!.length
      }
      for (const listener of terminal.listeners) listener.onData(data)
    })
    child.onExit(() => {
      this.#running.delete(id)
      for (const listener of terminal.listeners) listener.onExit()
    })
    return terminal.info
  }

  close(id: string): boolean {
    const terminal = this.#running.get(id)
    if (!terminal) return false
    terminal.process.kill()
    return true
  }

  attach(id: string, listener: TerminalListener): TerminalAttachment | null {
    const terminal = this.#running.get(id)
    if (!terminal) return null
    terminal.listeners.add(listener)
    return {
      backlog: terminal.backlog.join(''),
      write: (data) => terminal.process.write(data),
      resize: (cols, rows) => {
        // O processo pode ter acabado de sair; redimensionar um terminal morto lança erro.
        if (this.#running.has(id)) terminal.process.resize(cols, rows)
      },
      detach: () => terminal.listeners.delete(listener),
    }
  }

  closeAll(): void {
    for (const terminal of this.#running.values()) terminal.process.kill()
  }
}

function cleanEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [name, value] of Object.entries(process.env)) {
    if (value !== undefined && !INHERITED_SESSION_VARS.test(name)) env[name] = value
  }
  return env
}
