import {
  AUTH_VALIDATION_MESSAGES,
  EMAIL_PATTERN,
  SIGNUP_PASSWORD_PATTERN,
} from "@/constants/auth";

const BIRTH_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function validateEmail(email) {
  if (!email) return AUTH_VALIDATION_MESSAGES.emailRequired;
  if (!EMAIL_PATTERN.test(email)) return AUTH_VALIDATION_MESSAGES.emailInvalid;
  return "";
}

function validateSignupPassword(password, email) {
  if (!password) return AUTH_VALIDATION_MESSAGES.passwordRequired;
  if (!SIGNUP_PASSWORD_PATTERN.test(password)) {
    return AUTH_VALIDATION_MESSAGES.passwordInvalid;
  }
  if (email && password.toLowerCase().includes(email.toLowerCase())) {
    return AUTH_VALIDATION_MESSAGES.passwordContainsEmail;
  }
  return "";
}

function parseBirthDate(birthDate) {
  const match = BIRTH_DATE_PATTERN.exec(birthDate);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  const isValidDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return isValidDate ? date : null;
}

function validateBirthDate(birthDate) {
  if (!birthDate) return AUTH_VALIDATION_MESSAGES.birthDateRequired;

  const date = parseBirthDate(birthDate);
  if (!date) return AUTH_VALIDATION_MESSAGES.birthDateInvalid;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today ? "" : AUTH_VALIDATION_MESSAGES.birthDatePast;
}

export function validateSignupData({ email, password, nickname, birthDate }) {
  const emailError = validateEmail(email);

  return {
    email: emailError,
    password: validateSignupPassword(password, emailError ? "" : email),
    nickname: nickname ? "" : AUTH_VALIDATION_MESSAGES.nicknameRequired,
    birthDate: validateBirthDate(birthDate),
  };
}

export function validateLoginData({ email, password }) {
  return {
    email: validateEmail(email),
    password: password ? "" : AUTH_VALIDATION_MESSAGES.passwordRequired,
  };
}

export function hasAuthValidationErrors(errors) {
  return Object.values(errors).some(Boolean);
}
