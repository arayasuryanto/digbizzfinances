import { format, parseISO } from 'date-fns';

/**
 * Format a date to a readable string
 * @param {Date|string} date - Date to format
 * @param {string} formatString - Format string (defaults to 'MMM dd, yyyy')
 * @returns {string} Formatted date string
 */
export function formatDate(date, formatString = 'MMM dd, yyyy') {
  if (!date) return '';
  
  // Handle both Date objects and ISO strings
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Format a time to a readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string
 */
export function formatTime(date, formatString = 'h:mm a') {
  if (!date) return '';
  
  // Handle both Date objects and ISO strings
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Format a number as currency (in USD format)
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (defaults to USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  if (currency === 'USD') {
    return `$${Number(amount).toFixed(2)}`;
  } else if (currency === 'IDR') {
    return formatRupiah(amount);
  }
  return `${Number(amount).toFixed(2)} ${currency}`;
}

/**
 * Format a number as Indonesian Rupiah
 * @param {number} amount - Amount to format
 * @returns {string} Formatted Rupiah string
 */
export function formatRupiah(amount) {
  // Always use positive value for formatting
  const absValue = Math.abs(amount);
  
  // Format without any decimal places and with dot as thousands separator
  return 'Rp' + absValue.toLocaleString('id-ID');
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
