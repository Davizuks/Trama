import { describe, expect, it } from 'vitest'
import { hasSidebar, layoutFor } from './layout.ts'

describe('layoutFor', () => {
  it.each([
    [1440, 900, 'desktop'],
    [1112, 834, 'tablet-landscape'],
    [834, 1112, 'tablet-portrait'],
    [844, 390, 'phone-landscape'],
    [390, 844, 'phone'],
  ] as const)('reconhece a tela %i×%i do Figma como %s', (width, height, layout) => {
    expect(layoutFor(width, height)).toBe(layout)
  })

  it('trata uma janela larga e baixa como celular deitado', () => {
    expect(layoutFor(1300, 420)).toBe('phone-landscape')
  })

  it('troca de formato exatamente nos limites', () => {
    expect(layoutFor(599, 800)).toBe('phone')
    expect(layoutFor(600, 800)).toBe('tablet-portrait')
    expect(layoutFor(900, 800)).toBe('tablet-landscape')
    expect(layoutFor(1200, 800)).toBe('desktop')
  })
})

describe('hasSidebar', () => {
  it('mantém a lista lateral só onde há largura para ela', () => {
    expect(hasSidebar('desktop')).toBe(true)
    expect(hasSidebar('phone-landscape')).toBe(true)
    expect(hasSidebar('tablet-portrait')).toBe(false)
    expect(hasSidebar('phone')).toBe(false)
  })
})
