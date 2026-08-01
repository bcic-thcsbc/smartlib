const phonePrefixes = new Set([
  "032", "033", "034", "035", "036", "037", "038", "039", "052",
  "056", "058", "059", "070", "076", "077", "078", "079", "081",
  "082", "083", "084", "085", "086", "087", "088", "089", "090",
  "091", "092", "093", "094", "096", "097", "098", "099",
]);

function normalizeClassName(value) {
  return String(value || "").trim().toUpperCase();
}

function validClassName(value) {
  return /^[6-9]A[1-9]\d*$/.test(normalizeClassName(value));
}

function normalizePhone(value) {
  return String(value || "").trim();
}

function validPhone(value) {
  const phone = normalizePhone(value);
  return /^0\d{9}$/.test(phone) && phonePrefixes.has(phone.slice(0, 3));
}

function validGender(value) {
  return ["male", "female"].includes(String(value || ""));
}

function visitorUsername(fullName, className) {
  const parts = String(fullName || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "";
  const last = parts.at(-1).toLowerCase();
  const initials = parts.slice(0, -1).map((part) => part[0].toLowerCase()).join("");
  return `${initials}${last}${normalizeClassName(className).toLowerCase()}`;
}

module.exports = { normalizeClassName, normalizePhone, validClassName, validPhone, validGender, visitorUsername };
