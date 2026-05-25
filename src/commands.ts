import { spawn } from 'node:child_process';
import { type AllowedCommand } from './config.js';

export type CommandResult = {
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

export const DEFAULT_ALLOWED_COMMANDS: Record<string, AllowedCommand> = {
  'npm:test': { command: 'npm', args: ['test'] },
  'npm:build': { command: 'npm', args: ['run', 'build'] },
  'npm:typecheck': { command: 'npm', args: ['run', 'typecheck'] }
};

export function listAllowedCommands(
  allowedCommands: Record<string, AllowedCommand> = DEFAULT_ALLOWED_COMMANDS
): string[] {
  return Object.keys(allowedCommands);
}

export async function runAllowedCommand(
  commandKey: string,
  cwd: string,
  allowedCommands: Record<string, AllowedCommand> = DEFAULT_ALLOWED_COMMANDS,
  timeoutMs = 30_000
): Promise<CommandResult> {
  const command = allowedCommands[commandKey];

  if (!command) {
    throw new Error(`Comando não permitido: ${commandKey}`);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command.command, command.args, {
      cwd,
      shell: process.platform === 'win32',
      env: process.env
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({
        command: [command.command, ...command.args].join(' '),
        exitCode,
        stdout,
        stderr,
        timedOut
      });
    });
  });
}
