import { describe, expect, it } from 'vitest';
import { isAIInferenceRequest, configureAIHeaders } from '../../../src/protocols/ai.js';

describe('AI Inference Protocol Handler', () => {
  describe('isAIInferenceRequest', () => {
    describe('detection by path prefix', () => {
      it('should detect OpenAI API requests by /ip/openai path', () => {
        const request = new Request('https://example.com/ip/openai/v1/chat/completions');
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect Anthropic API requests by /ip/anthropic path', () => {
        const request = new Request('https://example.com/ip/anthropic/v1/messages');
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect Gemini API requests by /ip/gemini path', () => {
        const request = new Request(
          'https://example.com/ip/gemini/v1beta/models/gemini-2.0-flash:generateContent'
        );
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect Cohere API requests', () => {
        const request = new Request('https://example.com/ip/cohere/v1/generate');
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect Groq API requests', () => {
        const request = new Request('https://example.com/ip/groq/openai/v1/chat/completions');
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect Mistral AI API requests', () => {
        const request = new Request('https://example.com/ip/mistralai/v1/chat/completions');
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect Together AI API requests', () => {
        const request = new Request('https://example.com/ip/together/v1/chat/completions');
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect Replicate API requests', () => {
        const request = new Request('https://example.com/ip/replicate/v1/predictions');
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });
    });

    describe('detection by common AI endpoints', () => {
      it('should detect /v1/chat/completions endpoint', () => {
        const request = new Request('https://example.com/v1/chat/completions', {
          method: 'POST'
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect /v1/completions endpoint', () => {
        const request = new Request('https://example.com/v1/completions', {
          method: 'POST'
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect /v1/messages endpoint', () => {
        const request = new Request('https://example.com/v1/messages', {
          method: 'POST'
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect /v1/embeddings endpoint', () => {
        const request = new Request('https://example.com/v1/embeddings', {
          method: 'POST'
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect /v1/predictions endpoint', () => {
        const request = new Request('https://example.com/v1/predictions', {
          method: 'POST'
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect /v1/generate endpoint', () => {
        const request = new Request('https://example.com/v1/generate', {
          method: 'POST'
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect /openai/v1/chat/completions endpoint', () => {
        const request = new Request('https://example.com/openai/v1/chat/completions', {
          method: 'POST'
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });
    });

    describe('detection by content type and URL patterns', () => {
      it('should detect AI requests by /chat/ in URL with JSON content type', () => {
        const request = new Request('https://example.com/api/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect AI requests by /completions in URL with JSON content type', () => {
        const request = new Request('https://example.com/api/v1/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect AI requests by /generate in URL with JSON content type', () => {
        const request = new Request('https://example.com/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });

      it('should detect AI requests by /predict in URL with JSON content type', () => {
        const request = new Request('https://example.com/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(true);
      });
    });

    describe('negative cases', () => {
      it('should not detect regular package requests', () => {
        const request = new Request('https://example.com/npm/lodash');
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(false);
      });

      it('should not detect GitHub requests', () => {
        const request = new Request('https://example.com/gh/microsoft/vscode');
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(false);
      });

      it('should not detect Docker registry requests', () => {
        const request = new Request('https://example.com/cr/docker/v2/library/ubuntu/manifests/latest');
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(false);
      });

      it('should not detect non-JSON POST requests as AI', () => {
        const request = new Request('https://example.com/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(false);
      });

      it('should not detect JSON GET requests as AI', () => {
        const request = new Request('https://example.com/api/chat/status', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(false);
      });

      it('should not detect random paths with /chat/ in them', () => {
        const request = new Request('https://example.com/chat/room/123', {
          method: 'GET'
        });
        const url = new URL(request.url);
        expect(isAIInferenceRequest(request, url)).toBe(false);
      });
    });
  });

  describe('configureAIHeaders', () => {
    it('should set Content-Type for POST requests if not already set', () => {
      const request = new Request('https://example.com/ip/openai/v1/chat/completions', {
        method: 'POST',
        headers: {}
      });
      const headers = new Headers();
      configureAIHeaders(headers, request);

      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should not overwrite existing Content-Type for POST requests', () => {
      const request = new Request('https://example.com/ip/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
      const headers = new Headers();
      headers.set('Content-Type', 'text/plain');
      configureAIHeaders(headers, request);

      expect(headers.get('Content-Type')).toBe('text/plain');
    });

    it('should set User-Agent if not already set', () => {
      const request = new Request('https://example.com/ip/openai/v1/chat/completions', {
        method: 'POST'
      });
      const headers = new Headers();
      configureAIHeaders(headers, request);

      expect(headers.get('User-Agent')).toBe('Xget-AI-Proxy/1.0');
    });

    it('should not overwrite existing User-Agent', () => {
      const request = new Request('https://example.com/ip/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'User-Agent': 'Custom-AI-Client/1.0'
        }
      });
      const headers = new Headers();
      headers.set('User-Agent', 'existing-agent');
      configureAIHeaders(headers, request);

      expect(headers.get('User-Agent')).toBe('existing-agent');
    });

    it('should not set Content-Type for GET requests', () => {
      const request = new Request('https://example.com/ip/openai/v1/models', {
        method: 'GET'
      });
      const headers = new Headers();
      configureAIHeaders(headers, request);

      expect(headers.has('Content-Type')).toBe(false);
    });

    it('should not set Content-Type for HEAD requests', () => {
      const request = new Request('https://example.com/ip/openai/v1/models', {
        method: 'HEAD'
      });
      const headers = new Headers();
      configureAIHeaders(headers, request);

      expect(headers.has('Content-Type')).toBe(false);
    });

    it('should preserve existing headers', () => {
      const request = new Request('https://example.com/ip/anthropic/v1/messages', {
        method: 'POST',
        headers: {
          'X-Request-ID': 'req-456'
        }
      });
      const headers = new Headers();
      headers.set('Authorization', 'Bearer sk-ant-xxx');
      configureAIHeaders(headers, request);

      expect(headers.get('Authorization')).toBe('Bearer sk-ant-xxx');
      expect(headers.get('X-Request-ID')).toBe('req-456');
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });
});
