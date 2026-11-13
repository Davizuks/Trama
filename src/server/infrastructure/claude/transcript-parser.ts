import type { ChatMessage } from '../../../domain/model.ts'

const USER_LIMIT = 4000
const ASSISTANT_LIMIT = 6000
const TOOL_LIMIT = 160

interface ContentPart {
  type?: string
  text?: string
  name?: string
  input?: Record<string, unknown>
}

interface TranscriptEntry {
  type?: string
  isSidechain?: boolean
  isMeta?: boolean
  origin?: { kind?: string }
  message?: { content?: string | ContentPart[] }
}

const cut = (text: string, limit: number) =>
  text.length > limit ? `${text.slice(0, limit)}…` : text

/** Remove os blocos que o próprio Claude Code injeta na fala do usuário. */
const cleanUserText = (text: string) =>
  text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .trim()

function userText(content: string | ContentPart[] | undefined): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('\n')
}

/** Resume uma chamada de ferramenta em uma linha: o nome e o que ela foi fazer. */
function describeTool(part: ContentPart): string {
  const input = part.input ?? {}
  const detail = [input.description, input.file_path, input.command, input.query, input.skill].find(
    (value) => typeof value === 'string' && value,
  ) as string | undefined
  const firstLine = detail?.split('\n')[0]
  return cut(firstLine ? `${part.name}: ${firstLine}` : String(part.name), TOOL_LIMIT)
}

/**
 * Converte o arquivo de conversa do Claude Code (um JSON por linha) nas falas visíveis.
 * Linhas incompletas ou de tipos desconhecidos são ignoradas: o arquivo é lido a partir do
 * meio e o formato é interno do Claude Code.
 */
export function parseTranscript(jsonl: string): ChatMessage[] {
  const messages: ChatMessage[] = []
  for (const line of jsonl.split('\n')) {
    if (!line.startsWith('{')) continue
    let entry: TranscriptEntry
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }
    if (entry.isSidechain || entry.isMeta) continue
    const content = entry.message?.content

    if (entry.type === 'user') {
      if (entry.origin && entry.origin.kind !== 'human') continue
      const text = cleanUserText(userText(content))
      if (text) messages.push({ author: 'user', text: cut(text, USER_LIMIT) })
    } else if (entry.type === 'assistant' && Array.isArray(content)) {
      for (const part of content) {
        if (part.type === 'text' && part.text?.trim()) {
          messages.push({ author: 'assistant', text: cut(part.text.trim(), ASSISTANT_LIMIT) })
        } else if (part.type === 'tool_use') {
          messages.push({ author: 'tool', text: describeTool(part) })
        }
      }
    }
  }
  return messages
}
