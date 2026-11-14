import { STATUS_LABEL } from '../../domain/chats.ts'
import type { ChatStatus } from '../../domain/model.ts'

export function StatusDot({ status }: { status: ChatStatus }) {
  return <span className={`ponto ponto--${status}`} aria-hidden="true" />
}

export function Status({ status }: { status: ChatStatus }) {
  return (
    <span className={`estado estado--${status} t-ui-12`}>
      <StatusDot status={status} />
      {STATUS_LABEL[status]}
    </span>
  )
}
