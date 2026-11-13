/** Um corpo da simulação: um nó do grafo com posição, velocidade e tamanho. */
export interface Body {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  mass: number
  /** Janelas são sólidas: nada fica debaixo delas, nem outra janela nem uma nota. */
  solid: boolean
  /** Preso pelo usuário enquanto é arrastado. */
  pinned: boolean
}

export interface Spring {
  a: string
  b: string
  rest: number
}

export interface View {
  x: number
  y: number
  k: number
}

const REPULSION = 16_000
const SPRING = 0.03
/** A gravidade vertical é mais forte: a tela é larga, então o grafo deve se espalhar para os lados. */
const GRAVITY_X = 0.003
const GRAVITY_Y = 0.009
const DAMPING = 0.8
const WINDOW_GAP = 24
const NOTE_GAP = 6
const OVERLAP_PASSES = 6
const MIN_DISTANCE_SQUARED = 64
/** Sem este teto, dois corpos que nascem quase no mesmo ponto se arremessam para longe. */
const MAX_SPEED = 40

/**
 * Avança a simulação um passo: todos os corpos se repelem, as ligações puxam como molas e uma
 * gravidade leve mantém tudo perto do centro. `heat` vai de 1 (agitado) a 0 (parado).
 * Devolve o maior deslocamento do passo, para quem chama saber se o grafo já assentou.
 */
export function step(bodies: Body[], springs: Spring[], heat: number): number {
  const before = bodies.map((body) => ({ x: body.x, y: body.y }))
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i]
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const distanceSquared = Math.max(dx * dx + dy * dy, MIN_DISTANCE_SQUARED)
      const distance = Math.sqrt(distanceSquared)
      const force = (REPULSION * a.mass * b.mass) / distanceSquared
      push(a, b, (dx / distance) * force, (dy / distance) * force)
    }
  }

  const byId = new Map(bodies.map((body) => [body.id, body]))
  for (const spring of springs) {
    const a = byId.get(spring.a)
    const b = byId.get(spring.b)
    if (!a || !b) continue
    const dx = b.x - a.x
    const dy = b.y - a.y
    const distance = Math.hypot(dx, dy) || 1
    const force = (distance - spring.rest) * SPRING
    push(a, b, (dx / distance) * force, (dy / distance) * force)
  }

  for (const body of bodies) {
    if (body.pinned) {
      body.vx = 0
      body.vy = 0
      continue
    }
    body.vx = (body.vx - body.x * GRAVITY_X) * DAMPING
    body.vy = (body.vy - body.y * GRAVITY_Y) * DAMPING
    const speed = Math.hypot(body.vx, body.vy)
    if (speed > MAX_SPEED) {
      body.vx *= MAX_SPEED / speed
      body.vy *= MAX_SPEED / speed
    }
    body.x += body.vx * heat
    body.y += body.vy * heat
  }
  resolveOverlaps(bodies)

  // Mede depois de desfazer as sobreposições: um corpo encostado em outro tem velocidade, mas
  // não sai do lugar, e não deve manter a simulação acordada.
  return bodies.reduce(
    (farthest, body, index) =>
      Math.max(farthest, Math.hypot(body.x - before[index].x, body.y - before[index].y)),
    0,
  )
}

function push(a: Body, b: Body, fx: number, fy: number): void {
  a.vx += fx
  a.vy += fy
  b.vx -= fx
  b.vy -= fy
}

/**
 * Desfaz sobreposições movendo os corpos, em vez de só empurrá-los: uma força pode ser vencida
 * pelas molas, e uma janela parada sobre outra esconde o que está embaixo. Repete algumas vezes
 * porque desfazer uma sobreposição pode criar outra.
 */
function resolveOverlaps(bodies: Body[]): void {
  for (let pass = 0; pass < OVERLAP_PASSES; pass++) {
    let moved = false
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i]
        const b = bodies[j]
        if (!a.solid && !b.solid) continue
        const gap = a.solid && b.solid ? WINDOW_GAP : NOTE_GAP
        const overlapX = (a.width + b.width) / 2 + gap - Math.abs(a.x - b.x)
        const overlapY = (a.height + b.height) / 2 + gap - Math.abs(a.y - b.y)
        if (overlapX <= 0 || overlapY <= 0) continue
        // Quem está preso pelo usuário não cede; o outro percorre a distância toda.
        const shareA = a.pinned ? 0 : b.pinned ? 1 : 0.5
        const shareB = b.pinned ? 0 : 1 - shareA
        if (overlapX < overlapY) {
          const direction = a.x < b.x ? -1 : 1
          a.x += direction * overlapX * shareA
          b.x -= direction * overlapX * shareB
          // Como em uma colisão, os dois perdem a velocidade no eixo do contato. Sem isso
          // continuariam se empurrando e o grafo nunca assentaria.
          a.vx = 0
          b.vx = 0
        } else {
          const direction = a.y < b.y ? -1 : 1
          a.y += direction * overlapY * shareA
          b.y -= direction * overlapY * shareB
          a.vy = 0
          b.vy = 0
        }
        moved = true
      }
    }
    if (!moved) return
  }
}

export const overlaps = (a: Body, b: Body): boolean =>
  Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2

/** Calcula a vista (deslocamento e zoom) em que todos os corpos cabem na área dada. */
export function fitView(bodies: Body[], width: number, height: number, margin = 32): View | null {
  if (bodies.length === 0 || width <= 0 || height <= 0) return null
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (const body of bodies) {
    left = Math.min(left, body.x - body.width / 2)
    right = Math.max(right, body.x + body.width / 2)
    top = Math.min(top, body.y - body.height / 2)
    bottom = Math.max(bottom, body.y + body.height / 2)
  }
  const k = Math.min(
    1,
    (width - margin * 2) / (right - left),
    (height - margin * 2) / (bottom - top),
  )
  return { k, x: (-(left + right) / 2) * k, y: (-(top + bottom) / 2) * k }
}
