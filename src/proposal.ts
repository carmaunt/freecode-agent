export type WriteFileProposal = {
  action: 'write_file';
  path: string;
  content: string;
};

export type AgentProposal = WriteFileProposal;

export function parseAgentProposal(rawText: string): AgentProposal {
  const jsonText = extractJson(rawText);
  const data = JSON.parse(jsonText) as unknown;

  if (!isRecord(data)) {
    throw new Error('A proposta do modelo não é um objeto JSON válido.');
  }

  if (data.action !== 'write_file') {
    throw new Error('Ação não suportada. Ação esperada: write_file.');
  }

  if (typeof data.path !== 'string' || data.path.trim().length === 0) {
    throw new Error('Campo path inválido ou ausente.');
  }

  if (typeof data.content !== 'string') {
    throw new Error('Campo content inválido ou ausente.');
  }

  return {
    action: 'write_file',
    path: data.path,
    content: data.content
  };
}

function extractJson(rawText: string): string {
  const trimmed = rawText.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error('Nenhum JSON encontrado na resposta do modelo.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
