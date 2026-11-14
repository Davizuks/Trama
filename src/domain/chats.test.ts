import { describe, expect, it } from 'vitest'
import {
  canReply,
  chatContext,
  describeServer,
  focusedChat,
  forksOf,
  groupChats,
  replyPlaceholder,
} from './chats.ts'
import type { Chat, McpServer } from './model.ts'

const chat = (patch: Partial<Chat> & { id: string }): Chat => ({
  name: patch.id,
  role: 'construtor',
  project: 'Portfólio',
  status: 'working',
  lastActivity: 'agora',
  summary: '',
  transcript: [],
  ...patch,
})

describe('groupChats', () => {
  it('põe primeiro quem precisa de você e omite grupos vazios', () => {
    const groups = groupChats([chat({ id: 'a' }), chat({ id: 'b', status: 'needs-you' })])
    expect(groups.map((group) => group.label)).toEqual(['Precisa de você', 'Trabalhando'])
    expect(groups[0].chats.map((each) => each.id)).toEqual(['b'])
  })

  it('lista só os chats de origem, no grupo do fork mais urgente', () => {
    const chats = [
      chat({ id: 'pai', status: 'stopped' }),
      chat({ id: 'fork', forkOf: 'pai', status: 'needs-you' }),
    ]
    const groups = groupChats(chats)
    expect(groups).toHaveLength(1)
    expect(groups[0].status).toBe('needs-you')
    expect(groups[0].chats.map((each) => each.id)).toEqual(['pai'])
    expect(forksOf(chats, 'pai').map((each) => each.id)).toEqual(['fork'])
  })
})

describe('focusedChat', () => {
  const chats = [chat({ id: 'a' }), chat({ id: 'b', status: 'needs-you' })]

  it('usa o chat selecionado quando ele existe', () => {
    expect(focusedChat(chats, 'a')?.id).toBe('a')
  })

  it('cai no mais urgente quando a seleção não existe mais', () => {
    expect(focusedChat(chats, 'sumiu')?.id).toBe('b')
    expect(focusedChat([], null)).toBeUndefined()
  })
})

describe('textos de um chat', () => {
  const parent = chat({
    id: 'maestro-1',
    role: 'maestro',
    project: 'VarellaLabs',
    status: 'stopped',
  })
  const fork = chat({ id: 'fork', forkOf: 'maestro-1', status: 'needs-you' })
  const chats = [parent, fork]

  it('descreve o contexto pelo papel e projeto, ou pelo chat de origem', () => {
    expect(chatContext(parent, chats)).toBe('Maestro · VarellaLabs')
    expect(chatContext(fork, chats)).toBe('Fork de maestro-1')
  })

  it('não deixa responder a um chat bifurcado nem a um que está trabalhando', () => {
    expect(canReply(parent, chats)).toBe(false)
    expect(replyPlaceholder(parent, chats)).toBe('Bifurcado. Responda em um dos forks')
    expect(canReply(chat({ id: 'x' }), [])).toBe(false)
    expect(canReply(fork, chats)).toBe(true)
    expect(replyPlaceholder(fork, chats)).toBe('Responder ao fork')
  })
})

describe('describeServer', () => {
  const server: McpServer = {
    id: 'figma',
    name: 'Figma',
    kind: 'http',
    tools: 28,
    scope: 'all',
    enabled: true,
    needsLogin: false,
  }

  it('resume tipo, ferramentas e alcance', () => {
    expect(describeServer(server)).toBe('HTTP · 28 ferramentas · todos os chats')
    expect(
      describeServer({
        ...server,
        kind: 'command',
        command: 'npx @mcp/postgres',
        scope: 'Portfólio',
      }),
    ).toBe('Comando local · npx @mcp/postgres · só no projeto Portfólio')
  })

  it('avisa quando está desligado ou precisa de login', () => {
    expect(describeServer({ ...server, enabled: false })).toBe('HTTP · desligado')
    expect(describeServer({ ...server, needsLogin: true })).toBe(
      'HTTP · precisa entrar para funcionar',
    )
  })
})
