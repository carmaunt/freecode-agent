import { afterEach, describe, expect, it, vi } from 'vitest';
import { chatWithModel } from './llm.js';

describe('chatWithModel', () => {
  const originalFetch = globalThis.fetch;
  const originalBaseUrl = process.env.FREECODE_BASE_URL;
  const originalApiKey = process.env.FREECODE_API_KEY;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.FREECODE_BASE_URL = originalBaseUrl;
    process.env.FREECODE_API_KEY = originalApiKey;
    vi.restoreAllMocks();
  });

  it('calls OpenAI-compatible chat completions endpoint', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      choices: [
        {
          message: {
            content: 'ok'
          }
        }
      ]
    }), { status: 200 }));

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await chatWithModel({
      provider: 'openai-compatible',
      baseUrl: 'https://example.test/v1/',
      apiKey: 'test-key',
      model: 'test-model',
      messages: [
        { role: 'user', content: 'hello' }
      ]
    });

    expect(result).toBe('ok');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.test/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key'
        })
      })
    );
  });

  it('requires baseUrl for OpenAI-compatible provider', async () => {
    delete process.env.FREECODE_BASE_URL;

    await expect(chatWithModel({
      provider: 'openai-compatible',
      apiKey: 'test-key',
      model: 'test-model',
      messages: []
    })).rejects.toThrow('baseUrl ausente');
  });

  it('requires apiKey for OpenAI-compatible provider', async () => {
    delete process.env.FREECODE_API_KEY;

    await expect(chatWithModel({
      provider: 'openai-compatible',
      baseUrl: 'https://example.test/v1',
      model: 'test-model',
      messages: []
    })).rejects.toThrow('apiKey ausente');
  });
});
