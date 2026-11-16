import { useMemo } from 'react';
import type { RegionKey } from '../data/realtimeSmpData';
import { REGION_LABELS } from '../data/realtimeSmpData';
import type { SmpRecord } from '../types/smp';

interface CsvMonthlyChartProps {
  records: SmpRecord[];
  selectedRecord: SmpRecord;
  region: RegionKey;
  onSelectPeriod: (period: string) => void;
}

export function CsvMonthlyChart({
  records,
  selectedRecord,
  region,
  onSelectPeriod,
}: CsvMonthlyChartProps) {
  const getVal = (r: SmpRecord) => {
    if (region === 'land') return r.land;
    if (region === 'jeju') return r.jeju;
    return r.integrated;
  };

  // Show chronological months (Jan..Dec) for the selected record's year
  const yearRecords = useMemo(() => {
    return records
      .filter((r) => r.year === selectedRecord.year)
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [records, selectedRecord.year]);

  const { minRec, maxRec, avgVal, minScale, maxScale, avgLinePct, hasZeroData } = useMemo(() => {
    if (yearRecords.length === 0) {
      return {
        minRec: selectedRecord,
        maxRec: selectedRecord,
        avgVal: 0,
        minScale: 0,
        maxScale: 200,
        avgLinePct: 50,
        hasZeroData: true,
      };
    }
    const vals = yearRecords.map((r) => getVal(r));
    const nonZero = vals.every((v) => v === 0);
    const min = yearRecords.reduce((a, b) => (getVal(b) < getVal(a) ? b : a), yearRecords[0]);
    const max = yearRecords.reduce((a, b) => (getVal(b) > getVal(a) ? b : a), yearRecords[0]);
    const sum = vals.reduce((acc, v) => acc + v, 0);
    const avg = sum / yearRecords.length;

    const minV = getVal(min);
    const maxV = getVal(max);
    const lo = nonZero ? 0 : Math.max(0, Math.floor((minV - 15) / 10) * 10);
    const hi = nonZero ? 100 : Math.max(lo + 40, Math.ceil((maxV + 15) / 10) * 10);
    const pct = hi === lo ? 50 : ((avg - lo) / (hi - lo)) * 100;

    return {
      minRec: min,
      maxRec: max,
      avgVal: avg,
      minScale: lo,
      maxScale: hi,
      avgLinePct: Math.min(90, Math.max(10, pct)),
      hasZeroData: nonZero,
    };
  }, [yearRecords, region, selectedRecord]);

  const getBarHeightPct = (val: number) => {
    if (hasZeroData) return 10;
    const raw = ((val - minScale) / (maxScale - minScale)) * 100;
    return Math.min(94, Math.max(16, Math.round(raw)));
  };

  const selectedVal = getVal(selectedRecord);

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
      {/* Header & Legend */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="font-headline text-[17px] font-bold text-on-surface leading-snug whitespace-nowrap">
              {selectedRecord.year}년 월별 SMP 추이
            </h2>
            <span className="font-mono text-[11px] text-tertiary px-2 py-0.5 bg-surface-container rounded-full font-bold whitespace-nowrap">
              KPX 확정
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-primary whitespace-nowrap">
            {REGION_LABELS[region]} 기준
          </span>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          {selectedRecord.year}년 {yearRecords[0]?.month}월~{yearRecords[yearRecords.length - 1]?.month}월 정산 단가 (막대를 탭하면 해당 월로 이동)
        </p>

        {/* Legend Row */}
        <div className="flex items-center gap-x-3 gap-y-1 text-[11px] text-on-surface-variant flex-wrap">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-xs bg-primary shrink-0" />
            <span>선택월 / 최고</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-xs bg-primary-fixed shrink-0" />
            <span>일반 월</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-xs bg-secondary-container shrink-0" />
            <span>연중 최저월</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3.5 h-0.5 border-t border-dashed border-primary shrink-0" />
            <span>연평균 ({avgVal.toFixed(2)}원)</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="relative w-full h-56 pt-6 pb-1 select-none flex flex-col justify-end">
        {/* Horizontal Scale Gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7 pt-6">
          {[1, 0.66, 0.33, 0].map((ratio, idx) => (
            <div
              key={idx}
              className="w-full flex items-center justify-between text-on-surface-variant font-mono text-[10px]"
            >
              <div className="w-full border-b border-surface-container-high" />
              <span className="pl-1.5 shrink-0 tabular-nums">
                {Math.round(minScale + (maxScale - minScale) * ratio)}원
              </span>
            </div>
          ))}
        </div>

        {/* Average Dashed Reference Line */}
        {!hasZeroData && (
          <div
            className="absolute left-0 right-0 pointer-events-none flex items-center z-0"
            style={{ bottom: `calc(1.75rem + ${avgLinePct * 0.68}%)` }}
          >
            <div className="w-full border-b-2 border-dashed border-primary/55" />
            <span className="pl-1 shrink-0 font-mono text-[9px] font-bold bg-surface-container-lowest text-primary tabular-nums">
              평균 {avgVal.toFixed(1)}
            </span>
          </div>
        )}

        {/* Monthly Columns */}
        <div className="relative z-10 w-full h-40 flex items-end justify-between gap-1.5 pr-11">
          {yearRecords.map((item) => {
            const val = getVal(item);
            const isSelected = item.period === selectedRecord.period;
            const isMax = item.period === maxRec.period && !hasZeroData;
            const isMin = item.period === minRec.period && !hasZeroData;
            const heightPct = getBarHeightPct(val);

            let barColor = 'bg-primary-fixed hover:bg-primary-fixed-dim';
            if (hasZeroData) {
              barColor = 'bg-surface-container-high';
            } else if (isSelected) {
              barColor = 'bg-primary shadow-xs';
            } else if (isMax) {
              barColor = 'bg-primary-container/85 hover:bg-primary';
            } else if (isMin) {
              barColor = 'bg-secondary-container hover:bg-secondary';
            }

            return (
              <button
                key={item.period}
                type="button"
                onClick={() => onSelectPeriod(item.period)}
                aria-label={`${item.period} ${val.toFixed(2)} 원/kWh`}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative focus:outline-none"
              >
                {isMin && !isSelected && (
                  <span className="absolute -top-5 px-1 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-mono text-[8px] font-bold whitespace-nowrap z-20">
                    최저
                  </span>
                )}
                {isMax && !isSelected && (
                  <span className="absolute -top-5 px-1 py-0.5 rounded bg-primary text-on-primary font-mono text-[8px] font-bold whitespace-nowrap z-20">
                    최고
                  </span>
                )}
                {isSelected && (
                  <span className="absolute -top-5 flex items-center justify-center z-20">
                    <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary font-mono text-[8px] font-bold whitespace-nowrap shadow-xs">
                      선택
                    </span>
                  </span>
                )}

                <div
                  className={`w-full rounded-t-md transition-all ${barColor} ${
                    isSelected ? 'ring-2 ring-on-surface/70 ring-offset-1' : ''
                  }`}
                  style={{ height: `${heightPct}%` }}
                />

                <span
                  className={`font-mono text-[10px] mt-1.5 leading-none tabular-nums ${
                    isSelected
                      ? 'text-primary font-bold'
                      : isMin
                        ? 'text-secondary font-bold'
                        : 'text-on-surface-variant'
                  }`}
                >
                  {item.month}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Month Inspector Strip */}
      <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between gap-2 text-on-surface">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
            touch_app
          </span>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-on-surface whitespace-nowrap">
              {selectedRecord.year}년 {selectedRecord.month}월
            </span>
            <span className="font-metric text-sm font-bold text-primary whitespace-nowrap">
              {selectedVal.toFixed(2)} 원/kWh
            </span>
          </div>
        </div>

        <span className="font-mono text-[10px] text-on-surface-variant whitespace-nowrap">
          BLMP {selectedRecord.blmp.toFixed(2)}원
        </span>
      </div>

      {hasZeroData && (
        <p className="text-[11px] text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
          안내: {selectedRecord.year}년은 {REGION_LABELS[region]} 분리 산정 이전 기간으로 CSV 값이 0.00으로 기록되어 있습니다. 상단에서 <strong>통합</strong>을 선택하면 해당 연도 추이를 확인할 수 있습니다.
        </p>
      )}
    </div>
  );
}
