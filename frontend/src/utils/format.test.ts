import { formatEur, formatGrams, gainLossClass } from '../utils/format';

describe('formatEur', () => {
  it('formats positive numbers as EUR currency', () => {
    expect(formatEur(1234.5)).toContain('1,234.50');
  });

  it('formats zero', () => {
    expect(formatEur(0)).toContain('0.00');
  });

  it('formats negative numbers', () => {
    expect(formatEur(-500)).toContain('500.00');
  });
});

describe('formatGrams', () => {
  it('appends g unit', () => {
    expect(formatGrams(1000)).toContain('g');
    expect(formatGrams(1000)).toContain('1,000.00');
  });
});

describe('gainLossClass', () => {
  it('returns green for positive', () => expect(gainLossClass(100)).toBe('text-green-600'));
  it('returns red for negative', () => expect(gainLossClass(-1)).toBe('text-red-600'));
  it('returns gray for zero', () => expect(gainLossClass(0)).toBe('text-gray-600'));
});
