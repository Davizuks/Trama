import { describe, expect, it, vi } from 'vitest'
import { UseCaseError } from './errors.ts'
import type { LiveSession, TerminalGateway } from './ports.ts'
import { makeOpenTerminal, type OpenTerminalDeps } from './terminals.ts'

const SESSION = '1b8af328-8f3b-48b8-b278-711977a9e1bc'

function setup(overrides: { live?: LiveSession[]; conversationExists?: boolean } = {}) {
  const open = vi.fn<TerminalGateway['open']>((options) => ({
    id: 't1',
    pid: 1,
    cwd: options.cwd,
    role: options.role,
  }))
  const deps: OpenTerminalDeps = {
    terminals: { open } as unknown as TerminalGateway,
    sessions: { listLive: () => overrides.live ?? [] },
    conversations: { exists: () => overrides.conversationExists ?? true, read: () => [] },
    files: { isDirectory: (dir) => dir === '/ws' || dir === '/home/me/proj' },
    homeDir: '/home/me',
  }
  return { open, openTerminal: makeOpenTerminal(deps) }
}

const kindOf = (run: () => unknown) => {
  try {
    run()
  } catch (error) {
    if (error instanceof UseCaseError) return error.kind
    throw error
  }
  return 'ok'
}

describe('openTerminal', () => {
  it('abre um chat simples na pasta pedida', () => {
    const { open, openTerminal } = setup()

    openTerminal({ cwd: '/ws' })

    expect(open).toHaveBeenCalledWith({ cwd: '/ws', role: null, args: [] })
  })

  it('já inicia o chat com o papel escolhido', () => {
    const { open, openTerminal } = setup()

    openTerminal({ cwd: '/ws', role: 'maestro' })

    expect(open).toHaveBeenCalledWith({ cwd: '/ws', role: 'maestro', args: ['/iniciar maestro'] })
  })

  it('expande o til para a pasta pessoal', () => {
    const { open, openTerminal } = setup()

    openTerminal({ cwd: ' ~/proj ' })

    expect(open).toHaveBeenCalledWith(expect.objectContaining({ cwd: '/home/me/proj' }))
  })

  it('recusa caminho relativo, pasta inexistente e papel desconhecido', () => {
    const { open, openTerminal } = setup()

    expect(kindOf(() => openTerminal({ cwd: 'proj' }))).toBe('invalid')
    expect(kindOf(() => openTerminal({ cwd: '/nao/existe' }))).toBe('invalid')
    expect(kindOf(() => openTerminal({ cwd: '/ws', role: 'hacker' as never }))).toBe('invalid')
    expect(open).not.toHaveBeenCalled()
  })

  it('retoma uma conversa já encerrada', () => {
    const { open, openTerminal } = setup()

    openTerminal({ cwd: '/ws', resumeSessionId: SESSION })

    expect(open).toHaveBeenCalledWith({ cwd: '/ws', role: null, args: ['--resume', SESSION] })
  })

  it('não retoma um chat que ainda está aberto em outro terminal', () => {
    const live: LiveSession = {
      pid: 5,
      sessionId: SESSION,
      cwd: '/ws',
      name: 'x',
      status: 'idle',
      startedAt: null,
      updatedAt: null,
    }
    const { open, openTerminal } = setup({ live: [live] })

    expect(kindOf(() => openTerminal({ cwd: '/ws', resumeSessionId: SESSION }))).toBe('conflict')
    expect(open).not.toHaveBeenCalled()
  })

  it('recusa identificador malformado, que viraria argumento de linha de comando', () => {
    const { open, openTerminal } = setup()

    expect(kindOf(() => openTerminal({ cwd: '/ws', resumeSessionId: '--dangerous' }))).toBe(
      'invalid',
    )
    expect(open).not.toHaveBeenCalled()
  })

  it('avisa quando a conversa a retomar não existe', () => {
    const { openTerminal } = setup({ conversationExists: false })

    expect(kindOf(() => openTerminal({ cwd: '/ws', resumeSessionId: SESSION }))).toBe('not-found')
  })
})
