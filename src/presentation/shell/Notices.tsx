import { focusedChat } from '../../domain/chats.ts'
import type { Notice } from '../../domain/model.ts'
import { unreadCount } from '../../domain/workspace.ts'
import { useNavigation } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Button, IconButton } from '../ui/Button.tsx'
import { Popover } from '../ui/Overlay.tsx'
import { chatScreenFor } from './screens.ts'

function useOpenNotice() {
  const { dispatch, layout } = useWorkspace()
  const { openChat, show } = useNavigation()

  return (notice: Notice) => {
    dispatch({ type: 'notice-dismissed', noticeId: notice.id })
    if (notice.chatId) openChat(notice.chatId, chatScreenFor(layout))
    else show(null)
  }
}

export function BellButton() {
  const { workspace, layout } = useWorkspace()
  const { show, goTo } = useNavigation()
  const unread = unreadCount(workspace)
  const open = () => (layout === 'phone' ? goTo('avisos') : show('avisos'))

  return (
    <span className="sino">
      <IconButton
        icon="sino"
        label={unread > 0 ? `Notificações, ${unread} não lidas` : 'Notificações'}
        onClick={open}
      />
      {unread > 0 && <span className="sino__ponto" />}
    </span>
  )
}

export function NoticeList() {
  const { workspace } = useWorkspace()
  const openNotice = useOpenNotice()

  return (
    <>
      {workspace.notices.map((notice) => (
        <button key={notice.id} type="button" className="aviso" onClick={() => openNotice(notice)}>
          <span className="aviso__marca">
            {notice.unread && <span className="ponto ponto--needs-you" />}
          </span>
          <span className="coluna cresce aviso__conteudo">
            <span className="linha aviso__topo">
              <span className={`cresce corta t-ui-13-forte ${notice.unread ? 'c-1' : 'c-2'}`}>
                {notice.title}
              </span>
              <span className="t-ui-12 c-3">{notice.when}</span>
            </span>
            <span className="t-ui-13 c-2">{notice.body}</span>
          </span>
        </button>
      ))}
      {workspace.notices.length === 0 && <p className="aviso__vazio t-ui-13 c-3">Nenhum aviso.</p>}
    </>
  )
}

export function NoticePanel() {
  const { dispatch, layout } = useWorkspace()
  const { show } = useNavigation()

  return (
    <Popover label="Notificações" className={`avisos avisos--${layout}`} onClose={() => show(null)}>
      <header className="linha avisos__cabecalho">
        <h2 className="cresce t-ui-14-forte">Notificações</h2>
        <button
          type="button"
          className="t-ui-12 c-2"
          onClick={() => dispatch({ type: 'notices-read' })}
        >
          Marcar todas como lidas
        </button>
      </header>
      <NoticeList />
    </Popover>
  )
}

export function NoticeScreen() {
  const { dispatch } = useWorkspace()
  const { goTo } = useNavigation()

  return (
    <div className="coluna tela-cheia">
      <header className="linha cabecalho-voltar">
        <IconButton icon="voltar" label="Voltar" size={18} onClick={() => goTo('chats')} />
        <h1 className="cresce t-titulo-15">Notificações</h1>
        <button
          type="button"
          className="t-ui-13 c-2"
          onClick={() => dispatch({ type: 'notices-read' })}
        >
          Ler todas
        </button>
      </header>
      <div className="coluna cresce rolagem avisos__lista">
        <NoticeList />
      </div>
    </div>
  )
}

export function NoticeToast() {
  const { workspace, dispatch, layout } = useWorkspace()
  const { selectedChatId, overlay } = useNavigation()
  const openNotice = useOpenNotice()
  const focus = focusedChat(workspace.chats, selectedChatId)
  const onScreen = layout === 'desktop' ? workspace.chats : focus ? [focus] : []
  const notice = workspace.notices.find(
    (each) => each.unread && each.chatId && !onScreen.some((chat) => chat.id === each.chatId),
  )
  if (!notice || overlay) return null

  return (
    <aside className="aviso-flutuante anima-entrada" role="status">
      <div className="linha aviso-flutuante__topo">
        <span className="ponto ponto--needs-you" />
        <h3 className="t-ui-13-forte">{notice.title}</h3>
      </div>
      <p className="t-ui-13 c-2">{notice.body}</p>
      <div className="linha aviso-flutuante__acoes">
        <Button kind="primario" onClick={() => openNotice(notice)}>
          Responder
        </Button>
        <Button
          kind="texto"
          onClick={() => dispatch({ type: 'notice-dismissed', noticeId: notice.id })}
        >
          Dispensar
        </Button>
      </div>
    </aside>
  )
}
