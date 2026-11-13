const STATUS_LABELS: Record<string, string> = {
  busy: 'trabalhando',
  idle: 'aguardando você',
}

/** Estados que a Trama não conhece são mostrados como vieram, em vez de adivinhados. */
export const statusLabel = (status: string): string => STATUS_LABELS[status] ?? status

export const statusClass = (status: string | undefined): string =>
  status && status in STATUS_LABELS ? status : 'other'

export const shortenPath = (path: string, homeDir: string): string =>
  path.startsWith(homeDir) ? `~${path.slice(homeDir.length)}` : path

export function timeAgo(then: number | null, now: number): string {
  if (!then) return ''
  const seconds = Math.max(0, Math.round((now - then) / 1000))
  if (seconds < 60) return 'agora há pouco'
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)} min`
  if (seconds < 86_400) return `há ${Math.floor(seconds / 3600)} h`
  return `há ${Math.floor(seconds / 86_400)} d`
}

/** Mostra só o texto dos wikilinks: `[[nota|apelido]]` vira `apelido`. */
export const stripWikilinks = (text: string): string =>
  text.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_, target: string, alias?: string) => alias ?? target,
  )
