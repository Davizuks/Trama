import { focusedChat } from '../../domain/chats.ts'
import type { Chat } from '../../domain/model.ts'
import { COMPACT_SHAPE, TALL_SHAPE } from '../../domain/graph.ts'
import { ChatRow } from '../chat/ChatRow.tsx'
import { ChatWindow } from '../chat/ChatWindow.tsx'
import { useNavigation } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Button } from '../ui/Button.tsx'
import { Logo } from '../ui/Logo.tsx'
import { Graph } from './Graph.tsx'

export function EmptyTeia() {
  const { show } = useNavigation()
  return (
    <div className="vazio">
      <Logo size={40} />
      <h2 className="t-titulo-18">Nenhum chat aberto</h2>
      <p className="t-ui-14 c-2">
        Abra um chat do Claude Code em uma pasta e ele aparece aqui, ligado ao cérebro.
      </p>
      <Button kind="primario" onClick={() => show('novo-chat')}>
        Novo chat
      </Button>
    </div>
  )
}

function TeiaDesktop({ chats, focus }: { chats: Chat[]; focus: Chat }) {
  const { selectChat } = useNavigation()
  return (
    <div className="teia-desktop">
      <Graph chats={chats} selectedChatId={focus.id} onSelectChat={selectChat} chatsAsWindows />
    </div>
  )
}

function TeiaCompact({ chats, focus }: { chats: Chat[]; focus: Chat }) {
  const { layout } = useWorkspace()
  const { selectChat } = useNavigation()

  return (
    <div className="teia-compacta">
      {layout === 'tablet-portrait' && (
        <div className="faixa-chats">
          {chats.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              selected={chat.id === focus.id}
              onSelect={() => selectChat(chat.id)}
            />
          ))}
        </div>
      )}
      <Graph chats={chats} selectedChatId={focus.id} onSelectChat={selectChat} />
      <div className="teia-compacta__chat">
        <ChatWindow chat={focus} selected />
      </div>
    </div>
  )
}

function TeiaPhone({ chats, focus }: { chats: Chat[]; focus: Chat }) {
  const { layout } = useWorkspace()
  const { selectChat, openChat } = useNavigation()
  return (
    <div className="teia-celular">
      <Graph
        chats={chats}
        selectedChatId={focus.id}
        onSelectChat={selectChat}
        shape={layout === 'phone' ? TALL_SHAPE : COMPACT_SHAPE}
      />
      <ChatRow chat={focus} selected onSelect={() => openChat(focus.id, 'chat')} />
    </div>
  )
}

export function Teia() {
  const { workspace, layout } = useWorkspace()
  const { selectedChatId } = useNavigation()
  const focus = focusedChat(workspace.chats, selectedChatId)

  if (!focus) return <EmptyTeia />
  if (layout === 'desktop') return <TeiaDesktop chats={workspace.chats} focus={focus} />
  if (layout === 'phone' || layout === 'phone-landscape')
    return <TeiaPhone chats={workspace.chats} focus={focus} />
  return <TeiaCompact chats={workspace.chats} focus={focus} />
}
