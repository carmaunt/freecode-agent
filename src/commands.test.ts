import { describe, expect, it } from 'vitest';
import { listAllowedCommands, runAllowedCommand } from './commands.js';

describe('commands', () => {
  it('lists default allowed commands', () => {
    expect(listAllowedCommands()).toEqual([
      'npm:test',
      'npm:build',
      'npm:typecheck'
    ]);
  });

  it('lists configured allowed commands', () => {
    expect(listAllowedCommands({
      'custom:check': { command: 'npm', args: ['run', 'check'] }
    })).toEqual(['custom:check']);
  });

  it('rejects commands outside the allowlist', async () => {
    await expect(runAllowedCommand('rm:everything', process.cwd()))
      .rejects
      .toThrow('Comando não permitido');
  });
});
