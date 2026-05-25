export type OllamaMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OllamaChatOptions = {
  model: string;
  messages: OllamaMessage[];
  host?: string;
};

export async function chatWithOllama(options: OllamaChatOptions): Promise<string> {
  const host = options.host ?? 'http://localhost:11434';

  const response = await fetch(`${host}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: false
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama error ${response.status}: ${body}`);
  }

  const data = await response.json() as { message?: { content?: string } };
  return data.message?.content ?? '';
}
