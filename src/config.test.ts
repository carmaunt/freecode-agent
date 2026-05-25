import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { loadConfig, parseProvider } from './config.js';

describe('config', () => {
  it('loads default config when project config is absent', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'freecode-config-'));
    const config = await loadConfig(rootDir);

    expect(config.provider).toBe('ollama');
    expect(config.model).toBe('qwen2.5-coder:7b');
    expect(config.ollamaHost).toBe('http://localhost:11434');
    expect(config.maxSteps).toBe(2);
    expect(config.allowedCommands['npm:typecheck']).toEqual({
      command: 'npm',
      args: ['run', 'typecheck']
    });
  });

  it('loads project config from .freecode-agent.json', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'freecode-config-'));

    await writeFile(join(rootDir, '.freecode-agent.json'), JSON.stringify({
      provider: 'openai-compatible',
      model: 'custom-model',
      baseUrl: 'https://example.test/v1',
      maxSteps: 3,
      allowedCommands: {
        'app:lint': {
          command: 'npm',
          args: ['run', 'lint']
        }
      }
    }), 'utf8');

    const config = await loadConfig(rootDir);

    expect(config.provider).toBe('openai-compatible');
    expect(config.model).toBe('custom-model');
    expect(config.baseUrl).toBe('https://example.test/v1');
    expect(config.maxSteps).toBe(3);
    expect(config.allowedCommands).toEqual({
      'app:lint': {
        command: 'npm',
        args: ['run', 'lint']
      }
    });
  });

  it('applies overrides over file config', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'freecode-config-'));

    await writeFile(join(rootDir, '.freecode-agent.json'), JSON.stringify({
      provider: 'ollama',
      model: 'file-model',
      maxSteps: 2
    }), 'utf8');

    const config = await loadConfig(rootDir, {
      provider: 'openai-compatible',
      model: 'override-model',
      steps: '4'
    });

    expect(config.provider).toBe('openai-compatible');
    expect(config.model).toBe('override-model');
    expect(config.maxSteps).toBe(4);
  });

  it('rejects invalid provider', () => {
    expect(() => parseProvider('invalid')).toThrow('Provider inválido');
  });
});
