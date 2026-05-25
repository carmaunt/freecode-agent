export function createSimpleDiff(oldContent: string, newContent: string): string {
  if (oldContent === newContent) {
    return 'Nenhuma alteração detectada.';
  }

  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const max = Math.max(oldLines.length, newLines.length);
  const output: string[] = [];

  for (let index = 0; index < max; index += 1) {
    const oldLine = oldLines[index];
    const newLine = newLines[index];

    if (oldLine === newLine) {
      continue;
    }

    const lineNumber = index + 1;

    if (oldLine !== undefined) {
      output.push(`- ${lineNumber}: ${oldLine}`);
    }

    if (newLine !== undefined) {
      output.push(`+ ${lineNumber}: ${newLine}`);
    }
  }

  return output.join('\n');
}
