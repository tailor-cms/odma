/**
 * Sanitizes user data for logging purposes by only keeping the id field.
 * This approach is more secure than trying to mask arbitrary sensitive fields.
 */
export function sanitizeUser(user: any): { id?: number | string } | null {
  if (!user || typeof user !== 'object') {
    return null;
  }

  return {
    id: user.id || user.sub || null,
  };
}
