import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type LlmProvider } from './llm.js';

export type FreeCodeConfig = {
  provider: LlmProvider;
  model: string;
  ollamaHost: string;
  baseUrl?: string;
  maxSteps: number;
};

export type ConfigOverrides = {
  provider?: string;
  model?: string;
  host?: string;
  baseUrl?: string;
  steps?: string;
};

const DEFAULT_CONFIG: FreeCodeConfig = {
  provider: 'ollama',
  model: 'qwen2.5-coder:7b',
  ollamaHost: 'http://localhost:11434',
  maxSteps: 2
};

export async function loadConfig(rootDir: string, overrides: ConfigOverrides = {}): Promise<FreeCodeConfig> {
  const fileConfig = await readConfigFile(rootDir);

  const config: FreeCodeConfig = {
    provider: parseProvider(
      overrides.provider ??
      process.env.FREECODE_PROVIDER ??
      fileConfig.provider ??
      DEFAULT_CONFIG.provider
    ),
    model:
      overrides.model ??
      process.env.FREECODE_MODEL ??
      fileConfig.model ??
      DEFAULT_CONFIG.model,
    ollamaHost:
      overrides.host ??
      process.env.FREECODE_OLLAMA_HOST ??
      fileConfig.ollamaHost ??
      DEFAULT_CONFIG.ollamaHost,
    baseUrl:
      overrides.baseUrl ??
      process.env.FREECODE_BASE_URL ??
      fileConfig.baseUrl,
    maxSteps: parseSteps(
      overrides.steps ??
      process.env.FREECODE_MAX_STEPS ??
      String(fileConfig.maxSteps ?? DEFAULT_CONFIG.maxSteps)
    )
  };

  return config;
}

async function readConfigFile(rootDir: string): Promise<Partial<FreeCodeConfig>> {
  const configPath = join(rootDir, '.freecode-agent.json');

  try {
    const raw = await readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;

    if (!isRecord(parsed)) {
      throw new Error('Configuração deve ser um objeto JSON.');
    }

    return {
      provider: typeof parsed.provider === 'string' ? parseProvider(parsed.provider) : undefined,
      model: typeof parsed.model === 'string' ? parsed.model : undefined,
      ollamaHost: typeof parsed.ollamaHost === 'string' ? parsed.ollamaHost : undefined,
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : undefined,
      maxSteps: typeof parsed.maxSteps === 'number' ? parseSteps(String(parsed.maxSteps)) : undefined
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

export function parseProvider(provider: string): LlmProvider {
  if (provider === 'ollama' || provider === 'openai-compatible') {
    return provider;
  }

  throw new Error('Provider inválido. Use ollama ou openai-compatible.');
}

function parseSteps(value: string): number {
  const maxSteps = Number.parseInt(value, 10);

  if (!Number.isInteger(maxSteps) || maxSteps < 1 || maxSteps > 5) {
    throw new Error('maxSteps deve ser um inteiro entre 1 e 5.');
  }

  return maxSteps;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
