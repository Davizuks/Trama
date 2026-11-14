import type { ReactNode } from 'react'
import { useNavigation, type SettingsSection } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { AccountButton } from '../shell/AccountMenu.tsx'
import { IconButton } from '../ui/Button.tsx'
import { Icon } from '../ui/Icon.tsx'
import { Connections } from './Connections.tsx'
import { General } from './General.tsx'
import { McpServers } from './McpServers.tsx'

const SECTIONS: Array<{ id: SettingsSection; label: string }> = [
  { id: 'geral', label: 'Geral' },
  { id: 'conexoes', label: 'Conexões' },
  { id: 'atalhos', label: 'Atalhos' },
  { id: 'sobre', label: 'Sobre' },
]

const TITLES: Record<SettingsSection, string> = {
  geral: 'Configurações',
  conexoes: 'Conexões',
  mcp: 'Servidores MCP',
  atalhos: 'Atalhos',
  sobre: 'Sobre',
}

function NotDesignedYet({ title }: { title: string }) {
  return (
    <>
      <h1 className="t-titulo-18 config__titulo">{title}</h1>
      <p className="t-ui-14 c-3">Esta seção ainda não foi desenhada.</p>
    </>
  )
}

function SectionContent({ section }: { section: SettingsSection }): ReactNode {
  if (section === 'geral') return <General />
  if (section === 'conexoes') return <Connections />
  if (section === 'mcp') return <McpServers />
  return <NotDesignedYet title={TITLES[section]} />
}

export function SettingsScreen() {
  const { layout } = useWorkspace()
  const { section, goTo, openSettings } = useNavigation()

  if (layout === 'phone') {
    const back = () =>
      section === 'geral' ? goTo('chats') : openSettings(section === 'mcp' ? 'conexoes' : 'geral')
    return (
      <div className="coluna tela-cheia">
        <header className="linha cabecalho-voltar">
          <IconButton icon="voltar" label="Voltar" size={18} onClick={back} />
          <h1 className="t-titulo-15">{TITLES[section]}</h1>
        </header>
        <div className="coluna cresce rolagem config__conteudo">
          <SectionContent section={section} />
        </div>
      </div>
    )
  }

  return (
    <div className={`casca casca--lateral casca--${layout} config`}>
      <aside className="lateral">
        <button
          type="button"
          className="linha config__voltar t-ui-13 c-2"
          onClick={() => goTo('teia')}
        >
          <Icon name="voltar" />
          Voltar
        </button>
        {SECTIONS.map((each) => {
          const current = each.id === section || (each.id === 'conexoes' && section === 'mcp')
          return (
            <button
              key={each.id}
              type="button"
              aria-current={current ? 'page' : undefined}
              className={`config__secao ${current ? 't-ui-13-forte' : 't-ui-13'}`}
              onClick={() => openSettings(each.id)}
            >
              {each.label}
            </button>
          )
        })}
        <span className="cresce" />
        <AccountButton />
      </aside>
      <main className="coluna principal rolagem config__conteudo">
        <div className="coluna config__coluna">
          <SectionContent section={section} />
        </div>
      </main>
    </div>
  )
}
