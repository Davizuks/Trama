import { useMemo, useRef, type CSSProperties } from 'react'
import {
  boardSize,
  CHAT_WINDOW,
  COMPACT_SHAPE,
  forkStepOn,
  WINDOW_SHAPE,
  drawGraph,
  type GraphPoint,
  type GraphShape,
} from '../../domain/graph.ts'
import type { Chat } from '../../domain/model.ts'
import { ChatWindow } from '../chat/ChatWindow.tsx'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { StatusDot } from '../ui/Status.tsx'
import { useCanvasView } from './useCanvasView.ts'
import { useDragPoints } from './useDragPoints.ts'

interface GraphProps {
  chats: Chat[]
  selectedChatId?: string
  onSelectChat: (chatId: string) => void
  chatsAsWindows?: boolean
  shape?: GraphShape
}

const WINDOW_SIZE_VARS = {
  '--janela-largura': `${CHAT_WINDOW.width}px`,
  '--janela-altura': `${CHAT_WINDOW.height}px`,
} as CSSProperties

const percent = (value: number) => `${value * 100}%`

export function Graph({
  chats,
  selectedChatId,
  onSelectChat,
  chatsAsWindows = false,
  shape: givenShape,
}: GraphProps) {
  const { workspace } = useWorkspace()
  const canvas = useRef<HTMLDivElement>(null)
  const area = useRef<HTMLDivElement>(null)
  const { view, spaceHeld, startPan, fitAll } = useCanvasView(
    canvas,
    chatsAsWindows ? chats.length : undefined,
  )
  const { moved, startDrag } = useDragPoints(area)
  const chatsOnArc = chats.filter((chat) => !chat.forkOf).length
  const board = useMemo(() => boardSize(chatsOnArc), [chatsOnArc])
  const shape = useMemo(
    () =>
      givenShape ??
      (chatsAsWindows ? { ...WINDOW_SHAPE, forkStep: forkStepOn(board) } : COMPACT_SHAPE),
    [givenShape, chatsAsWindows, board],
  )
  const drawing = useMemo(
    () => drawGraph(workspace.brain, chats, shape),
    [workspace.brain, chats, shape],
  )
  const points = drawing.points.map((point) => ({ ...point, ...moved[point.id] }))
  const pointById = new Map(points.map((point) => [point.id, point]))
  const chatById = new Map(chats.map((chat) => [chat.id, chat]))

  const renderPoint = (point: GraphPoint) => {
    const position = { left: percent(point.x), top: percent(point.y) }
    const chat = chatById.get(point.id)
    const selected = chat?.id === selectedChatId

    if (chat && chatsAsWindows) {
      return (
        <div
          key={point.id}
          className={`no-janela ${selected ? 'no-janela--selecionada' : ''}`}
          style={position}
        >
          <ChatWindow
            chat={chat}
            selected={selected}
            onFocus={() => onSelectChat(chat.id)}
            onDragStart={(event) => startDrag(chat.id, point, event)}
          />
        </div>
      )
    }
    if (chat) {
      return (
        <button
          key={point.id}
          type="button"
          className={`no-chat t-ui-13-forte ${selected ? 'no-chat--selecionado' : ''}`}
          style={position}
          onClick={() => onSelectChat(chat.id)}
        >
          <StatusDot status={chat.status} />
          {chat.name}
        </button>
      )
    }
    return (
      <div key={point.id} className={`no no--${point.kind}`} style={position}>
        <span className="no__ponto" />
        <span className={point.kind === 'brain' ? 't-ui-12-forte' : 't-ui-12'}>{point.label}</span>
      </div>
    )
  }

  return (
    <div
      ref={canvas}
      className={`grafo ${chatsAsWindows ? 'grafo--janelas' : ''} ${spaceHeld ? 'grafo--movendo' : ''}`}
      onPointerDownCapture={startPan}
    >
      <div
        ref={area}
        className="grafo__area"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          ...(chatsAsWindows ? { ...board, ...WINDOW_SIZE_VARS } : {}),
        }}
      >
        <svg
          className="grafo__fios"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {drawing.wires.map(([from, to]) => {
            const a = pointById.get(from)
            const b = pointById.get(to)
            if (!a || !b) return null
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x * 100}
                y1={a.y * 100}
                x2={b.x * 100}
                y2={b.y * 100}
              />
            )
          })}
        </svg>
        {points.map(renderPoint)}
      </div>
      <button type="button" className="grafo__centralizar t-ui-12 c-2" onClick={fitAll}>
        Centralizar
      </button>
    </div>
  )
}
