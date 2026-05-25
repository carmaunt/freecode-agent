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

## Formato da proposta

```json
{
  "action": "write_file",
  "path": "src/exemplo.ts",
  "content": "export const message = 'hello';\n"
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
- executar comandos seguros por allowlist com timeout.

## Próximas etapas

1. Permitir propostas estruturadas para execução segura de comandos.
2. Criar loop de agente com ferramentas estruturadas.
3. Adicionar suporte a provedores compatíveis com OpenAI além do Ollama.
4. Melhorar diff usando algoritmo unificado.
