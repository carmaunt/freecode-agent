#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { chatWithOllama } from './ollama.js';
import { collectProjectContext } from './context.js';
import { listFiles } from './tools.js';

const program = new Command();

program
  .name('freecode-agent')
  .description('Agente CLI local para programação usando IA via Ollama')
  .version('0.1.0')
  .argument('<prompt...>', 'tarefa ou pergunta para o agente')
  .option('-m, --model <model>', 'modelo do Ollama', 'qwen2.5-coder:7b')
  .option('--host <host>', 'URL do Ollama', 'http://localhost:11434')
  .action(async (promptParts: string[], options: { model: string; host: string }) => {
    const prompt = promptParts.join(' ');
    const cwd = process.cwd();
    const spinner = ora('Analisando projeto...').start();

    try {
      const [files, tree] = await Promise.all([
        collectProjectContext(cwd),
        listFiles(cwd)
      ]);

      const context = files
        .map((file) => `Arquivo: ${file.path}\n\n${file.content}`)
        .join('\n\n---\n\n');

      spinner.text = 'Consultando modelo local...';

      const answer = await chatWithOllama({
        host: options.host,
        model: options.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um agente de programação local. Responda em português, seja técnico, direto e priorize ações seguras. Nesta versão você ainda não edita arquivos; apenas analisa e orienta.'
          },
          {
            role: 'user',
            content: `Estrutura inicial do projeto:\n\n${tree.output}\n\nArquivos carregados:\n\n${context || 'Nenhum arquivo de contexto encontrado.'}\n\nTarefa do usuário:\n${prompt}`
          }
        ]
      });

      spinner.stop();
      console.log(chalk.green('\nFreeCode Agent:\n'));
      console.log(answer);
    } catch (error) {
      spinner.stop();
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('\nErro:'), message);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);
