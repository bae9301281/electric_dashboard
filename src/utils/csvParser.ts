import type { SmpRecord } from '../types/smp';

export const ATTACHED_CSV_URL = '/assets/aistudio/_______________SMP_c105125e.csv';

export function decodeCsvBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // UTF-8 BOM check
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes);
  }

  // Try EUC-KR first for KPX CSV exports, verify Korean header keyword
  try {
    const eucKrText = new TextDecoder('euc-kr').decode(bytes);
    if (eucKrText.includes('기간') && eucKrText.includes('육지')) {
      return eucKrText;
    }
  } catch {
    // Fallback to UTF-8 below
  }

  return new TextDecoder('utf-8').decode(bytes);
}

export function parseSmpCsv(csvText: string): SmpRecord[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const records: SmpRecord[] = [];

  for (const line of lines) {
    const cols = line.split(',').map((c) => c.trim());
    if (cols.length < 5) continue;

    const period = cols[0];
    // Match YYYY/MM or YYYY-MM
    const match = /^(\d{4})[/-](\d{2})$/.exec(period);
    if (!match) continue;

    const land = Number.parseFloat(cols[1]);
    const jeju = Number.parseFloat(cols[2]);
    const integrated = Number.parseFloat(cols[3]);
    const blmp = Number.parseFloat(cols[4]);

    if (
      Number.isNaN(land) ||
      Number.isNaN(jeju) ||
      Number.isNaN(integrated) ||
      Number.isNaN(blmp)
    ) {
      continue;
    }

    records.push({
      period: `${match[1]}/${match[2]}`,
      year: match[1],
      month: match[2],
      land,
      jeju,
      integrated,
      blmp,
    });
  }

  return records;
}

export async function loadAttachedSmpCsv(): Promise<SmpRecord[]> {
  const response = await fetch(ATTACHED_CSV_URL);
  if (!response.ok) {
    throw new Error(`CSV 데이터를 불러오지 못했습니다. (HTTP ${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  const text = decodeCsvBuffer(buffer);
  const records = parseSmpCsv(text);
  if (records.length === 0) {
    throw new Error('CSV 파일에서 유효한 SMP·BLMP 데이터를 찾을 수 없습니다.');
  }
  return records;
}

export function formatKoreanPeriod(period: string): string {
  const [year, month] = period.split('/');
  if (!year || !month) return period;
  return `${year}년 ${month}월 (${period})`;
}

export function formatPrice(value: number): string {
  return value.toFixed(2);
}

export function exportSmpCsv(records: SmpRecord[], filename = 'kpx_smp_blmp_data.csv'): void {
  const header1 = '기간,SMP,,,BLMP';
  const header2 = ',육지,제주,통합,';
  const rows = records.map(
    (r) =>
      `${r.period},${r.land.toFixed(2)},${r.jeju.toFixed(2)},${r.integrated.toFixed(2)},${r.blmp.toFixed(2)}`
  );
  const csvContent = '\uFEFF' + [header1, header2, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
