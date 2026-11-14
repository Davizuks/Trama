import { useNavigation } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Button } from '../ui/Button.tsx'
import { Icon, type IconName } from '../ui/Icon.tsx'
import { Dialog, Popover } from '../ui/Overlay.tsx'

export function Avatar({ size = 28 }: { size?: number }) {
  const { workspace } = useWorkspace()
  return (
    <span className="avatar t-ui-12-forte" style={{ width: size, height: size }}>
      {workspace.account.initials}
    </span>
  )
}

export function AccountButton() {
  const { workspace } = useWorkspace()
  const { show } = useNavigation()
  return (
    <button type="button" className="linha conta" onClick={() => show('conta')}>
      <Avatar />
      <span className="coluna cresce">
        <span className="corta t-ui-13-forte">{workspace.account.name}</span>
        <span className="corta t-ui-12 c-3">{workspace.account.workspace}</span>
      </span>
      <span className="c-3">
        <Icon name="seletor" />
      </span>
    </button>
  )
}

function MenuItem(props: { icon: IconName; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`linha menu__item t-ui-13 ${props.danger ? 'c-perigo' : ''}`}
      onClick={props.onClick}
    >
      <span className={props.danger ? '' : 'c-2'}>
        <Icon name={props.icon} />
      </span>
      {props.label}
    </button>
  )
}

export function AccountMenu() {
  const { layout } = useWorkspace()
  const { show, openSettings } = useNavigation()
  const close = () => show(null)

  return (
    <Popover label="Menu da conta" className={`menu menu--${layout}`} onClose={close}>
      <MenuItem icon="configuracoes" label="Configurações" onClick={() => openSettings('geral')} />
      <MenuItem icon="teclado" label="Atalhos de teclado" onClick={() => openSettings('atalhos')} />
      <MenuItem icon="cerebro" label="Abrir o cérebro no Obsidian" onClick={close} />
      <hr className="menu__divisor" />
      <MenuItem icon="sair" label="Sair" danger onClick={() => show('sair')} />
    </Popover>
  )
}

export function LogoutDialog() {
  const { workspace, dispatch } = useWorkspace()
  const { show, goTo } = useNavigation()
  const count = workspace.chats.length
  const chats =
    count === 1 ? 'O chat aberto será encerrado' : `Os ${count} chats abertos serão encerrados`

  const logout = () => {
    dispatch({ type: 'session-ended' })
    goTo('teia')
  }

  return (
    <Dialog title="Sair da Trama?" width={400} onClose={() => show(null)}>
      <p className="t-ui-14 c-2">
        {count > 0 ? `${chats}. ` : ''}As conversas ficam salvas e podem ser retomadas depois.
      </p>
      <div className="dialogo__acoes">
        <Button kind="texto" onClick={() => show(null)}>
          Cancelar
        </Button>
        <Button danger onClick={logout}>
          Sair
        </Button>
      </div>
    </Dialog>
  )
}
