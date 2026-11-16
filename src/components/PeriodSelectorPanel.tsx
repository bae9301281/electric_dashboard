import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SmpRecord } from '../types/smp';
import { formatKoreanPeriod, formatPrice } from '../utils/csvParser';

interface PeriodSelectorPanelProps {
  records: SmpRecord[];
  selectedPeriod: string;
  selectedRecord: SmpRecord | null;
  previousRecord: SmpRecord | null;
  onSelectPeriod: (period: string) => void;
  isLoading: boolean;
}

interface MetricCellProps {
  label: string;
  subLabel: string;
  value: number | null;
  prevValue: number | null;
  accent?: boolean;
}

function MetricCell({ label, subLabel, value, prevValue, accent = false }: MetricCellProps) {
  const hasDelta =
    value !== null &&
    prevValue !== null &&
    !(value === 0 && prevValue === 0);
  const delta = hasDelta ? value - prevValue : null;

  let deltaText = '전월 대비 -';
  let deltaClass = 'text-slate-500';
  if (delta !== null) {
    if (Math.abs(delta) < 0.005) {
      deltaText = '전월 동일 0.00';
      deltaClass = 'text-slate-500';
    } else if (delta > 0) {
      deltaText = `전월 대비 ▲ +${delta.toFixed(2)}`;
      deltaClass = 'text-rose-700';
    } else {
      deltaText = `전월 대비 ▼ ${delta.toFixed(2)}`;
      deltaClass = 'text-blue-700';
    }
  }

  return (
    <div className="px-5 py-4 sm:py-5 flex flex-col justify-between gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">{label}</span>
        <span className="text-xs text-slate-500 whitespace-nowrap">{subLabel}</span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-mono tabular-nums text-2xl sm:text-[28px] font-semibold tracking-tight ${
            value === null
              ? 'text-slate-300'
              : value === 0
                ? 'text-slate-400'
                : accent
                  ? 'text-blue-700'
                  : 'text-slate-900'
          }`}
        >
          {value !== null ? formatPrice(value) : '--.--'}
        </span>
        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">원/kWh</span>
      </div>

      <div className={`font-mono tabular-nums text-xs font-medium ${deltaClass}`}>
        {deltaText}
      </div>
    </div>
  );
}

export function PeriodSelectorPanel({
  records,
  selectedPeriod,
  selectedRecord,
  previousRecord,
  onSelectPeriod,
  isLoading,
}: PeriodSelectorPanelProps) {
  // records are assumed chronological desc (newest first: index 0 = 2026/09, last = 2001/04)
  const currentIndex = records.findIndex((r) => r.period === selectedPeriod);
  const canGoNewer = currentIndex > 0;
  const canGoOlder = currentIndex !== -1 && currentIndex < records.length - 1;

  const handleGoOlder = () => {
    if (canGoOlder) {
      onSelectPeriod(records[currentIndex + 1].period);
    }
  };

  const handleGoNewer = () => {
    if (canGoNewer) {
      onSelectPeriod(records[currentIndex - 1].period);
    }
  };

  return (
    <section
      id="period-lookup"
      aria-labelledby="period-lookup-heading"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Top Control Row: Period Selection Dropdown */}
      <div className="px-5 py-4 bg-slate-50/70 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label
            id="period-lookup-heading"
            htmlFor="period-select"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 whitespace-nowrap shrink-0"
          >
            <Calendar className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
            <span>기간 선택</span>
          </label>

          <div className="flex items-center gap-2">
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => onSelectPeriod(e.target.value)}
              disabled={isLoading || records.length === 0}
              className="h-10 min-w-[220px] sm:min-w-[250px] px-3.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 font-mono tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400 transition-colors cursor-pointer"
            >
              {records.length === 0 ? (
                <option value="">기간 데이터를 불러오는 중...</option>
              ) : (
                records.map((record) => (
                  <option key={record.period} value={record.period}>
                    {formatKoreanPeriod(record.period)}
                  </option>
                ))
              )}
            </select>

            <div className="flex items-center gap-1" role="group" aria-label="기간 월 이동">
              <button
                type="button"
                onClick={handleGoOlder}
                disabled={isLoading || !canGoOlder}
                title="이전 월 (과거)"
                aria-label="이전 월"
                className="h-10 w-10 inline-flex items-center justify-center bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleGoNewer}
                disabled={isLoading || !canGoNewer}
                title="다음 월 (최신)"
                aria-label="다음 월"
                className="h-10 w-10 inline-flex items-center justify-center bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
          <span className="font-medium text-slate-800">
            {selectedRecord ? formatKoreanPeriod(selectedRecord.period) : '기간 미선택'}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>단위: 원/kWh</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>총 {records.length.toLocaleString('ko-KR')}개월 수록</span>
        </div>
      </div>

      {/* Selected Date Values Grid */}
      <div className="border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="px-5 py-5 space-y-3 animate-pulse">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-28 bg-slate-200 rounded" />
              <div className="h-3.5 w-20 bg-slate-100 rounded" />
            </div>
          ))
        ) : (
          <>
            <MetricCell
              label="SMP · 육지"
              subLabel="계통한계가격"
              value={selectedRecord ? selectedRecord.land : null}
              prevValue={previousRecord ? previousRecord.land : null}
            />
            <MetricCell
              label="SMP · 제주"
              subLabel="계통한계가격"
              value={selectedRecord ? selectedRecord.jeju : null}
              prevValue={previousRecord ? previousRecord.jeju : null}
            />
            <MetricCell
              label="SMP · 통합"
              subLabel="계통한계가격"
              value={selectedRecord ? selectedRecord.integrated : null}
              prevValue={previousRecord ? previousRecord.integrated : null}
              accent
            />
            <MetricCell
              label="BLMP"
              subLabel="기저한계가격"
              value={selectedRecord ? selectedRecord.blmp : null}
              prevValue={previousRecord ? previousRecord.blmp : null}
            />
          </>
        )}
      </div>
    </section>
  );
}
