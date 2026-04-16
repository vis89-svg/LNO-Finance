/**
 * Format date from ISO/string to DD-MM-YYYY format (for display)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date in DD-MM-YYYY
 */
const formatDate = (date) => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

/**
 * Parse date from DD-MM-YYYY format to Date object
 * @param {string} dateString - Date in DD-MM-YYYY format
 * @returns {Date|null} Parsed Date object or null if invalid
 */
const parseDate = (dateString) => {
  if (!dateString) return null;

  const parts = dateString.split('-');
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  const date = new Date(`${year}-${month}-${day}`);

  if (isNaN(date.getTime())) return null;

  return date;
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date in YYYY-MM-DD
 */
const formatDateForInput = (date) => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

module.exports = {
  formatDate,
  parseDate,
  formatDateForInput,
};
