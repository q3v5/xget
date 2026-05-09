import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  parseAuthenticate,
  fetchToken,
  getScopeFromUrl,
  responseUnauthorized
} from '../../../src/protocols/docker.js';

describe('Docker Protocol Handler', () => {
  describe('parseAuthenticate', () => {
    it('should parse valid WWW-Authenticate header with realm and service', () => {
      const authenticateStr =
        'Bearer realm="https://auth.docker.io/token",service="registry.docker.io"';
      const result = parseAuthenticate(authenticateStr);

      expect(result.realm).toBe('https://auth.docker.io/token');
      expect(result.service).toBe('registry.docker.io');
    });

    it('should parse WWW-Authenticate header with scope parameter', () => {
      const authenticateStr =
        'Bearer realm="https://auth.example.com/token",service="example.com",scope="repository:user/image:pull"';
      const result = parseAuthenticate(authenticateStr);

      expect(result.realm).toBe('https://auth.example.com/token');
      expect(result.service).toBe('example.com');
    });

    it('should parse Docker Hub authentication header', () => {
      const authenticateStr =
        'Bearer realm="https://auth.ipv6.docker.com/token",service="registry.docker.io",scope="repository:library/ubuntu:pull"';
      const result = parseAuthenticate(authenticateStr);

      expect(result.realm).toBe('https://auth.ipv6.docker.com/token');
      expect(result.service).toBe('registry.docker.io');
    });

    it('should parse GitHub Container Registry authentication header', () => {
      const authenticateStr =
        'Bearer realm="https://ghcr.io/token",service="ghcr.io",scope="repository:user/image:pull"';
      const result = parseAuthenticate(authenticateStr);

      expect(result.realm).toBe('https://ghcr.io/token');
      expect(result.service).toBe('ghcr.io');
    });

    it('should throw error for missing realm', () => {
      const authenticateStr = 'Bearer service="registry.docker.io"';
      expect(() => parseAuthenticate(authenticateStr)).toThrow(
        'invalid Www-Authenticate Header'
      );
    });

    it('should throw error for missing service', () => {
      const authenticateStr = 'Bearer realm="https://auth.docker.io/token"';
      expect(() => parseAuthenticate(authenticateStr)).toThrow(
        'invalid Www-Authenticate Header'
      );
    });

    it('should handle empty authenticate string', () => {
      expect(() => parseAuthenticate('')).toThrow('invalid Www-Authenticate Header');
    });

    it('should handle malformed authenticate string', () => {
      expect(() => parseAuthenticate('Bearer invalid')).toThrow(
        'invalid Www-Authenticate Header'
      );
    });
  });

  describe('fetchToken', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch token with scope parameter', async () => {
      const mockResponse = new Response(JSON.stringify({ token: 'test-token-123' }));
      global.fetch.mockResolvedValue(mockResponse);

      const wwwAuthenticate = {
        realm: 'https://auth.docker.io/token',
        service: 'registry.docker.io'
      };
      const result = await fetchToken(wwwAuthenticate, 'repository:library/ubuntu:pull', '');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('https://auth.docker.io/token'),
          method: 'GET'
        })
      );
    });

    it('should include service parameter in token request', async () => {
      const mockResponse = new Response(JSON.stringify({ token: 'test-token' }));
      global.fetch.mockResolvedValue(mockResponse);

      const wwwAuthenticate = {
        realm: 'https://auth.docker.io/token',
        service: 'registry.docker.io'
      };
      await fetchToken(wwwAuthenticate, 'repository:ubuntu:pull', '');

      const calledUrl = global.fetch.mock.calls[0][0].url;
      expect(calledUrl).toContain('service=registry.docker.io');
    });

    it('should include scope parameter in token request', async () => {
      const mockResponse = new Response(JSON.stringify({ token: 'test-token' }));
      global.fetch.mockResolvedValue(mockResponse);

      const wwwAuthenticate = {
        realm: 'https://auth.docker.io/token',
        service: 'registry.docker.io'
      };
      await fetchToken(wwwAuthenticate, 'repository:library/nginx:pull', '');

      const calledUrl = global.fetch.mock.calls[0][0].url;
      expect(calledUrl).toContain('scope=repository%3Alibrary%2Fnginx%3Apull');
    });

    it('should include authorization header when provided', async () => {
      const mockResponse = new Response(JSON.stringify({ token: 'test-token' }));
      global.fetch.mockResolvedValue(mockResponse);

      const wwwAuthenticate = {
        realm: 'https://auth.docker.io/token',
        service: 'registry.docker.io'
      };
      await fetchToken(
        wwwAuthenticate,
        'repository:private/repo:pull',
        'Basic dXNlcjpwYXNz'
      );

      const fetchOptions = global.fetch.mock.calls[0][1];
      expect(fetchOptions.headers.get('Authorization')).toBe('Basic dXNlcjpwYXNz');
    });

    it('should not include authorization header when empty', async () => {
      const mockResponse = new Response(JSON.stringify({ token: 'test-token' }));
      global.fetch.mockResolvedValue(mockResponse);

      const wwwAuthenticate = {
        realm: 'https://auth.docker.io/token',
        service: 'registry.docker.io'
      };
      await fetchToken(wwwAuthenticate, 'repository:public/image:pull', '');

      const fetchOptions = global.fetch.mock.calls[0][1];
      expect(fetchOptions.headers.has('Authorization')).toBe(false);
    });

    it('should handle empty service gracefully', async () => {
      const mockResponse = new Response(JSON.stringify({ token: 'test-token' }));
      global.fetch.mockResolvedValue(mockResponse);

      const wwwAuthenticate = {
        realm: 'https://auth.example.com/token',
        service: ''
      };
      await fetchToken(wwwAuthenticate, 'repository:user/image:pull', '');

      const calledUrl = global.fetch.mock.calls[0][0].url;
      expect(calledUrl).not.toContain('service=');
    });

    it('should return the response from fetch', async () => {
      const mockTokenData = { token: 'bearer-token-abc123' };
      const mockResponse = new Response(JSON.stringify(mockTokenData));
      global.fetch.mockResolvedValue(mockResponse);

      const wwwAuthenticate = {
        realm: 'https://auth.docker.io/token',
        service: 'registry.docker.io'
      };
      const result = await fetchToken(wwwAuthenticate, 'repository:user/image:pull', '');

      const resultData = await result.json();
      expect(resultData.token).toBe('bearer-token-abc123');
    });
  });

  describe('getScopeFromUrl', () => {
    it('should extract scope for Docker Hub repository', () => {
      const url = new URL('https://example.com/cr/docker/v2/nginx/manifests/latest');
      const effectivePath = '/cr/docker/v2/nginx/manifests/latest';
      const scope = getScopeFromUrl(url, effectivePath, 'cr-docker');

      expect(scope).toBe('repository:library/nginx:pull');
    });

    it('should extract scope for user Docker Hub repository', () => {
      const url = new URL(
        'https://example.com/cr/docker/v2/nginxinc/nginx-unprivileged/manifests/latest'
      );
      const effectivePath = '/cr/docker/v2/nginxinc/nginx-unprivileged/manifests/latest';
      const scope = getScopeFromUrl(url, effectivePath, 'cr-docker');

      expect(scope).toBe('repository:nginxinc/nginx-unprivileged:pull');
    });

    it('should extract scope for GHCR repository', () => {
      const url = new URL(
        'https://example.com/cr/ghcr/v2/user/repo/manifests/latest'
      );
      const effectivePath = '/cr/ghcr/v2/user/repo/manifests/latest';
      const scope = getScopeFromUrl(url, effectivePath, 'cr-ghcr');

      expect(scope).toBe('repository:user/repo:pull');
    });

    it('should extract scope for blobs endpoint', () => {
      const url = new URL(
        'https://example.com/cr/ghcr/v2/user/image/blobs/sha256:abc123def456'
      );
      const effectivePath = '/cr/ghcr/v2/user/image/blobs/sha256:abc123def456';
      const scope = getScopeFromUrl(url, effectivePath, 'cr-ghcr');

      expect(scope).toBe('repository:user/image:pull');
    });

    it('should extract scope for tags endpoint', () => {
      const url = new URL(
        'https://example.com/cr/ghcr/v2/user/image/tags/list'
      );
      const effectivePath = '/cr/ghcr/v2/user/image/tags/list';
      const scope = getScopeFromUrl(url, effectivePath, 'cr-ghcr');

      expect(scope).toBe('repository:user/image:pull');
    });

    it('should extract scope for referrers endpoint', () => {
      const url = new URL(
        'https://example.com/cr/ghcr/v2/user/image/referrers/sha256:abc123'
      );
      const effectivePath = '/cr/ghcr/v2/user/image/referrers/sha256:abc123';
      const scope = getScopeFromUrl(url, effectivePath, 'cr-ghcr');

      expect(scope).toBe('repository:user/image:pull');
    });

    it('should return catalog scope for _catalog endpoint', () => {
      const url = new URL('https://example.com/cr/docker/v2/_catalog');
      const effectivePath = '/cr/docker/v2/_catalog';
      const scope = getScopeFromUrl(url, effectivePath, 'cr-docker');

      expect(scope).toBe('registry:catalog:*');
    });

    it('should return empty string for invalid paths', () => {
      const url = new URL('https://example.com/cr/docker/v2/');
      const effectivePath = '/cr/docker/v2/';
      const scope = getScopeFromUrl(url, effectivePath, 'cr-docker');

      expect(scope).toBe('');
    });

    it('should handle deeply nested repository paths', () => {
      const url = new URL(
        'https://example.com/cr/ghcr/v2/org/team/project/image/manifests/v1.0.0'
      );
      const effectivePath = '/cr/ghcr/v2/org/team/project/image/manifests/v1.0.0';
      const scope = getScopeFromUrl(url, effectivePath, 'cr-ghcr');

      expect(scope).toBe('repository:org/team/project/image:pull');
    });

    it('should handle paths without manifest suffix', () => {
      const url = new URL('https://example.com/cr/docker/v2/library/ubuntu');
      const effectivePath = '/cr/docker/v2/library/ubuntu';
      const scope = getScopeFromUrl(url, effectivePath, 'cr-docker');

      expect(scope).toBe('repository:library/ubuntu:pull');
    });
  });

  describe('responseUnauthorized', () => {
    it('should create 401 response with WWW-Authenticate header', () => {
      const url = new URL('https://example.com/cr/docker/v2/library/ubuntu');
      const response = responseUnauthorized(url);

      expect(response.status).toBe(401);
      expect(response.headers.get('WWW-Authenticate')).toBe(
        'Bearer realm="https://example.com/v2/auth",service="Xget"'
      );
    });

    it('should include proper JSON error body', async () => {
      const url = new URL('https://example.com/cr/ghcr/v2/user/repo');
      const response = responseUnauthorized(url);
      const body = await response.json();

      expect(body.errors).toBeInstanceOf(Array);
      expect(body.errors[0].code).toBe('UNAUTHORIZED');
      expect(body.errors[0].message).toBe('authentication required');
    });

    it('should set correct content type', () => {
      const url = new URL('https://example.com/cr/docker/v2/');
      const response = responseUnauthorized(url);

      expect(response.headers.get('Content-Type')).toContain('application/json');
    });

    it('should handle different hostnames correctly', () => {
      const url1 = new URL('https://xget.example.com/cr/docker/v2/library/nginx');
      const url2 = new URL('https://cdn.example.com/cr/ghcr/v2/user/image');

      const response1 = responseUnauthorized(url1);
      const response2 = responseUnauthorized(url2);

      expect(response1.headers.get('WWW-Authenticate')).toContain('xget.example.com');
      expect(response2.headers.get('WWW-Authenticate')).toContain('cdn.example.com');
    });
  });
});
