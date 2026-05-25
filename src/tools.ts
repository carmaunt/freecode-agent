import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve } from 'node:path';

export type ToolResult = {
  ok: boolean;
  output: string;
};

export async function listFiles(rootDir: string, targetPath = '.'): Promise<ToolResult> {
  const safePath = resolveSafePath(rootDir, targetPath);
  const entries = await readdir(safePath, { withFileTypes: true });

  const output = entries
    .filter((entry) => !entry.name.startsWith('.git'))
    .map((entry) => `${entry.isDirectory() ? 'dir ' : 'file'} ${entry.name}`)
    .join('\n');

  return {
    ok: true,
    output: output || 'Diretório vazio.'
  };
}

export async function readProjectFile(rootDir: string, targetPath: string): Promise<ToolResult> {
  const safePath = resolveSafePath(rootDir, targetPath);
  const info = await stat(safePath);

  if (!info.isFile()) {
    return {
      ok: false,
      output: 'O caminho informado não é um arquivo.'
    };
  }

  if (info.size > 80_000) {
    return {
      ok: false,
      output: 'Arquivo muito grande para leitura nesta versão.'
    };
  }

  const content = await readFile(safePath, 'utf8');
  const relativePath = relative(rootDir, safePath).replaceAll('\\', '/');

  return {
    ok: true,
    output: `Arquivo: ${relativePath}\n\n${content}`
  };
}

export async function writeProjectFile(
  rootDir: string,
  targetPath: string,
  content: string
): Promise<ToolResult> {
  const safePath = resolveSafePath(rootDir, targetPath);
  const relativePath = relative(rootDir, safePath).replaceAll('\\', '/');

  await mkdir(dirname(safePath), { recursive: true });
  await writeFile(safePath, content, 'utf8');

  return {
    ok: true,
    output: `Arquivo salvo: ${relativePath}`
  };
}

export function resolveSafePath(rootDir: string, targetPath: string): string {
  const normalizedTarget = normalize(targetPath);
  const resolved = resolve(rootDir, normalizedTarget);
  const resolvedRoot = resolve(rootDir);

  if (!resolved.startsWith(resolvedRoot)) {
    throw new Error('Acesso negado: caminho fora do projeto.');
  }

  return resolved;
}
