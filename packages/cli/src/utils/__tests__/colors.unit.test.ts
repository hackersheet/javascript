import { describe, it, expect, beforeEach, vi } from 'vitest';

import { setNoColor, shouldUseColor, colors, symbols } from '../colors';

vi.mock('picocolors', () => ({
  default: {
    isColorSupported: true,
    green: (text: string) => `\x1b[32m${text}\x1b[39m`,
    red: (text: string) => `\x1b[31m${text}\x1b[39m`,
    yellow: (text: string) => `\x1b[33m${text}\x1b[39m`,
    cyan: (text: string) => `\x1b[36m${text}\x1b[39m`,
    blue: (text: string) => `\x1b[34m${text}\x1b[39m`,
    bold: (text: string) => `\x1b[1m${text}\x1b[22m`,
    dim: (text: string) => `\x1b[2m${text}\x1b[22m`,
  },
}));

describe('colors', () => {
  beforeEach(() => {
    setNoColor(false);
  });

  describe('setNoColor', () => {
    it('disables colors when set to true', () => {
      setNoColor(true);
      expect(shouldUseColor()).toBe(false);
    });

    it('enables colors when set to false', () => {
      setNoColor(false);
      expect(shouldUseColor()).toBe(true);
    });
  });

  describe('shouldUseColor', () => {
    it('returns true when colors are enabled', () => {
      setNoColor(false);
      expect(shouldUseColor()).toBe(true);
    });

    it('returns false when no-color flag is set', () => {
      setNoColor(true);
      expect(shouldUseColor()).toBe(false);
    });
  });

  describe('color functions', () => {
    it('applies green color for success', () => {
      const result = colors.success('test');
      expect(result).toContain('test');
      expect(result).toContain('\x1b[32m');
    });

    it('applies red color for error', () => {
      const result = colors.error('test');
      expect(result).toContain('test');
      expect(result).toContain('\x1b[31m');
    });

    it('applies yellow color for warning', () => {
      const result = colors.warning('test');
      expect(result).toContain('test');
      expect(result).toContain('\x1b[33m');
    });

    it('applies cyan color for info', () => {
      const result = colors.info('test');
      expect(result).toContain('test');
      expect(result).toContain('\x1b[36m');
    });

    it('applies blue color for hint', () => {
      const result = colors.hint('test');
      expect(result).toContain('test');
      expect(result).toContain('\x1b[34m');
    });

    it('applies bold for emphasis', () => {
      const result = colors.emphasis('test');
      expect(result).toContain('test');
      expect(result).toContain('\x1b[1m');
    });

    it('applies dim for supplementary text', () => {
      const result = colors.dim('test');
      expect(result).toContain('test');
      expect(result).toContain('\x1b[2m');
    });

    it('applies bold cyan for path', () => {
      const result = colors.path('/path/to/file');
      expect(result).toContain('/path/to/file');
      expect(result).toContain('\x1b[1m');
      expect(result).toContain('\x1b[36m');
    });
  });

  describe('color functions when disabled', () => {
    beforeEach(() => {
      setNoColor(true);
    });

    it('returns plain text for success when colors disabled', () => {
      expect(colors.success('test')).toBe('test');
    });

    it('returns plain text for error when colors disabled', () => {
      expect(colors.error('test')).toBe('test');
    });

    it('returns plain text for warning when colors disabled', () => {
      expect(colors.warning('test')).toBe('test');
    });

    it('returns plain text for info when colors disabled', () => {
      expect(colors.info('test')).toBe('test');
    });

    it('returns plain text for hint when colors disabled', () => {
      expect(colors.hint('test')).toBe('test');
    });

    it('returns plain text for emphasis when colors disabled', () => {
      expect(colors.emphasis('test')).toBe('test');
    });

    it('returns plain text for dim when colors disabled', () => {
      expect(colors.dim('test')).toBe('test');
    });

    it('returns plain text for path when colors disabled', () => {
      expect(colors.path('/path/to/file')).toBe('/path/to/file');
    });
  });
});

describe('symbols', () => {
  beforeEach(() => {
    setNoColor(false);
  });

  describe('when colors enabled', () => {
    it('returns colored checkmark for success', () => {
      const result = symbols.success();
      expect(result).toContain('✔');
      expect(result).toContain('\x1b[32m');
    });

    it('returns colored cross for error', () => {
      const result = symbols.error();
      expect(result).toContain('✖');
      expect(result).toContain('\x1b[31m');
    });

    it('returns colored warning symbol', () => {
      const result = symbols.warning();
      expect(result).toContain('⚠');
      expect(result).toContain('\x1b[33m');
    });

    it('returns colored info symbol', () => {
      const result = symbols.info();
      expect(result).toContain('ℹ');
      expect(result).toContain('\x1b[36m');
    });
  });

  describe('when colors disabled', () => {
    beforeEach(() => {
      setNoColor(true);
    });

    it('returns plain checkmark for success', () => {
      expect(symbols.success()).toBe('✔');
    });

    it('returns plain cross for error', () => {
      expect(symbols.error()).toBe('✖');
    });

    it('returns plain warning symbol', () => {
      expect(symbols.warning()).toBe('⚠');
    });

    it('returns plain info symbol', () => {
      expect(symbols.info()).toBe('ℹ');
    });
  });
});
