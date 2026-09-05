// NRR is signed with 2 decimal places; -0 (from float rounding) always prints as "0.00".
export function formatNrr(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return '0.00';
  const sign = rounded > 0 ? '+' : '-';
  return `${sign}${Math.abs(rounded).toFixed(2)}`;
}
