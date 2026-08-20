/**
 * Escapes special Regular Expression metacharacters from user input strings
 * to prevent ReDoS (Regular Expression Denial of Service) and regex injection attacks.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
