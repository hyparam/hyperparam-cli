
/**
 * Helper function to join class names
 */
export function cn(...names: (string | undefined | false)[]): string {
  return names.filter((n) => n).join(' ')
}
