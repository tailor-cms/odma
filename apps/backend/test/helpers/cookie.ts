import * as setCookieParser from 'set-cookie-parser';

// Types
interface SetCookieHeaders {
  'set-cookie'?: string | string[];
}

/**
 * Parse all Set-Cookie headers using set-cookie-parser
 * Returns an array of parsed cookies with all their attributes
 */
export function parseCookies(
  headers: SetCookieHeaders,
): setCookieParser.Cookie[] {
  const setCookieHeaders = headers['set-cookie'];
  if (!setCookieHeaders) return [];
  const cookieArray = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : [setCookieHeaders];
  return setCookieParser.parse(cookieArray);
}

/**
 * Extract a specific cookie value from response headers
 * Works with httpOnly cookies by reading Set-Cookie headers from HTTP responses
 *
 * @param headers - Response headers containing Set-Cookie
 * @param cookieName - Name of the cookie to extract (default: 'access_token')
 * @returns The cookie value or undefined if not found
 */
export function extractCookie(
  headers: SetCookieHeaders,
  cookieName = 'access_token',
): string | undefined {
  const cookies = parseCookies(headers);
  const targetCookie = cookies.find((c) => c.name === cookieName);
  return targetCookie?.value;
}

/**
 * Get a specific cookie with all its attributes
 * Useful for testing cookie security settings (HttpOnly, Secure, SameSite, etc.)
 *
 * @param headers - Response headers containing Set-Cookie
 * @param cookieName - Name of the cookie to get
 * @returns The parsed cookie object or undefined if not found
 */
export function getCookieWithAttributes(
  headers: SetCookieHeaders,
  cookieName: string,
): setCookieParser.Cookie | undefined {
  const cookies = parseCookies(headers);
  return cookies.find((c) => c.name === cookieName);
}
