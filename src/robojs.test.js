import { describe, it, expect } from 'vitest';
import { getBuckets } from './robojs.js';
import md5 from 'blueimp-md5';

describe('getBuckets', () => {
  it('should return 8 bucket values', () => {
    const hash = md5('test');
    const buckets = getBuckets(hash);
    expect(buckets).toHaveLength(8);
  });

  it('should return values between 0-9', () => {
    const hash = md5('NodeBots');
    const buckets = getBuckets(hash);
    buckets.forEach(bucket => {
      expect(bucket).toBeGreaterThanOrEqual(0);
      expect(bucket).toBeLessThanOrEqual(9);
    });
  });

  it('should be deterministic - same input = same output', () => {
    const hash = md5('Radagast');
    const buckets1 = getBuckets(hash);
    const buckets2 = getBuckets(hash);
    expect(buckets1).toEqual(buckets2);
  });

  it('should produce different buckets for different inputs', () => {
    const hash1 = md5('clawdbot');
    const hash2 = md5('pippin');
    const buckets1 = getBuckets(hash1);
    const buckets2 = getBuckets(hash2);
    expect(buckets1).not.toEqual(buckets2);
  });

  it('should handle UUIDs with dashes', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const buckets = getBuckets(uuid);
    expect(buckets).toHaveLength(8);
  });

  it('should produce consistent results for known input', () => {
    // "test" -> md5 -> "098f6bcd4621d373cade4e832627b4f6"
    const hash = '098f6bcd4621d373cade4e832627b4f6';
    const buckets = getBuckets(hash);
    // These are the actual bucket values for this specific hash
    expect(buckets).toEqual([7, 7, 3, 1, 4, 9, 7, 6]);
  });
});

describe('md5 integration', () => {
  it('should hash empty string consistently', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('should hash "test" consistently', () => {
    expect(md5('test')).toBe('098f6bcd4621d373cade4e832627b4f6');
  });
});
