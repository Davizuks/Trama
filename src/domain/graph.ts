import type { BrainNote, ClaudeSession, TerminalInfo, WebState } from './model.ts'

export const BRAIN_ID = 'brain'
const INDEX_NOTE = 'index'

export type GraphNode =
  | { id: typeof BRAIN_ID; kind: 'brain'; label: string }
  | { id: string; kind: 'note' | 'project'; label: string; note: BrainNote }
  | { id: string; kind: 'folder'; label: string; cwd: string; insideWorkspace: boolean }
  | {
      id: string
      kind: 'terminal'
      label: string
      terminal: TerminalInfo
      session: ClaudeSession | null
      hubId: string
    }
  | { id: string; kind: 'external'; label: string; session: ClaudeSession; hubId: string }

export interface GraphEdge {
  from: string
  to: string
  kind: 'link' | 'chat'
}

export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export const baseName = (dir: string): string => dir.split('/').filter(Boolean).pop() ?? dir

const noteNodeId = (noteId: string) => (noteId === INDEX_NOTE ? BRAIN_ID : `note:${noteId}`)

/**
 * Monta a teia: o cérebro no centro, as notas ligadas pelos seus wikilinks e cada chat preso
 * ao projeto (ou à pasta) em que está trabalhando.
 */
export function buildGraph(state: WebState): Graph {
  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const seen = new Set<string>()

  const connect = (from: string, to: string, kind: GraphEdge['kind']) => {
    if (from === to || !nodes.has(from) || !nodes.has(to)) return
    const key = from < to ? `${from}|${to}` : `${to}|${from}`
    if (seen.has(key)) return
    seen.add(key)
    edges.push({ from, to, kind })
  }

  nodes.set(BRAIN_ID, { id: BRAIN_ID, kind: 'brain', label: 'Cérebro' })

  const projectByDir = new Map<string, string>()
  for (const note of state.notes) {
    if (note.id === INDEX_NOTE) continue
    const id = noteNodeId(note.id)
    nodes.set(id, { id, kind: note.projectDir ? 'project' : 'note', label: note.title, note })
    if (note.projectDir) projectByDir.set(note.projectDir, id)
  }
  for (const note of state.notes) {
    for (const link of note.links) connect(noteNodeId(note.id), noteNodeId(link), 'link')
  }
  // Nota que ninguém cita fica presa ao cérebro, para não flutuar solta.
  const linked = new Set(edges.flatMap((edge) => [edge.from, edge.to]))
  for (const node of [...nodes.values()]) {
    if (node.kind !== 'brain' && !linked.has(node.id)) connect(BRAIN_ID, node.id, 'link')
  }

  const hubFor = (cwd: string): string => {
    if (cwd === state.workspaceDir) return BRAIN_ID
    const project = projectByDir.get(cwd)
    if (project) return project
    const id = `folder:${cwd}`
    if (!nodes.has(id)) {
      const insideWorkspace = cwd.startsWith(`${state.workspaceDir}/`)
      nodes.set(id, { id, kind: 'folder', label: baseName(cwd), cwd, insideWorkspace })
      if (insideWorkspace) connect(id, BRAIN_ID, 'link')
    }
    return id
  }

  for (const terminal of state.terminals) {
    const session = state.sessions.find((s) => s.terminalId === terminal.id) ?? null
    const hubId = hubFor(terminal.cwd)
    const id = `terminal:${terminal.id}`
    const label = session?.name ?? terminal.role ?? baseName(terminal.cwd)
    nodes.set(id, { id, kind: 'terminal', label, terminal, session, hubId })
    connect(id, hubId, 'chat')
  }
  for (const session of state.sessions) {
    if (session.terminalId) continue
    const hubId = hubFor(session.cwd)
    const id = `external:${session.pid}`
    nodes.set(id, { id, kind: 'external', label: session.name, session, hubId })
    connect(id, hubId, 'chat')
  }

  return { nodes: [...nodes.values()], edges }
}
