/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - Raw HTML string
 * @returns {string} - Sanitized string
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Escape HTML entities
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export function escapeHtml(str) {
  if (!str) return '';
  
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return str.replace(/[&<>"']/g, char => htmlEntities[char]);
}

/**
 * Sanitize URL for safe usage
 * @param {string} url - URL to sanitize
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export function sanitizeUrl(url) {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Truncate text to max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncate(text, maxLength = 100) {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Clean extracted text
 * @param {string} text - Raw text
 * @returns {string} - Cleaned text
 */
export function cleanExtractedText(text) {
  if (!text) return '';
  
  return text
    // Remove null bytes
    .replace(/\0/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive whitespace
    .replace(/[ \t]+/g, ' ')
    // Remove excessive newlines
    .replace(/\n{4,}/g, '\n\n\n')
    // Trim
    .trim();
}
