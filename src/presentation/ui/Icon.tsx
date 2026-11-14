import type { CSSProperties } from 'react'

const files = import.meta.glob<string>('./icons/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const urlByName = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.slice('./icons/'.length, -'.svg'.length), url]),
)

export type IconName =
  | 'sino'
  | 'buscar'
  | 'seletor'
  | 'mais-acoes'
  | 'enviar'
  | 'fork'
  | 'baixo'
  | 'configuracoes'
  | 'teclado'
  | 'cerebro'
  | 'sair'
  | 'voltar'
  | 'claude'
  | 'obsidian'
  | 'github'
  | 'figma'
  | 'mcp'
  | 'chave'
  | 'servidor'
  | 'comando'
  | 'feito'
  | 'mais'
  | 'teia'
  | 'chats'
  | 'fila'

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const style = { '--icone': `url("${urlByName[name]}")`, width: size, height: size }
  return <span className="icone" style={style as CSSProperties} aria-hidden="true" />
}
