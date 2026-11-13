import { describe, expect, it } from 'vitest'
import { BRAIN_ID, buildGraph } from './graph.ts'
import type { BrainNote, ClaudeSession, WebState } from './model.ts'

const note = (id: string, extra: Partial<BrainNote> = {}): BrainNote => ({
  id,
  title: id,
  group: '',
  path: `/ws/cerebro/${id}.md`,
  projectDir: null,
  links: [],
  ...extra,
})

const session = (pid: number, cwd: string, extra: Partial<ClaudeSession> = {}): ClaudeSession => ({
  pid,
  id: `id-${pid}`,
  name: `chat-${pid}`,
  cwd,
  status: 'idle',
  startedAt: null,
  updatedAt: null,
  terminalId: null,
  role: null,
  task: null,
  recent: [],
  currentTool: null,
  ...extra,
})

const state = (extra: Partial<WebState>): WebState => ({
  now: 0,
  workspaceDir: '/ws',
  homeDir: '/home/me',
  sessions: [],
  terminals: [],
  notes: [],
  queue: [],
  messages: [],
  folders: [],
  ...extra,
})

const edgeKeys = (graph: ReturnType<typeof buildGraph>) =>
  graph.edges.map((edge) => `${edge.from}>${edge.to}`)

describe('buildGraph', () => {
  it('trata a nota INDEX como o próprio cérebro', () => {
    const graph = buildGraph(
      state({ notes: [note('index', { links: ['quadro'] }), note('quadro')] }),
    )

    expect(graph.nodes.map((n) => n.id)).toEqual([BRAIN_ID, 'note:quadro'])
    expect(edgeKeys(graph)).toEqual([`${BRAIN_ID}>note:quadro`])
  })

  it('prende ao cérebro a nota que ninguém cita', () => {
    const graph = buildGraph(state({ notes: [note('solta')] }))

    expect(edgeKeys(graph)).toEqual([`${BRAIN_ID}>note:solta`])
  })

  it('não repete a ligação quando duas notas se citam', () => {
    const graph = buildGraph(
      state({ notes: [note('a', { links: ['b'] }), note('b', { links: ['a'] })] }),
    )

    expect(edgeKeys(graph)).toEqual(['note:a>note:b'])
  })

  it('liga o chat à nota do projeto em que ele trabalha', () => {
    const graph = buildGraph(
      state({
        notes: [note('index', { links: ['site'] }), note('site', { projectDir: '/ws/site' })],
        sessions: [session(7, '/ws/site')],
      }),
    )

    expect(graph.nodes.find((n) => n.id === 'note:site')?.kind).toBe('project')
    expect(edgeKeys(graph)).toContain('external:7>note:site')
  })

  it('liga direto ao cérebro o chat aberto na raiz da teia', () => {
    const graph = buildGraph(state({ sessions: [session(1, '/ws')] }))

    expect(edgeKeys(graph)).toEqual([`external:1>${BRAIN_ID}`])
  })

  it('deixa fora da teia a pasta que não pertence ao workspace', () => {
    const graph = buildGraph(state({ sessions: [session(2, '/outro/lugar')] }))

    const folder = graph.nodes.find((n) => n.kind === 'folder')
    expect(folder).toMatchObject({ label: 'lugar', insideWorkspace: false })
    expect(edgeKeys(graph)).toEqual(['external:2>folder:/outro/lugar'])
  })

  it('mostra como terminal o chat que roda dentro da Trama', () => {
    const graph = buildGraph(
      state({
        terminals: [{ id: 't1', cwd: '/ws', pid: 9, role: 'maestro' }],
        sessions: [session(9, '/ws', { terminalId: 't1', name: 'maestro-1' })],
      }),
    )

    expect(graph.nodes.filter((n) => n.kind === 'external')).toHaveLength(0)
    expect(graph.nodes.find((n) => n.kind === 'terminal')).toMatchObject({
      id: 'terminal:t1',
      label: 'maestro-1',
    })
  })

  it('nomeia pelo papel o terminal cujo chat ainda está iniciando', () => {
    const graph = buildGraph(
      state({ terminals: [{ id: 't1', cwd: '/ws/site', pid: 9, role: 'revisor' }] }),
    )

    expect(graph.nodes.find((n) => n.kind === 'terminal')?.label).toBe('revisor')
  })
})
