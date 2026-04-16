import { describe, it, expect } from 'vitest';
import { formatBytes, generateChartData } from './utils';

describe('utils', () => {
  describe('formatBytes', () => {
    it('formats 0 bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('formats bytes correctly', () => {
      expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('formats kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('handles custom decimals', () => {
      expect(formatBytes(1500, 0)).toBe('1 KB');
      expect(formatBytes(1500, 3)).toBe('1.465 KB');
    });
  });

  describe('generateChartData', () => {
    it('generates an array of 30 items', () => {
      const data = generateChartData(1000);
      expect(data).toHaveLength(30);
    });

    it('generates correct structure', () => {
      const data = generateChartData(1000);
      expect(data[0]).toHaveProperty('time');
      expect(data[0]).toHaveProperty('speed');
    });

    it('calculates speed based on throughput', () => {
      const throughput = 1024 * 1024 * 1024; // 1 GB/s
      const data = generateChartData(throughput);
      // Speed should be between 0.9 and 1.1 GB/s
      expect(data[0].speed).toBeGreaterThanOrEqual(0.9);
      expect(data[0].speed).toBeLessThanOrEqual(1.1);
    });
  });
});
