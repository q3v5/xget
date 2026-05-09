import { describe, expect, it } from 'vitest';
import {
  isHuggingFaceAPIRequest,
  configureHuggingFaceHeaders
} from '../../../src/protocols/huggingface.js';

describe('HuggingFace Protocol Handler', () => {
  describe('isHuggingFaceAPIRequest', () => {
    it('should detect HuggingFace API requests by path prefix', () => {
      const request1 = new Request('https://example.com/hf/api/models');
      const url1 = new URL(request1.url);
      expect(isHuggingFaceAPIRequest(request1, url1)).toBe(true);

      const request2 = new Request('https://example.com/hf/api/datasets');
      const url2 = new URL(request2.url);
      expect(isHuggingFaceAPIRequest(request2, url2)).toBe(true);
    });

    it('should detect HuggingFace token endpoint requests', () => {
      const request = new Request('https://example.com/hf/token');
      const url = new URL(request.url);
      expect(isHuggingFaceAPIRequest(request, url)).toBe(true);
    });

    it('should not detect non-HuggingFace requests', () => {
      const request = new Request('https://example.com/npm/react');
      const url = new URL(request.url);
      expect(isHuggingFaceAPIRequest(request, url)).toBe(false);
    });

    it('should not detect GitHub requests', () => {
      const request = new Request('https://example.com/gh/microsoft/vscode');
      const url = new URL(request.url);
      expect(isHuggingFaceAPIRequest(request, url)).toBe(false);
    });

    it('should not detect AI inference provider requests', () => {
      const request = new Request('https://example.com/ip/openai/v1/chat/completions');
      const url = new URL(request.url);
      expect(isHuggingFaceAPIRequest(request, url)).toBe(false);
    });

    it('should handle nested HuggingFace API paths', () => {
      const request = new Request('https://example.com/hf/api/spaces/my-org/my-space');
      const url = new URL(request.url);
      expect(isHuggingFaceAPIRequest(request, url)).toBe(true);
    });

    it('should handle HuggingFace inference API paths', () => {
      const request = new Request('https://example.com/hf/api/inference');
      const url = new URL(request.url);
      expect(isHuggingFaceAPIRequest(request, url)).toBe(true);
    });

    it('should not match partial path segments', () => {
      const request = new Request('https://example.com/something/hf/other');
      const url = new URL(request.url);
      expect(isHuggingFaceAPIRequest(request, url)).toBe(false);
    });
  });

  describe('configureHuggingFaceHeaders', () => {
    it('should pass through Authorization header if present', () => {
      const request = new Request('https://example.com/hf/api/models', {
        headers: {
          Authorization: 'Bearer hf_token_123'
        }
      });
      const headers = new Headers();
      configureHuggingFaceHeaders(headers, request);

      expect(headers.get('Authorization')).toBe('Bearer hf_token_123');
    });

    it('should not set Authorization if not present in request', () => {
      const request = new Request('https://example.com/hf/api/models');
      const headers = new Headers();
      configureHuggingFaceHeaders(headers, request);

      expect(headers.has('Authorization')).toBe(false);
    });

    it('should set Content-Type for POST requests if not already set', () => {
      const request = new Request('https://example.com/hf/api/models', {
        method: 'POST',
        headers: {}
      });
      const headers = new Headers();
      configureHuggingFaceHeaders(headers, request);

      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should not overwrite existing Content-Type for POST requests', () => {
      const request = new Request('https://example.com/hf/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const headers = new Headers();
      headers.set('Content-Type', 'custom/content-type');
      configureHuggingFaceHeaders(headers, request);

      expect(headers.get('Content-Type')).toBe('custom/content-type');
    });

    it('should not set Content-Type for GET requests', () => {
      const request = new Request('https://example.com/hf/api/models', {
        method: 'GET'
      });
      const headers = new Headers();
      configureHuggingFaceHeaders(headers, request);

      expect(headers.has('Content-Type')).toBe(false);
    });

    it('should not set Content-Type for HEAD requests', () => {
      const request = new Request('https://example.com/hf/api/models', {
        method: 'HEAD'
      });
      const headers = new Headers();
      configureHuggingFaceHeaders(headers, request);

      expect(headers.has('Content-Type')).toBe(false);
    });

    it('should preserve existing headers', () => {
      const request = new Request('https://example.com/hf/api/models', {
        headers: {
          Authorization: 'Bearer hf_token'
        }
      });
      const headers = new Headers();
      headers.set('X-Custom-Header', 'custom-value');
      configureHuggingFaceHeaders(headers, request);

      expect(headers.get('Authorization')).toBe('Bearer hf_token');
      expect(headers.get('X-Custom-Header')).toBe('custom-value');
    });

    it('should handle request with multiple headers', () => {
      const request = new Request('https://example.com/hf/api/datasets', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer hf_token',
          'X-Request-ID': 'req-123'
        }
      });
      const headers = new Headers();
      configureHuggingFaceHeaders(headers, request);

      expect(headers.get('Authorization')).toBe('Bearer hf_token');
      expect(headers.get('X-Request-ID')).toBe('req-123');
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });
});
