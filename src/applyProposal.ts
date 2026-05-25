import { readFile } from 'node:fs/promises';
import chalk from 'chalk';
import { runAllowedCommand } from './commands.js';
import { confirmAction } from './confirm.js';
import { createUnifiedDiff } from './diff.js';
import { writeLog } from './logger.js';
import { type AgentProposal } from './proposal.js';
import { resolveSafePath, writeProjectFile } from './tools.js';

export async function applyProposal(rootDir: string, proposal: AgentProposal): Promise<void> {
  await writeLog(rootDir, {
    event: 'proposal.received',
    data: summarizeProposal(proposal)
  });

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
    await writeLog(rootDir, {
      event: 'proposal.cancelled',
      data: { action: 'write_file', path: targetPath }
    });
    console.log(chalk.gray('Proposta cancelada.'));
    return;
  }

  const result = await writeProjectFile(rootDir, targetPath, content);
  await writeLog(rootDir, {
    event: 'file.written',
    data: {
      path: targetPath,
      bytes: Buffer.byteLength(content, 'utf8')
    }
  });
  console.log(chalk.green(result.output));
}

async function applyRunCommandProposal(rootDir: string, command: string): Promise<void> {
  console.log(chalk.yellow('\nProposta do agente:'));
  console.log(`Ação: run_command`);
  console.log(`Comando permitido: ${command}\n`);

  const confirmed = await confirmAction('Executar este comando?');

  if (!confirmed) {
    await writeLog(rootDir, {
      event: 'proposal.cancelled',
      data: { action: 'run_command', command }
    });
    console.log(chalk.gray('Execução cancelada.'));
    return;
  }

  const result = await runAllowedCommand(command, rootDir);

  await writeLog(rootDir, {
    event: 'command.executed',
    data: {
      commandKey: command,
      command: result.command,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      stdoutLength: result.stdout.length,
      stderrLength: result.stderr.length
    }
  });

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

function summarizeProposal(proposal: AgentProposal): Record<string, unknown> {
  if (proposal.action === 'write_file') {
    return {
      action: proposal.action,
      path: proposal.path,
      contentLength: proposal.content.length
    };
  }

  return {
    action: proposal.action,
    command: proposal.command
  };
}
