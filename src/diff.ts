export type DiffOptions = {
  filePath?: string;
  contextLines?: number;
};

type DiffLine = {
  type: 'context' | 'add' | 'remove';
  oldLine?: number;
  newLine?: number;
  value: string;
};

export function createUnifiedDiff(
  oldContent: string,
  newContent: string,
  options: DiffOptions = {}
): string {
  if (oldContent === newContent) {
    return 'Nenhuma alteração detectada.';
  }

  const filePath = options.filePath ?? 'arquivo';
  const contextLines = options.contextLines ?? 3;
  const oldLines = splitLines(oldContent);
  const newLines = splitLines(newContent);
  const diffLines = buildDiffLines(oldLines, newLines);
  const hunks = buildHunks(diffLines, contextLines);

  return [
    `--- a/${filePath}`,
    `+++ b/${filePath}`,
    ...hunks.map(formatHunk)
  ].join('\n');
}

export function createSimpleDiff(oldContent: string, newContent: string): string {
  return createUnifiedDiff(oldContent, newContent);
}

function splitLines(content: string): string[] {
  if (content.length === 0) return [];
  return content.split('\n');
}

function buildDiffLines(oldLines: string[], newLines: string[]): DiffLine[] {
  const table = buildLcsTable(oldLines, newLines);
  const output: DiffLine[] = [];

  let oldIndex = 0;
  let newIndex = 0;
  let oldLineNumber = 1;
  let newLineNumber = 1;

  while (oldIndex < oldLines.length && newIndex < newLines.length) {
    if (oldLines[oldIndex] === newLines[newIndex]) {
      output.push({
        type: 'context',
        oldLine: oldLineNumber,
        newLine: newLineNumber,
        value: oldLines[oldIndex]
      });
      oldIndex += 1;
      newIndex += 1;
      oldLineNumber += 1;
      newLineNumber += 1;
      continue;
    }

    if (table[oldIndex + 1]?.[newIndex] >= table[oldIndex]?.[newIndex + 1]) {
      output.push({
        type: 'remove',
        oldLine: oldLineNumber,
        value: oldLines[oldIndex]
      });
      oldIndex += 1;
      oldLineNumber += 1;
    } else {
      output.push({
        type: 'add',
        newLine: newLineNumber,
        value: newLines[newIndex]
      });
      newIndex += 1;
      newLineNumber += 1;
    }
  }

  while (oldIndex < oldLines.length) {
    output.push({
      type: 'remove',
      oldLine: oldLineNumber,
      value: oldLines[oldIndex]
    });
    oldIndex += 1;
    oldLineNumber += 1;
  }

  while (newIndex < newLines.length) {
    output.push({
      type: 'add',
      newLine: newLineNumber,
      value: newLines[newIndex]
    });
    newIndex += 1;
    newLineNumber += 1;
  }

  return output;
}

function buildLcsTable(oldLines: string[], newLines: string[]): number[][] {
  const table = Array.from({ length: oldLines.length + 1 }, () =>
    Array.from({ length: newLines.length + 1 }, () => 0)
  );

  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      if (oldLines[oldIndex] === newLines[newIndex]) {
        table[oldIndex][newIndex] = table[oldIndex + 1][newIndex + 1] + 1;
      } else {
        table[oldIndex][newIndex] = Math.max(
          table[oldIndex + 1][newIndex],
          table[oldIndex][newIndex + 1]
        );
      }
    }
  }

  return table;
}

function buildHunks(diffLines: DiffLine[], contextLines: number): DiffLine[][] {
  const changedIndexes = diffLines
    .map((line, index) => line.type === 'context' ? -1 : index)
    .filter((index) => index >= 0);

  if (changedIndexes.length === 0) return [];

  const ranges: Array<{ start: number; end: number }> = [];

  for (const changedIndex of changedIndexes) {
    const start = Math.max(0, changedIndex - contextLines);
    const end = Math.min(diffLines.length - 1, changedIndex + contextLines);
    const previous = ranges.at(-1);

    if (previous && start <= previous.end + 1) {
      previous.end = Math.max(previous.end, end);
    } else {
      ranges.push({ start, end });
    }
  }

  return ranges.map((range) => diffLines.slice(range.start, range.end + 1));
}

function formatHunk(lines: DiffLine[]): string {
  const oldStart = lines.find((line) => line.oldLine !== undefined)?.oldLine ?? 0;
  const newStart = lines.find((line) => line.newLine !== undefined)?.newLine ?? 0;
  const oldCount = lines.filter((line) => line.type !== 'add').length;
  const newCount = lines.filter((line) => line.type !== 'remove').length;

  return [
    `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`,
    ...lines.map(formatDiffLine)
  ].join('\n');
}

function formatDiffLine(line: DiffLine): string {
  if (line.type === 'add') return `+${line.value}`;
  if (line.type === 'remove') return `-${line.value}`;
  return ` ${line.value}`;
}
