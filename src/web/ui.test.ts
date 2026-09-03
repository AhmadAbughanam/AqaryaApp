import {describe, expect, it} from 'vitest';
import {formatDate, formatJod} from './ui';

describe('web formatters', () => {
  it('formats JOD amounts for display', () => {
    expect(formatJod(1250)).toContain('1,250');
  });

  it('returns a safe placeholder for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDate(null)).toBe('—');
  });
});
