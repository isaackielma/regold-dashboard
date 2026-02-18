import { PASSWORD_REGEX } from '../services/authService';

// Unit tests for things that don't need a real DB.
// Integration tests for register/login live in auth.integration.test.ts

describe('PASSWORD_REGEX', () => {
  it('accepts a strong password', () => {
    expect(PASSWORD_REGEX.test('Secure#1')).toBe(true);
    expect(PASSWORD_REGEX.test('MyPass@99')).toBe(true);
  });

  it('rejects passwords without uppercase', () => {
    expect(PASSWORD_REGEX.test('secure#1')).toBe(false);
  });

  it('rejects passwords without lowercase', () => {
    expect(PASSWORD_REGEX.test('SECURE#1')).toBe(false);
  });

  it('rejects passwords without a digit', () => {
    expect(PASSWORD_REGEX.test('SecurePass!')).toBe(false);
  });

  it('rejects passwords without a special character', () => {
    expect(PASSWORD_REGEX.test('Secure123')).toBe(false);
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(PASSWORD_REGEX.test('Se#1')).toBe(false);
  });
});
