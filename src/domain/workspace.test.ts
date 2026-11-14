import { describe, expect, it } from 'vitest'
import { createDemoGateway, sceneFromUrl } from '../infrastructure/demo/demo-gateway.ts'
import { reduce, setupBlocker, unreadCount } from './workspace.ts'

const load = (scene = 'padrao') => createDemoGateway(scene).loadWorkspace()

describe('reduce', () => {
  it('abre um chat com o próximo nome livre do papel', async () => {
    const before = await load()
    const after = reduce(before, { type: 'chat-opened', project: 'Trama', role: 'construtor' })
    expect(after.chats.at(-1)).toMatchObject({ name: 'construtor-1', status: 'needs-you' })
    expect(before.chats).toHaveLength(3)
  })

  it('registra a resposta, põe o chat para trabalhar e tira o aviso dele', async () => {
    const after = reduce(await load(), { type: 'chat-replied', chatId: 'maestro-1', text: 'pode' })
    const chat = after.chats.find((each) => each.id === 'maestro-1')
    expect(chat?.status).toBe('working')
    expect(chat?.transcript.at(-1)).toEqual({ text: '› pode', strong: true })
    expect(after.notices.some((notice) => notice.chatId === 'maestro-1')).toBe(false)
  })

  it('responder a um pedido o remove; fechar um chat caído o deixa parado', async () => {
    const allowed = reduce(await load('permissao'), {
      type: 'request-answered',
      chatId: 'construtor-2',
      answer: 'allow',
    })
    expect(allowed.chats.find((each) => each.id === 'construtor-2')).toMatchObject({
      request: undefined,
      status: 'working',
    })

    const closed = reduce(await load('chat-parou'), {
      type: 'request-answered',
      chatId: 'construtor-2',
      answer: 'close',
    })
    expect(closed.chats.find((each) => each.id === 'construtor-2')?.status).toBe('stopped')
  })

  it('ficar com um fork arquiva só os irmãos dele', async () => {
    const after = reduce(await load('forks'), { type: 'fork-kept', chatId: 'tarefa-unica' })
    const ids = after.chats.map((chat) => chat.id)
    expect(ids).toContain('tarefa-unica')
    expect(ids).toContain('maestro-1')
    expect(ids).not.toContain('duas-tarefas')
  })

  it('marca todos os avisos como lidos', async () => {
    const before = await load()
    expect(unreadCount(before)).toBe(2)
    expect(unreadCount(reduce(before, { type: 'notices-read' }))).toBe(0)
  })

  it('não liga um servidor MCP que ainda precisa de login', async () => {
    const before = await load()
    const after = reduce(before, { type: 'mcp-toggled', serverId: 'github' })
    expect(after.mcpServers.find((server) => server.id === 'github')?.enabled).toBe(false)
    const off = reduce(before, { type: 'mcp-toggled', serverId: 'figma' })
    expect(off.mcpServers.find((server) => server.id === 'figma')?.enabled).toBe(false)
  })

  it('sair encerra os chats e limpa os avisos', async () => {
    const after = reduce(await load(), { type: 'session-ended' })
    expect(after.chats).toEqual([])
    expect(after.notices).toEqual([])
  })
})

describe('setupBlocker', () => {
  it('diz o que falta e libera quando o essencial está pronto', async () => {
    const { setup } = await load('primeiro-uso')
    expect(setupBlocker(setup!)).toBe('Falta escolher o cérebro.')
    const ready = reduce(await load('primeiro-uso'), { type: 'setup-step-done', step: 'brain' })
    expect(setupBlocker(ready.setup!)).toBeNull()
  })

  it('sem o Claude Code, é ele que falta', async () => {
    const { setup } = await load('sem-claude')
    expect(setupBlocker(setup!)).toBe('Falta o Claude Code.')
  })
})

describe('gateway de demonstração', () => {
  it('falha na cena sem servidor e usa a padrão para cenas desconhecidas', async () => {
    await expect(load('sem-servidor')).rejects.toThrow()
    expect((await load('nao-existe')).chats).toHaveLength(3)
  })
})

describe('cena de abertura', () => {
  it('sem cena no endereço, abre a que tem um chat com forks', async () => {
    const { chats } = await load(sceneFromUrl(''))
    expect(chats.filter((chat) => chat.forkOf === 'maestro-1')).toHaveLength(2)
    expect(sceneFromUrl('?cena=padrao')).toBe('padrao')
  })
})
