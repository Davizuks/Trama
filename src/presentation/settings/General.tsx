import type { ReactNode } from 'react'
import { ROLES, type Settings, type Theme } from '../../domain/model.ts'
import { useNavigation } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Avatar } from '../shell/AccountMenu.tsx'
import { Button } from '../ui/Button.tsx'
import { Field, Segmented, Select, Toggle } from '../ui/controls.tsx'

interface RowProps {
  title: string
  hint?: string
  children: ReactNode
  stacks?: boolean
}

export function SettingRow({ title, hint, children, stacks = false }: RowProps) {
  return (
    <div className={`linha ajuste ${stacks ? 'ajuste--empilha' : ''}`}>
      <div className="coluna cresce ajuste__texto">
        <span className="t-ui-14-forte">{title}</span>
        {hint && <span className="t-ui-13 c-3">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const THEMES: Array<{ value: Theme; label: string }> = [
  { value: 'escuro', label: 'Escuro' },
  { value: 'claro', label: 'Claro' },
  { value: 'sistema', label: 'Sistema' },
]

export function General() {
  const { workspace, dispatch, layout } = useWorkspace()
  const { show, openSettings } = useNavigation()
  const { settings, account } = workspace
  const change = (patch: Partial<Settings>) => dispatch({ type: 'settings-changed', patch })
  const phone = layout === 'phone'

  return (
    <>
      {phone ? (
        <div className="linha config__conta">
          <Avatar size={40} />
          <div className="coluna">
            <span className="t-ui-14-forte">{account.name}</span>
            <span className="t-ui-13 c-3">{account.workspace}</span>
          </div>
        </div>
      ) : (
        <h1 className="t-titulo-18">Configurações</h1>
      )}

      <h2 className="config__grupo t-ui-12-forte c-3">Pastas</h2>
      <SettingRow title="Pasta de trabalho" hint="Onde ficam o cérebro e os seus projetos." stacks>
        <Field
          label="Pasta de trabalho"
          value={settings.workFolder}
          onChange={(event) => change({ workFolder: event.target.value })}
        />
      </SettingRow>
      <SettingRow
        title="Cérebro"
        hint="A pasta de notas que todos os chats leem e escrevem."
        stacks
      >
        <Field
          label="Cérebro"
          value={settings.brainFolder}
          onChange={(event) => change({ brainFolder: event.target.value })}
        />
      </SettingRow>

      <h2 className="config__grupo t-ui-12-forte c-3">Chats</h2>
      <SettingRow title="Papel padrão" hint="Com que papel um chat novo começa." stacks>
        <Select
          label="Papel padrão"
          value={settings.defaultRole}
          options={ROLES.map((role) => ({
            value: role.id,
            label: role.id === 'livre' ? 'Sem papel' : role.label,
          }))}
          onChange={(defaultRole) => change({ defaultRole })}
        />
      </SettingRow>
      <SettingRow
        title="Mostrar chats de outros terminais"
        hint="Chats abertos fora da Trama aparecem em modo leitura."
      >
        <Toggle
          label="Mostrar chats de outros terminais"
          on={settings.showExternalChats}
          onChange={(showExternalChats) => change({ showExternalChats })}
        />
      </SettingRow>
      <SettingRow
        title="Avisar quando um chat precisar de você"
        hint="Notificação do sistema e ponto azul no ícone da aba."
      >
        <Toggle
          label="Avisar quando um chat precisar de você"
          on={settings.notifyWhenNeeded}
          onChange={(notifyWhenNeeded) => change({ notifyWhenNeeded })}
        />
      </SettingRow>
      <SettingRow title="Confirmar antes de encerrar um chat">
        <Toggle
          label="Confirmar antes de encerrar um chat"
          on={settings.confirmBeforeClosing}
          onChange={(confirmBeforeClosing) => change({ confirmBeforeClosing })}
        />
      </SettingRow>

      <h2 className="config__grupo t-ui-12-forte c-3">Aparência</h2>
      <SettingRow title="Tema" stacks>
        <Segmented
          label="Tema"
          value={settings.theme}
          options={THEMES}
          onChange={(theme) => change({ theme })}
        />
      </SettingRow>

      {phone && (
        <>
          <h2 className="config__grupo t-ui-12-forte c-3">Mais</h2>
          <SettingRow title="Conexões" hint="O que a Trama e os seus chats podem acessar.">
            <Button onClick={() => openSettings('conexoes')}>Abrir</Button>
          </SettingRow>
        </>
      )}

      <h2 className="config__grupo t-ui-12-forte c-3">Sessão</h2>
      <SettingRow title="Sair da Trama" hint="Encerra os chats abertos. As conversas ficam salvas.">
        <Button danger onClick={() => show('sair')}>
          Sair
        </Button>
      </SettingRow>
    </>
  )
}
