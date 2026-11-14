import { forksOf } from './chats.ts'
import type { Chat, McpServer, Role, ServiceId, Settings, Setup, Workspace } from './model.ts'

export type Action =
  | { type: 'chat-opened'; project: string; role: Role }
  | { type: 'chat-replied'; chatId: string; text: string }
  | { type: 'request-answered'; chatId: string; answer: 'allow' | 'deny' | 'resume' | 'close' }
  | { type: 'fork-kept'; chatId: string }
  | { type: 'task-toggled'; taskId: string }
  | { type: 'notices-read' }
  | { type: 'notice-dismissed'; noticeId: string }
  | { type: 'settings-changed'; patch: Partial<Settings> }
  | { type: 'claude-mode-changed'; mode: 'account' | 'api-key' }
  | { type: 'claude-logged-in' }
  | { type: 'service-toggled'; serviceId: ServiceId }
  | { type: 'mcp-toggled'; serverId: string }
  | { type: 'mcp-added'; server: Omit<McpServer, 'id' | 'tools' | 'enabled' | 'needsLogin'> }
  | { type: 'setup-step-done'; step: keyof Setup }
  | { type: 'setup-finished' }
  | { type: 'session-ended' }

const updateChat = (chats: Chat[], chatId: string, change: (chat: Chat) => Chat): Chat[] =>
  chats.map((chat) => (chat.id === chatId ? change(chat) : chat))

function nextChatName(chats: Chat[], role: Role): string {
  const prefix = role === 'livre' ? 'chat' : role
  let number = 1
  while (chats.some((chat) => chat.name === `${prefix}-${number}`)) number++
  return `${prefix}-${number}`
}

const ANSWER_LINE = {
  allow: 'Permitido. Continuando.',
  deny: 'Negado. Vou seguir por outro caminho.',
  resume: 'Conversa retomada do ponto em que parou.',
  close: 'Chat fechado. A conversa fica salva.',
} as const

export function reduce(state: Workspace, action: Action): Workspace {
  switch (action.type) {
    case 'chat-opened': {
      const name = nextChatName(state.chats, action.role)
      const chat: Chat = {
        id: name,
        name,
        role: action.role,
        project: action.project,
        status: 'needs-you',
        lastActivity: 'agora',
        summary: 'Chat aberto. Diga o que fazer.',
        transcript: [{ text: 'Chat aberto. Diga o que fazer.' }],
      }
      return { ...state, chats: [...state.chats, chat] }
    }

    case 'chat-replied':
      return {
        ...state,
        chats: updateChat(state.chats, action.chatId, (chat) => ({
          ...chat,
          status: 'working',
          lastActivity: 'agora',
          summary: action.text,
          transcript: [
            ...chat.transcript,
            { text: '' },
            { text: `› ${action.text}`, strong: true },
          ],
        })),
        notices: state.notices.filter((notice) => notice.chatId !== action.chatId),
      }

    case 'request-answered':
      return {
        ...state,
        chats: updateChat(state.chats, action.chatId, (chat) => ({
          ...chat,
          request: undefined,
          status: action.answer === 'close' ? 'stopped' : 'working',
          lastActivity: 'agora',
          summary: ANSWER_LINE[action.answer],
          transcript: [...chat.transcript, { text: '' }, { text: ANSWER_LINE[action.answer] }],
        })),
      }

    case 'fork-kept': {
      const kept = state.chats.find((chat) => chat.id === action.chatId)
      if (!kept?.forkOf) return state
      const siblings = forksOf(state.chats, kept.forkOf).filter((chat) => chat.id !== kept.id)
      return { ...state, chats: state.chats.filter((chat) => !siblings.includes(chat)) }
    }

    case 'task-toggled':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId ? { ...task, done: !task.done } : task,
        ),
      }

    case 'notices-read':
      return { ...state, notices: state.notices.map((notice) => ({ ...notice, unread: false })) }

    case 'notice-dismissed':
      return {
        ...state,
        notices: state.notices.map((notice) =>
          notice.id === action.noticeId ? { ...notice, unread: false } : notice,
        ),
      }

    case 'settings-changed':
      return { ...state, settings: { ...state.settings, ...action.patch } }

    case 'claude-mode-changed':
      return { ...state, claude: { ...state.claude, mode: action.mode } }

    case 'claude-logged-in':
      return { ...state, claudeLoggedIn: true }

    case 'service-toggled':
      return {
        ...state,
        services: state.services.map((service) =>
          service.id === action.serviceId
            ? {
                ...service,
                connected: !service.connected,
                statusLabel: service.connected ? 'Não conectado' : 'Conectado',
              }
            : service,
        ),
      }

    case 'mcp-toggled':
      return {
        ...state,
        mcpServers: state.mcpServers.map((server) =>
          server.id === action.serverId && !server.needsLogin
            ? { ...server, enabled: !server.enabled }
            : server,
        ),
      }

    case 'mcp-added': {
      const server: McpServer = {
        ...action.server,
        id: action.server.name,
        tools: 0,
        enabled: true,
        needsLogin: false,
      }
      return { ...state, mcpServers: [...state.mcpServers, server] }
    }

    case 'setup-step-done':
      return state.setup ? { ...state, setup: { ...state.setup, [action.step]: 'done' } } : state

    case 'setup-finished':
      return { ...state, setup: null }

    case 'session-ended':
      return { ...state, chats: [], notices: [] }
  }
}

export function unreadCount(state: Workspace): number {
  return state.notices.filter((notice) => notice.unread).length
}

export function setupBlocker(setup: Setup): string | null {
  if (setup.claude !== 'done') return 'Falta o Claude Code.'
  if (setup.workFolder !== 'done') return 'Falta escolher a pasta de trabalho.'
  if (setup.brain !== 'done') return 'Falta escolher o cérebro.'
  return null
}
