import { createContext, useContext, useMemo, useState } from 'react'

export type Screen = 'teia' | 'chats' | 'fila' | 'chat' | 'avisos' | 'configuracoes'

export type SettingsSection = 'geral' | 'conexoes' | 'mcp' | 'atalhos' | 'sobre'

export type Overlay = 'novo-chat' | 'avisos' | 'conta' | 'sair' | 'novo-mcp' | null

export interface InitialNavigation {
  screen: Screen
  section: SettingsSection
  overlay: Overlay
}

export function navigationFromUrl(search: string): InitialNavigation {
  const params = new URLSearchParams(search)
  return {
    screen: (params.get('tela') as Screen | null) ?? 'chats',
    section: (params.get('secao') as SettingsSection | null) ?? 'geral',
    overlay: params.get('abrir') as Overlay,
  }
}

export interface Navigation {
  screen: Screen
  section: SettingsSection
  overlay: Overlay
  selectedChatId: string | null
  goTo: (screen: Screen) => void
  openSettings: (section?: SettingsSection) => void
  show: (overlay: Overlay) => void
  selectChat: (chatId: string) => void
  openChat: (chatId: string, screen: Screen) => void
}

export function useNavigationState(initial: InitialNavigation): Navigation {
  const [screen, setScreen] = useState<Screen>(initial.screen)
  const [section, setSection] = useState<SettingsSection>(initial.section)
  const [overlay, setOverlay] = useState<Overlay>(initial.overlay)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  return useMemo(
    () => ({
      screen,
      section,
      overlay,
      selectedChatId,
      goTo: (next) => {
        setScreen(next)
        setOverlay(null)
      },
      openSettings: (next = 'geral') => {
        setSection(next)
        setScreen('configuracoes')
        setOverlay(null)
      },
      show: setOverlay,
      selectChat: setSelectedChatId,
      openChat: (chatId, next) => {
        setSelectedChatId(chatId)
        setScreen(next)
        setOverlay(null)
      },
    }),
    [screen, section, overlay, selectedChatId],
  )
}

export const NavigationContext = createContext<Navigation | null>(null)

export function useNavigation(): Navigation {
  const value = useContext(NavigationContext)
  if (!value) throw new Error('useNavigation precisa estar dentro de NavigationContext.')
  return value
}
