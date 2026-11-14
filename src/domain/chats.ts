import { ROLES, type Chat, type ChatStatus, type McpServer } from './model.ts'

export const STATUS_LABEL: Record<ChatStatus, string> = {
  'needs-you': 'Precisa de você',
  working: 'Trabalhando',
  stopped: 'Parado',
}

const STATUS_ORDER: ChatStatus[] = ['needs-you', 'working', 'stopped']

export interface ChatGroup {
  status: ChatStatus
  label: string
  chats: Chat[]
}

export function rootChats(chats: Chat[]): Chat[] {
  return chats.filter((chat) => !chat.forkOf)
}

export function forksOf(chats: Chat[], chatId: string): Chat[] {
  return chats.filter((chat) => chat.forkOf === chatId)
}

export function groupChats(chats: Chat[]): ChatGroup[] {
  const urgency = (chat: Chat): ChatStatus => {
    const statuses = [chat, ...forksOf(chats, chat.id)].map((each) => each.status)
    return STATUS_ORDER.find((status) => statuses.includes(status)) ?? chat.status
  }
  const roots = rootChats(chats)
  return STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    chats: roots.filter((chat) => urgency(chat) === status),
  })).filter((group) => group.chats.length > 0)
}

export function focusedChat(chats: Chat[], selectedId: string | null): Chat | undefined {
  return chats.find((chat) => chat.id === selectedId) ?? groupChats(chats)[0]?.chats[0]
}

export function chatContext(chat: Chat, chats: Chat[]): string {
  const parent = chats.find((each) => each.id === chat.forkOf)
  if (parent) return `Fork de ${parent.name}`
  const role = ROLES.find((each) => each.id === chat.role)?.label ?? chat.role
  return `${role} · ${chat.project}`
}

export function replyPlaceholder(chat: Chat, chats: Chat[]): string {
  if (forksOf(chats, chat.id).length > 0) return 'Bifurcado. Responda em um dos forks'
  if (chat.status === 'working') return 'Trabalhando. Esc para interromper'
  return chat.forkOf ? 'Responder ao fork' : `Responder ao ${chat.name}`
}

export function canReply(chat: Chat, chats: Chat[]): boolean {
  return chat.status !== 'working' && forksOf(chats, chat.id).length === 0
}

export function describeServer(server: McpServer): string {
  const kind = server.kind === 'http' ? 'HTTP' : 'Comando local'
  if (server.needsLogin) return `${kind} · precisa entrar para funcionar`
  if (!server.enabled) return `${kind} · desligado`
  const middle = server.kind === 'http' ? `${server.tools} ferramentas` : (server.command ?? '')
  const scope = server.scope === 'all' ? 'todos os chats' : `só no projeto ${server.scope}`
  return [kind, middle, scope].filter(Boolean).join(' · ')
}
