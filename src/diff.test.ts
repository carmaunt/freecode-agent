import { describe, expect, it } from 'vitest';
import { createUnifiedDiff } from './diff.js';

describe('createUnifiedDiff', () => {
  it('returns no changes message when contents are equal', () => {
    expect(createUnifiedDiff('a\nb', 'a\nb')).toBe('Nenhuma alteração detectada.');
  });

  it('creates a unified diff with file headers and changed lines', () => {
    const diff = createUnifiedDiff('line 1\nold\nline 3', 'line 1\nnew\nline 3', {
      filePath: 'src/example.ts'
    });

    expect(diff).toContain('--- a/src/example.ts');
    expect(diff).toContain('+++ b/src/example.ts');
    expect(diff).toContain('@@');
    expect(diff).toContain('-old');
    expect(diff).toContain('+new');
  });
});
