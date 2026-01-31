import { describe, it, expect } from 'vitest';

import { padZero, getDateComponents } from '../date-format';

describe('padZero', () => {
  it('pads single digit numbers with leading zero', () => {
    expect(padZero(1)).toBe('01');
    expect(padZero(9)).toBe('09');
  });

  it('does not pad double digit numbers', () => {
    expect(padZero(10)).toBe('10');
    expect(padZero(99)).toBe('99');
  });

  it('pads zero correctly', () => {
    expect(padZero(0)).toBe('00');
  });

  it('supports custom length', () => {
    expect(padZero(1, 3)).toBe('001');
    expect(padZero(12, 4)).toBe('0012');
    expect(padZero(123, 5)).toBe('00123');
  });

  it('does not truncate numbers longer than length', () => {
    expect(padZero(100, 2)).toBe('100');
    expect(padZero(1234, 3)).toBe('1234');
  });
});

describe('getDateComponents', () => {
  it('extracts correct components from a specific date', () => {
    const testDate = new Date(2024, 2, 15, 10, 30, 45); // March 15, 2024, 10:30:45

    const result = getDateComponents(testDate);

    expect(result.yyyy).toBe('2024');
    expect(result.mm).toBe('03');
    expect(result.dd).toBe('15');
    expect(result.date).toBe('2024-03-15');
    expect(result.datetime).toBe('2024-03-15 10:30:45');
  });

  it('pads single digit months and days', () => {
    const testDate = new Date(2024, 0, 5, 8, 5, 3); // January 5, 2024, 08:05:03

    const result = getDateComponents(testDate);

    expect(result.mm).toBe('01');
    expect(result.dd).toBe('05');
    expect(result.datetime).toBe('2024-01-05 08:05:03');
  });

  it('handles end of year dates', () => {
    const testDate = new Date(2024, 11, 31, 23, 59, 59); // December 31, 2024, 23:59:59

    const result = getDateComponents(testDate);

    expect(result.yyyy).toBe('2024');
    expect(result.mm).toBe('12');
    expect(result.dd).toBe('31');
    expect(result.datetime).toBe('2024-12-31 23:59:59');
  });

  it('handles midnight', () => {
    const testDate = new Date(2024, 5, 15, 0, 0, 0); // June 15, 2024, 00:00:00

    const result = getDateComponents(testDate);

    expect(result.datetime).toBe('2024-06-15 00:00:00');
  });
});
