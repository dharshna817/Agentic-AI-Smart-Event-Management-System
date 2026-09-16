function normalizeDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function hasTimeOverlap(startA, endA, startB, endB) {
  const aStart = normalizeDateTime(startA);
  const aEnd = normalizeDateTime(endA);
  const bStart = normalizeDateTime(startB);
  const bEnd = normalizeDateTime(endB);

  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart < bEnd && aEnd > bStart;
}

function formatDateTimeForDisplay(value) {
  const date = normalizeDateTime(value);
  if (!date) return "Unknown time";

  const pad = (n) => String(n).padStart(2, "0");
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${month}/${day} ${hours}:${minutes}`;
}

function buildConflictMessage(
  entityType,
  entityName,
  existingStart,
  existingEnd,
) {
  const label = entityType || "Item";
  return `${label} conflict: ${entityName} is already booked from ${formatDateTimeForDisplay(existingStart)} to ${formatDateTimeForDisplay(existingEnd)}.`;
}

module.exports = {
  normalizeDateTime,
  hasTimeOverlap,
  formatDateTimeForDisplay,
  buildConflictMessage,
};
