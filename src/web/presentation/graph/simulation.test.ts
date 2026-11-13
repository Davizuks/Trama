import { describe, expect, it } from 'vitest'
import { fitView, overlaps, step, type Body, type Spring } from './simulation.ts'

const body = (id: string, x: number, y: number, extra: Partial<Body> = {}): Body => ({
  id,
  x,
  y,
  vx: 0,
  vy: 0,
  width: 20,
  height: 20,
  mass: 1,
  solid: false,
  pinned: false,
  ...extra,
})

const settle = (bodies: Body[], springs: Spring[] = [], steps = 600) => {
  for (let i = 0; i < steps; i++) step(bodies, springs, 1)
}

describe('step', () => {
  it('separa duas janelas que nasceram sobrepostas', () => {
    const window = { width: 600, height: 400, mass: 4, solid: true }
    const bodies = [body('a', 0, 0, window), body('b', 30, 10, window)]

    settle(bodies)

    expect(overlaps(bodies[0], bodies[1])).toBe(false)
  })

  it('mantém separadas as janelas que as molas puxam para o mesmo ponto', () => {
    const window = { width: 640, height: 420, mass: 2, solid: true }
    const bodies = [
      body('hub', 0, 0),
      body('a', 100, 0, window),
      body('b', -100, 40, window),
      body('c', 0, -90, window),
    ]
    const springs = ['a', 'b', 'c'].map((id) => ({ a: id, b: 'hub', rest: 100 }))

    settle(bodies, springs)

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        expect(overlaps(bodies[i], bodies[j]), `${bodies[i].id} sobre ${bodies[j].id}`).toBe(false)
      }
    }
  })

  it('leva dois nós ligados para perto do comprimento de repouso da ligação', () => {
    const bodies = [body('a', -400, 0), body('b', 400, 0)]

    settle(bodies, [{ a: 'a', b: 'b', rest: 150 }])

    const distance = Math.hypot(bodies[0].x - bodies[1].x, bodies[0].y - bodies[1].y)
    expect(distance).toBeGreaterThan(120)
    expect(distance).toBeLessThan(260)
  })

  it('não move o nó que o usuário está segurando', () => {
    const bodies = [body('a', 50, 50, { pinned: true }), body('b', 60, 50)]

    settle(bodies, [], 50)

    expect(bodies[0]).toMatchObject({ x: 50, y: 50 })
    expect(bodies[1].x).toBeGreaterThan(60)
  })

  it('ignora a ligação para um nó que não existe', () => {
    const bodies = [body('a', 10, 0)]

    expect(() => step(bodies, [{ a: 'a', b: 'sumiu', rest: 100 }], 1)).not.toThrow()
  })
})

describe('fitView', () => {
  it('reduz o zoom até caber tudo e centraliza o conjunto', () => {
    const bodies = [body('a', 0, 0, { width: 200 }), body('b', 2000, 0, { width: 200 })]

    const view = fitView(bodies, 1100, 600, 0)!

    expect(view.k).toBeCloseTo(0.5)
    expect(view.x).toBeCloseTo(-500)
    expect(view.y).toBeCloseTo(0)
  })

  it('não amplia além do tamanho real quando sobra espaço', () => {
    expect(fitView([body('a', 0, 0)], 1000, 800)?.k).toBe(1)
  })

  it('não tem vista para calcular sem corpos ou sem área', () => {
    expect(fitView([], 100, 100)).toBeNull()
    expect(fitView([body('a', 0, 0)], 0, 0)).toBeNull()
  })
})
