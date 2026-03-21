export function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em - sh * 60 - sm) / 60
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString()}`
}

export const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  'キッチン': { bg: '#f3e8ff', text: '#7c3aed' },
  'ホール': { bg: '#d1fae5', text: '#059669' },
  'バー': { bg: '#ffedd5', text: '#ea580c' },
  'MGR': { bg: '#fce7f3', text: '#db2777' },
}

export const STATUS_LABELS: Record<string, string> = {
  confirmed: '確定',
  optimized: '最適化済',
  draft: '下書き',
}
