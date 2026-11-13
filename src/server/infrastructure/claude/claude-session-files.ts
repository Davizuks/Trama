import fs from 'node:fs'
import path from 'node:path'
import type { LiveSession, SessionSource } from '../../application/ports.ts'
import { isProcessAlive } from '../system/linux-process.ts'

/**
 * Lê os registros que o Claude Code mantém em `~/.claude/sessions/<pid>.json`.
 * O formato é interno do Claude Code e pode mudar entre versões; por isso cada campo é conferido.
 */
export class ClaudeSessionFiles implements SessionSource {
  readonly #dir: string

  constructor(claudeDir: string) {
    this.#dir = path.join(claudeDir, 'sessions')
  }

  listLive(): LiveSession[] {
    let files: string[] = []
    try {
      files = fs.readdirSync(this.#dir).filter((file) => /^\d+\.json$/.test(file))
    } catch {
      return []
    }
    return files
      .map((file) => this.#read(path.join(this.#dir, file)))
      .filter((session) => session !== null)
      .sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0))
  }

  #read(file: string): LiveSession | null {
    let raw: Record<string, unknown>
    try {
      raw = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch {
      return null
    }
    const { pid, sessionId, cwd } = raw
    if (typeof pid !== 'number' || typeof sessionId !== 'string' || typeof cwd !== 'string')
      return null
    const procStart = typeof raw.procStart === 'string' ? raw.procStart : undefined
    if (!isProcessAlive(pid, procStart)) return null

    const time = (value: unknown) => (typeof value === 'number' ? value : null)
    return {
      pid,
      sessionId,
      cwd,
      name: typeof raw.name === 'string' && raw.name ? raw.name : `chat ${pid}`,
      status: typeof raw.status === 'string' ? raw.status : 'desconhecido',
      startedAt: time(raw.startedAt),
      updatedAt: time(raw.statusUpdatedAt) ?? time(raw.updatedAt),
    }
  }
}
