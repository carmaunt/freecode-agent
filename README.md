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

## Perguntar ao agente

```bash
npm run dev -- ask "analise este projeto"
```

## Usar outro modelo

```bash
npm run dev -- ask --model llama3.1:8b "explique a estrutura deste projeto"
```

## Gerar proposta estruturada

```bash
npm run dev -- ask --proposal --out proposal.json "crie um arquivo src/hello.ts exportando uma mensagem"
```

Esse comando força o modelo a responder em JSON, valida a resposta e salva em `proposal.json`.

## Aplicar proposta estruturada

```bash
npm run dev -- apply proposal.json
```

O comando valida a proposta, mostra o diff e só aplica depois da confirmação.

## Rodar loop limitado do agente

```bash
npm run dev -- loop --steps 2 "crie um arquivo src/hello.ts e valide o projeto"
```

O loop gera uma proposta por etapa, aplica somente após confirmação e respeita o limite máximo de 5 etapas.

## Escrever arquivo manualmente com confirmação e diff

```bash
npm run dev -- write src/exemplo.ts --from rascunho.ts
```

Esse comando copia o conteúdo de `rascunho.ts` para `src/exemplo.ts`, mostra um preview das alterações e só grava depois da confirmação no terminal.

## Executar comandos seguros

```bash
npm run dev -- run npm:typecheck
```

Comandos permitidos nesta versão:

- `npm:test` executa `npm test`
- `npm:build` executa `npm run build`
- `npm:typecheck` executa `npm run typecheck`

O agente não executa shell livre. Apenas comandos pré-aprovados são aceitos, com timeout padrão de 30 segundos.

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

- listar a raiz do projeto com proteção contra acesso fora da pasta atual;
- ler arquivos pequenos de contexto;
- enviar contexto ao Ollama;
- retornar uma análise técnica no terminal;
- gerar propostas JSON estruturadas usando o modelo;
- escrever arquivos manualmente com confirmação explícita;
- mostrar diff simples antes de salvar alterações;
- aplicar propostas JSON estruturadas com validação, diff e confirmação;
- executar comandos seguros por allowlist com timeout;
- aplicar propostas de execução segura de comandos;
- rodar um loop limitado de agente com propostas estruturadas.

## Próximas etapas

1. Adicionar suporte a provedores compatíveis com OpenAI além do Ollama.
2. Melhorar diff usando algoritmo unificado.
3. Criar testes automatizados para parser, diff e comandos.
4. Adicionar logs estruturados de execução.
