import { describe, expect, it } from 'vitest'
import { isAuthorized, isLocalRequest, type RequestFacts, type SecurityPolicy } from './security.ts'

const policy: SecurityPolicy = { port: 4747, devOrigin: null, token: 'segredo' }

const facts = (extra: Partial<RequestFacts> = {}): RequestFacts => ({
  host: '127.0.0.1:4747',
  origin: 'http://127.0.0.1:4747',
  fetchSite: 'same-origin',
  token: 'segredo',
  ...extra,
})

describe('isLocalRequest', () => {
  it('aceita a própria página, por 127.0.0.1 ou localhost', () => {
    expect(isLocalRequest(policy, facts())).toBe(true)
    expect(
      isLocalRequest(policy, facts({ host: 'localhost:4747', origin: 'http://localhost:4747' })),
    ).toBe(true)
  })

  it('aceita pedido sem origem, como a navegação direta para a página', () => {
    expect(isLocalRequest(policy, facts({ origin: undefined, fetchSite: 'none' }))).toBe(true)
  })

  it('recusa domínio apontado para esta máquina (DNS rebinding)', () => {
    expect(isLocalRequest(policy, facts({ host: 'evil.example:4747' }))).toBe(false)
  })

  it('recusa página de outra origem, inclusive outra porta local', () => {
    expect(isLocalRequest(policy, facts({ origin: 'https://evil.example' }))).toBe(false)
    expect(isLocalRequest(policy, facts({ origin: 'http://localhost:3000' }))).toBe(false)
    expect(isLocalRequest(policy, facts({ origin: undefined, fetchSite: 'cross-site' }))).toBe(
      false,
    )
  })

  it('só aceita a origem do Vite quando ela foi configurada', () => {
    const dev = facts({ origin: 'http://localhost:5173' })

    expect(isLocalRequest(policy, dev)).toBe(false)
    expect(isLocalRequest({ ...policy, devOrigin: 'http://localhost:5173' }, dev)).toBe(true)
  })
})

describe('isAuthorized', () => {
  it('exige o token certo além da origem local', () => {
    expect(isAuthorized(policy, facts())).toBe(true)
    expect(isAuthorized(policy, facts({ token: 'errado!' }))).toBe(false)
    expect(isAuthorized(policy, facts({ token: undefined }))).toBe(false)
    expect(isAuthorized(policy, facts({ host: 'evil.example' }))).toBe(false)
  })
})
