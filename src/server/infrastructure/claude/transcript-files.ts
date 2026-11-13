import fs from 'node:fs'
import path from 'node:path'
import type { ChatMessage } from '../../../domain/model.ts'
import type { ConversationSource } from '../../application/ports.ts'
import { parseTranscript } from './transcript-parser.ts'

/** Só o final do arquivo interessa: conversas longas passam de dezenas de megabytes. */
const TAIL_BYTES = 2 * 1024 * 1024

interface CacheEntry {
  stamp: string
  messages: ChatMessage[]
}

/** Lê as conversas que o Claude Code grava em `~/.claude/projects/<pasta>/<sessão>.jsonl`. */
export class TranscriptFiles implements ConversationSource {
  readonly #projectsDir: string
  readonly #cache = new Map<string, CacheEntry>()

  constructor(claudeDir: string) {
    this.#projectsDir = path.join(claudeDir, 'projects')
  }

  exists(cwd: string, sessionId: string): boolean {
    return this.#locate(cwd, sessionId) !== null
  }

  read(cwd: string, sessionId: string): ChatMessage[] {
    const file = this.#locate(cwd, sessionId)
    if (!file) return []
    try {
      const { size, mtimeMs } = fs.statSync(file)
      const stamp = `${size}|${mtimeMs}`
      const cached = this.#cache.get(file)
      if (cached?.stamp === stamp) return cached.messages

      const messages = parseTranscript(readTail(file, size))
      this.#cache.set(file, { stamp, messages })
      return messages
    } catch {
      return []
    }
  }

  /** O Claude Code nomeia a pasta trocando por hífen tudo o que não é letra nem número. */
  #locate(cwd: string, sessionId: string): string | null {
    const direct = path.join(
      this.#projectsDir,
      cwd.replace(/[^a-zA-Z0-9]/g, '-'),
      `${sessionId}.jsonl`,
    )
    return fs.existsSync(direct) ? direct : null
  }
}

function readTail(file: string, size: number): string {
  const length = Math.min(size, TAIL_BYTES)
  const buffer = Buffer.alloc(length)
  const fd = fs.openSync(file, 'r')
  try {
    fs.readSync(fd, buffer, 0, length, size - length)
  } finally {
    fs.closeSync(fd)
  }
  return buffer.toString('utf8')
}
