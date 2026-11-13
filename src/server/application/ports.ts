import type { Board, BrainNote, ChatMessage, Role, TerminalInfo } from '../../domain/model.ts'

/** Um chat do Claude Code cujo processo está vivo. */
export interface LiveSession {
  pid: number
  sessionId: string
  cwd: string
  name: string
  status: string
  startedAt: number | null
  updatedAt: number | null
}

export interface SessionSource {
  listLive(): LiveSession[]
}

export interface ConversationSource {
  exists(cwd: string, sessionId: string): boolean
  read(cwd: string, sessionId: string): ChatMessage[]
}

export interface BrainSource {
  notes(): BrainNote[]
  board(): Board
}

export interface ProcessInspector {
  parentPid(pid: number): number | null
}

export interface FileSystem {
  isDirectory(path: string): boolean
}

export interface TerminalAttachment {
  /** Tudo o que o terminal já escreveu, para redesenhar a tela de quem acabou de conectar. */
  backlog: string
  write(data: string): void
  resize(cols: number, rows: number): void
  detach(): void
}

export interface TerminalListener {
  onData(data: string): void
  onExit(): void
}

export interface TerminalGateway {
  list(): TerminalInfo[]
  open(options: { cwd: string; role: Role | null; args: string[] }): TerminalInfo
  close(id: string): boolean
  attach(id: string, listener: TerminalListener): TerminalAttachment | null
  closeAll(): void
}
