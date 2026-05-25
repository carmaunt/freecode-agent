import { readFile } from 'node:fs/promises';
import chalk from 'chalk';
import { confirmAction } from './confirm.js';
import { createSimpleDiff } from './diff.js';
import { type AgentProposal } from './proposal.js';
import { resolveSafePath, writeProjectFile } from './tools.js';

export async function applyProposal(rootDir: string, proposal: AgentProposal): Promise<void> {
  if (proposal.action === 'write_file') {
    await applyWriteFileProposal(rootDir, proposal.path, proposal.content);
    return;
  }

  const _exhaustive: never = proposal;
  throw new Error(`Ação não suportada: ${String(_exhaustive)}`);
}

async function applyWriteFileProposal(rootDir: string, targetPath: string, content: string): Promise<void> {
  const targetFullPath = resolveSafePath(rootDir, targetPath);
  const currentContent = await readOptionalFile(targetFullPath);
  const diff = createSimpleDiff(currentContent, content);

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

async function readOptionalFile(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}
