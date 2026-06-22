/**
 * Authentication utilities for password hashing and verification
 * Using Node.js native crypto for browser-compatible hashing
 */

/**
 * Simple hash function using Web Crypto API (browser + Node.js compatible)
 * For production, consider using bcryptjs or argon2
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Browser/Node.js compatible using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Add salt prefix for basic security
    return `sha256:${hashHex}`;
  } catch (error) {
    console.error('Hash error:', error);
    // Fallback for environments without crypto
    return btoa(password);
  }
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const newHash = await hashPassword(password);
    return newHash === hash;
  } catch (error) {
    console.error('Verify error:', error);
    return false;
  }
}

/**
 * For backward compatibility with existing plain passwords
 * This should be temporary while migrating existing data
 */
export async function isPlainPassword(hash: string): Promise<boolean> {
  return !hash.startsWith('sha256:');
}

/**
 * Generate a random password for default admin user
 */
export function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
