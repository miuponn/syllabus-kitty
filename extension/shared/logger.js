/** Logger for Syllabus Kitty Extension */

const DEBUG = true;
const PREFIX = '🐱 Syllabus Kitty';

/**
 * Log a message with prefix
 * @param  {...any} args - Arguments to log
 */
export function log(...args) {
  if (DEBUG) {
    console.log(PREFIX, ...args);
  }
}

/**
 * Log an error with prefix
 * @param  {...any} args - Arguments to log
 */
export function error(...args) {
  console.error(PREFIX, '❌', ...args);
}

/**
 * Log a warning with prefix
 * @param  {...any} args - Arguments to log
 */
export function warn(...args) {
  if (DEBUG) {
    console.warn(PREFIX, '⚠️', ...args);
  }
}

/**
 * Log info with prefix
 * @param  {...any} args - Arguments to log
 */
export function info(...args) {
  if (DEBUG) {
    console.info(PREFIX, 'ℹ️', ...args);
  }
}
