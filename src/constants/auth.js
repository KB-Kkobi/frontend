export const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

export const SIGNUP_PASSWORD_PATTERN =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,}$/;

export const AUTH_VALIDATION_MESSAGES = Object.freeze({
  emailRequired: "이메일은 필수 입력 값입니다.",
  emailInvalid: "올바른 이메일 형식이 아닙니다.",
  passwordRequired: "비밀번호는 필수 입력 값입니다.",
  passwordInvalid:
    "비밀번호는 숫자, 영문자, 특수문자를 포함하여 8자 이상이어야 합니다.",
  passwordContainsEmail: "비밀번호에는 이메일을 포함할 수 없습니다.",
  nicknameRequired: "닉네임은 필수 입력 값입니다.",
  birthDateRequired: "생년월일은 필수 입력 값입니다.",
  birthDateInvalid: "올바른 생년월일을 입력해주세요.",
  birthDatePast: "생년월일은 과거 날짜여야 합니다.",
});
