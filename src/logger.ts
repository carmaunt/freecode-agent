import { mkdir, appendFile } from 'node:fs/promises';
import { join } from 'node:path';

export type LogEvent = {
  event: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
  data?: Record<string, unknown>;
};

export async function writeLog(rootDir: string, event: LogEvent): Promise<void> {
  if (process.env.FREECODE_LOGS === '0') {
    return;
  }

  const now = new Date();
  const logDir = join(rootDir, '.freecode-agent', 'logs');
  const logFile = join(logDir, `${now.toISOString().slice(0, 10)}.jsonl`);

  await mkdir(logDir, { recursive: true });

  const entry = {
    timestamp: now.toISOString(),
    level: event.level ?? 'info',
    event: event.event,
    data: sanitizeData(event.data ?? {})
  };

  await appendFile(logFile, `${JSON.stringify(entry)}\n`, 'utf8');
}

function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      output[key] = '[REDACTED]';
      continue;
    }

    if (typeof value === 'string') {
      output[key] = truncate(value);
      continue;
    }

    if (isPlainObject(value)) {
      output[key] = sanitizeData(value as Record<string, unknown>);
      continue;
    }

    output[key] = value;
  }

  return output;
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return normalized.includes('key') ||
    normalized.includes('token') ||
    normalized.includes('secret') ||
    normalized.includes('password') ||
    normalized.includes('authorization');
}

function truncate(value: string): string {
  if (value.length <= 500) {
    return value;
  }

  return `${value.slice(0, 500)}...[truncated]`;
}

function isPlainObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
