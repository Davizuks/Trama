import type { ReactNode } from 'react'
import type { Service } from '../../domain/model.ts'
import { useNavigation } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Button } from '../ui/Button.tsx'
import { Field, Segmented } from '../ui/controls.tsx'
import { Icon, type IconName } from '../ui/Icon.tsx'

interface CardProps {
  icon: IconName
  name: string
  status: string
  connected: boolean
  description: string
  actions?: ReactNode
  children?: ReactNode
}

function ConnectionCard({
  icon,
  name,
  status,
  connected,
  description,
  actions,
  children,
}: CardProps) {
  return (
    <section className="conexao">
      <div className="conexao__cabecalho">
        <span className="conexao__simbolo">
          <Icon name={icon} size={18} />
        </span>
        <div className="coluna cresce conexao__texto">
          <div className="linha conexao__nome">
            <h3 className="t-ui-14-forte">{name}</h3>
            <span className={`linha conexao__situacao t-ui-12 ${connected ? 'c-2' : 'c-3'}`}>
              <span className={`conexao__ponto ${connected ? 'conexao__ponto--ligado' : ''}`} />
              {status}
            </span>
          </div>
          <p className="t-ui-13 c-3">{description}</p>
        </div>
        {actions && <div className="linha conexao__acoes">{actions}</div>}
      </div>
      {children && <div className="coluna conexao__detalhe">{children}</div>}
    </section>
  )
}

function ClaudeCard() {
  const { workspace, dispatch } = useWorkspace()
  const { claude } = workspace

  return (
    <ConnectionCard
      icon="claude"
      name="Claude"
      status="Conectado"
      connected
      description="É com esta credencial que os chats da Trama rodam."
    >
      <Segmented
        label="Como entrar"
        value={claude.mode}
        options={[
          { value: 'account', label: 'Conta do Claude' },
          { value: 'api-key', label: 'Chave de API' },
        ]}
        onChange={(mode) => dispatch({ type: 'claude-mode-changed', mode })}
      />
      {claude.mode === 'account' ? (
        <div className="conexao__linha">
          <div className="coluna cresce conexao__texto">
            <span className="t-ui-14-forte">{claude.accountName}</span>
            <span className="t-ui-13 c-3">{claude.plan} · sessão iniciada pelo Claude Code</span>
          </div>
          <Button>Trocar de conta</Button>
        </div>
      ) : (
        <>
          <div className="conexao__linha">
            <div className="cresce">
              <Field label="Chave de API" icon="chave" mono readOnly value={claude.maskedKey} />
            </div>
            <div className="linha conexao__acoes">
              <Button>Trocar chave</Button>
              <Button kind="texto">Testar</Button>
            </div>
          </div>
          <p className="t-ui-13 c-3">
            A chave fica no chaveiro do sistema, nunca em arquivo nem no navegador. O uso é cobrado
            pela API.
          </p>
        </>
      )}
    </ConnectionCard>
  )
}

function ServiceCard({ service }: { service: Service }) {
  const { dispatch } = useWorkspace()
  const toggle = () => dispatch({ type: 'service-toggled', serviceId: service.id })

  const actions =
    service.id === 'obsidian' ? (
      <>
        <Button>Abrir cofre</Button>
        <Button kind="texto">Trocar</Button>
      </>
    ) : service.connected ? (
      <Button kind="texto" onClick={toggle}>
        Desconectar
      </Button>
    ) : (
      <Button kind="primario" onClick={toggle}>
        Conectar
      </Button>
    )

  return (
    <ConnectionCard
      icon={service.id}
      name={service.name}
      status={service.statusLabel}
      connected={service.connected}
      description={service.description}
      actions={actions}
    />
  )
}

export function Connections() {
  const { workspace, layout } = useWorkspace()
  const { openSettings } = useNavigation()
  const byId = (id: Service['id']) => workspace.services.find((service) => service.id === id)
  const active = workspace.mcpServers.filter((server) => server.enabled).length
  const obsidian = byId('obsidian')
  const github = byId('github')
  const figma = byId('figma')

  return (
    <div className="coluna conexoes">
      {layout !== 'phone' && (
        <>
          <h1 className="t-titulo-18">Conexões</h1>
          <p className="t-ui-14 c-3">O que a Trama e os seus chats podem acessar.</p>
        </>
      )}
      <h2 className="conexoes__grupo t-ui-12-forte c-3">Claude</h2>
      <ClaudeCard />
      <h2 className="conexoes__grupo t-ui-12-forte c-3">Cérebro e código</h2>
      {obsidian && <ServiceCard service={obsidian} />}
      {github && <ServiceCard service={github} />}
      <h2 className="conexoes__grupo t-ui-12-forte c-3">Ferramentas dos chats</h2>
      {figma && <ServiceCard service={figma} />}
      <ConnectionCard
        icon="mcp"
        name="Servidores MCP"
        status={`${active} ativos`}
        connected={active > 0}
        description="Outras ferramentas que os chats podem usar: Notion, Slack, banco de dados e mais."
        actions={<Button onClick={() => openSettings('mcp')}>Gerenciar</Button>}
      />
    </div>
  )
}
