import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export async function confirmAction(question: string): Promise<boolean> {
  const readline = createInterface({ input, output });

  try {
    const answer = await readline.question(`${question} [y/N] `);
    return answer.trim().toLowerCase() === 'y';
  } finally {
    readline.close();
  }
}
