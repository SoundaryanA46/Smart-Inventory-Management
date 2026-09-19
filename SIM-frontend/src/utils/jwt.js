/**
 * JWT helpers for client-side session validation (payload only; no signature verify).
 * Used to avoid sending expired tokens and to clear session when token is expired.
 */

/**
 * Decode JWT payload without verification (client-side; server validates).
 * @param {string} token - JWT string
 * @returns {{ exp?: number; sub?: string } | null}
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if JWT is expired (with 60s buffer so we don't use tokens about to expire).
 * @param {string} token - JWT string
 * @param {number} bufferSeconds - Seconds before exp to consider expired (default 60)
 * @returns {boolean}
 */
export function isTokenExpired(token, bufferSeconds = 60) {
  const payload = decodeJwtPayload(token);
  if (!payload || payload.exp == null) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - bufferSeconds <= now;
}
