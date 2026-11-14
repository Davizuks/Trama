import type { Layout } from '../../domain/layout.ts'
import type { Screen } from '../hooks/useNavigation.ts'
import type { IconName } from '../ui/Icon.tsx'

export interface Tab {
  screen: Screen
  label: string
  icon: IconName
}

const TEIA: Tab = { screen: 'teia', label: 'Teia', icon: 'teia' }
const CHATS: Tab = { screen: 'chats', label: 'Chats', icon: 'chats' }
const FILA: Tab = { screen: 'fila', label: 'Fila', icon: 'fila' }

export function tabsFor(layout: Layout): Tab[] {
  if (layout === 'phone') return [TEIA, CHATS, FILA]
  if (layout === 'phone-landscape') return [CHATS, TEIA, FILA]
  if (layout === 'desktop') return []
  return [TEIA, FILA]
}

export function resolveScreen(layout: Layout, screen: Screen): Screen {
  if (screen === 'configuracoes') return screen
  switch (layout) {
    case 'desktop':
      return 'teia'
    case 'tablet-landscape':
    case 'tablet-portrait':
      return screen === 'fila' ? 'fila' : 'teia'
    case 'phone-landscape':
      return screen === 'teia' || screen === 'fila' ? screen : 'chats'
    case 'phone':
      return screen
  }
}

export function chatScreenFor(layout: Layout): Screen {
  if (layout === 'phone') return 'chat'
  if (layout === 'phone-landscape') return 'chats'
  return 'teia'
}
