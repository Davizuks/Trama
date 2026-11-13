# Trama

Uma teia viva dos seus chats do Claude Code. Cada chat é uma janela com o terminal de verdade,
ligada por um fio ao projeto em que trabalha e a um cérebro de notas Markdown que todos
compartilham.

A Trama roda só na sua máquina: um servidor Node local e uma página no navegador.

## O que ela faz

- Abre chats do Claude Code em terminais dentro da própria página, já com um papel
  (maestro, construtor, revisor, redator) se você quiser.
- Mostra os chats abertos em outros terminais, somente para leitura, e traz qualquer um deles
  para dentro quando você o fecha lá.
- Desenha o cérebro: as notas, os links entre elas e qual chat está em qual projeto.
- Mostra a fila de tarefas e os recados do `quadro.md`.

## Como usar

Requisitos: Linux, Node 24 ou mais novo e o Claude Code instalado.

```bash
npm install
npm run build
npm start          # sobe em http://127.0.0.1:4747
```

O atalho `bin/trama` faz tudo isso e abre o navegador.

Para desenvolver, `npm run dev` sobe o servidor com recarga e o Vite em
http://localhost:5173.

### Configuração

Variáveis de ambiente, todas opcionais:

| Variável           | Padrão                | Para quê                               |
| ------------------ | --------------------- | -------------------------------------- |
| `TRAMA_WORKSPACE`  | pasta acima do repo   | Raiz que reúne o cérebro e os projetos |
| `TRAMA_BRAIN`      | `<workspace>/cerebro` | Pasta de notas Markdown                |
| `TRAMA_PORT`       | `4747`                | Porta do servidor                      |
| `TRAMA_CLAUDE_BIN` | `~/.local/bin/claude` | Executável do Claude Code              |

## Arquitetura

O código segue a arquitetura limpa: as regras ficam no centro e não conhecem o que está em volta.

```
src/
  domain/            Modelo e regras puras (montagem do grafo). Usado pelo servidor e pela página.
  server/
    application/     Casos de uso e as portas (interfaces) de que eles precisam.
    infrastructure/  Implementações das portas: arquivos do Claude Code, notas, pseudo-terminais.
    http/            Rotas, WebSocket dos terminais e a política de segurança.
    main.ts          Raiz de composição: liga as implementações aos casos de uso.
  web/
    infrastructure/  Cliente da API e a sessão de terminal no navegador.
    presentation/    Componentes React, o grafo e a simulação de forças.
```

As dependências apontam para dentro: `domain` não importa nada, `application` só importa
`domain`, e `infrastructure` e `http` implementam ou usam as portas de `application`.

## Segurança

Quem fala com a Trama consegue rodar comandos na máquina, então o servidor:

- escuta apenas em `127.0.0.1`;
- recusa pedidos cujo `Host` não seja local e cuja origem não seja a da própria página;
- exige em toda chamada um token sorteado a cada início.

Os detalhes e os testes estão em `src/server/http/security.ts`.

## Limites conhecidos

- Os dados dos chats vêm de arquivos internos do Claude Code (`~/.claude/sessions` e
  `~/.claude/projects`). Não são uma interface documentada e podem mudar entre versões.
- Os terminais pertencem ao servidor: se ele parar, os chats abertos na Trama fecham. As
  conversas ficam salvas e podem ser retomadas com `claude --resume`.
- Só foi usada no Linux.

## Comandos

| Comando             | O que faz                        |
| ------------------- | -------------------------------- |
| `npm run dev`       | Servidor e Vite com recarga      |
| `npm run build`     | Checa os tipos e gera `dist/`    |
| `npm start`         | Sobe o servidor servindo `dist/` |
| `npm run test:run`  | Roda os testes                   |
| `npm run lint`      | Lint com oxlint                  |
| `npm run typecheck` | Checa os tipos                   |
