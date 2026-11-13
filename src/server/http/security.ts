import { timingSafeEqual } from 'node:crypto'

/**
 * A Trama abre terminais nesta máquina, então quem consegue falar com ela consegue rodar comandos.
 * Três barreiras impedem que uma página qualquer aberta no navegador faça isso:
 *
 * 1. `Host`: o pedido precisa ter sido endereçado a esta máquina (barra DNS rebinding).
 * 2. `Origin`: quando o navegador informa a origem, ela precisa ser a da própria Trama.
 * 3. Token: sorteado a cada início do servidor e entregue só à página da Trama, que o devolve em
 *    cada chamada. Uma página de outra origem não consegue lê-lo.
 */
export interface SecurityPolicy {
  port: number
  /** Origem extra aceita em desenvolvimento, quando a página é servida pelo Vite. */
  devOrigin: string | null
  token: string
}

export interface RequestFacts {
  host: string | undefined
  origin: string | undefined
  fetchSite: string | undefined
  token: string | undefined
}

const LOCAL_HOSTS = ['127.0.0.1', 'localhost']

export function isLocalRequest(policy: SecurityPolicy, facts: RequestFacts): boolean {
  const host = (facts.host ?? '').replace(/:\d+$/, '')
  if (!LOCAL_HOSTS.includes(host)) return false
  if (facts.fetchSite === 'cross-site') return false
  if (facts.origin === undefined) return true

  const allowed = LOCAL_HOSTS.map((name) => `http://${name}:${policy.port}`)
  if (policy.devOrigin) allowed.push(policy.devOrigin)
  return allowed.includes(facts.origin)
}

export function hasValidToken(policy: SecurityPolicy, facts: RequestFacts): boolean {
  const given = Buffer.from(facts.token ?? '')
  const expected = Buffer.from(policy.token)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** Pedido autorizado a ler dados ou a controlar terminais. */
export const isAuthorized = (policy: SecurityPolicy, facts: RequestFacts): boolean =>
  isLocalRequest(policy, facts) && hasValidToken(policy, facts)
