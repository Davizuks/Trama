import type { Board, BoardRow } from '../../../domain/model.ts'

const WIKILINK = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g

/** Colunas da tabela "Sessões ativas" do quadro, pelo título que aparece no Markdown. */
const BOARD_COLUMNS: Record<string, keyof BoardRow> = {
  sessão: 'session',
  papel: 'role',
  projeto: 'project',
  tarefa: 'task',
  'arquivos reservados': 'files',
}

const splitRow = (line: string) =>
  line
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim())

const isSeparator = (cells: string[]) => cells.every((cell) => /^:?-+:?$/.test(cell))

/** Lê o `quadro.md`: sessões ativas, recados entre sessões e a fila de tarefas. */
export function parseBoard(markdown: string): Board {
  const board: Board = { rows: [], queue: [], messages: [] }
  let section = ''
  let header: string[] | null = null

  for (const raw of markdown.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('## ')) {
      section = line.slice(3).toLowerCase()
      header = null
    } else if (section.startsWith('sessões ativas') && line.startsWith('|')) {
      const cells = splitRow(line)
      if (isSeparator(cells)) continue
      if (!header) {
        header = cells.map((cell) => cell.toLowerCase())
        continue
      }
      const row: BoardRow = { session: '', role: '', project: '', task: '', files: '' }
      header.forEach((title, index) => {
        const field = BOARD_COLUMNS[title]
        if (field) row[field] = cells[index] ?? ''
      })
      board.rows.push(row)
    } else if (section.startsWith('próximas tarefas') && /^- \[[ xX]\]/.test(line)) {
      board.queue.push({
        done: /^- \[[xX]\]/.test(line),
        text: line.replace(/^- \[[ xX]\]\s*/, ''),
      })
    } else if (section.startsWith('recados') && line.startsWith('- ')) {
      board.messages.push(line.slice(2))
    }
  }
  return board
}

export interface ParsedNote {
  title: string | null
  projectDir: string | null
  links: string[]
}

/** Extrai de uma nota o título, os wikilinks e a pasta de código que ela descreve. */
export function parseNote(markdown: string): ParsedNote {
  // Links dentro de trechos de código são exemplos, não ligações.
  const prose = markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
  const links = new Set<string>()
  for (const match of prose.matchAll(WIKILINK)) links.add(match[1].trim().toLowerCase())

  return {
    title: markdown.match(/^#\s+(.+)$/m)?.[1].trim() ?? null,
    projectDir: markdown.match(/\*\*Pasta\*\*:\s*`([^`]+)`/)?.[1].replace(/\/$/, '') ?? null,
    links: [...links],
  }
}
