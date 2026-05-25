import { describe, expect, it } from 'vitest';
import { parseAgentProposal } from './proposal.js';

describe('parseAgentProposal', () => {
  it('parses write_file proposals', () => {
    const proposal = parseAgentProposal(JSON.stringify({
      action: 'write_file',
      path: 'src/example.ts',
      content: 'export const value = 1;\n'
    }));

    expect(proposal).toEqual({
      action: 'write_file',
      path: 'src/example.ts',
      content: 'export const value = 1;\n'
    });
  });

  it('parses run_command proposals', () => {
    const proposal = parseAgentProposal(JSON.stringify({
      action: 'run_command',
      command: 'npm:typecheck'
    }));

    expect(proposal).toEqual({
      action: 'run_command',
      command: 'npm:typecheck'
    });
  });

  it('throws on unsupported actions', () => {
    expect(() => parseAgentProposal(JSON.stringify({
      action: 'delete_file',
      path: 'src/example.ts'
    }))).toThrow('Ação não suportada');
  });
});
