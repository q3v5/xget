import { describe, expect, it } from 'vitest';
import { createConfig, CONFIG } from '../../../src/config/index.js';

describe('Configuration Module', () => {
  describe('CONFIG (Default Configuration)', () => {
    it('should have correct default timeout value', () => {
      expect(CONFIG.TIMEOUT_SECONDS).toBe(30);
    });

    it('should have correct default max retries', () => {
      expect(CONFIG.MAX_RETRIES).toBe(3);
    });

    it('should have correct default retry delay', () => {
      expect(CONFIG.RETRY_DELAY_MS).toBe(1000);
    });

    it('should have correct default cache duration', () => {
      expect(CONFIG.CACHE_DURATION).toBe(1800);
    });

    it('should have correct default allowed methods', () => {
      expect(CONFIG.SECURITY.ALLOWED_METHODS).toEqual(['GET', 'HEAD']);
    });

    it('should have correct default allowed origins', () => {
      expect(CONFIG.SECURITY.ALLOWED_ORIGINS).toEqual(['*']);
    });

    it('should have correct default max path length', () => {
      expect(CONFIG.SECURITY.MAX_PATH_LENGTH).toBe(2048);
    });

    it('should have PLATFORMS object defined', () => {
      expect(CONFIG.PLATFORMS).toBeDefined();
      expect(typeof CONFIG.PLATFORMS).toBe('object');
    });

    it('should have common platforms in PLATFORMS', () => {
      expect(CONFIG.PLATFORMS.gh).toBe('https://github.com');
      expect(CONFIG.PLATFORMS.npm).toBe('https://registry.npmjs.org');
      expect(CONFIG.PLATFORMS.pypi).toBe('https://pypi.org');
    });
  });

  describe('createConfig', () => {
    it('should return default config when no environment provided', () => {
      const config = createConfig();
      expect(config.TIMEOUT_SECONDS).toBe(30);
      expect(config.MAX_RETRIES).toBe(3);
      expect(config.CACHE_DURATION).toBe(1800);
    });

    it('should return default config when empty environment provided', () => {
      const config = createConfig({});
      expect(config.TIMEOUT_SECONDS).toBe(30);
      expect(config.MAX_RETRIES).toBe(3);
    });

    describe('TIMEOUT_SECONDS override', () => {
      it('should parse string environment variable', () => {
        const config = createConfig({ TIMEOUT_SECONDS: '60' });
        expect(config.TIMEOUT_SECONDS).toBe(60);
      });

      it('should fallback to default for invalid value', () => {
        const config = createConfig({ TIMEOUT_SECONDS: 'invalid' });
        expect(config.TIMEOUT_SECONDS).toBe(30);
      });

      it('should fallback to default for empty string', () => {
        const config = createConfig({ TIMEOUT_SECONDS: '' });
        expect(config.TIMEOUT_SECONDS).toBe(30);
      });

      it('should handle numeric input', () => {
        const config = createConfig({ TIMEOUT_SECONDS: 120 });
        expect(config.TIMEOUT_SECONDS).toBe(120);
      });

      it('should handle zero value', () => {
        const config = createConfig({ TIMEOUT_SECONDS: '0' });
        expect(config.TIMEOUT_SECONDS).toBe(0);
      });

      it('should handle negative values', () => {
        const config = createConfig({ TIMEOUT_SECONDS: '-10' });
        expect(config.TIMEOUT_SECONDS).toBe(-10);
      });
    });

    describe('MAX_RETRIES override', () => {
      it('should parse string environment variable', () => {
        const config = createConfig({ MAX_RETRIES: '5' });
        expect(config.MAX_RETRIES).toBe(5);
      });

      it('should fallback to default for invalid value', () => {
        const config = createConfig({ MAX_RETRIES: 'invalid' });
        expect(config.MAX_RETRIES).toBe(3);
      });

      it('should handle numeric input', () => {
        const config = createConfig({ MAX_RETRIES: 10 });
        expect(config.MAX_RETRIES).toBe(10);
      });

      it('should handle zero value', () => {
        const config = createConfig({ MAX_RETRIES: '0' });
        expect(config.MAX_RETRIES).toBe(0);
      });
    });

    describe('RETRY_DELAY_MS override', () => {
      it('should parse string environment variable', () => {
        const config = createConfig({ RETRY_DELAY_MS: '2000' });
        expect(config.RETRY_DELAY_MS).toBe(2000);
      });

      it('should fallback to default for invalid value', () => {
        const config = createConfig({ RETRY_DELAY_MS: 'invalid' });
        expect(config.RETRY_DELAY_MS).toBe(1000);
      });

      it('should handle numeric input', () => {
        const config = createConfig({ RETRY_DELAY_MS: 500 });
        expect(config.RETRY_DELAY_MS).toBe(500);
      });
    });

    describe('CACHE_DURATION override', () => {
      it('should parse string environment variable', () => {
        const config = createConfig({ CACHE_DURATION: '3600' });
        expect(config.CACHE_DURATION).toBe(3600);
      });

      it('should fallback to default for invalid value', () => {
        const config = createConfig({ CACHE_DURATION: 'invalid' });
        expect(config.CACHE_DURATION).toBe(1800);
      });

      it('should handle 1 hour cache duration', () => {
        const config = createConfig({ CACHE_DURATION: '3600' });
        expect(config.CACHE_DURATION).toBe(3600);
      });

      it('should handle 1 day cache duration', () => {
        const config = createConfig({ CACHE_DURATION: '86400' });
        expect(config.CACHE_DURATION).toBe(86400);
      });
    });

    describe('ALLOWED_METHODS override', () => {
      it('should parse comma-separated methods', () => {
        const config = createConfig({ ALLOWED_METHODS: 'GET,HEAD,POST' });
        expect(config.SECURITY.ALLOWED_METHODS).toEqual(['GET', 'HEAD', 'POST']);
      });

      it('should handle single method', () => {
        const config = createConfig({ ALLOWED_METHODS: 'GET' });
        expect(config.SECURITY.ALLOWED_METHODS).toEqual(['GET']);
      });

      it('should handle methods with spaces', () => {
        const config = createConfig({ ALLOWED_METHODS: 'GET, HEAD, POST' });
        expect(config.SECURITY.ALLOWED_METHODS).toEqual(['GET', 'HEAD', 'POST']);
      });

      it('should handle all standard methods', () => {
        const config = createConfig({
          ALLOWED_METHODS: 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS'
        });
        expect(config.SECURITY.ALLOWED_METHODS).toEqual([
          'GET',
          'HEAD',
          'POST',
          'PUT',
          'PATCH',
          'DELETE',
          'OPTIONS'
        ]);
      });

      it('should fallback to default for non-string value', () => {
        const config = createConfig({ ALLOWED_METHODS: 123 });
        expect(config.SECURITY.ALLOWED_METHODS).toEqual(['GET', 'HEAD']);
      });
    });

    describe('ALLOWED_ORIGINS override', () => {
      it('should parse comma-separated origins', () => {
        const config = createConfig({
          ALLOWED_ORIGINS: 'https://example.com,https://app.example.com'
        });
        expect(config.SECURITY.ALLOWED_ORIGINS).toEqual([
          'https://example.com',
          'https://app.example.com'
        ]);
      });

      it('should handle single origin', () => {
        const config = createConfig({ ALLOWED_ORIGINS: 'https://example.com' });
        expect(config.SECURITY.ALLOWED_ORIGINS).toEqual(['https://example.com']);
      });

      it('should handle wildcard origin', () => {
        const config = createConfig({ ALLOWED_ORIGINS: '*' });
        expect(config.SECURITY.ALLOWED_ORIGINS).toEqual(['*']);
      });

      it('should handle origins with ports', () => {
        const config = createConfig({
          ALLOWED_ORIGINS: 'https://example.com:8080,https://app.example.com:3000'
        });
        expect(config.SECURITY.ALLOWED_ORIGINS).toEqual([
          'https://example.com:8080',
          'https://app.example.com:3000'
        ]);
      });

      it('should fallback to default for non-string value', () => {
        const config = createConfig({ ALLOWED_ORIGINS: 123 });
        expect(config.SECURITY.ALLOWED_ORIGINS).toEqual(['*']);
      });
    });

    describe('MAX_PATH_LENGTH override', () => {
      it('should parse string environment variable', () => {
        const config = createConfig({ MAX_PATH_LENGTH: '4096' });
        expect(config.SECURITY.MAX_PATH_LENGTH).toBe(4096);
      });

      it('should fallback to default for invalid value', () => {
        const config = createConfig({ MAX_PATH_LENGTH: 'invalid' });
        expect(config.SECURITY.MAX_PATH_LENGTH).toBe(2048);
      });

      it('should handle numeric input', () => {
        const config = createConfig({ MAX_PATH_LENGTH: 8192 });
        expect(config.SECURITY.MAX_PATH_LENGTH).toBe(8192);
      });

      it('should handle increased path length for long repository paths', () => {
        const config = createConfig({ MAX_PATH_LENGTH: '8192' });
        expect(config.SECURITY.MAX_PATH_LENGTH).toBe(8192);
      });
    });

    describe('combined environment overrides', () => {
      it('should apply all environment overrides together', () => {
        const env = {
          TIMEOUT_SECONDS: '60',
          MAX_RETRIES: '5',
          RETRY_DELAY_MS: '2000',
          CACHE_DURATION: '3600',
          ALLOWED_METHODS: 'GET,HEAD,POST,PUT',
          ALLOWED_ORIGINS: 'https://example.com,https://app.example.com',
          MAX_PATH_LENGTH: '4096'
        };
        const config = createConfig(env);

        expect(config.TIMEOUT_SECONDS).toBe(60);
        expect(config.MAX_RETRIES).toBe(5);
        expect(config.RETRY_DELAY_MS).toBe(2000);
        expect(config.CACHE_DURATION).toBe(3600);
        expect(config.SECURITY.ALLOWED_METHODS).toEqual(['GET', 'HEAD', 'POST', 'PUT']);
        expect(config.SECURITY.ALLOWED_ORIGINS).toEqual([
          'https://example.com',
          'https://app.example.com'
        ]);
        expect(config.SECURITY.MAX_PATH_LENGTH).toBe(4096);
      });

      it('should apply partial environment overrides', () => {
        const env = {
          TIMEOUT_SECONDS: '120',
          ALLOWED_METHODS: 'GET,HEAD,POST'
        };
        const config = createConfig(env);

        expect(config.TIMEOUT_SECONDS).toBe(120);
        expect(config.SECURITY.ALLOWED_METHODS).toEqual(['GET', 'HEAD', 'POST']);
        expect(config.MAX_RETRIES).toBe(3);
        expect(config.RETRY_DELAY_MS).toBe(1000);
        expect(config.CACHE_DURATION).toBe(1800);
      });

      it('should maintain PLATFORMS from default config', () => {
        const config = createConfig({ TIMEOUT_SECONDS: '60' });
        expect(config.PLATFORMS).toEqual(CONFIG.PLATFORMS);
      });
    });
  });
});
