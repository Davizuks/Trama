import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { BRAIN_ID, type Graph, type GraphEdge, type GraphNode } from '../../../domain/graph.ts'
import { fitView, step, type Body, type Spring, type View } from './simulation.ts'

export type ChatNode = Extract<GraphNode, { kind: 'terminal' | 'external' }>

interface Props {
  graph: Graph
  visible: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
  renderWindow: (node: ChatNode) => ReactNode
}

interface Shape {
  width: number
  height: number
  mass: number
  solid: boolean
}

const SHAPES: Record<GraphNode['kind'], Shape> = {
  terminal: { width: 640, height: 420, mass: 2, solid: true },
  external: { width: 340, height: 260, mass: 1.5, solid: true },
  brain: { width: 120, height: 80, mass: 1, solid: false },
  project: { width: 130, height: 60, mass: 1, solid: false },
  folder: { width: 130, height: 60, mass: 1, solid: false },
  note: { width: 150, height: 44, mass: 1, solid: false },
}

const RADIUS: Partial<Record<GraphNode['kind'], number>> = {
  brain: 22,
  project: 11,
  folder: 11,
  note: 7,
}

const isChat = (node: GraphNode): node is ChatNode =>
  node.kind === 'terminal' || node.kind === 'external'

const edgeKey = (edge: GraphEdge) => `${edge.from}>${edge.to}`

function restLength(edge: GraphEdge, kinds: Map<string, GraphNode['kind']>): number {
  if (edge.kind === 'chat') return kinds.get(edge.from) === 'terminal' ? 420 : 300
  return edge.from === BRAIN_ID || edge.to === BRAIN_ID ? 170 : 130
}

const cut = (text: string, limit: number) =>
  text.length > limit ? `${text.slice(0, limit - 1)}…` : text

const DRAG_THRESHOLD = 4
const HEAT_DECAY = 0.985
const HEAT_FLOOR = 0.03
/** Enquanto algum nó ainda corre, a simulação não esfria abaixo disto. */
const HEAT_WHILE_MOVING = 0.25
/** Deslocamento por quadro, em pixels, abaixo do qual o grafo é considerado parado. */
const SETTLED_MOVE = 0.15
const MAX_FRAMES = 1500
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

interface Drag {
  id: string | null
  startX: number
  startY: number
  viewX: number
  viewY: number
  moved: boolean
}

/**
 * O grafo da teia. O React decide quais nós existem; as posições são calculadas por uma simulação
 * de forças e aplicadas direto no DOM a cada quadro, sem passar pelo ciclo de renderização.
 */
export function GraphCanvas({ graph, visible, selectedId, onSelect, renderWindow }: Props) {
  const stage = useRef<HTMLDivElement>(null)
  const svgWorld = useRef<SVGGElement>(null)
  const htmlWorld = useRef<HTMLDivElement>(null)
  const elements = useRef(new Map<string, HTMLElement | SVGElement>())
  const lines = useRef(new Map<string, SVGLineElement>())
  const bodies = useRef(new Map<string, Body>())
  const springs = useRef<Spring[]>([])
  const view = useRef<View>({ x: 0, y: 0, k: 1 })
  /** Enquanto o usuário não move nem aproxima a vista, ela se ajusta para caber tudo. */
  const manualView = useRef(false)
  const heat = useRef(0)
  const frame = useRef(0)
  const framesLeft = useRef(0)
  const drag = useRef<Drag | null>(null)

  const structure = useMemo(
    () => `${graph.nodes.map((node) => node.id).join(',')}#${graph.edges.map(edgeKey).join(',')}`,
    [graph],
  )
  // Os quadros da animação leem o grafo mais recente sem recriar as funções de desenho.
  const latestGraph = useRef(graph)
  useLayoutEffect(() => {
    latestGraph.current = graph
  })

  const paint = useCallback(() => {
    const area = stage.current?.getBoundingClientRect()
    if (!area || area.width === 0) return
    const all = [...bodies.current.values()]
    if (!manualView.current)
      view.current = fitView(all, area.width, area.height - 40) ?? view.current
    const { x, y, k } = view.current
    const originX = area.width / 2 + x
    const originY = area.height / 2 + y
    svgWorld.current?.setAttribute('transform', `translate(${originX} ${originY}) scale(${k})`)
    if (htmlWorld.current) {
      htmlWorld.current.style.transform = `translate(${originX}px, ${originY}px) scale(${k})`
    }
    for (const body of all) {
      const element = elements.current.get(body.id)
      if (!element) continue
      if (element instanceof SVGElement) {
        element.setAttribute('transform', `translate(${body.x} ${body.y})`)
      } else {
        const left = body.x - body.width / 2
        const top = body.y - body.height / 2
        element.style.transform = `translate(${left}px, ${top}px)`
      }
    }
    for (const edge of latestGraph.current.edges) {
      const line = lines.current.get(edgeKey(edge))
      const from = bodies.current.get(edge.from)
      const to = bodies.current.get(edge.to)
      if (!line || !from || !to) continue
      line.setAttribute('x1', String(from.x))
      line.setAttribute('y1', String(from.y))
      line.setAttribute('x2', String(to.x))
      line.setAttribute('y2', String(to.y))
    }
  }, [])

  const animate = useCallback(
    (minimumHeat: number) => {
      heat.current = Math.max(heat.current, minimumHeat)
      const advance = () => step([...bodies.current.values()], springs.current, heat.current)
      if (reducedMotion()) {
        for (let i = 0; i < 900; i++) advance()
        heat.current = 0
        paint()
        return
      }
      framesLeft.current = MAX_FRAMES
      if (frame.current) return
      const tick = () => {
        const farthest = advance()
        paint()
        heat.current *= HEAT_DECAY
        const moving = farthest > SETTLED_MOVE && framesLeft.current-- > 0
        if (moving) heat.current = Math.max(heat.current, HEAT_WHILE_MOVING)
        frame.current = heat.current > HEAT_FLOOR || drag.current ? requestAnimationFrame(tick) : 0
      }
      frame.current = requestAnimationFrame(tick)
    },
    [paint],
  )

  // Quando a estrutura muda, acrescenta corpos para os nós novos e descarta os que sumiram.
  useLayoutEffect(() => {
    const current = latestGraph.current
    const first = bodies.current.size === 0
    const kinds = new Map(current.nodes.map((node) => [node.id, node.kind]))
    for (const node of current.nodes) {
      const shape = SHAPES[node.kind]
      const existing = bodies.current.get(node.id)
      if (existing) {
        Object.assign(existing, shape)
        continue
      }
      const hub = isChat(node) ? bodies.current.get(node.hubId) : undefined
      const angle = Math.random() * Math.PI * 2
      const distance = hub ? 200 : 160 + Math.random() * 120
      bodies.current.set(node.id, {
        id: node.id,
        x: node.id === BRAIN_ID ? 0 : (hub?.x ?? 0) + Math.cos(angle) * distance,
        y: node.id === BRAIN_ID ? 0 : (hub?.y ?? 0) + Math.sin(angle) * distance,
        vx: 0,
        vy: 0,
        pinned: false,
        ...shape,
      })
    }
    for (const id of [...bodies.current.keys()]) if (!kinds.has(id)) bodies.current.delete(id)
    springs.current = current.edges.map((edge) => ({
      a: edge.from,
      b: edge.to,
      rest: restLength(edge, kinds),
    }))
    paint()
    animate(first ? 1 : 0.4)
  }, [structure, paint, animate])

  useEffect(() => {
    if (visible) paint()
  }, [visible, paint])

  useEffect(() => {
    const element = stage.current
    if (!element) return
    const observer = new ResizeObserver(paint)
    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [paint])

  const toWorld = (clientX: number, clientY: number) => {
    const area = stage.current!.getBoundingClientRect()
    return {
      x: (clientX - area.left - area.width / 2 - view.current.x) / view.current.k,
      y: (clientY - area.top - area.height / 2 - view.current.y) / view.current.k,
    }
  }

  // A roda aproxima a vista no ponto do cursor. Precisa ser um ouvinte não passivo para impedir
  // a rolagem da página, o que o `onWheel` do React não permite.
  useEffect(() => {
    const element = stage.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      if ((event.target as Element).closest('[data-no-drag]')) return
      event.preventDefault()
      manualView.current = true
      const before = toWorld(event.clientX, event.clientY)
      const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1
      view.current.k = Math.min(2, Math.max(0.2, view.current.k * factor))
      const after = toWorld(event.clientX, event.clientY)
      view.current.x += (after.x - before.x) * view.current.k
      view.current.y += (after.y - before.y) * view.current.k
      paint()
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [paint])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as Element
    // Dentro de um terminal ou de uma conversa o mouse seleciona texto; só a moldura arrasta.
    if (target.closest('[data-no-drag], button, a, input, select')) return
    drag.current = {
      id: target.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null,
      startX: event.clientX,
      startY: event.clientY,
      viewX: view.current.x,
      viewY: view.current.y,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (!current) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) current.moved = true
    if (!current.moved) return
    const body = current.id ? bodies.current.get(current.id) : undefined
    if (body) {
      Object.assign(body, toWorld(event.clientX, event.clientY), { pinned: true })
      animate(0.5)
    } else {
      manualView.current = true
      view.current.x = current.viewX + dx
      view.current.y = current.viewY + dy
      paint()
    }
  }

  const onPointerUp = () => {
    const current = drag.current
    if (!current) return
    drag.current = null
    const body = current.id ? bodies.current.get(current.id) : undefined
    if (body) body.pinned = false
    if (current.moved) animate(0.3)
    else onSelect(current.id === selectedId ? null : current.id)
  }

  const register = (id: string) => (element: HTMLElement | SVGElement | null) => {
    if (element) elements.current.set(id, element)
    else elements.current.delete(id)
  }

  const registerLine = (key: string) => (element: SVGLineElement | null) => {
    if (element) lines.current.set(key, element)
    else lines.current.delete(key)
  }

  return (
    <div
      className="stage"
      ref={stage}
      hidden={!visible}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg className="threads" role="img" aria-label="Fios que ligam os chats às notas do cérebro">
        <g ref={svgWorld}>
          {graph.edges.map((edge) => {
            const touchesSelection = edge.from === selectedId || edge.to === selectedId
            return (
              <line
                key={edgeKey(edge)}
                ref={registerLine(edgeKey(edge))}
                className={`thread ${edge.kind}${touchesSelection ? ' highlighted' : ''}`}
              />
            )
          })}
          {graph.nodes
            .filter((node) => !isChat(node))
            .map((node) => {
              const radius = RADIUS[node.kind] ?? 7
              const group = 'note' in node ? ` group-${node.note.group.split('/')[0]}` : ''
              const outside = node.kind === 'folder' && !node.insideWorkspace ? ' outside' : ''
              const selected = node.id === selectedId ? ' selected' : ''
              return (
                <g
                  key={node.id}
                  ref={register(node.id)}
                  data-node-id={node.id}
                  className={`point ${node.kind}${group}${outside}${selected}`}
                >
                  <circle r={radius} />
                  <text y={radius + 14}>{cut(node.label, 30)}</text>
                  <title>{node.label}</title>
                </g>
              )
            })}
        </g>
      </svg>

      <div className="windows" ref={htmlWorld}>
        {graph.nodes.filter(isChat).map((node) => (
          <div
            key={node.id}
            ref={register(node.id)}
            data-node-id={node.id}
            className={`window-anchor${node.id === selectedId ? ' selected' : ''}`}
            style={{ width: SHAPES[node.kind].width, height: SHAPES[node.kind].height }}
          >
            {renderWindow(node)}
          </div>
        ))}
      </div>

      <button
        type="button"
        className="fit-button"
        onClick={() => {
          manualView.current = false
          paint()
        }}
      >
        Enquadrar tudo
      </button>
    </div>
  )
}
