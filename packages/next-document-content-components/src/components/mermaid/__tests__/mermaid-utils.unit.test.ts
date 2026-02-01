import { describe, it, expect } from 'vitest';

import { hasValidSvgDimensions, normalizeCode } from '../mermaid-utils';

describe('normalizeCode', () => {
  describe('trailing semicolon removal', () => {
    it('removes trailing semicolon from single line', () => {
      expect(normalizeCode('A-->B;')).toBe('A --> B');
    });

    it('removes trailing semicolons from multiple lines', () => {
      const input = `graph TD;
A-->B;
B-->C;`;
      const expected = `graph TD
A --> B
B --> C`;
      expect(normalizeCode(input)).toBe(expected);
    });

    it('preserves whitespace after semicolon removal', () => {
      expect(normalizeCode('A-->B;  ')).toBe('A --> B  ');
    });

    it('does not remove semicolons in the middle of line', () => {
      expect(normalizeCode('A["text; more"]')).toBe('A["text; more"]');
    });
  });

  describe('arrow spacing', () => {
    it('adds space before arrow when word character precedes', () => {
      expect(normalizeCode('A-->')).toBe('A -->');
    });

    it('adds space after arrow when word character follows', () => {
      expect(normalizeCode('-->B')).toBe('--> B');
    });

    it('adds spaces around arrow between word characters', () => {
      expect(normalizeCode('A-->B')).toBe('A --> B');
    });

    it('handles multiple arrows in one line', () => {
      expect(normalizeCode('A-->B-->C')).toBe('A --> B --> C');
    });

    it('does not add extra spaces if already present', () => {
      expect(normalizeCode('A --> B')).toBe('A --> B');
    });

    it('handles arrow at start of line', () => {
      expect(normalizeCode('-->A')).toBe('--> A');
    });

    it('handles arrow at end of line', () => {
      expect(normalizeCode('A-->')).toBe('A -->');
    });
  });

  describe('combined transformations', () => {
    it('normalizes typical flowchart code', () => {
      const input = `graph TD;
A-->B;
B-->C;
C-->D;`;
      const expected = `graph TD
A --> B
B --> C
C --> D`;
      expect(normalizeCode(input)).toBe(expected);
    });

    it('handles complex mermaid diagram', () => {
      const input = `sequenceDiagram;
Alice->>Bob: Hello;
Bob->>Alice: Hi;`;
      // Note: ->> is not -->  so it won't be modified
      const expected = `sequenceDiagram
Alice->>Bob: Hello
Bob->>Alice: Hi`;
      expect(normalizeCode(input)).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(normalizeCode('')).toBe('');
    });

    it('handles single line without transformations needed', () => {
      expect(normalizeCode('graph TD')).toBe('graph TD');
    });

    it('handles lines with only whitespace', () => {
      expect(normalizeCode('  \n  ')).toBe('  \n  ');
    });

    it('preserves other special characters', () => {
      expect(normalizeCode('A["Label with special chars: <>"]')).toBe('A["Label with special chars: <>"]');
    });
  });
});

describe('hasValidSvgDimensions', () => {
  describe('valid dimensions', () => {
    it('returns true for positive integer dimensions', () => {
      const svg = '<svg width="100" height="200"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(true);
    });

    it('returns true for positive decimal dimensions', () => {
      const svg = '<svg width="100.5" height="200.75"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(true);
    });

    it('returns true for very small positive dimensions', () => {
      const svg = '<svg width="0.1" height="0.001"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(true);
    });

    it('returns true for large dimensions', () => {
      const svg = '<svg width="10000" height="20000"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(true);
    });
  });

  describe('invalid dimensions', () => {
    it('returns false for negative width', () => {
      const svg = '<svg width="-100" height="200"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(false);
    });

    it('returns false for negative height', () => {
      const svg = '<svg width="100" height="-200"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(false);
    });

    it('returns false for zero width', () => {
      const svg = '<svg width="0" height="200"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(false);
    });

    it('returns false for zero height', () => {
      const svg = '<svg width="100" height="0"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(false);
    });

    it('returns false for Infinity width', () => {
      const svg = '<svg width="Infinity" height="200"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(false);
    });

    it('returns false for Infinity height', () => {
      const svg = '<svg width="100" height="Infinity"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(false);
    });

    it('returns false for -Infinity', () => {
      const svg = '<svg width="-Infinity" height="200"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(false);
    });

    it('returns false for NaN width', () => {
      const svg = '<svg width="NaN" height="200"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(false);
    });

    it('returns false for NaN height', () => {
      const svg = '<svg width="100" height="NaN"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(false);
    });
  });

  describe('missing dimensions', () => {
    it('returns false when width is missing', () => {
      const svg = '<svg height="200"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(false);
    });

    it('returns false when height is missing', () => {
      const svg = '<svg width="100"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(false);
    });

    it('returns false when both are missing', () => {
      const svg = '<svg></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(hasValidSvgDimensions('')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles dimensions with units (treated as valid numbers)', () => {
      // parseFloat will parse "100px" as 100
      const svg = '<svg width="100px" height="200px"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(true);
    });

    it('handles SVG with other attributes', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="200" viewBox="0 0 100 200"></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(true);
    });

    it('handles multiline SVG', () => {
      const svg = `<svg
        width="100"
        height="200">
      </svg>`;
      expect(hasValidSvgDimensions(svg)).toBe(true);
    });

    it('handles SVG with content', () => {
      const svg = '<svg width="100" height="200"><rect x="0" y="0" width="100" height="200"/></svg>';
      expect(hasValidSvgDimensions(svg)).toBe(true);
    });
  });
});
