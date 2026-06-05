/**
 * Date Utility Functions
 * Consolidated date/time handling utilities for the application
 */

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Enable timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// ==========================================
// CONSTANTS (Single Source of Truth)
// ==========================================

/**
 * Forever date constant - represents an indefinite end date
 * Used across the application for relationships/records with no expiration
 */
export const FOREVER_DATE = "9999-12-31";

/**
 * Forever date display text
 */
export const FOREVER_DISPLAY_TEXT = "Forever";

/**
 * "Effective From" date display text
 */
export const EFFECTIVE_FROM_DISPLAY_TEXT = "Effective From";

/**
 * Start date constant - represents the beginning of time (used for min-to-forever COI rules)
 * Used across the application for relationships/records with no start restriction
 */
export const START_DATE = "0001-01-01";

/**
 * Start date display text
 */
export const START_DISPLAY_TEXT = "Any Date";

/**
 * Hong Kong timezone identifier
 */
export const HKT_TIMEZONE = "Asia/Hong_Kong";

/**
 * Standard date/time formats used in the system
 */
import { DateConfigEnum } from "../configs/AppConfig";

export const DATE_FORMATS = {
  // Display formats
  SYSTEM_DATE_TIME_DISPLAY: "DD MMM YYYY HH:mm",
  DATE_DISPLAY: "DD MMM YYYY",
  DATE_SHORT: "DD/MM/YYYY",
  DATE_LONG: "MMMM DD, YYYY",

  // API formats
  API_DATE: "YYYY-MM-DD",
  API_DATETIME: "YYYY-MM-DDTHH:mm:ss",

  // Time formats
  TIME_12H: "hh:mm A",
  TIME_24H: "HH:mm",
};

// ==========================================
// FOREVER DATE UTILITIES
// ==========================================

/**
 * Check if a date is the "forever" date
 * @param {string|Date|dayjs} date - Date to check
 * @returns {boolean} True if date is forever date
 */
export const isForeverDate = (date) => {
  if (!date) return false;

  // Handle different date formats
  if (typeof date === "string") {
    return date === FOREVER_DATE || date.startsWith("9999-12-31");
  }

  if (dayjs.isDayjs(date)) {
    return date.format("YYYY-MM-DD") === FOREVER_DATE;
  }

  if (date instanceof Date) {
    return dayjs(date).format("YYYY-MM-DD") === FOREVER_DATE;
  }

  return false;
};

/**
 * Check if a date is the "start" date (0001-01-01)
 * Handles DatePicker clamping at ~1900 by also checking for dates in early 1900s
 * @param {string|Date|dayjs} date - Date to check
 * @returns {boolean} True if date is start date (0001-01-01) or clamped to ~1900-1901
 */
export const isStartDate = (date) => {
  if (!date) return false;

  // Handle different date formats
  if (typeof date === "string") {
    return date === START_DATE || date.startsWith("0001-01-01");
  }

  if (dayjs.isDayjs(date)) {
    const formatted = date.format("YYYY-MM-DD");
    // Check for actual start date or DatePicker's clamped version (~1900-1901)
    return formatted === START_DATE || formatted.startsWith("1900-") || formatted.startsWith("1901-");
  }

  if (date instanceof Date) {
    const formatted = dayjs(date).format("YYYY-MM-DD");
    return formatted === START_DATE || formatted.startsWith("1900-") || formatted.startsWith("1901-");
  }

  return false;
};

/**
 * Format a date for display, showing "Forever" for forever dates
 * @param {string|Date|dayjs} date - Date to format
 * @param {string} format - Optional format string (default: API_DATE)
 * @returns {string} Formatted date or "Forever"
 */
export const formatDateOrForever = (date, format = DATE_FORMATS.API_DATE) => {
  if (!date) return "";

  if (isForeverDate(date)) {
    return FOREVER_DISPLAY_TEXT;
  }

  if (isStartDate(date)) {
    return START_DISPLAY_TEXT;
  }

  return dayjs(date).format(format);
};

/**
 * Get a dayjs object for the forever date
 * @returns {dayjs} Forever date as dayjs object
 */
export const getForeverDate = () => {
  return dayjs(FOREVER_DATE);
};

/**
 * Get a dayjs object for the start date
 * @returns {dayjs} Start date as dayjs object
 */
export const getStartDate = () => {
  return dayjs(START_DATE);
};

/**
 * Check if a date is effectively permanent (either null or forever date)
 * @param {string|Date|dayjs} date - Date to check
 * @returns {boolean} True if date is permanent
 */
export const isPermanentDate = (date) => {
  return !date || isForeverDate(date);
};

/**
 * Normalize date for API payload - converts clamped dates back to their true values
 * Handles DatePicker's limitation that clamps 0001-01-01 to ~1900-1901
 * When sending to API, we need to convert back to the original value
 *
 * @param {string|dayjs} date - Date to normalize (in YYYY-MM-DD format)
 * @returns {string} Normalized date in YYYY-MM-DD format
 */
export const normalizeDateForAPI = (date) => {
  if (!date) return null;

  // Convert dayjs to string if needed
  let dateStr = dayjs.isDayjs(date) ? date.format("YYYY-MM-DD") : String(date).trim();

  // Ensure date is in YYYY-MM-DD format before processing
  if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Try to parse and reformat if not in correct format
    const parsed = dayjs(dateStr);
    if (parsed.isValid()) {
      dateStr = parsed.format("YYYY-MM-DD");
    } else {
      return dateStr; // Return as-is if can't parse
    }
  }

  // If date is clamped to 1900 or 1901, convert back to 0001
  if (dateStr.startsWith("1900-") || dateStr.startsWith("1901-")) {
    // Extract month-day portion (e.g., "01-01" from "1901-01-01")
    const monthDay = dateStr.substring(4); // Starting from position 4 gets "-MM-DD"
    return `0001${monthDay}`; // Result: "0001-MM-DD"
  }

  // If date is exactly the start date format, ensure it's 0001-01-01
  if (dateStr === START_DATE || dateStr.startsWith("0001-")) {
    return START_DATE;
  }

  // If date is forever, keep it
  if (dateStr.startsWith("9999-")) {
    return FOREVER_DATE;
  }

  return dateStr;
};

// ==========================================
// DATE FORMATTING
// ==========================================

/**
 * Format date for API (YYYY-MM-DD format)
 * @param {Date|string|dayjs} date - Date to format
 * @returns {string} Formatted date string or null
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;

  if (dayjs.isDayjs(date)) {
    return date.format(DATE_FORMATS.API_DATE);
  }

  const d = dayjs(date);
  return d.isValid() ? d.format(DATE_FORMATS.API_DATE) : null;
};

/**
 * Format date for display (localized format)
 * @param {Date|string|dayjs} date - Date to format
 * @param {string} format - Format string (default: DATE_DISPLAY)
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (date, format = DATE_FORMATS.DATE_DISPLAY) => {
  if (!date) return "";

  const d = dayjs(date);
  return d.isValid() ? d.format(format) : "";
};

/**
 * Format date with "Forever" or "Start" display for special dates
 * Used by DatePicker components to show "Forever" for 9999-12-31 or "Start" for 0001-01-01
 * Handles DatePicker's limitation that clamps 0001-01-01 to ~1900-1901
 *
 * Display format: DD MMM YYYY (DATE_FORMATS.DATE_DISPLAY)
 * Note: This is for DISPLAY only. The actual dayjs value remains in YYYY-MM-DD format
 * When calling date.format() on the dayjs object for API, it returns YYYY-MM-DD
 *
 * @param {dayjs} date - Date to format
 * @returns {string} Formatted date or "Forever" or "Start"
 */
export const formatDateWithForever = (date) => {
  if (!date) return "";
  if (isForeverDate(date)) {
    return FOREVER_DISPLAY_TEXT;
  }
  if (isStartDate(date)) {
    return START_DISPLAY_TEXT;
  }
  return date.format(DATE_FORMATS.DATE_DISPLAY);
};

/**
 * Format date/time for display
 * @param {Date|string|dayjs} date - Date to format
 * @param {string} format - Format string (default: SYSTEM_DATE_TIME_DISPLAY)
 * @returns {string} Formatted date/time string
 */
export const formatDateTime = (date, format = DATE_FORMATS.SYSTEM_DATE_TIME_DISPLAY) => {
  if (!date) return "";

  const d = dayjs(date);
  return d.format(format || DATE_FORMATS.DISPLAY_DATE);
};

// ==========================================
// DATE CONVERSION
// ==========================================

/**
 * Convert UTC date string to local date/time
 * @param {string} utcDateString - UTC date string
 * @returns {string} Local date/time string
 */
export const convertUtcToLocalDateTime = (utcDateString) => {
  if (!utcDateString) return "";

  const utcDate = new Date(utcDateString);
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utcDate.getUTCDate()).padStart(2, "0");
  const hours = String(utcDate.getUTCHours()).padStart(2, "0");
  const minutes = String(utcDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(utcDate.getUTCSeconds()).padStart(2, "0");

  const localDate = new Date(year, month - 1, day, hours, minutes, seconds);
  const localYear = localDate.getFullYear();
  const localMonth = String(localDate.getMonth() + 1).padStart(2, "0");
  const localDay = String(localDate.getDate()).padStart(2, "0");
  const localHours = String(localDate.getHours()).padStart(2, "0");
  const localMinutes = String(localDate.getMinutes()).padStart(2, "0");
  const localSeconds = String(localDate.getSeconds()).padStart(2, "0");

  return `${localYear}-${localMonth}-${localDay}T${localHours}:${localMinutes}:${localSeconds}`;
};

/**
 * Convert date to different timezone
 * @param {Date|string} date - Date to convert
 * @param {string} timezone - Target timezone (e.g., 'Asia/Hong_Kong')
 * @returns {Date} Converted date or null
 */
export const convertToTimezone = (date, timezone) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  try {
    return new Date(d.toLocaleString("en-US", { timeZone: timezone }));
  } catch (error) {
    console.error("Invalid timezone:", timezone);
    return d; // Return original date if timezone is invalid
  }
};

// ==========================================
// DATE CALCULATIONS
// ==========================================

/**
 * Calculate elapsed time between two dates
 * @param {Date|string} startTime - Start time
 * @param {Date|string} endTime - End time (optional, defaults to now)
 * @returns {string} Human-readable elapsed time
 */
export const calculateElapsedTime = (startTime, endTime) => {
  if (!startTime) return "-";

  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const diffMs = end - start;

  const seconds = Math.floor((diffMs / 1000) % 60);
  const minutes = Math.floor((diffMs / 1000 / 60) % 60);
  const hours = Math.floor((diffMs / 1000 / 60 / 60) % 24);
  const days = Math.floor(diffMs / 1000 / 60 / 60 / 24);

  let result = "";
  if (days > 0) result += `${days} day${days > 1 ? "s" : ""} `;
  if (hours > 0) result += `${hours} hour${hours > 1 ? "s" : ""} `;
  if (minutes > 0) result += `${minutes} minute${minutes > 1 ? "s" : ""} `;
  if (seconds >= 0) result += `${seconds} second${seconds !== 1 ? "s" : ""}`;

  return result.trim() || "0 seconds";
};

/**
 * Get month difference between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of months difference
 */
export const getMonthDifference = (startDate, endDate) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  return (end.year() - start.year()) * 12 + (end.month() - start.month());
};

/**
 * Calculate age based on creation date
 * @param {Date|string} createdDate - Creation date
 * @param {Date} referenceDate - Reference date (default: current date)
 * @returns {Object} Age in years, months, days, and totalDays
 */
export const calculateAge = (createdDate, referenceDate = new Date()) => {
  const created = dayjs(createdDate);
  const reference = dayjs(referenceDate);

  if (!created.isValid() || !reference.isValid()) {
    return { years: 0, months: 0, days: 0, totalDays: 0 };
  }

  const totalDays = reference.diff(created, "day");
  const years = reference.diff(created, "year");
  const months = reference.diff(created.add(years, "year"), "month");
  const days = reference.diff(created.add(years, "year").add(months, "month"), "day");

  return { years, months, days, totalDays };
};

/**
 * Get date X days from now
 * @param {number} days - Number of days (positive for future, negative for past)
 * @returns {dayjs} Calculated date
 */
export const getDateFromNow = (days) => {
  return dayjs().add(days, "day");
};

// ==========================================
// DATE VALIDATION
// ==========================================

/**
 * Check if an item is effective on a given date
 * @param {Object} item - Item with effectiveFrom and effectiveTo properties
 * @param {Date|string|dayjs} checkDate - Date to check against (default: current date)
 * @returns {boolean} True if item is effective on the check date
 */
export const isEffectiveDate = (item, checkDate = new Date()) => {
  if (!item) return false;

  const check = dayjs(checkDate).startOf("day");

  const effectiveFrom = item.effectiveFrom ? dayjs(item.effectiveFrom).startOf("day") : null;
  const effectiveTo = item.effectiveTo ? dayjs(item.effectiveTo).endOf("day") : null;

  // If no effective from date, assume effective from beginning of time
  const isAfterStart = !effectiveFrom || check.isAfter(effectiveFrom) || check.isSame(effectiveFrom);

  // If no effective to date or forever date, assume effective until end of time
  const isBeforeEnd = !effectiveTo || isForeverDate(item.effectiveTo) || check.isBefore(effectiveTo) || check.isSame(effectiveTo);

  return isAfterStart && isBeforeEnd;
};

/**
 * Filter array of items by effective date
 * @param {Array} items - Array of items with effective dates
 * @param {Date|string|dayjs} checkDate - Date to filter by (default: current date)
 * @returns {Array} Filtered array of effective items
 */
export const getEffectiveItems = (items = [], checkDate = new Date()) => {
  return items.filter((item) => isEffectiveDate(item, checkDate));
};

/**
 * Validate date range
 * @param {Date|string} effectiveFrom - Start date
 * @param {Date|string} effectiveTo - End date
 * @returns {Object} Validation result with isValid and message
 */
export const validateDateRange = (effectiveFrom, effectiveTo) => {
  if (!effectiveFrom) {
    return {
      isValid: false,
      message: "Effective from date is required",
    };
  }

  if (!effectiveTo) {
    return {
      isValid: false,
      message: "Effective to date is required",
    };
  }

  const fromDate = dayjs(effectiveFrom);
  const toDate = dayjs(effectiveTo);

  if (!fromDate.isValid()) {
    return {
      isValid: false,
      message: "Invalid effective from date",
    };
  }

  if (!toDate.isValid()) {
    return {
      isValid: false,
      message: "Invalid effective to date",
    };
  }

  // Allow forever date as valid end date
  if (isForeverDate(effectiveTo)) {
    return {
      isValid: true,
      message: "Date range is valid",
    };
  }

  if (fromDate.isAfter(toDate) || fromDate.isSame(toDate)) {
    return {
      isValid: false,
      message: "Effective from date must be before effective to date",
    };
  }

  return {
    isValid: true,
    message: "Date range is valid",
  };
};

/**
 * Check if a date is in the future
 * @param {Date|string|dayjs} date - Date to check
 * @param {Date|string|dayjs} referenceDate - Reference date (default: current date)
 * @returns {boolean} True if date is in the future
 */
export const isFutureDate = (date, referenceDate = new Date()) => {
  const checkDate = dayjs(date);
  const refDate = dayjs(referenceDate);

  if (!checkDate.isValid() || !refDate.isValid()) {
    return false;
  }

  return checkDate.isAfter(refDate);
};

/**
 * Check if a date is in the past
 * @param {Date|string|dayjs} date - Date to check
 * @param {Date|string|dayjs} referenceDate - Reference date (default: current date)
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (date, referenceDate = new Date()) => {
  const checkDate = dayjs(date);
  const refDate = dayjs(referenceDate);

  if (!checkDate.isValid() || !refDate.isValid()) {
    return false;
  }

  return checkDate.isBefore(refDate);
};

/**
 * Validate if date string is in correct format
 * @param {string} dateString - Date string to validate
 * @param {string} format - Expected format (default: 'YYYY-MM-DD')
 * @returns {boolean} True if valid format
 */
export const isValidDateFormat = (dateString, format = "YYYY-MM-DD") => {
  if (!dateString) return false;

  switch (format) {
    case "YYYY-MM-DD":
      return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    case "DD/MM/YYYY":
      return /^\d{2}\/\d{2}\/\d{4}$/.test(dateString);
    case "MM/DD/YYYY":
      return /^\d{2}\/\d{2}\/\d{4}$/.test(dateString);
    default:
      return dayjs(dateString, format, true).isValid();
  }
};

// ==========================================
// DATE RANGE UTILITIES
// ==========================================

/**
 * Get overlap between two date ranges
 * @param {Object} range1 - First date range {from, to} or {effectiveFrom, effectiveTo}
 * @param {Object} range2 - Second date range {from, to} or {effectiveFrom, effectiveTo}
 * @returns {Object|null} Overlap range or null if no overlap
 */
export const getDateRangeOverlap = (range1, range2) => {
  if (!range1 || !range2) return null;

  const from1 = dayjs(range1.from || range1.effectiveFrom);
  const to1 = dayjs(range1.to || range1.effectiveTo);
  const from2 = dayjs(range2.from || range2.effectiveFrom);
  const to2 = dayjs(range2.to || range2.effectiveTo);

  // Check if any dates are invalid
  if ([from1, to1, from2, to2].some((d) => !d.isValid())) {
    return null;
  }

  const overlapStart = from1.isAfter(from2) ? from1 : from2;
  const overlapEnd = to1.isBefore(to2) ? to1 : to2;

  // No overlap if start is after end
  if (overlapStart.isAfter(overlapEnd)) {
    return null;
  }

  return {
    from: overlapStart.toDate(),
    to: overlapEnd.toDate(),
    days: overlapEnd.diff(overlapStart, "day") + 1,
  };
};

/**
 * Check if two date ranges overlap
 * @param {Object} range1 - First date range
 * @param {Object} range2 - Second date range
 * @returns {boolean} True if ranges overlap
 */
export const doDateRangesOverlap = (range1, range2) => {
  return getDateRangeOverlap(range1, range2) !== null;
};

/**
 * Get start and end of year for a given date
 * @param {Date|string|dayjs} date - Reference date
 * @returns {Object} {start, end} dates as dayjs objects
 */
export const getYearRange = (date = new Date()) => {
  const d = dayjs(date);

  return {
    start: d.startOf("year"),
    end: d.endOf("year"),
  };
};

/**
 * Get preset date ranges
 * @returns {Object} Preset date ranges with labels and date objects
 */
export const getPresetDateRanges = () => {
  const now = dayjs();

  return {
    today: {
      label: "Today",
      from: now.startOf("day"),
      to: now.endOf("day"),
    },
    thisWeek: {
      label: "This Week",
      from: now.startOf("week"),
      to: now.endOf("week"),
    },
    thisMonth: {
      label: "This Month",
      from: now.startOf("month"),
      to: now.endOf("month"),
    },
    thisYear: {
      label: "This Year",
      from: now.startOf("year"),
      to: now.endOf("year"),
    },
    lastYear: {
      label: "Last Year",
      from: now.subtract(1, "year").startOf("year"),
      to: now.subtract(1, "year").endOf("year"),
    },
    nextYear: {
      label: "Next Year",
      from: now.add(1, "year").startOf("year"),
      to: now.add(1, "year").endOf("year"),
    },
  };
};

// ==========================================
// BUSINESS DATE UTILITIES
// ==========================================

/**
 * Get the next business day (skip weekends)
 * @param {Date|string|dayjs} date - Starting date (default: today)
 * @returns {dayjs} Next business day
 */
export const getNextBusinessDay = (date = new Date()) => {
  let nextDay = dayjs(date).add(1, "day");

  // If it's Saturday (6) or Sunday (0), add more days
  while (nextDay.day() === 0 || nextDay.day() === 6) {
    nextDay = nextDay.add(1, "day");
  }

  return nextDay;
};

/**
 * Get current date in API format
 * @returns {string} Current date in YYYY-MM-DD format
 */
export const getCurrentDateForAPI = () => {
  return dayjs().format(DATE_FORMATS.API_DATE);
};

/**
 * Get today's date at start of day
 * @returns {dayjs} Today at 00:00:00
 */
export const getToday = () => {
  return dayjs().startOf("day");
};

/**
 * Get today's date in Hong Kong timezone (HKT)
 * @returns {dayjs} Today in HKT at 00:00:00
 */
export const getTodayHKT = () => {
  return dayjs().tz(HKT_TIMEZONE).startOf("day");
};

/**
 * Check if a date is before today in HKT timezone
 * @param {string|Date|dayjs} date - Date to check
 * @returns {boolean} True if date is before today (HKT)
 */
export const isBeforeTodayHKT = (date) => {
  if (!date) return false;
  const todayHKT = getTodayHKT();
  const checkDate = dayjs(date).tz(HKT_TIMEZONE).startOf("day");
  return checkDate.isBefore(todayHKT);
};

/**
 * Check if a date is today or after in HKT timezone
 * @param {string|Date|dayjs} date - Date to check
 * @returns {boolean} True if date is today or after (HKT)
 */
export const isTodayOrAfterHKT = (date) => {
  if (!date) return false;
  const todayHKT = getTodayHKT();
  const checkDate = dayjs(date).tz(HKT_TIMEZONE).startOf("day");
  return checkDate.isSame(todayHKT) || checkDate.isAfter(todayHKT);
};
