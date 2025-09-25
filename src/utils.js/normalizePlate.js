export function normalizePlate(plate = '') {
  return plate
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .trim();
}
