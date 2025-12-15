export function getDaysUntilExpiry(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getExpiryColor(days: number): string {
  if (days < 0) return 'text-red-400';
  if (days <= 30) return 'text-red-400';
  if (days <= 60) return 'text-yellow-400';
  return 'text-green-400';
}

export function calculateAnnualCost(amount: number, frequency: string): number {
  switch (frequency) {
    case 'MONTHLY':
      return amount * 12;
    case 'QUARTERLY':
      return amount * 4;
    case 'SEMI_ANNUAL':
      return amount * 2;
    case 'ANNUAL':
      return amount;
    default:
      return amount;
  }
}
