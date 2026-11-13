import { describe, expect, it } from 'vitest'
import { parseBoard, parseNote } from './brain-parser.ts'

describe('parseBoard', () => {
  const board = parseBoard(`# Quadro

## Sessões ativas

| Sessão | Início | Papel | Projeto | Tarefa | Arquivos reservados |
| --- | --- | --- | --- | --- | --- |
| 4242 | 2026-11-12 10:00 | construtor | portfolio | Trocar o rodapé | src/Footer.tsx |

## Recados entre sessões

Texto de explicação que não é recado.

- O teste de rodapé está instável.

## Próximas tarefas

- [ ] Primeira rodada
- [x] Montar a teia
`)

  it('lê as sessões ativas pelas colunas do cabeçalho', () => {
    expect(board.rows).toEqual([
      {
        session: '4242',
        role: 'construtor',
        project: 'portfolio',
        task: 'Trocar o rodapé',
        files: 'src/Footer.tsx',
      },
    ])
  })

  it('lê os recados e a fila, marcando o que já foi feito', () => {
    expect(board.messages).toEqual(['O teste de rodapé está instável.'])
    expect(board.queue).toEqual([
      { done: false, text: 'Primeira rodada' },
      { done: true, text: 'Montar a teia' },
    ])
  })

  it('devolve um quadro vazio quando a tabela não tem linhas', () => {
    const empty = parseBoard('## Sessões ativas\n\n| Sessão | Papel |\n| --- | --- |\n')

    expect(empty.rows).toEqual([])
  })
})

describe('parseNote', () => {
  it('extrai título, pasta do projeto e links sem repetição', () => {
    const note = parseNote(
      '# Portfólio\n\n- **Pasta**: `/ws/site/`\n\nVer [[Quadro]], [[quadro|o quadro]] e [[decisao#motivo]].',
    )

    expect(note).toEqual({
      title: 'Portfólio',
      projectDir: '/ws/site',
      links: ['quadro', 'decisao'],
    })
  })

  it('não trata como ligação o link que aparece dentro de código', () => {
    const note = parseNote('Use `[[nome-da-nota]]`.\n\n```\n[[exemplo]]\n```\n\nReal: [[inbox]]')

    expect(note.links).toEqual(['inbox'])
  })

  it('aceita nota sem título nem pasta', () => {
    expect(parseNote('só texto')).toEqual({ title: null, projectDir: null, links: [] })
  })
})
