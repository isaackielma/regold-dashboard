import { format, formatDistanceToNow } from 'date-fns';

export function formatEur(value: number): string {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(value);
}

export function formatGrams(value: number): string {
  return `${new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} g`;
}

export function formatTokens(value: number): string {
  return new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function formatDate(dateStr: string | Date): string {
  return format(new Date(dateStr), 'd MMM yyyy');
}

export function formatDateShort(dateStr: string | Date): string {
  return format(new Date(dateStr), 'dd/MM/yyyy');
}

export function timeAgo(dateStr: string | Date): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function gainLossClass(value: number): string {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
}
