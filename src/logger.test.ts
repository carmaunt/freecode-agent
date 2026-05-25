import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { writeLog } from './logger.js';

describe('writeLog', () => {
  const originalFreecodeLogs = process.env.FREECODE_LOGS;

  afterEach(() => {
    process.env.FREECODE_LOGS = originalFreecodeLogs;
  });

  it('writes JSONL log entries and redacts sensitive fields', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'freecode-logs-'));

    await writeLog(rootDir, {
      event: 'test.event',
      data: {
        apiKey: 'secret-value',
        normal: 'visible'
      }
    });

    const date = new Date().toISOString().slice(0, 10);
    const logContent = await readFile(
      join(rootDir, '.freecode-agent', 'logs', `${date}.jsonl`),
      'utf8'
    );

    const entry = JSON.parse(logContent.trim()) as {
      event: string;
      data: Record<string, unknown>;
    };

    expect(entry.event).toBe('test.event');
    expect(entry.data.apiKey).toBe('[REDACTED]');
    expect(entry.data.normal).toBe('visible');
  });

  it('can be disabled with FREECODE_LOGS=0', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'freecode-logs-'));
    process.env.FREECODE_LOGS = '0';

    await writeLog(rootDir, {
      event: 'disabled.event'
    });

    const date = new Date().toISOString().slice(0, 10);
    await expect(readFile(join(rootDir, '.freecode-agent', 'logs', `${date}.jsonl`), 'utf8'))
      .rejects
      .toThrow();
  });
});
