#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { chatWithOllama } from './ollama.js';
import { collectProjectContext } from './context.js';
import { listFiles, writeProjectFile } from './tools.js';
import { confirmAction } from './confirm.js';

const program = new Command();

program
  .name('freecode-agent')
  .description('Agente CLI local para programação usando IA via Ollama')
  .version('0.1.0');

program
  .command('ask')
  .description('Analisa o projeto atual e consulta o modelo local')
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
            content: 'Você é um agente de programação local. Responda em português, seja técnico, direto e priorize ações seguras. Nesta versão você ainda não edita arquivos automaticamente; apenas analisa e orienta.'
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

program
  .command('write')
  .description('Escreve um arquivo no projeto atual após confirmação')
  .argument('<target>', 'caminho do arquivo que será escrito')
  .requiredOption('--from <source>', 'arquivo local usado como origem do conteúdo')
  .action(async (target: string, options: { from: string }) => {
    try {
      const content = await readFile(options.from, 'utf8');

      console.log(chalk.yellow('\nAlteração solicitada:'));
      console.log(`Arquivo destino: ${target}`);
      console.log(`Arquivo origem: ${options.from}`);
      console.log(`Tamanho: ${content.length} caracteres\n`);

      const confirmed = await confirmAction('Confirmar gravação do arquivo?');

      if (!confirmed) {
        console.log(chalk.gray('Operação cancelada.'));
        return;
      }

      const result = await writeProjectFile(process.cwd(), target, content);
      console.log(chalk.green(result.output));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('\nErro:'), message);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);
