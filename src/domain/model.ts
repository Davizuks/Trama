/** Papéis que uma sessão pode assumir na teia. */
export const ROLES = ['maestro', 'construtor', 'revisor', 'redator'] as const
export type Role = (typeof ROLES)[number]

export const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && (ROLES as readonly string[]).includes(value)

export interface ChatMessage {
  author: 'user' | 'assistant' | 'tool'
  text: string
}

/** Um chat do Claude Code aberto nesta máquina. */
export interface ClaudeSession {
  pid: number
  id: string
  name: string
  cwd: string
  /** `busy` e `idle` são os estados conhecidos; outros valores são exibidos como vieram. */
  status: string
  startedAt: number | null
  updatedAt: number | null
  /** Terminal da Trama em que o chat roda, ou `null` se foi aberto em outro terminal. */
  terminalId: string | null
  role: string | null
  task: string | null
  recent: ChatMessage[]
  currentTool: string | null
}

/** Um terminal criado pela Trama, rodando o Claude Code. */
export interface TerminalInfo {
  id: string
  cwd: string
  pid: number
  role: Role | null
}

export interface BrainNote {
  id: string
  title: string
  /** Subpasta do cérebro em que a nota está (`projetos`, `decisoes`...), ou vazio na raiz. */
  group: string
  path: string
  /** Pasta de código que a nota descreve, quando ela é uma nota de projeto. */
  projectDir: string | null
  links: string[]
}

export interface BoardRow {
  session: string
  role: string
  project: string
  task: string
  files: string
}

export interface QueueItem {
  done: boolean
  text: string
}

export interface Board {
  rows: BoardRow[]
  queue: QueueItem[]
  messages: string[]
}

export interface FolderOption {
  label: string
  path: string
}

/** Fotografia de tudo o que a Trama mostra em um instante. */
export interface WebState {
  now: number
  workspaceDir: string
  homeDir: string
  sessions: ClaudeSession[]
  terminals: TerminalInfo[]
  notes: BrainNote[]
  queue: QueueItem[]
  messages: string[]
  folders: FolderOption[]
}

export interface OpenTerminalRequest {
  cwd: string
  role?: Role | null
  /** Id de uma conversa já encerrada, para continuá-la dentro da Trama. */
  resumeSessionId?: string | null
}
