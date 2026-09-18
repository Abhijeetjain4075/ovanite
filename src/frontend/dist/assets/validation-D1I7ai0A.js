const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function isRequired(value) {
  return value.trim().length > 0;
}
function isValidEmail(value) {
  return EMAIL_PATTERN.test(value.trim());
}
function validateName(value) {
  if (!isRequired(value)) return "Please enter your name.";
  if (value.trim().length < 2) return "Name must be at least 2 characters.";
  return void 0;
}
function validateEmail(value) {
  if (!isRequired(value)) return "Please enter your email address.";
  if (!isValidEmail(value)) return "Please enter a valid email address.";
  return void 0;
}
function validateMessage(value) {
  if (!isRequired(value)) return "Please tell us how we can help.";
  if (value.trim().length < 10)
    return "Please provide at least 10 characters of detail.";
  return void 0;
}
function validateNote(value) {
  if (value.trim().length > 500)
    return "Please keep your note under 500 characters.";
  return void 0;
}
function isDuplicateResult(result) {
  return typeof result === "object" && result !== null && result.__kind__ === "duplicate";
}
export {
  validateEmail as a,
  validateName as b,
  validateNote as c,
  isDuplicateResult as i,
  validateMessage as v
};
