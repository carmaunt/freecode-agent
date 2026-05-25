import { readFile } from 'node:fs/promises';
import chalk from 'chalk';
import { runAllowedCommand } from './commands.js';
import { confirmAction } from './confirm.js';
import { createUnifiedDiff } from './diff.js';
import { type AgentProposal } from './proposal.js';
import { resolveSafePath, writeProjectFile } from './tools.js';

export async function applyProposal(rootDir: string, proposal: AgentProposal): Promise<void> {
  if (proposal.action === 'write_file') {
    await applyWriteFileProposal(rootDir, proposal.path, proposal.content);
    return;
  }

  if (proposal.action === 'run_command') {
    await applyRunCommandProposal(rootDir, proposal.command);
    return;
  }

  const _exhaustive: never = proposal;
  throw new Error(`Ação não suportada: ${String(_exhaustive)}`);
}

async function applyWriteFileProposal(rootDir: string, targetPath: string, content: string): Promise<void> {
  const targetFullPath = resolveSafePath(rootDir, targetPath);
  const currentContent = await readOptionalFile(targetFullPath);
  const diff = createUnifiedDiff(currentContent, content, { filePath: targetPath });

  console.log(chalk.yellow('\nProposta do agente:'));
  console.log(`Ação: write_file`);
  console.log(`Arquivo: ${targetPath}`);
  console.log(`Tamanho novo: ${content.length} caracteres\n`);

  console.log(chalk.cyan('Preview das alterações:'));
  console.log(diff);
  console.log('');

  const confirmed = await confirmAction('Aplicar esta proposta?');

  if (!confirmed) {
    console.log(chalk.gray('Proposta cancelada.'));
    return;
  }

  const result = await writeProjectFile(rootDir, targetPath, content);
  console.log(chalk.green(result.output));
}

async function applyRunCommandProposal(rootDir: string, command: string): Promise<void> {
  console.log(chalk.yellow('\nProposta do agente:'));
  console.log(`Ação: run_command`);
  console.log(`Comando permitido: ${command}\n`);

  const confirmed = await confirmAction('Executar este comando?');

  if (!confirmed) {
    console.log(chalk.gray('Execução cancelada.'));
    return;
  }

  const result = await runAllowedCommand(command, rootDir);

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
}

async function readOptionalFile(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}
