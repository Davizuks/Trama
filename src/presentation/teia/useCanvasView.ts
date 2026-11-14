import { useEffect, useState, type PointerEvent, type RefObject } from 'react'
import { fitView, HOME_VIEW, panView, zoomView, type View } from '../../domain/graph.ts'

const ZOOM_STEP = 0.0015

const isTyping = () =>
  document.activeElement instanceof HTMLInputElement ||
  document.activeElement instanceof HTMLTextAreaElement

const isOverWindow = (target: EventTarget | null) =>
  target instanceof Element && target.closest('.no-janela') !== null

export function useCanvasView(canvas: RefObject<HTMLElement | null>) {
  const [view, setView] = useState<View>(HOME_VIEW)
  const [spaceHeld, setSpaceHeld] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || isTyping()) return
      // Sem isto o espaço rola a página ou aciona o botão em foco.
      event.preventDefault()
      setSpaceHeld(true)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceHeld(false)
    }
    // Se a janela perde o foco com o espaço apertado, o keyup nunca chega.
    const release = () => setSpaceHeld(false)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', release)
    }
  }, [])

  // O onWheel do React é passivo e não deixa chamar preventDefault.
  useEffect(() => {
    const element = canvas.current
    if (!element) return

    const onWheel = (event: WheelEvent) => {
      const zooming = event.ctrlKey || event.metaKey
      if (!zooming && isOverWindow(event.target)) return
      event.preventDefault()
      if (zooming) {
        const box = element.getBoundingClientRect()
        const cursor = { x: event.clientX - box.left, y: event.clientY - box.top }
        setView((current) => zoomView(current, Math.exp(-event.deltaY * ZOOM_STEP), cursor))
      } else {
        setView((current) => panView(current, { x: -event.deltaX, y: -event.deltaY }))
      }
    }

    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [canvas])

  // Ligar na fase de captura (onPointerDownCapture), para valer antes das janelas.
  const startPan = (event: PointerEvent<HTMLElement>) => {
    if (!spaceHeld) return
    event.stopPropagation()
    event.preventDefault()
    const element = event.currentTarget
    let last = { x: event.clientX, y: event.clientY }
    element.setPointerCapture(event.pointerId)

    const onMove = (move: globalThis.PointerEvent) => {
      const delta = { x: move.clientX - last.x, y: move.clientY - last.y }
      last = { x: move.clientX, y: move.clientY }
      setView((current) => panView(current, delta))
    }
    const onEnd = () => {
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerup', onEnd)
      element.removeEventListener('pointercancel', onEnd)
    }
    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerup', onEnd)
    element.addEventListener('pointercancel', onEnd)
  }

  const fitAll = () => {
    const element = canvas.current
    const area = element?.querySelector<HTMLElement>('.grafo__area')
    const pieces = element?.querySelectorAll('.no, .no-janela, .no-chat')
    if (!element || !area || !pieces?.length) return

    const frame = element.getBoundingClientRect()
    const origin = { x: area.offsetLeft, y: area.offsetTop }
    // Desfaz a vista atual para medir cada peça como se estivesse na vista inicial.
    const atHome = (x: number, y: number) => ({
      x: (x - frame.left - view.x - origin.x) / view.scale + origin.x,
      y: (y - frame.top - view.y - origin.y) / view.scale + origin.y,
    })
    const corners = [...pieces].flatMap((piece) => {
      const box = piece.getBoundingClientRect()
      return [atHome(box.left, box.top), atHome(box.right, box.bottom)]
    })
    const xs = corners.map((corner) => corner.x)
    const ys = corners.map((corner) => corner.y)
    const content = {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    }
    setView(fitView(content, frame, origin))
  }

  return { view, spaceHeld, startPan, fitAll }
}
