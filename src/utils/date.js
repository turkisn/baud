function dateParts(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return { date, year: get('year'), month: get('month'), day: get('day') };
}

export function formatAdminDate(value) {
  const parts = dateParts(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : '—';
}

export function formatAdminDateTime(value) {
  const parts = dateParts(value);
  if (!parts) return '—';
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(parts.date);
  const get = (type) => timeParts.find((part) => part.type === type)?.value;
  return `${parts.year}-${parts.month}-${parts.day} ${get('hour')}:${get('minute')}`;
}
