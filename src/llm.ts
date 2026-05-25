import { chatWithOllama, type OllamaMessage } from './ollama.js';

export type ChatMessage = OllamaMessage;

export type LlmProvider = 'ollama' | 'openai-compatible';

export type ChatOptions = {
  provider: LlmProvider;
  model: string;
  messages: ChatMessage[];
  host?: string;
  baseUrl?: string;
  apiKey?: string;
};

export async function chatWithModel(options: ChatOptions): Promise<string> {
  if (options.provider === 'ollama') {
    return chatWithOllama({
      host: options.host,
      model: options.model,
      messages: options.messages
    });
  }

  if (options.provider === 'openai-compatible') {
    return chatWithOpenAICompatible(options);
  }

  const _exhaustive: never = options.provider;
  throw new Error(`Provider não suportado: ${String(_exhaustive)}`);
}

async function chatWithOpenAICompatible(options: ChatOptions): Promise<string> {
  const baseUrl = options.baseUrl ?? process.env.FREECODE_BASE_URL;
  const apiKey = options.apiKey ?? process.env.FREECODE_API_KEY;

  if (!baseUrl) {
    throw new Error('baseUrl ausente. Use --base-url ou FREECODE_BASE_URL.');
  }

  if (!apiKey) {
    throw new Error('apiKey ausente. Use --api-key ou FREECODE_API_KEY.');
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI-compatible error ${response.status}: ${body}`);
  }

  const data = await response.json() as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  return data.choices?.[0]?.message?.content ?? '';
}
