export type ChatStatus = 'needs-you' | 'working' | 'stopped'

export type Role = 'livre' | 'maestro' | 'construtor' | 'revisor' | 'redator'

export interface TranscriptLine {
  text: string
  strong?: boolean
}

export interface ChatRequest {
  kind: 'command' | 'edit' | 'crashed'
  title: string
  detail: string
  context: string
}

export interface Chat {
  id: string
  name: string
  role: Role
  project: string
  status: ChatStatus
  lastActivity: string
  summary: string
  transcript: TranscriptLine[]
  forkOf?: string
  request?: ChatRequest
}

export interface Task {
  id: string
  title: string
  done: boolean
  note?: string
}

export interface Memo {
  id: string
  from: string
  to: string
  when: string
  text: string
}

export type BrainNodeKind = 'brain' | 'project' | 'note'

export interface BrainNode {
  id: string
  label: string
  kind: BrainNodeKind
}

export interface Brain {
  nodes: BrainNode[]
  links: Array<[from: string, to: string]>
}

export interface Notice {
  id: string
  chatId?: string
  title: string
  body: string
  when: string
  unread: boolean
}

export type Theme = 'escuro' | 'claro' | 'sistema'

export interface Settings {
  workFolder: string
  brainFolder: string
  defaultRole: Role
  showExternalChats: boolean
  notifyWhenNeeded: boolean
  confirmBeforeClosing: boolean
  theme: Theme
}

export type ServiceId = 'obsidian' | 'github' | 'figma'

export interface Service {
  id: ServiceId
  name: string
  description: string
  connected: boolean
  statusLabel: string
}

export interface ClaudeConnection {
  mode: 'account' | 'api-key'
  accountName: string
  plan: string
  /** Já vem mascarada: a chave inteira nunca chega ao navegador. */
  maskedKey: string
}

export interface McpServer {
  id: string
  name: string
  kind: 'http' | 'command'
  command?: string
  tools: number
  scope: 'all' | string
  enabled: boolean
  needsLogin: boolean
}

export interface Account {
  name: string
  initials: string
  workspace: string
}

export type SetupStepState = 'done' | 'pending' | 'error'

export interface Setup {
  claude: SetupStepState
  workFolder: SetupStepState
  brain: SetupStepState
  obsidian: SetupStepState
}

export interface Workspace {
  account: Account
  chats: Chat[]
  externalChats: number
  tasks: Task[]
  memos: Memo[]
  brain: Brain
  notices: Notice[]
  settings: Settings
  claude: ClaudeConnection
  claudeLoggedIn: boolean
  services: Service[]
  mcpServers: McpServer[]
  setup: Setup | null
}

export const ROLES: Array<{ id: Role; label: string; hint: string }> = [
  { id: 'livre', label: 'Livre', hint: 'Um chat sem papel definido.' },
  { id: 'maestro', label: 'Maestro', hint: 'Quebra o trabalho em tarefas e distribui.' },
  {
    id: 'construtor',
    label: 'Construtor',
    hint: 'Implementa uma tarefa da fila e roda os testes.',
  },
  { id: 'revisor', label: 'Revisor', hint: 'Revisa o trabalho pronto e aponta defeitos.' },
  { id: 'redator', label: 'Redator', hint: 'Escreve textos a partir das notas do cérebro.' },
]
