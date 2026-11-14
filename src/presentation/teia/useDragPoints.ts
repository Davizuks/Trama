import { useCallback, useState, type PointerEvent, type RefObject } from 'react'
import { movePoint, type Position } from '../../domain/graph.ts'

export function useDragPoints(area: RefObject<HTMLElement | null>) {
  const [moved, setMoved] = useState<Record<string, Position>>({})

  const startDrag = useCallback(
    (id: string, from: Position, event: PointerEvent<HTMLElement>) => {
      const container = area.current
      if (!container) return
      // Um botão dentro do cabeçalho continua sendo um clique, não um arrasto.
      if ((event.target as HTMLElement).closest('button')) return

      event.preventDefault()
      const size = container.getBoundingClientRect()
      const origin = { x: event.clientX, y: event.clientY }
      const handle = event.currentTarget
      handle.setPointerCapture(event.pointerId)

      const onMove = (move: globalThis.PointerEvent) => {
        const delta = { x: move.clientX - origin.x, y: move.clientY - origin.y }
        setMoved((current) => ({ ...current, [id]: movePoint(from, delta, size) }))
      }
      const onEnd = () => {
        handle.removeEventListener('pointermove', onMove)
        handle.removeEventListener('pointerup', onEnd)
        handle.removeEventListener('pointercancel', onEnd)
      }
      handle.addEventListener('pointermove', onMove)
      handle.addEventListener('pointerup', onEnd)
      handle.addEventListener('pointercancel', onEnd)
    },
    [area],
  )

  return { moved, startDrag }
}
