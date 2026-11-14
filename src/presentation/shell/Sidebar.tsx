import { focusedChat, forksOf, groupChats } from '../../domain/chats.ts'
import { ChatRow } from '../chat/ChatRow.tsx'
import { TaskItem } from '../fila/Queue.tsx'
import { useNavigation } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { IconButton } from '../ui/Button.tsx'
import { Logo } from '../ui/Logo.tsx'
import { AccountButton } from './AccountMenu.tsx'
import { BellButton } from './Notices.tsx'
import { chatScreenFor } from './screens.ts'
import { ViewTabs } from './ViewTabs.tsx'

export function ChatList() {
  const { workspace, layout } = useWorkspace()
  const { selectedChatId, openChat } = useNavigation()
  const focus = focusedChat(workspace.chats, selectedChatId)

  return (
    <>
      {groupChats(workspace.chats).map((group) => (
        <section key={group.status} className="coluna lateral__grupo">
          <h2 className="lateral__rotulo t-ui-12-forte c-3">{group.label}</h2>
          {group.chats.flatMap((chat) =>
            [chat, ...forksOf(workspace.chats, chat.id)].map((each) => (
              <ChatRow
                key={each.id}
                chat={each}
                fork={each.id !== chat.id}
                selected={each.id === focus?.id}
                onSelect={() => openChat(each.id, chatScreenFor(layout))}
              />
            )),
          )}
        </section>
      ))}
    </>
  )
}

export function Sidebar() {
  const { workspace, dispatch, layout } = useWorkspace()
  const { show } = useNavigation()
  const desktop = layout === 'desktop'

  return (
    <aside className="lateral">
      <div className="linha lateral__marca">
        <Logo size={20} />
        <span className="t-titulo-15">Trama</span>
        <span className="cresce" />
        {desktop ? (
          <>
            <BellButton />
            <IconButton icon="buscar" label="Buscar" />
          </>
        ) : (
          <IconButton
            icon="mais"
            label="Novo chat"
            tone="claro"
            onClick={() => show('novo-chat')}
          />
        )}
      </div>
      {!desktop && <ViewTabs />}
      <div className="coluna cresce rolagem lateral__lista">
        <ChatList />
        {desktop && (
          <section className="coluna lateral__grupo">
            <h2 className="lateral__rotulo t-ui-12-forte c-3">Fila</h2>
            {workspace.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                compact
                onToggle={() => dispatch({ type: 'task-toggled', taskId: task.id })}
              />
            ))}
          </section>
        )}
      </div>
      <AccountButton />
    </aside>
  )
}
