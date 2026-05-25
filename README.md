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

## Rodar em desenvolvimento

```bash
npm run dev -- "analise este projeto"
```

## Usar outro modelo

```bash
npm run dev -- --model llama3.1:8b "explique a estrutura deste projeto"
```

## Estado atual

A versão 0.1 lê arquivos pequenos do projeto atual, envia contexto ao Ollama e retorna uma resposta técnica.

Ainda não edita arquivos. A próxima etapa será adicionar ferramentas controladas como leitura específica, escrita com confirmação e execução segura de comandos.
