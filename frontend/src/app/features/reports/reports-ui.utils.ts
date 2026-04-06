/** Visual tone helpers for premium reports tables (percentages, status text, severity). */

export type PercentTone = 'high' | 'mid' | 'low';
export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';
export type SeverityTone = 'high' | 'mid' | 'low' | 'neutral';

export function reportsPercentTone(percent: number): PercentTone {
  if (percent >= 75) return 'high';
  if (percent >= 40) return 'mid';
  return 'low';
}

export function reportsStatusTone(status: string | null | undefined): StatusTone {
  const s = (status || '').toLowerCase();
  if (/مكتمل|مكتملة|complete|completed|success|نجاح|active|نشط|approved|معتمد|معتمدة|effective|فعّال|منجز/.test(s)) return 'success';
  if (/cancel|ملغ|مرفوض|reject|فشل|failed|error|منته|expired|مرفوضة/.test(s)) return 'danger';
  if (/pending|قيد|await|draft|مسودة|open|مفتوح|partial|جزئ|معلق/.test(s)) return 'warning';
  return 'neutral';
}

export function reportsSeverityTone(severity: string | null | undefined): SeverityTone {
  const s = (severity || '').toLowerCase();
  if (/high|عالي|حرج|critical|severe|قصوى/.test(s)) return 'high';
  if (/medium|متوسط|mid|moderate|متوسطة/.test(s)) return 'mid';
  if (/low|منخفض|minor|منخفضة/.test(s)) return 'low';
  return 'neutral';
}

export function reportsScoreTone(score: number | null | undefined): PercentTone {
  if (score == null || Number.isNaN(score)) return 'mid';
  if (score >= 75) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
}
