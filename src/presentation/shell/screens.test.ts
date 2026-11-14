import { describe, expect, it } from 'vitest'
import { chatScreenFor, resolveScreen, tabsFor } from './screens.ts'

describe('resolveScreen', () => {
  it('no desktop tudo vira a teia, menos as configurações', () => {
    expect(resolveScreen('desktop', 'chats')).toBe('teia')
    expect(resolveScreen('desktop', 'fila')).toBe('teia')
    expect(resolveScreen('desktop', 'configuracoes')).toBe('configuracoes')
  })

  it('ao girar o celular, o chat em tela cheia vira o painel de chats', () => {
    expect(resolveScreen('phone', 'chat')).toBe('chat')
    expect(resolveScreen('phone-landscape', 'chat')).toBe('chats')
    expect(resolveScreen('tablet-portrait', 'chat')).toBe('teia')
  })

  it('a fila continua sendo a fila onde ela tem tela própria', () => {
    expect(resolveScreen('tablet-landscape', 'fila')).toBe('fila')
    expect(resolveScreen('phone-landscape', 'fila')).toBe('fila')
  })
})

describe('tabsFor', () => {
  it('só mostra as áreas que existem no formato', () => {
    expect(tabsFor('desktop')).toEqual([])
    expect(tabsFor('tablet-portrait').map((tab) => tab.screen)).toEqual(['teia', 'fila'])
    expect(tabsFor('phone').map((tab) => tab.screen)).toEqual(['teia', 'chats', 'fila'])
  })
})

describe('chatScreenFor', () => {
  it('abre o chat onde ele cabe', () => {
    expect(chatScreenFor('phone')).toBe('chat')
    expect(chatScreenFor('phone-landscape')).toBe('chats')
    expect(chatScreenFor('desktop')).toBe('teia')
  })
})
