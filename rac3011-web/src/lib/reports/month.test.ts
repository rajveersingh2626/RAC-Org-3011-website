import { describe, expect, it } from 'vitest';
import { currentReportMonth, currentRyYear, formatMonthLabel, monthKey, ryYearOf } from './month';

describe('monthKey', () => {
  it('formats a UTC date as YYYY-MM', () => {
    expect(monthKey(new Date(Date.UTC(2026, 7, 15)))).toBe('2026-08');
    expect(monthKey(new Date(Date.UTC(2026, 0, 1)))).toBe('2026-01');
  });
});

describe('ryYearOf', () => {
  it('treats July as the start of the rotary year', () => {
    expect(ryYearOf(new Date(Date.UTC(2026, 6, 1)))).toBe(2026);
    expect(ryYearOf(new Date(Date.UTC(2027, 5, 30)))).toBe(2026);
  });
});

describe('currentReportMonth', () => {
  it('returns the previous calendar month', () => {
    expect(currentReportMonth(new Date(Date.UTC(2026, 8, 4)))).toBe('2026-08');
    expect(currentReportMonth(new Date(Date.UTC(2026, 0, 15)))).toBe('2025-12');
  });
});

describe('formatMonthLabel', () => {
  it('turns a YYYY-MM key into a readable label', () => {
    expect(formatMonthLabel('2026-08')).toBe('August 2026');
    expect(formatMonthLabel('2026-01')).toBe('January 2026');
  });
});

describe('currentRyYear', () => {
  it('matches ryYearOf', () => {
    const now = new Date(Date.UTC(2026, 8, 4));
    expect(currentRyYear(now)).toBe(ryYearOf(now));
  });
});
