import {describe, expect, it} from 'vitest';
import {normalizeUserRole} from './auth';

describe('normalizeUserRole', () => {
  it('preserves citizen access', () => {
    expect(normalizeUserRole('citizen')).toBe('citizen');
  });

  it.each(['admin', 'dlsAdmin', 'dlsadmin', 'auditor', 'analyst'])(
    'maps %s to the admin web workspace',
    role => {
      expect(normalizeUserRole(role)).toBe('admin');
    },
  );

  it('rejects unknown roles', () => {
    expect(normalizeUserRole('owner')).toBeNull();
  });
});
