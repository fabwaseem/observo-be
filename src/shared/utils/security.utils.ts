import { BadRequestException } from '@nestjs/common';

/**
 * Sanitizes text input by removing potential XSS and SQL injection patterns
 */
export function sanitizeText(text: string): string {
  if (!text) return text;

  // Remove any HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Remove potential SQL injection patterns
  text = text.replace(
    /(\b(select|insert|update|delete|drop|union|exec|eval)\b)/gi,
    '',
  );

  // Remove script tags and their contents
  text = text.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    '',
  );

  // Remove null bytes and other control characters
  text = text.replace(/[\x00-\x1F\x7F]/g, '');

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Validates and sanitizes a UUID
 */
export function validateUUID(uuid: string): string {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new BadRequestException('Invalid UUID format');
  }
  return uuid.toLowerCase();
}

/**
 * Rate limiting helper - returns true if request should be blocked
 */
export function shouldRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  store: Map<string, number[]>,
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get existing timestamps for this key
  let timestamps = store.get(key) || [];

  // Remove old timestamps outside the window
  timestamps = timestamps.filter((timestamp) => timestamp > windowStart);

  // Check if we're over the limit
  if (timestamps.length >= limit) {
    return true;
  }

  // Add current timestamp
  timestamps.push(now);
  store.set(key, timestamps);

  return false;
}
