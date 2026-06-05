import { validateDateRange as _validateDateRange } from "../utils/DateUtil";

/**
 * Adapts a Promise<void>-style validator for use with react-hook-form's `validate` option.
 *
 * @param {any} value - The field value to validate
 * @param {(value: any) => Promise<void>} validatorFn - Any validator from this module
 * @returns {Promise<true | string>}
 *
 * @example
 * rules={{ validate: (v) => rhfValidate(v, validatePhonenum) }}
 */
export async function rhfValidate(value, validatorFn) {
  try {
    await validatorFn(value);
    return /** @type {true} */ (true);
  } catch (e) {
    return e.message ?? "Invalid value";
  }
}

export function validateMax(value, extParams) {
  if (value == null) {
    return Promise.resolve();
  }
  let minNum = extParams.minNum;
  let maxNum = extParams.maxNum;
  let errorMsg = extParams.errorMsg;

  const hasMin = minNum !== undefined && minNum !== null;
  const hasMax = maxNum !== undefined && maxNum !== null;

  let isValid = true;
  if (hasMin && hasMax) {
    isValid = value != null && value >= minNum && value <= maxNum;
  } else if (hasMin) {
    isValid = value != null && value >= minNum;
  } else if (hasMax) {
    isValid = value != null && value <= maxNum;
  } else {
    return Promise.resolve();
  }

  if (isValid) {
    return Promise.resolve();
  } else {
    if (!errorMsg) {
      if (hasMin && hasMax) {
        errorMsg = `Value must be between ${minNum} and ${maxNum}`;
      } else if (hasMin) {
        errorMsg = `Value must be at least ${minNum}`;
      } else if (hasMax) {
        errorMsg = `Value cannot exceed ${maxNum}`;
      }
    }
    return Promise.reject(new Error(errorMsg));
  }
}

const DECIMAL_PLACES_REGEX = /^\d+(\.\d{1,2})?$/;

function isEmptyNumberInput(value) {
  return value == null || value === "" || (typeof value === "string" && String(value).trim() === "");
}

export function validateDecimalPlaces(value) {
  if (isEmptyNumberInput(value)) {
    return Promise.resolve();
  }
  const str = String(value).trim();
  if (!DECIMAL_PLACES_REGEX.test(str)) {
    const num = Number(str);
    if (!Number.isNaN(num) && num <= 0) {
      return Promise.reject(new Error("The number must be greater than zero."));
    }
    return Promise.reject(new Error("Please use a maximum of two decimal places."));
  }
  return Promise.resolve();
}

/**
 * Like validateDecimalPlaces, but values entered must be strictly greater than zero (no 0 / negatives).
 * Empty values are allowed (optional fields).
 */
export function validatePositiveDecimalPlaces(value) {
  if (isEmptyNumberInput(value)) {
    return Promise.resolve();
  }
  const str = String(value).trim();
  if (!DECIMAL_PLACES_REGEX.test(str)) {
    return Promise.reject(new Error("Please use a maximum of two decimal places."));
  }
  const num = Number(str);
  if (Number.isNaN(num) || num <= 0) {
    return Promise.reject(new Error("The number must be greater than zero."));
  }
  return Promise.resolve();
}
export function validateMaxAndDecimalPlaces(value, maxNum) {
  const decimalRegex = /^\d+(\.\d{1,2})?$/;

  if (value == null) {
    return { valid: true, message: null };
  }
}
function validateMandatory(value) {
  if (value == null || value.length() == 0) {
    return Promise.reject(new Error("This field is required"));
  }
}

function validateUpload(event, extParams) {
  var dataIndex = extParams.dataIndex;
  var modelParamName = extParams.modelParamName;
  //changes: need to pass field name from extParams instead of hard code field name in function
  var fieldName = extParams.fieldName;
  //let fieldName = "rifApplicationFullInput.full_part1." + modelParamName;
  var lineData = getFormFieldValueByName(fieldName)[dataIndex];
  if (lineData.cv == null || lineData.cv == "") {
    return Promise.reject(new Error("Attachment is required"));
  }
  if (value <= maxNum && decimalRegex.test(value)) {
    return Promise.resolve();
  } else if (value > maxNum) {
    return Promise.reject(new Error(`Value cannot exceed ${maxNum}`));
  } else if (value <= 0) {
    return Promise.reject(new Error("The number must be grater than zero"));
  } else if (!decimalRegex.test(value)) {
    return Promise.reject(new Error("Please use a maximum of two decimal places"));
  }
}

export async function validateTextArea(value, maxLength = null, required = false) {
  if (maxLength) {
    const res = await validateWordCount(value, maxLength);
    if (res !== true) return res;
  }
  return validateRequired(value, required);
}
export function validateRequired(value, required = false) {
  if (!required) {
    return true;
  }
  if (value == null || value === "") {
    return "This field is required";
  }
  const text = value.replace(/<[^>]*>/g, "").trim();
  const count = text.length;
  if (count === 0) {
    return "This field is required";
  }
  return true;
}

/**
 * Counts words in plain or HTML text using a regex that handles English and Chinese.
 * For HTML input, strips tags before counting.
 *
 * @param {string} value
 * @param {boolean} [isHtml] - strip HTML tags before counting (default false)
 * @returns {number}
 */
export function countWords(value, isHtml = false) {
  if (!value || typeof value !== "string") return 0;
  const plainText = isHtml
    ? value
        .replace(/<\/p>|<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .trim()
    : String(value).trim();
  if (!plainText) return 0;
  const wordRegex =
    /[\u4e00-\u9fff]|[\u3000-\u303F\uFF00-\uFFEF]|(?:[.,!?'\u201c\u201d\u2018\u2019';:\\][a-zA-Z0-9]+)+[a-zA-Z0-9]+(?:[.,!?'\u201c\u201d\u2018\u2019';:\\]+)|(?:[.,!?'\u201c\u201d\u2018\u2019';:\\][a-zA-Z0-9]+)+[a-zA-Z0-9]|[a-zA-Z0-9]+(?:[.,!?'\u201c\u201d\u2018\u2019';:\\][a-zA-Z0-9]+)|[a-zA-Z0-9]+(?:[.,!?'\u201c\u201d\u2018\u2019';:\\]+)*|[\u300c\u300d\u300e\u300f\uff08\uff09\u3010\u3011\u300a\u300b\u3008\u3009\uff5e\ufe4f\uff0e\u3001\uff0c\u3002\uff1b\uff1a\uff01\u2026\u2014\u2013-]|[.,!?'\u201c\u201d\u2018\u2019';:\\]+/g;
  return (plainText.match(wordRegex) || []).length;
}

/**
 * @param {string} value - HTML or plain text value
 * @param {number | null} maxWords - Maximum allowed word count
 * @param {number} minWords - Minimum allowed word count
 * @returns {Promise<true | string>}
 */
export async function validateWordCount(value, maxWords = null, minWords = 0) {
  const count = countWords(value, true);
  if (!value || count === 0) return true;
  if (minWords > 0 && count < minWords) {
    return `Word count must be at least ${minWords} words.`;
  }
  if (maxWords !== null && count > maxWords) {
    return `Word count (${count}) exceeds the maximum of ${maxWords} words.`;
  }
  return true;
}
/**
 * @param {any[]} value
 * @param {boolean} [required]
 * @param {any[] | null} [columns]
 */
export async function validateRowList(value, required = false, columns = null) {
  const isRowEmpty = (row) => {
    if (row == null) return true;
    if (typeof row !== "object") {
      return typeof row === "string" ? row.trim() === "" : false;
    }
    return Object.values(row).every((v) => v == null || String(v).trim() === "");
  };

  const isEmpty = !Array.isArray(value) || value.length === 0 || value.every(isRowEmpty);
  if (required && isEmpty) {
    return "This field is required";
  }
  if (isEmpty) return true;

  let errorMsg = "";
  // Per-row required-column and custom validate check
  if (Array.isArray(columns) && columns.length > 0) {
    for (let i = 0; i < value.length; i++) {
      const row = value[i];
      for (const col of columns) {
        const cellValue = typeof row === "object" ? row?.[col.key] : row;
        if (col.required && (cellValue == null || String(cellValue).trim() === "")) {
          const label = col.label || col.key;
          errorMsg += `Row ${i + 1}: ${label} is required, `;
        }
        if (typeof col.validate === "function") {
          const result = await col.validate(cellValue, row);
          if (typeof result === "string") {
            errorMsg += `Row ${i + 1}: ${result}, `;
          } else if (result === false) {
            errorMsg += `Row ${i + 1}: Invalid value in ${col.label || col.key}, `;
          }
        }
      }
    }
  }

  return errorMsg.slice(0, -2) || true;
}
export function validateOldRowList(value, required = false) {
  if (!required) return Promise.resolve();

  const isRowEmpty = (row) => {
    if (row == null) return true;
    if (typeof row !== "object") {
      return typeof row === "string" ? row.trim() === "" : false;
    }
    return Object.values(row).every((v) => v == null || String(v).trim() === "");
  };

  return Promise.resolve();
}

export function validateOrcid(value, extParams) {
  //function revamp:
  //1. no need "Handle required fields properly"?
  //2. pass list of field names with orcid
  //3. check for duplicate
  //4. check for pattern
  const { dataIndex, modelParamName } = extParams;

  // Handle required fields properly
  const isRequired = ["pc_details", "co_pi_details"].includes(modelParamName);
  if (isRequired && !value) {
    return Promise.reject(new Error("ORCID iD is required"));
  }

  // Skip validation for empty non-required fields
  if (!value) {
    return Promise.resolve();
  }

  // Validate format
  if (!"/^[0-9X]{4}-[0-9X]{4}-[0-9X]{4}-[0-9X]{4}$/".test(value)) {
    return Promise.reject(new Error("ORCID iD must be in XXXX-XXXX-XXXX-XXXX format"));
  }

  return Promise.resolve();
}

export function validateOrcidFormat(value) {
  if (!value) return Promise.resolve();

  const regex = /^[0-9X]{4}-[0-9X]{4}-[0-9X]{4}-[0-9X]{4}$/;
  if (!regex.test(value)) {
    return Promise.reject(new Error("ORCID iD must be in XXXX-XXXX-XXXX-XXXX format"));
  }

  return Promise.resolve();
}

export function validateChinese(value) {
  // Accepts both simplified and traditional Chinese characters
  const chineseRegex = /^[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]+$/;

  if (value == null || value === "" || value === "N/A") {
    return Promise.resolve();
  }
  if (chineseRegex.test(value)) {
    return Promise.resolve();
  } else {
    return Promise.reject(new Error("Please input Chinese character only"));
  }
}

//delegate to date util validateDateRange and align result
export function validateDateRange(startDate, endDate) {
  const result = _validateDateRange(startDate, endDate);
  return {
    valid: result.isValid,
    message: result.message,
  };
}

export function validateEmail(value) {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (value == null || value === "" || emailRegex.test(value)) {
    return Promise.resolve();
  } else {
    return Promise.reject(new Error("Please enter a valid email address (must include ‘@’)."));
  }
}

export function validateNumericHyphenSpace(value) {
  const allowedCharsRegex = /^[0-9\- ]+$/;

  if (value == null || allowedCharsRegex.test(value)) {
    return Promise.resolve();
  } else {
    return Promise.reject(new Error("Please only input 0-9, -"));
  }
}

export function validateWeekhour(value) {
  let maxNum = 168;
  let minNum = 1;
  let maxErrormsg = `Week hours cannot exceed  ${maxNum}`;
  let minErrormsg = `The number must be grater than zero`;

  if (!value || (value <= maxNum && value >= minNum)) {
    return Promise.resolve();
  } else {
    let errormsg = value > maxNum ? maxErrormsg : minErrormsg;
    return Promise.reject(new Error(errormsg));
  }
}

export function validatePercentage(value) {
  let maxNum = 100;
  let minNum = 0;
  let maxErrormsg = `Percentage cannot exceed  ${maxNum}`;
  let minErrormsg = `The number must be greater than ${minNum}`;

  if (!value) return Promise.resolve();

  if (value <= maxNum && value >= minNum) {
    return Promise.resolve();
  } else {
    let errormsg = value > maxNum ? maxErrormsg : minErrormsg;
    return Promise.reject(new Error(errormsg));
  }
}

export function validatePhonenum(value) {
  const decimalRegex = /^(\+?\d{1,3}[- ]?)?\(?\d{2,4}\)?[- ]?\d{3,4}[- ]?\d{3,4}$/;
  if (value == null || decimalRegex.test(value)) {
    return Promise.resolve();
  } else {
    return Promise.reject(new Error("Please enter a valid Phone Number format"));
  }
}

export function validateWebsite(value) {
  // Validate format
  const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,6}(\/[^\s]*)?$/;
  if (!value || urlRegex.test(value)) {
    return Promise.resolve();
  } else {
    return Promise.reject(new Error("Please enter a valid website url"));
  }
}

/**
 * Whole number strictly greater than zero when a value is entered.
 * Empty/null is allowed (optional fields). Use with rhfValidate for react-hook-form.
 */
export function validateInteger(value) {
  if (isEmptyNumberInput(value)) {
    return Promise.resolve();
  }
  const num = typeof value === "number" ? value : Number(String(value).trim());
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return Promise.reject(new Error("Please enter a valid integer without decimal places."));
  }
  if (!Number.isInteger(num)) {
    return Promise.reject(new Error("Please enter a valid integer without decimal places."));
  }
  if (num <= 0) {
    return Promise.reject(new Error("The number must be greater than zero."));
  }
  return Promise.resolve();
}

export function validateRequiredSelection(value) {
  if (value == null || value === "") {
    return { valid: false, message: "This field is required." };
  }
  return { valid: true };
}
