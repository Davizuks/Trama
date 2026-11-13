import {
  isRole,
  type ChatMessage,
  type OpenTerminalRequest,
  type TerminalInfo,
} from '../../domain/model.ts'
import { UseCaseError } from './errors.ts'
import type { ConversationSource, FileSystem, SessionSource, TerminalGateway } from './ports.ts'

const SESSION_ID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/
const CONVERSATION_LIMIT = 80

export interface OpenTerminalDeps {
  terminals: TerminalGateway
  sessions: SessionSource
  conversations: ConversationSource
  files: FileSystem
  homeDir: string
}

const expandHome = (dir: string, homeDir: string) => dir.replace(/^~(?=\/|$)/, homeDir)

/** Abre um chat do Claude Code em um terminal da Trama: novo, com um papel, ou retomando outro. */
export function makeOpenTerminal(deps: OpenTerminalDeps) {
  return function openTerminal(request: OpenTerminalRequest): TerminalInfo {
    const cwd = typeof request.cwd === 'string' ? expandHome(request.cwd.trim(), deps.homeDir) : ''
    if (!cwd.startsWith('/'))
      throw new UseCaseError('invalid', 'Informe o caminho completo da pasta.')
    if (!deps.files.isDirectory(cwd))
      throw new UseCaseError('invalid', `Essa pasta não existe: ${cwd}`)

    const role = request.role ?? null
    if (role !== null && !isRole(role)) throw new UseCaseError('invalid', 'Papel desconhecido.')

    const resume = request.resumeSessionId ?? null
    if (resume === null) {
      return deps.terminals.open({ cwd, role, args: role ? [`/iniciar ${role}`] : [] })
    }

    if (!SESSION_ID.test(resume))
      throw new UseCaseError('invalid', 'Identificador de conversa inválido.')
    if (deps.sessions.listLive().some((session) => session.sessionId === resume)) {
      throw new UseCaseError(
        'conflict',
        'Esse chat ainda está aberto em outro terminal. Feche-o lá antes de trazê-lo para a Trama.',
      )
    }
    if (!deps.conversations.exists(cwd, resume)) {
      throw new UseCaseError('not-found', 'Não encontrei essa conversa para retomar.')
    }
    return deps.terminals.open({ cwd, role: null, args: ['--resume', resume] })
  }
}

export function makeCloseTerminal(terminals: TerminalGateway) {
  return function closeTerminal(id: string): void {
    if (!terminals.close(id)) throw new UseCaseError('not-found', 'Esse terminal já foi encerrado.')
  }
}

export function makeGetConversation(deps: {
  sessions: SessionSource
  conversations: ConversationSource
}) {
  return function getConversation(pid: number): ChatMessage[] {
    const session = deps.sessions.listLive().find((s) => s.pid === pid)
    if (!session) throw new UseCaseError('not-found', 'Esse chat não está mais aberto.')
    return deps.conversations.read(session.cwd, session.sessionId).slice(-CONVERSATION_LIMIT)
  }
}
