/**
 * Safe base64 encoding that handles Unicode characters
 * @param str - The string to encode
 * @returns Base64 encoded string
 */
export function safeBtoa(str: string): string {
  try {
    // First try the standard btoa
    return btoa(str);
  } catch (error) {
    // If it fails due to Unicode characters, use a workaround
    return btoa(unescape(encodeURIComponent(str)));
  }
}

/**
 * Safe base64 decoding that handles Unicode characters
 * @param str - The base64 string to decode
 * @returns Decoded string
 */
export function safeAtob(str: string): string {
  try {
    // First try the standard atob
    return atob(str);
  } catch (error) {
    // If it fails, use a workaround
    return decodeURIComponent(escape(atob(str)));
  }
} 