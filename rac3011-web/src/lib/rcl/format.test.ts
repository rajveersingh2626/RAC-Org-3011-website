import { describe, expect, it } from 'vitest';
import { formatNrr } from './format';

describe('formatNrr', () => {
  it('signs positive values', () => {
    expect(formatNrr(1.5)).toBe('+1.50');
  });

  it('signs negative values', () => {
    expect(formatNrr(-1.5)).toBe('-1.50');
  });

  it('never shows a signed zero', () => {
    expect(formatNrr(0)).toBe('0.00');
    expect(formatNrr(0.004)).toBe('0.00');
    expect(formatNrr(-0.004)).toBe('0.00');
  });

  it('matches the acceptance example (150/5 beats 120/8 in 20ov)', () => {
    expect(formatNrr(1.5)).toBe('+1.50');
    expect(formatNrr(-1.5)).toBe('-1.50');
  });

  it('rounds to 2 decimals', () => {
    expect(formatNrr(0.6666)).toBe('+0.67');
  });
});
