import type { Brain, BrainNodeKind, Chat } from './model.ts'

export interface GraphPoint {
  id: string
  label: string
  kind: BrainNodeKind | 'chat'
  x: number
  y: number
}

export interface Position {
  x: number
  y: number
}

export function movePoint(
  from: Position,
  delta: Position,
  area: { width: number; height: number },
): Position {
  return { x: from.x + delta.x / area.width, y: from.y + delta.y / area.height }
}

export interface View {
  x: number
  y: number
  scale: number
}

export const HOME_VIEW: View = { x: 0, y: 0, scale: 1 }

const MIN_SCALE = 0.2
const MAX_SCALE = 2

export function panView(view: View, delta: Position): View {
  return { ...view, x: view.x + delta.x, y: view.y + delta.y }
}

export function zoomView(view: View, factor: number, cursor: Position): View {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * factor))
  const ratio = scale / view.scale
  return {
    scale,
    x: cursor.x - (cursor.x - view.x) * ratio,
    y: cursor.y - (cursor.y - view.y) * ratio,
  }
}

export interface GraphDrawing {
  points: GraphPoint[]
  wires: Array<[from: string, to: string]>
}

interface Arc {
  start: number
  end: number
  rx: number
  ry: number
}

export interface GraphShape {
  center: { x: number; y: number }
  projects: Arc
  notes: [Arc, Arc]
  chats: Arc
  forkStep?: Position
}

export const COMPACT_SHAPE: GraphShape = {
  center: { x: 0.5, y: 0.5 },
  projects: { start: 0.6, end: 0.9, rx: 0.26, ry: 0.26 },
  notes: [
    { start: 0.1, end: 0.42, rx: 0.4, ry: 0.4 },
    { start: 0.1, end: 0.42, rx: 0.27, ry: 0.27 },
  ],
  chats: { start: 0.46, end: 1.04, rx: 0.42, ry: 0.42 },
}

export const TALL_SHAPE: GraphShape = {
  center: { x: 0.5, y: 0.52 },
  projects: { start: 0.62, end: 0.88, rx: 0.3, ry: 0.12 },
  notes: [
    { start: 0.1, end: 0.4, rx: 0.4, ry: 0.3 },
    { start: 0.1, end: 0.4, rx: 0.24, ry: 0.18 },
  ],
  chats: { start: 0.58, end: 0.92, rx: 0.36, ry: 0.42 },
}

export const WINDOW_SHAPE: GraphShape = {
  center: { x: 0.5, y: 0.68 },
  projects: { start: 0.62, end: 0.88, rx: 0.2, ry: 0.2 },
  notes: [
    { start: 0.12, end: 0.38, rx: 0.28, ry: 0.3 },
    { start: 0.12, end: 0.38, rx: 0.18, ry: 0.18 },
  ],
  chats: { start: 0.5, end: 1, rx: 0.5, ry: 0.61 },
}

function spread(count: number, arc: Arc): number[] {
  if (count === 1) return [(arc.start + arc.end) / 2]
  return Array.from(
    { length: count },
    (_, i) => arc.start + ((arc.end - arc.start) * i) / (count - 1),
  )
}

function onArc(turn: number, arc: Arc, center: GraphShape['center']): { x: number; y: number } {
  const angle = turn * 2 * Math.PI
  return { x: center.x + arc.rx * Math.cos(angle), y: center.y + arc.ry * Math.sin(angle) }
}

function placeForks(
  parent: GraphPoint,
  forks: Chat[],
  step: Position,
  center: Position,
): GraphPoint[] {
  const awayFromCenter = parent.x < center.x ? -1 : 1
  return forks.map((fork, i) => ({
    id: fork.id,
    label: fork.name,
    kind: 'chat',
    x: parent.x + awayFromCenter * step.x,
    y: parent.y + (i - (forks.length - 1) / 2) * step.y,
  }))
}

export function anchorFor(brain: Brain, chat: Chat): string | undefined {
  if (chat.forkOf) return chat.forkOf
  const project = brain.nodes.find((node) => node.kind === 'project' && node.label === chat.project)
  return (project ?? brain.nodes.find((node) => node.kind === 'brain'))?.id
}

export function drawGraph(
  brain: Brain,
  chats: Chat[],
  shape: GraphShape = COMPACT_SHAPE,
): GraphDrawing {
  const byKind = (kind: BrainNodeKind) => brain.nodes.filter((node) => node.kind === kind)
  const place = (
    items: Array<{ id: string; label: string }>,
    kind: GraphPoint['kind'],
    arcs: Arc[],
  ): GraphPoint[] => {
    const turns = spread(items.length, arcs[0])
    return items.map((item, i) => ({
      id: item.id,
      label: item.label,
      kind,
      ...onArc(turns[i], arcs[i % arcs.length], shape.center),
    }))
  }

  const besideParent = shape.forkStep !== undefined
  const onArcChats = besideParent ? chats.filter((chat) => !chat.forkOf) : chats
  const arcPoints = place(
    onArcChats.map((chat) => ({ id: chat.id, label: chat.name })),
    'chat',
    [shape.chats],
  )
  const forkPoints = besideParent
    ? arcPoints.flatMap((parent) =>
        placeForks(
          parent,
          chats.filter((chat) => chat.forkOf === parent.id),
          shape.forkStep!,
          shape.center,
        ),
      )
    : []

  const points: GraphPoint[] = [
    ...byKind('brain').map((node) => ({ ...node, ...shape.center })),
    ...place(byKind('project'), 'project', [shape.projects]),
    ...place(byKind('note'), 'note', shape.notes),
    ...arcPoints,
    ...forkPoints,
  ]

  const chatWires = chats.flatMap((chat): Array<[string, string]> => {
    const anchor = anchorFor(brain, chat)
    return anchor ? [[chat.id, anchor]] : []
  })
  return { points, wires: [...brain.links, ...chatWires] }
}

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export function fitView(
  content: Box,
  canvas: { width: number; height: number },
  origin: Position,
  padding = 24,
): View {
  const scale = Math.max(
    MIN_SCALE,
    Math.min(
      1,
      (canvas.width - 2 * padding) / content.width,
      (canvas.height - 2 * padding) / content.height,
    ),
  )
  const left = (canvas.width - content.width * scale) / 2
  const top = (canvas.height - content.height * scale) / 2
  return {
    scale,
    // A escala é aplicada em torno de `origin`, por isso ele entra na conta.
    x: left - content.x * scale - origin.x * (1 - scale),
    y: top - content.y * scale - origin.y * (1 - scale),
  }
}

export const CHAT_WINDOW = { width: 520, height: 380 }
const WINDOW_GAP = 60
const MIN_BOARD_WIDTH = 1300
const BOARD_WIDTH_PER_CHAT = 330
const BOARD_ASPECT = 0.68

export function boardSize(chatsOnArc: number): { width: number; height: number } {
  const width = Math.max(MIN_BOARD_WIDTH, BOARD_WIDTH_PER_CHAT * chatsOnArc)
  return { width, height: Math.round(width * BOARD_ASPECT) }
}

export function forkStepOn(board: { width: number; height: number }): Position {
  return {
    x: (CHAT_WINDOW.width + WINDOW_GAP) / board.width,
    y: (CHAT_WINDOW.height + WINDOW_GAP) / board.height,
  }
}
