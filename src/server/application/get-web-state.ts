import type {
  ChatMessage,
  ClaudeSession,
  FolderOption,
  TerminalInfo,
  WebState,
} from '../../domain/model.ts'
import type {
  BrainSource,
  ConversationSource,
  LiveSession,
  ProcessInspector,
  SessionSource,
  TerminalGateway,
} from './ports.ts'

const RECENT_MESSAGES = 6
const RECENT_TEXT_LIMIT = 420

export interface GetWebStateDeps {
  sessions: SessionSource
  conversations: ConversationSource
  brain: BrainSource
  terminals: TerminalGateway
  processes: ProcessInspector
  workspaceDir: string
  homeDir: string
  now: () => number
}

const shorten = (text: string) =>
  text.length > RECENT_TEXT_LIMIT ? `${text.slice(0, RECENT_TEXT_LIMIT)}…` : text

/** O chat pertence ao terminal quando é o próprio processo dele ou um filho direto. */
function terminalOf(
  session: LiveSession,
  terminals: TerminalInfo[],
  processes: ProcessInspector,
): string | null {
  const own = terminals.find((terminal) => terminal.pid === session.pid)
  if (own) return own.id
  const parent = processes.parentPid(session.pid)
  return terminals.find((terminal) => terminal.pid === parent)?.id ?? null
}

function summarize(messages: ChatMessage[]): Pick<ClaudeSession, 'recent' | 'currentTool'> {
  const last = messages.at(-1)
  return {
    recent: messages
      .filter((message) => message.author !== 'tool')
      .slice(-RECENT_MESSAGES)
      .map((message) => ({ ...message, text: shorten(message.text) })),
    currentTool: last?.author === 'tool' ? last.text : null,
  }
}

export function makeGetWebState(deps: GetWebStateDeps) {
  return function getWebState(): WebState {
    const board = deps.brain.board()
    const notes = deps.brain.notes()
    const terminals = deps.terminals.list()

    const sessions = deps.sessions.listLive().map((session): ClaudeSession => {
      const row = board.rows.find(
        (r) => r.session === String(session.pid) || r.session === session.name,
      )
      return {
        pid: session.pid,
        id: session.sessionId,
        name: session.name,
        cwd: session.cwd,
        status: session.status,
        startedAt: session.startedAt,
        updatedAt: session.updatedAt,
        terminalId: terminalOf(session, terminals, deps.processes),
        role: row?.role || null,
        task: row?.task || null,
        ...summarize(deps.conversations.read(session.cwd, session.sessionId)),
      }
    })

    const folders = new Map<string, FolderOption>()
    folders.set(deps.workspaceDir, { label: 'Raiz da teia', path: deps.workspaceDir })
    for (const note of notes) {
      if (note.projectDir)
        folders.set(note.projectDir, { label: note.title, path: note.projectDir })
    }
    for (const session of sessions) {
      if (!folders.has(session.cwd))
        folders.set(session.cwd, { label: session.cwd, path: session.cwd })
    }

    return {
      now: deps.now(),
      workspaceDir: deps.workspaceDir,
      homeDir: deps.homeDir,
      sessions,
      terminals,
      notes,
      queue: board.queue,
      messages: board.messages,
      folders: [...folders.values()],
    }
  }
}
