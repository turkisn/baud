export function formatCurrency(value, currency, locale) {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;

  const currencyCode = typeof currency === 'string' && /^[a-z]{3}$/i.test(currency.trim())
    ? currency.trim().toUpperCase()
    : 'SAR';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale, { maximumFractionDigits: 0 })} ${currencyCode}`;
  }
}

export function formatCount(value, locale) {
  const count = Number(value);
  return (Number.isFinite(count) && count >= 0 ? count : 0).toLocaleString(locale);
}
