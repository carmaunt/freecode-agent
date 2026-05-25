import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage'
]);

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.txt',
  '.yml',
  '.yaml',
  '.env.example'
]);

export type ProjectFile = {
  path: string;
  content: string;
};

export async function collectProjectContext(rootDir: string, limit = 12): Promise<ProjectFile[]> {
  const files: ProjectFile[] = [];

  async function walk(dir: string): Promise<void> {
    if (files.length >= limit) return;

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (files.length >= limit) return;

      const fullPath = join(dir, entry.name);
      const relPath = relative(rootDir, fullPath).replaceAll('\\', '/');

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          await walk(fullPath);
        }
        continue;
      }

      if (!entry.isFile()) continue;
      if (!isTextFile(entry.name)) continue;

      const info = await stat(fullPath);
      if (info.size > 20_000) continue;

      const content = await readFile(fullPath, 'utf8');
      files.push({ path: relPath, content });
    }
  }

  await walk(rootDir);
  return files;
}

function isTextFile(fileName: string): boolean {
  return [...TEXT_EXTENSIONS].some((extension) => fileName.endsWith(extension));
}
