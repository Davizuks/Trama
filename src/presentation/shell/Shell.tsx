import { focusedChat } from '../../domain/chats.ts'
import { hasSidebar } from '../../domain/layout.ts'
import { ChatCards } from '../chat/ChatCards.tsx'
import { ChatScreen } from '../chat/ChatScreen.tsx'
import { ChatWindow } from '../chat/ChatWindow.tsx'
import { NewChatDialog } from '../dialogs/NewChatDialog.tsx'
import { Queue } from '../fila/Queue.tsx'
import { useNavigation, type Screen } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { AddMcpDialog } from '../settings/AddMcpDialog.tsx'
import { SettingsScreen } from '../settings/SettingsScreen.tsx'
import { EmptyTeia, Teia } from '../teia/Teia.tsx'
import { Button, IconButton } from '../ui/Button.tsx'
import { Logo } from '../ui/Logo.tsx'
import { AccountMenu, Avatar, LogoutDialog } from './AccountMenu.tsx'
import { BellButton, NoticePanel, NoticeScreen, NoticeToast } from './Notices.tsx'
import { resolveScreen } from './screens.ts'
import { Sidebar } from './Sidebar.tsx'
import { BottomTabs, ViewTabs } from './ViewTabs.tsx'

const TITLES: Partial<Record<Screen, string>> = { teia: 'Sua trama', fila: 'Fila' }

function LoggedOutBanner() {
  const { dispatch, layout } = useWorkspace()
  return (
    <div className="linha faixa-aviso" role="alert">
      <span className="ponto ponto--perigo" />
      <p className="cresce t-ui-13">
        O Claude Code não está logado.
        {layout !== 'phone' && ' Os chats não conseguem responder até você entrar.'}
      </p>
      <Button kind="primario" onClick={() => dispatch({ type: 'claude-logged-in' })}>
        Entrar
      </Button>
    </div>
  )
}

function MainBar({ screen }: { screen: Screen }) {
  const { workspace, dispatch, layout } = useWorkspace()
  const { show } = useNavigation()
  const { showExternalChats } = workspace.settings

  return (
    <header className="linha barra">
      <h1 className="t-titulo-18">{TITLES[screen]}</h1>
      <span className="cresce" />
      {layout === 'desktop' ? (
        <>
          <Button
            kind="texto"
            aria-pressed={showExternalChats}
            onClick={() =>
              dispatch({
                type: 'settings-changed',
                patch: { showExternalChats: !showExternalChats },
              })
            }
          >
            Outros terminais ({workspace.externalChats})
          </Button>
          <Button kind="primario" onClick={() => show('novo-chat')}>
            Novo chat
          </Button>
        </>
      ) : (
        <BellButton />
      )}
    </header>
  )
}

function TopBar() {
  const { layout } = useWorkspace()
  const { show } = useNavigation()
  const phone = layout === 'phone'

  return (
    <header className="linha barra barra--topo">
      <Logo size={20} />
      <span className="t-titulo-15">Trama</span>
      {!phone && <ViewTabs />}
      <span className="cresce" />
      <BellButton />
      <IconButton icon="buscar" label="Buscar" size={18} />
      {phone ? (
        <IconButton
          icon="mais"
          label="Novo chat"
          tone="claro"
          size={18}
          onClick={() => show('novo-chat')}
        />
      ) : (
        <Button kind="primario" onClick={() => show('novo-chat')}>
          Novo chat
        </Button>
      )}
      <button type="button" aria-label="Conta" onClick={() => show('conta')}>
        <Avatar />
      </button>
    </header>
  )
}

function Content({ screen }: { screen: Screen }) {
  const { workspace, layout } = useWorkspace()
  const { selectedChatId } = useNavigation()
  const focus = focusedChat(workspace.chats, selectedChatId)

  if (screen === 'fila') return <Queue />
  if (screen === 'teia') return <Teia />
  if (layout === 'phone') return <ChatCards />
  if (!focus) return <EmptyTeia />
  return (
    <div className="painel-chat">
      <ChatWindow chat={focus} selected />
    </div>
  )
}

function Overlays({ toast }: { toast: boolean }) {
  const { overlay } = useNavigation()

  return (
    <>
      {overlay === 'novo-chat' && <NewChatDialog />}
      {overlay === 'avisos' && <NoticePanel />}
      {overlay === 'conta' && <AccountMenu />}
      {overlay === 'sair' && <LogoutDialog />}
      {overlay === 'novo-mcp' && <AddMcpDialog />}
      {toast && <NoticeToast />}
    </>
  )
}

export function Shell() {
  const { workspace, layout } = useWorkspace()
  const navigation = useNavigation()
  const screen = resolveScreen(layout, navigation.screen)
  const focus = focusedChat(workspace.chats, navigation.selectedChatId)
  const banner = !workspace.claudeLoggedIn && <LoggedOutBanner />

  const toast = layout !== 'phone' && layout !== 'phone-landscape'

  if (screen === 'configuracoes') {
    return (
      <>
        <SettingsScreen />
        <Overlays toast={false} />
      </>
    )
  }
  if (screen === 'chat' && focus) return <ChatScreen chat={focus} />
  if (screen === 'avisos') return <NoticeScreen />

  if (hasSidebar(layout)) {
    return (
      <div className={`casca casca--lateral casca--${layout}`}>
        <Sidebar />
        <main className="coluna principal">
          {layout !== 'phone-landscape' && <MainBar screen={screen} />}
          {banner}
          <Content screen={screen} />
        </main>
        <Overlays toast={toast} />
      </div>
    )
  }

  return (
    <div className={`casca casca--topo casca--${layout}`}>
      <TopBar />
      {banner}
      <main className="coluna principal">
        <Content screen={screen === 'chat' ? 'chats' : screen} />
      </main>
      {layout === 'phone' && <BottomTabs />}
      <Overlays toast={toast} />
    </div>
  )
}
