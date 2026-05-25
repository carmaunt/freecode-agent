#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from './config.js';
import { collectProjectContext } from './context.js';
import { listFiles, resolveSafePath, writeProjectFile } from './tools.js';
import { confirmAction } from './confirm.js';
import { createUnifiedDiff } from './diff.js';
import { parseAgentProposal } from './proposal.js';
import { applyProposal } from './applyProposal.js';
import { listAllowedCommands, runAllowedCommand } from './commands.js';
import { runAgentLoop } from './agentLoop.js';
import { chatWithModel } from './llm.js';

type AskOptions = {
  provider?: string;
  model?: string;
  host?: string;
  baseUrl?: string;
  apiKey?: string;
  proposal?: boolean;
  out?: string;
};

type LoopOptions = {
  provider?: string;
  model?: string;
  host?: string;
  baseUrl?: string;
  apiKey?: string;
  steps?: string;
};

const program = new Command();

program
  .name('freecode-agent')
  .description('Agente CLI local para programação usando IA via Ollama')
  .version('0.1.0');

program
  .command('ask')
  .description('Analisa o projeto atual e consulta o modelo local')
  .argument('<prompt...>', 'tarefa ou pergunta para o agente')
  .option('--provider <provider>', 'provider: ollama ou openai-compatible')
  .option('-m, --model <model>', 'modelo do provider escolhido')
  .option('--host <host>', 'URL do Ollama')
  .option('--base-url <baseUrl>', 'base URL para provider OpenAI-compatible')
  .option('--api-key <apiKey>', 'API key para provider OpenAI-compatible')
  .option('--proposal', 'força resposta em JSON estruturado para aplicar depois')
  .option('--out <file>', 'salva a resposta do modelo em um arquivo')
  .action(async (promptParts: string[], options: AskOptions) => {
    const prompt = promptParts.join(' ');
    const cwd = process.cwd();
    const spinner = ora('Analisando projeto...').start();

    try {
      const config = await loadConfig(cwd, options);
      const [files, tree] = await Promise.all([
        collectProjectContext(cwd),
        listFiles(cwd)
      ]);

      const context = files
        .map((file) => `Arquivo: ${file.path}\n\n${file.content}`)
        .join('\n\n---\n\n');

      spinner.text = 'Consultando modelo...';

      const answer = await chatWithModel({
        provider: config.provider,
        host: config.ollamaHost,
        baseUrl: config.baseUrl,
        apiKey: options.apiKey,
        model: config.model,
        messages: [
          {
            role: 'system',
            content: options.proposal ? proposalSystemPrompt() : defaultSystemPrompt()
          },
          {
            role: 'user',
            content: `Estrutura inicial do projeto:\n\n${tree.output}\n\nArquivos carregados:\n\n${context || 'Nenhum arquivo de contexto encontrado.'}\n\nTarefa do usuário:\n${prompt}`
          }
        ]
      });

      spinner.stop();

      if (options.proposal) {
        const proposal = parseAgentProposal(answer);
        const normalized = JSON.stringify(proposal, null, 2);
        console.log(chalk.green('\nProposta estruturada:\n'));
        console.log(normalized);

        if (options.out) {
          await writeFile(options.out, `${normalized}\n`, 'utf8');
          console.log(chalk.green(`\nProposta salva em: ${options.out}`));
        }

        return;
      }

      console.log(chalk.green('\nFreeCode Agent:\n'));
      console.log(answer);

      if (options.out) {
        await writeFile(options.out, `${answer}\n`, 'utf8');
        console.log(chalk.green(`\nResposta salva em: ${options.out}`));
      }
    } catch (error) {
      spinner.stop();
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('\nErro:'), message);
      process.exitCode = 1;
    }
  });

program
  .command('write')
  .description('Escreve um arquivo no projeto atual após mostrar diff e pedir confirmação')
  .argument('<target>', 'caminho do arquivo que será escrito')
  .requiredOption('--from <source>', 'arquivo local usado como origem do conteúdo')
  .action(async (target: string, options: { from: string }) => {
    try {
      const cwd = process.cwd();
      const content = await readFile(options.from, 'utf8');
      const targetFullPath = resolveSafePath(cwd, target);
      const currentContent = await readOptionalFile(targetFullPath);
      const diff = createUnifiedDiff(currentContent, content, { filePath: target });

      console.log(chalk.yellow('\nAlteração solicitada:'));
      console.log(`Arquivo destino: ${target}`);
      console.log(`Arquivo origem: ${options.from}`);
      console.log(`Tamanho novo: ${content.length} caracteres\n`);

      console.log(chalk.cyan('Preview das alterações:'));
      console.log(diff);
      console.log('');

      const confirmed = await confirmAction('Confirmar gravação do arquivo?');

      if (!confirmed) {
        console.log(chalk.gray('Operação cancelada.'));
        return;
      }

      const result = await writeProjectFile(cwd, target, content);
      console.log(chalk.green(result.output));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('\nErro:'), message);
      process.exitCode = 1;
    }
  });

program
  .command('apply')
  .description('Aplica uma proposta JSON do agente com validação, diff e confirmação')
  .argument('<proposalFile>', 'arquivo contendo a proposta JSON')
  .action(async (proposalFile: string) => {
    try {
      const rawProposal = await readFile(proposalFile, 'utf8');
      const proposal = parseAgentProposal(rawProposal);
      await applyProposal(process.cwd(), proposal);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('\nErro:'), message);
      process.exitCode = 1;
    }
  });

program
  .command('run')
  .description('Executa um comando permitido com timeout')
  .argument('<commandKey>', `comando permitido: ${listAllowedCommands().join(', ')}`)
  .action(async (commandKey: string) => {
    const spinner = ora(`Executando ${commandKey}...`).start();

    try {
      const result = await runAllowedCommand(commandKey, process.cwd());
      spinner.stop();

      console.log(chalk.green(`\nComando: ${result.command}`));
      console.log(`Exit code: ${result.exitCode}`);
      console.log(`Timeout: ${result.timedOut ? 'sim' : 'não'}\n`);

      if (result.stdout.trim()) {
        console.log(chalk.cyan('stdout:'));
        console.log(result.stdout);
      }

      if (result.stderr.trim()) {
        console.log(chalk.yellow('stderr:'));
        console.log(result.stderr);
      }

      if (result.exitCode && result.exitCode !== 0) {
        process.exitCode = result.exitCode;
      }
    } catch (error) {
      spinner.stop();
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('\nErro:'), message);
      process.exitCode = 1;
    }
  });

program
  .command('loop')
  .description('Executa um loop limitado de propostas do agente')
  .argument('<task...>', 'tarefa para o agente executar em etapas')
  .option('--provider <provider>', 'provider: ollama ou openai-compatible')
  .option('-m, --model <model>', 'modelo do provider escolhido')
  .option('--host <host>', 'URL do Ollama')
  .option('--base-url <baseUrl>', 'base URL para provider OpenAI-compatible')
  .option('--api-key <apiKey>', 'API key para provider OpenAI-compatible')
  .option('--steps <number>', 'número máximo de etapas')
  .action(async (taskParts: string[], options: LoopOptions) => {
    try {
      const config = await loadConfig(process.cwd(), options);

      await runAgentLoop({
        rootDir: process.cwd(),
        task: taskParts.join(' '),
        provider: config.provider,
        model: config.model,
        host: config.ollamaHost,
        baseUrl: config.baseUrl,
        apiKey: options.apiKey,
        maxSteps: config.maxSteps
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('\nErro:'), message);
      process.exitCode = 1;
    }
  });

function defaultSystemPrompt(): string {
  return 'Você é um agente de programação local. Responda em português, seja técnico, direto e priorize ações seguras. Nesta versão você ainda não edita arquivos automaticamente; apenas analisa e orienta.';
}

function proposalSystemPrompt(): string {
  return [
    'Você é um agente de programação local.',
    'Responda exclusivamente com um objeto JSON válido.',
    'Não use markdown, comentários ou texto fora do JSON.',
    'Você pode escolher apenas uma das ações abaixo.',
    'Para escrever arquivo, use exatamente este schema:',
    '{"action":"write_file","path":"caminho/relativo/do/arquivo","content":"conteúdo completo do arquivo"}',
    'Para executar comando seguro, use exatamente este schema:',
    '{"action":"run_command","command":"npm:typecheck"}',
    `Comandos permitidos: ${listAllowedCommands().join(', ')}.`,
    'Use apenas caminhos relativos dentro do projeto.',
    'O campo content deve conter o conteúdo completo do arquivo final.'
  ].join(' ');
}

async function readOptionalFile(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}

program.parseAsync(process.argv);
