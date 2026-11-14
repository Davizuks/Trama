import type { Task } from '../../domain/model.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'

interface TaskItemProps {
  task: Task
  onToggle: () => void
  compact?: boolean
}

export function TaskItem({ task, onToggle, compact = false }: TaskItemProps) {
  const classes = ['tarefa', task.done && 'tarefa--feita', compact && 'tarefa--compacta']
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={task.done}
      className={classes.filter(Boolean).join(' ')}
      onClick={onToggle}
    >
      <span className="tarefa__marca" />
      <span className="coluna cresce tarefa__texto">
        <span className={`corta ${compact ? 't-ui-13' : 't-ui-14'}`}>{task.title}</span>
        {!compact && task.note && <span className="t-ui-12 c-3">{task.note}</span>}
      </span>
    </button>
  )
}

export function Queue() {
  const { workspace, dispatch } = useWorkspace()

  return (
    <div className="fila rolagem">
      <section className="coluna fila__coluna">
        <h3 className="t-ui-12-forte c-3">Tarefas</h3>
        {workspace.tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={() => dispatch({ type: 'task-toggled', taskId: task.id })}
          />
        ))}
      </section>
      <section className="coluna fila__coluna">
        <h3 className="t-ui-12-forte c-3">Recados entre chats</h3>
        {workspace.memos.map((memo) => (
          <article key={memo.id} className="recado">
            <p className="t-ui-12 c-3">
              {memo.from} para {memo.to} · {memo.when}
            </p>
            <p className="t-ui-14">{memo.text}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
