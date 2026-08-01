function parts(value) {
  const match = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/,
  );
  return match
    ? {
        year: match[1],
        month: match[2],
        day: match[3],
        hour: match[4],
        minute: match[5],
      }
    : null;
}

function formatDate(value) {
  const date = parts(value);
  return date ? `${date.day}/${date.month}/${date.year}` : "-";
}

function formatDateTime(value) {
  const date = parts(value);
  if (!date) return "-";
  return date.hour
    ? `${formatDate(value)} ${date.hour}:${date.minute}`
    : formatDate(value);
}

module.exports = { formatDate, formatDateTime };
