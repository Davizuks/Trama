import { describe, expect, it } from 'vitest'
import { parseTranscript } from './transcript-parser.ts'

const lines = (...entries: unknown[]) => entries.map((entry) => JSON.stringify(entry)).join('\n')

describe('parseTranscript', () => {
  it('extrai o que o usuário digitou e o que o Claude respondeu', () => {
    const transcript = lines(
      { type: 'user', origin: { kind: 'human' }, message: { content: 'arruma o bug' } },
      { type: 'assistant', message: { content: [{ type: 'text', text: ' Arrumado. ' }] } },
    )

    expect(parseTranscript(transcript)).toEqual([
      { author: 'user', text: 'arruma o bug' },
      { author: 'assistant', text: 'Arrumado.' },
    ])
  })

  it('resume cada ferramenta usada em uma linha', () => {
    const transcript = lines({
      type: 'assistant',
      message: {
        content: [
          { type: 'tool_use', name: 'Bash', input: { command: 'npm test\necho fim' } },
          { type: 'tool_use', name: 'Read', input: { file_path: '/a/b.ts' } },
          { type: 'tool_use', name: 'ListAgents', input: {} },
        ],
      },
    })

    expect(parseTranscript(transcript).map((m) => m.text)).toEqual([
      'Bash: npm test',
      'Read: /a/b.ts',
      'ListAgents',
    ])
  })

  it('ignora resultados de ferramenta, subagentes e mensagens internas', () => {
    const transcript = lines(
      { type: 'user', origin: { kind: 'tool' }, message: { content: 'saída do comando' } },
      { type: 'user', isSidechain: true, message: { content: 'pedido a um subagente' } },
      { type: 'user', isMeta: true, message: { content: 'aviso interno' } },
      { type: 'file-history-snapshot' },
    )

    expect(parseTranscript(transcript)).toEqual([])
  })

  it('remove os avisos de sistema embutidos na fala do usuário', () => {
    const transcript = lines({
      type: 'user',
      message: { content: '<system-reminder>segredo</system-reminder>oi <b>Claude</b>' },
    })

    expect(parseTranscript(transcript)).toEqual([{ author: 'user', text: 'oi  Claude' }])
  })

  it('sobrevive a uma linha cortada no início da leitura', () => {
    const transcript = `"texto":"resto de uma linha"}\n${lines({
      type: 'user',
      message: { content: 'oi' },
    })}\n{"type":"user","mess`

    expect(parseTranscript(transcript)).toEqual([{ author: 'user', text: 'oi' }])
  })
})
