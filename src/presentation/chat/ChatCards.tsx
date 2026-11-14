import { forksOf, groupChats } from '../../domain/chats.ts'
import { useNavigation } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { EmptyTeia } from '../teia/Teia.tsx'
import { ChatCard } from './ChatCard.tsx'

export function ChatCards() {
  const { workspace } = useWorkspace()
  const { openChat } = useNavigation()
  const groups = groupChats(workspace.chats)

  if (groups.length === 0) return <EmptyTeia />

  return (
    <div className="coluna cresce rolagem cartoes">
      {groups.map((group) => (
        <section key={group.status} className="coluna cartoes__grupo">
          <h2 className="t-ui-12-forte c-3">{group.label}</h2>
          {group.chats.map((chat) => {
            const forks = forksOf(workspace.chats, chat.id)
            return (
              <div key={chat.id} className="coluna cartoes__grupo">
                <ChatCard chat={chat} onOpen={() => openChat(chat.id, 'chat')} />
                {forks.length > 0 && (
                  <>
                    <div className="coluna cartoes__forks">
                      {forks.map((fork) => (
                        <ChatCard
                          key={fork.id}
                          chat={fork}
                          onOpen={() => openChat(fork.id, 'chat')}
                        />
                      ))}
                    </div>
                    <p className="t-ui-13 c-3">
                      Fique com um caminho e o outro é arquivado, ou mantenha os dois abertos.
                    </p>
                  </>
                )}
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
