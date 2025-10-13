/**
 * Password validation utilities for user registration and password change.
 * These rules should match the backend requirements:
 * - Minimum length: 8 characters
 * - (Optionally) Require at least one uppercase, one lowercase, one number, one symbol
 * - (Optionally) Disallow common passwords
 */

const MIN_LENGTH = 8;

// Optionally, enable these stricter checks:
const REQUIRE_UPPER = false;
const REQUIRE_LOWER = false;
const REQUIRE_NUMBER = false;
const REQUIRE_SYMBOL = false;

// Optionally, add a list of common passwords to reject
const COMMON_PASSWORDS = [
  'password', '123456', 'qwerty', 'letmein', 'admin', 'welcome', 'iloveyou',
  '12345678', 'abc123', '111111', '123123', 'password1'
];

export function validatePassword(password: string): { valid: boolean; reason?: string } {
  if (typeof password !== 'string' || password.length < MIN_LENGTH) {
    return { valid: false, reason: `Password must be at least ${MIN_LENGTH} characters long.` };
  }
  if (REQUIRE_UPPER && !/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (REQUIRE_LOWER && !/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number.' };
  }
  if (REQUIRE_SYMBOL && !/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character.' };
  }
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return { valid: false, reason: 'Password is too common. Please choose a less common password.' };
  }
  return { valid: true };
}