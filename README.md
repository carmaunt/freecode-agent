# FreeCode Agent

Agente CLI local para programação usando modelos de IA via Ollama.

## Objetivo

Criar um agente simples, local e extensível para analisar projetos de código e auxiliar no desenvolvimento usando modelos gratuitos executados no próprio computador.

## Requisitos

- Node.js 20 ou superior
- Ollama instalado e rodando
- Um modelo de código baixado no Ollama

Modelo recomendado para começar:

```bash
ollama pull qwen2.5-coder:7b
```

## Instalação

```bash
npm install
```

## Configuração do projeto

Copie o arquivo de exemplo:

```bash
cp .freecode-agent.example.json .freecode-agent.json
```

Exemplo de configuração local:

```json
{
  "provider": "ollama",
  "model": "qwen2.5-coder:7b",
  "ollamaHost": "http://localhost:11434",
  "maxSteps": 2
}
```

A ordem de prioridade é:

1. flags no terminal;
2. variáveis de ambiente;
3. `.freecode-agent.json`;
4. defaults internos.

O arquivo `.freecode-agent.json` é ignorado pelo Git. Versione apenas `.freecode-agent.example.json`.

## Perguntar ao agente

```bash
npm run dev -- ask "analise este projeto"
```

## Usar outro modelo local

```bash
npm run dev -- ask --model llama3.1:8b "explique a estrutura deste projeto"
```

## Usar provider compatível com OpenAI

Configure as variáveis de ambiente:

```bash
export FREECODE_BASE_URL="https://api.exemplo.com/v1"
export FREECODE_API_KEY="sua-chave"
```

Depois execute:

```bash
npm run dev -- ask --provider openai-compatible --model modelo-coder "analise este projeto"
```

Também é possível passar `--base-url` e `--api-key`, mas variáveis de ambiente são recomendadas para evitar expor segredo no histórico do terminal.

## Gerar proposta estruturada

```bash
npm run dev -- ask --proposal --out proposal.json "crie um arquivo src/hello.ts exportando uma mensagem"
```

Esse comando força o modelo a responder em JSON, valida a resposta e salva em `proposal.json`.

## Aplicar proposta estruturada

```bash
npm run dev -- apply proposal.json
```

O comando valida a proposta, mostra diff unificado e só aplica depois da confirmação.

## Rodar loop limitado do agente

```bash
npm run dev -- loop --steps 2 "crie um arquivo src/hello.ts e valide o projeto"
```

O loop gera uma proposta por etapa, aplica somente após confirmação e respeita o limite máximo de 5 etapas.

## Rodar loop com provider compatível com OpenAI

```bash
npm run dev -- loop --provider openai-compatible --model modelo-coder --steps 2 "crie um arquivo src/hello.ts e valide o projeto"
```

## Escrever arquivo manualmente com confirmação e diff

```bash
npm run dev -- write src/exemplo.ts --from rascunho.ts
```

Esse comando copia o conteúdo de `rascunho.ts` para `src/exemplo.ts`, mostra diff unificado e só grava depois da confirmação no terminal.

## Executar comandos seguros

```bash
npm run dev -- run npm:typecheck
```

Comandos permitidos nesta versão:

- `npm:test` executa `npm test`
- `npm:build` executa `npm run build`
- `npm:typecheck` executa `npm run typecheck`

O agente não executa shell livre. Apenas comandos pré-aprovados são aceitos, com timeout padrão de 30 segundos.

## Testes

```bash
npm test
```

Esse comando executa os testes unitários com Vitest.

```bash
npm run typecheck
```

Esse comando valida os tipos TypeScript sem gerar build.

```bash
npm run build
```

Esse comando compila o projeto TypeScript para `dist`.

## CI

O GitHub Actions executa automaticamente em push e pull request para `main`:

- `npm ci`
- `npm test`
- `npm run typecheck`
- `npm run build`

## Formatos de proposta

Para escrever arquivo:

```json
{
  "action": "write_file",
  "path": "src/exemplo.ts",
  "content": "export const message = 'hello';\n"
}
```

Para executar comando seguro:

```json
{
  "action": "run_command",
  "command": "npm:typecheck"
}
```

## Estado atual

A versão 0.1 consegue:

- carregar configuração local por `.freecode-agent.json`;
- aplicar prioridade entre flags, ambiente, config e defaults;
- listar a raiz do projeto com proteção contra acesso fora da pasta atual;
- ler arquivos pequenos de contexto;
- enviar contexto ao Ollama;
- usar providers compatíveis com OpenAI;
- retornar uma análise técnica no terminal;
- gerar propostas JSON estruturadas usando o modelo;
- escrever arquivos manualmente com confirmação explícita;
- mostrar diff unificado antes de salvar alterações;
- aplicar propostas JSON estruturadas com validação, diff e confirmação;
- executar comandos seguros por allowlist com timeout;
- aplicar propostas de execução segura de comandos;
- rodar um loop limitado de agente com propostas estruturadas;
- executar testes unitários com Vitest;
- validar build, typecheck e testes com GitHub Actions.

## Próximas etapas

1. Adicionar logs estruturados de execução.
2. Criar configuração de comandos permitidos por projeto.
3. Expandir cobertura de testes para config e LLM clients.
4. Preparar empacotamento para uso global como CLI.
