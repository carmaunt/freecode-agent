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

## Escrever arquivo com confirmação

```bash
npm run dev -- write src/exemplo.ts --from rascunho.ts
```

Esse comando copia o conteúdo de `rascunho.ts` para `src/exemplo.ts`, mas só grava depois da confirmação no terminal.

## Estado atual

A versão 0.1 consegue:

- listar a raiz do projeto com proteção contra acesso fora da pasta atual;
- ler arquivos pequenos de contexto;
- enviar contexto ao Ollama;
- retornar uma análise técnica no terminal;
- escrever arquivos manualmente com confirmação explícita.

## Próximas etapas

1. Criar modo diff antes de salvar alterações.
2. Permitir que o modelo proponha alterações estruturadas.
3. Adicionar execução segura de comandos.
4. Criar loop de agente com ferramentas estruturadas.
5. Adicionar suporte a provedores compatíveis com OpenAI além do Ollama.
