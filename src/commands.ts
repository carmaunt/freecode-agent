import { spawn } from 'node:child_process';

export type CommandResult = {
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

const ALLOWED_COMMANDS = new Map<string, string[]>([
  ['npm:test', ['npm', 'test']],
  ['npm:build', ['npm', 'run', 'build']],
  ['npm:typecheck', ['npm', 'run', 'typecheck']]
]);

export function listAllowedCommands(): string[] {
  return [...ALLOWED_COMMANDS.keys()];
}

export async function runAllowedCommand(
  commandKey: string,
  cwd: string,
  timeoutMs = 30_000
): Promise<CommandResult> {
  const command = ALLOWED_COMMANDS.get(commandKey);

  if (!command) {
    throw new Error(`Comando não permitido: ${commandKey}`);
  }

  const [bin, ...args] = command;

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
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
        command: command.join(' '),
        exitCode,
        stdout,
        stderr,
        timedOut
      });
    });
  });
}
