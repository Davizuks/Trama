import { canReply, chatContext } from '../../domain/chats.ts'
import type { Chat } from '../../domain/model.ts'
import { useNavigation } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Button, IconButton } from '../ui/Button.tsx'
import { Status } from '../ui/Status.tsx'
import { ReplyForm } from './ReplyForm.tsx'
import { RequestCard } from './RequestCard.tsx'
import { Transcript } from './Transcript.tsx'

const QUICK_REPLIES = ['Sim, manda', 'Não', 'Explica melhor']

export function ChatScreen({ chat }: { chat: Chat }) {
  const { workspace, dispatch } = useWorkspace()
  const { goTo } = useNavigation()
  const enabled = canReply(chat, workspace.chats)

  return (
    <div className="chat-cheio">
      <div className="coluna chat-cheio__chat">
        <header className="linha chat-cheio__cabecalho">
          <IconButton icon="voltar" label="Voltar" size={18} onClick={() => goTo('chats')} />
          <div className="chat-cheio__titulo">
            <h2 className="t-ui-14-forte">{chat.name}</h2>
            <span className="t-ui-12 c-3">{chatContext(chat, workspace.chats)}</span>
          </div>
          <span className="cresce" />
          <Status status={chat.status} />
        </header>
        <Transcript lines={chat.transcript} />
        {chat.request ? (
          <div className="chat-cheio__pedido">
            <RequestCard chat={chat} request={chat.request} />
          </div>
        ) : (
          <div className="chat-cheio__responder">
            {enabled && (
              <div className="linha chat-cheio__rapidas">
                {QUICK_REPLIES.map((reply) => (
                  <Button
                    key={reply}
                    onClick={() => dispatch({ type: 'chat-replied', chatId: chat.id, text: reply })}
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            )}
            <ReplyForm chat={chat} />
          </div>
        )}
      </div>
    </div>
  )
}
