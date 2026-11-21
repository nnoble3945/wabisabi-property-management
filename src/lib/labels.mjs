export function getPropertyTypeLabel(value) {
  const names = {
    PRIMARY: 'Primary residence',
    LONG_TERM_RENTAL: 'Long-term rental',
    SHORT_TERM_RENTAL: 'Cabin / short-term rental',
  };
  return names[value] ?? 'Other';
}
export function money(amount) {
  if (!Number.isFinite(amount)) throw new TypeError('Amount must be a finite number');
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
