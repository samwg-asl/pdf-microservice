export const DateConfigEnum = Object.freeze({
  // API format (used when sending data to backend)
  API_DATE_FORMAT: "YYYY-MM-DD",
  API_DATETIME_FORMAT: "YYYY-MM-DD HH:mm:ss",
  API_TIME_FORMAT: "HH:mm:ss",

  // Display format (used in UI components)
  DISPLAY_DATE_FORMAT: "DD MMM YYYY", // e.g., 23 Dec 2025
  DISPLAY_MONTH_FORMAT: "MMM YYYY", // e.g., Dec 2025 (for month picker without day)
  DISPLAY_YEAR_FORMAT: "YYYY", // e.g., 2025 (for year picker)
  DISPLAY_DATETIME_FORMAT_LONG: "DD MMM YYYY HH:mm:ss",
  DISPLAY_DATETIME_FORMAT: "DD MMM YYYY HH:mm", // Without seconds for audit info
  DISPLAY_TIME_FORMAT: "HH:mm:ss",

  // Legacy/Default formats (for backward compatibility)
  DEFAULT_DATE_FORMAT: "YYYY-MM-DD",
  DEFAULT_DATETIME_FORMAT: "YYYY-MM-DD HH:mm:ss",
  DEFAULT_TIME_FORMAT: "HH:mm:ss",
});