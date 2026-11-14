import { describe, expect, it } from 'vitest'
import {
  anchorFor,
  drawGraph,
  fitView,
  HOME_VIEW,
  movePoint,
  panView,
  WINDOW_SHAPE,
  zoomView,
} from './graph.ts'
import type { Brain, Chat } from './model.ts'

const brain: Brain = {
  nodes: [
    { id: 'cerebro', label: 'Cérebro', kind: 'brain' },
    { id: 'portfolio', label: 'Portfólio', kind: 'project' },
    { id: 'quadro', label: 'Quadro', kind: 'note' },
  ],
  links: [['cerebro', 'portfolio']],
}

const chat = (id: string, project: string): Chat => ({
  id,
  name: id,
  role: 'livre',
  project,
  status: 'working',
  lastActivity: 'agora',
  summary: '',
  transcript: [],
})

describe('drawGraph', () => {
  it('põe o cérebro no centro e todos os pontos dentro do desenho', () => {
    const { points } = drawGraph(brain, [chat('a', 'Portfólio'), chat('b', 'Outro')])
    expect(points.find((point) => point.id === 'cerebro')).toMatchObject({ x: 0.5, y: 0.5 })
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.x).toBeLessThanOrEqual(1)
      expect(point.y).toBeGreaterThanOrEqual(0)
      expect(point.y).toBeLessThanOrEqual(1)
    }
  })

  it('liga cada chat ao seu projeto, ou ao cérebro quando o projeto não está na teia', () => {
    const { wires } = drawGraph(brain, [chat('a', 'Portfólio'), chat('b', 'Outro')])
    expect(wires).toContainEqual(['a', 'portfolio'])
    expect(wires).toContainEqual(['b', 'cerebro'])
    expect(wires).toContainEqual(['cerebro', 'portfolio'])
  })

  it('produz sempre o mesmo desenho para os mesmos dados', () => {
    expect(drawGraph(brain, [chat('a', 'Portfólio')])).toEqual(
      drawGraph(brain, [chat('a', 'Portfólio')]),
    )
  })
})

describe('WINDOW_SHAPE', () => {
  it('põe os chats nas bordas e desce o cérebro para o meio de baixo', () => {
    const { points } = drawGraph(brain, [chat('a', 'Portfólio'), chat('b', 'Outro')], WINDOW_SHAPE)
    const at = (id: string) => points.find((point) => point.id === id)!
    expect(at('a').x).toBeCloseTo(0)
    expect(at('b').x).toBeCloseTo(1)
    expect(at('cerebro').y).toBeGreaterThan(0.5)
  })
})

describe('anchorFor', () => {
  it('liga um fork ao chat de onde ele saiu', () => {
    expect(anchorFor(brain, { ...chat('f', 'Portfólio'), forkOf: 'a' })).toBe('a')
  })

  it('liga o chat ao projeto dele, ou ao cérebro quando o projeto não está na teia', () => {
    expect(anchorFor(brain, chat('a', 'Portfólio'))).toBe('portfolio')
    expect(anchorFor(brain, chat('b', 'Outro'))).toBe('cerebro')
    expect(anchorFor({ nodes: [], links: [] }, chat('c', 'Outro'))).toBeUndefined()
  })
})

describe('movePoint', () => {
  const area = { width: 1000, height: 500 }

  it('converte o arrasto em pixels para frações da área', () => {
    expect(movePoint({ x: 0.5, y: 0.5 }, { x: 100, y: -50 }, area)).toEqual({ x: 0.6, y: 0.4 })
  })

  it('deixa levar o ponto para fora do desenho original', () => {
    expect(movePoint({ x: 0.9, y: 0.1 }, { x: 500, y: -500 }, area)).toEqual({ x: 1.4, y: -0.9 })
  })
})

describe('vista da teia', () => {
  it('desloca somando o arrasto', () => {
    expect(panView(HOME_VIEW, { x: 30, y: -10 })).toEqual({ x: 30, y: -10, scale: 1 })
  })

  it('aproxima mantendo parado o ponto sob o cursor', () => {
    const cursor = { x: 200, y: 100 }
    const zoomed = zoomView(HOME_VIEW, 2, cursor)
    expect(zoomed.scale).toBe(2)
    expect((cursor.x - zoomed.x) / zoomed.scale).toBe(cursor.x)
    expect((cursor.y - zoomed.y) / zoomed.scale).toBe(cursor.y)
  })

  it('limita a escala entre 20% e 200%', () => {
    expect(zoomView(HOME_VIEW, 10, { x: 0, y: 0 }).scale).toBe(2)
    expect(zoomView(HOME_VIEW, 0.01, { x: 0, y: 0 }).scale).toBe(0.2)
  })
})

describe('fitView', () => {
  const canvas = { width: 1000, height: 600 }
  const origin = { x: 100, y: 50 }
  const onScreen = (
    view: { x: number; y: number; scale: number },
    q: { x: number; y: number },
  ) => ({
    x: origin.x + view.x + (q.x - origin.x) * view.scale,
    y: origin.y + view.y + (q.y - origin.y) * view.scale,
  })

  it('afasta até o conteúdo caber inteiro, com folga, e o centraliza', () => {
    const content = { x: -500, y: -200, width: 2000, height: 1000 }
    const view = fitView(content, canvas, origin, 24)
    const topLeft = onScreen(view, { x: content.x, y: content.y })
    const bottomRight = onScreen(view, { x: content.x + 2000, y: content.y + 1000 })
    expect(topLeft.x).toBeGreaterThanOrEqual(24 - 1e-9)
    expect(topLeft.y).toBeGreaterThanOrEqual(24 - 1e-9)
    expect(bottomRight.x).toBeLessThanOrEqual(canvas.width - 24 + 1e-9)
    expect(bottomRight.y).toBeLessThanOrEqual(canvas.height - 24 + 1e-9)
    expect(topLeft.x).toBeCloseTo(canvas.width - bottomRight.x)
    expect(topLeft.y).toBeCloseTo(canvas.height - bottomRight.y)
  })

  it('não amplia um conteúdo pequeno além do tamanho real', () => {
    expect(fitView({ x: 400, y: 200, width: 100, height: 100 }, canvas, origin).scale).toBe(1)
  })
})
