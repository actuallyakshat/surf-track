import { describe, it, expect } from 'vitest';
import { getDomainFromUrl, isIgnoredDomain, DEFAULT_IGNORED_DOMAINS } from './domain-utils';

describe('domain-utils', () => {
  describe('getDomainFromUrl', () => {
    it('should extract hostname from a valid URL with protocol', () => {
      expect(getDomainFromUrl('https://www.google.com')).toBe('www.google.com');
      expect(getDomainFromUrl('http://example.com/path')).toBe('example.com');
    });

    it('should extract hostname from a URL without protocol', () => {
      expect(getDomainFromUrl('www.google.com')).toBe('www.google.com');
      expect(getDomainFromUrl('google.com/path')).toBe('google.com');
    });

    it('should handle URLs with query parameters', () => {
      expect(getDomainFromUrl('https://youtube.com/watch?v=123')).toBe('youtube.com');
    });

    it('should return empty string for empty input', () => {
      expect(getDomainFromUrl('')).toBe('');
    });

    it('should return "local file" for file protocol', () => {
      expect(getDomainFromUrl('file:///Users/user/doc.txt')).toBe('local file');
    });

    it('should handle chrome:// URLs', () => {
      expect(getDomainFromUrl('chrome://extensions')).toBe('extensions');
      expect(getDomainFromUrl('chrome://newtab')).toBe('newtab');
    });

    it('should return original string if parsing fails', () => {
      // "invalid" might be interpreted as https://invalid by the try/catch block fallback
      // So we need something that definitely fails new URL() even with https:// attached?
      // Most strings are valid URLs if you attach a protocol (e.g. https://not a url will allow spaces? No, spaces are invalid).
      expect(getDomainFromUrl('not a url with spaces')).toBe('not a url with spaces');
    });
  });

  describe('isIgnoredDomain', () => {
    it('should return true for domains in the default ignored list', () => {
      expect(isIgnoredDomain('newtab')).toBe(true);
      expect(isIgnoredDomain('localhost')).toBe(true);
      expect(isIgnoredDomain('extensions')).toBe(true);
    });

    it('should return false for domains not in the ignored list', () => {
      expect(isIgnoredDomain('google.com')).toBe(false);
      expect(isIgnoredDomain('example.com')).toBe(false);
    });

    it('should work with a custom ignored list', () => {
      const customList = ['example.com', 'test.com'];
      expect(isIgnoredDomain('example.com', customList)).toBe(true);
      expect(isIgnoredDomain('google.com', customList)).toBe(false);
      expect(isIgnoredDomain('newtab', customList)).toBe(false); // default list ignored
    });

    it('should return false for empty domain', () => {
      expect(isIgnoredDomain('')).toBe(false);
    });

    it('should confirm DEFAULT_IGNORED_DOMAINS contains expected values', () => {
      expect(DEFAULT_IGNORED_DOMAINS).toContain('newtab');
      expect(DEFAULT_IGNORED_DOMAINS).toContain('extensions');
      expect(DEFAULT_IGNORED_DOMAINS).toContain('localhost');
    });
  });
});
