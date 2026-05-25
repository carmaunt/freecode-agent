import chalk from 'chalk';
import { applyProposal } from './applyProposal.js';
import { collectProjectContext } from './context.js';
import { listAllowedCommands } from './commands.js';
import { type AllowedCommand } from './config.js';
import { chatWithModel, type ChatMessage, type LlmProvider } from './llm.js';
import { listFiles } from './tools.js';
import { parseAgentProposal } from './proposal.js';

export type AgentLoopOptions = {
  rootDir: string;
  task: string;
  provider: LlmProvider;
  model: string;
  host?: string;
  baseUrl?: string;
  apiKey?: string;
  maxSteps: number;
  allowedCommands: Record<string, AllowedCommand>;
};

export async function runAgentLoop(options: AgentLoopOptions): Promise<void> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: loopSystemPrompt(options.allowedCommands)
    },
    {
      role: 'user',
      content: await buildLoopPrompt(options.rootDir, options.task)
    }
  ];

  for (let step = 1; step <= options.maxSteps; step += 1) {
    console.log(chalk.cyan(`\nEtapa ${step}/${options.maxSteps}`));

    const answer = await chatWithModel({
      provider: options.provider,
      host: options.host,
      baseUrl: options.baseUrl,
      apiKey: options.apiKey,
      model: options.model,
      messages
    });

    const proposal = parseAgentProposal(answer);
    console.log(chalk.green('\nProposta recebida:'));
    console.log(JSON.stringify(proposal, null, 2));

    await applyProposal(options.rootDir, proposal, {
      allowedCommands: options.allowedCommands
    });

    messages.push({ role: 'assistant', content: answer });
    messages.push({
      role: 'user',
      content: 'A proposta foi processada. Se ainda houver trabalho, gere a próxima proposta JSON. Se terminou, gere uma proposta run_command quando fizer sentido validar o projeto.'
    });
  }

  console.log(chalk.gray('\nLoop finalizado pelo limite de etapas.'));
}

async function buildLoopPrompt(rootDir: string, task: string): Promise<string> {
  const [files, tree] = await Promise.all([
    collectProjectContext(rootDir),
    listFiles(rootDir)
  ]);

  const context = files
    .map((file) => `Arquivo: ${file.path}\n\n${file.content}`)
    .join('\n\n---\n\n');

  return [
    `Tarefa do usuário: ${task}`,
    '',
    `Estrutura inicial do projeto:\n${tree.output}`,
    '',
    `Arquivos carregados:\n${context || 'Nenhum arquivo de contexto encontrado.'}`
  ].join('\n');
}

function loopSystemPrompt(allowedCommands: Record<string, AllowedCommand>): string {
  const commandExamples = listAllowedCommands(allowedCommands);
  const firstCommand = commandExamples[0] ?? 'npm:typecheck';

  return [
    'Você é um agente de programação local.',
    'Responda exclusivamente com um objeto JSON válido.',
    'Não use markdown, comentários ou texto fora do JSON.',
    'Em cada etapa, gere exatamente uma proposta.',
    'Para escrever arquivo, use:',
    '{"action":"write_file","path":"caminho/relativo/do/arquivo","content":"conteúdo completo do arquivo"}',
    'Para executar comando seguro, use:',
    `{"action":"run_command","command":"${firstCommand}"}`,
    `Comandos permitidos: ${commandExamples.join(', ')}.`,
    'Use apenas caminhos relativos dentro do projeto.',
    'Nunca peça comandos fora da allowlist.',
    'O campo content deve conter o conteúdo completo do arquivo final.'
  ].join(' ');
}
