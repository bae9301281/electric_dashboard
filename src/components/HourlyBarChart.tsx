import { useMemo, useState } from 'react';
import type { HourlyPoint } from '../data/realtimeSmpData';

interface HourlyBarChartProps {
  hours: HourlyPoint[];
  avgPrice: number;
  currentHour: string;
  selectedHour: string;
  onSelectHour: (hour: string) => void;
}

export function HourlyBarChart({
  hours,
  avgPrice,
  currentHour,
  selectedHour,
  onSelectHour,
}: HourlyBarChartProps) {
  const [showTable, setShowTable] = useState(false);

  const { minPoint, maxPoint, peakThreshold, avgLinePct } = useMemo(() => {
    const min = hours.reduce((a, b) => (b.price < a.price ? b : a), hours[0]);
    const max = hours.reduce((a, b) => (b.price > a.price ? b : a), hours[0]);
    const sortedPrices = [...hours].map((h) => h.price).sort((a, b) => b - a);
    const top15Idx = Math.max(0, Math.floor(sortedPrices.length * 0.15) - 1);
    const threshold = sortedPrices[top15Idx] ?? max.price;

    // Scale grid between 90 and 185 (or dynamic if outside range)
    const minScale = Math.min(90, Math.floor((min.price - 10) / 10) * 10);
    const maxScale = Math.max(180, Math.ceil((max.price + 10) / 10) * 10);
    const pct = ((avgPrice - minScale) / (maxScale - minScale)) * 100;

    return {
      minPoint: min,
      maxPoint: max,
      peakThreshold: threshold,
      avgLinePct: Math.min(92, Math.max(8, pct)),
    };
  }, [hours, avgPrice]);

  const minScale = Math.min(90, Math.floor((minPoint.price - 10) / 10) * 10);
  const maxScale = Math.max(180, Math.ceil((maxPoint.price + 10) / 10) * 10);

  const inspected = hours.find((h) => h.hour === selectedHour) ?? hours[0];

  const getBarHeightPct = (price: number) => {
    const raw = ((price - minScale) / (maxScale - minScale)) * 100;
    return Math.min(96, Math.max(14, Math.round(raw)));
  };

  const getBarCategory = (item: HourlyPoint) => {
    const hourNum = Number.parseInt(item.hour, 10);
    if (item.hour === minPoint.hour) return 'min';
    if (hourNum >= 17 && hourNum <= 20) return 'peak';
    if (hourNum <= 6 || hourNum >= 23) return 'offpeak';
    return 'normal';
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
      {/* Header & Legend */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-headline text-[18px] font-bold text-on-surface leading-snug whitespace-nowrap">
                24시간 시간별 SMP 추이
              </h2>
              <span className="font-mono text-[11px] text-tertiary px-2 py-0.5 bg-surface-container rounded-full font-bold whitespace-nowrap">
                확정치
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              01시부터 24시까지 시간대별 원/kWh 정산 단가 (실시간 기준 {currentHour}시)
            </p>
          </div>
        </div>

        {/* Compact Legend Row */}
        <div className="flex items-center gap-x-3 gap-y-1.5 text-[11px] text-on-surface-variant flex-wrap">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-xs bg-primary shrink-0" />
            <span>피크 시간대</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-xs bg-primary-fixed shrink-0" />
            <span>일반 시간대</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-xs bg-surface-container-high shrink-0" />
            <span>경부하(심야)</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3.5 h-0.5 border-t border-dashed border-primary shrink-0" />
            <span>일평균 ({avgPrice.toFixed(2)}원)</span>
          </div>
        </div>
      </div>

      {/* Chart Graphic Container */}
      <div className="relative w-full h-64 pt-6 pb-1 select-none flex flex-col justify-end">
        {/* Background Horizontal Scale Gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7 pt-6">
          <div className="w-full flex items-center justify-between text-on-surface-variant font-mono text-[10px]">
            <div className="w-full border-b border-surface-container-high" />
            <span className="pl-1.5 shrink-0 tabular-nums">{maxScale}원</span>
          </div>
          <div className="w-full flex items-center justify-between text-on-surface-variant font-mono text-[10px]">
            <div className="w-full border-b border-surface-container-high" />
            <span className="pl-1.5 shrink-0 tabular-nums">
              {Math.round(minScale + (maxScale - minScale) * 0.66)}원
            </span>
          </div>
          <div className="w-full flex items-center justify-between text-on-surface-variant font-mono text-[10px]">
            <div className="w-full border-b border-surface-container-high" />
            <span className="pl-1.5 shrink-0 tabular-nums">
              {Math.round(minScale + (maxScale - minScale) * 0.33)}원
            </span>
          </div>
          <div className="w-full flex items-center justify-between text-on-surface-variant font-mono text-[10px]">
            <div className="w-full border-b border-surface-container-high" />
            <span className="pl-1.5 shrink-0 tabular-nums">{minScale}원</span>
          </div>
        </div>

        {/* Dynamic Average Reference Dashed Line */}
        <div
          className="absolute left-0 right-0 pointer-events-none flex items-center z-0 pr-0"
          style={{ bottom: `calc(1.75rem + ${avgLinePct * 0.72}%)` }}
        >
          <div className="w-full border-b-2 border-dashed border-primary/55" />
          <span className="pl-1 shrink-0 font-mono text-[9px] font-bold bg-surface-container-lowest text-primary tabular-nums">
            평균 {avgPrice.toFixed(1)}
          </span>
        </div>

        {/* 24-Hour Bar Columns */}
        <div
          className="relative z-10 w-full h-48 flex items-end justify-between gap-[2px] pr-11"
          id="smp-chart-bars"
        >
          {hours.map((item) => {
            const cat = getBarCategory(item);
            const isMax = item.hour === maxPoint.hour;
            const isMin = item.hour === minPoint.hour;
            const isCurrent = item.hour === currentHour;
            const isInspected = item.hour === selectedHour;
            const heightPct = getBarHeightPct(item.price);

            let barColor = 'bg-primary-fixed hover:bg-primary';
            if (cat === 'min') {
              barColor = 'bg-secondary-container hover:bg-secondary';
            } else if (isMax) {
              barColor = 'bg-primary-container hover:brightness-110';
            } else if (cat === 'peak' || isCurrent) {
              barColor = 'bg-primary hover:bg-primary-container';
            } else if (cat === 'offpeak') {
              barColor = 'bg-surface-container-high hover:bg-primary-fixed';
            }

            const showLabel =
              Number.parseInt(item.hour, 10) % 2 === 1 ||
              isMax ||
              isMin ||
              isCurrent ||
              item.hour === '24';

            return (
              <button
                key={item.hour}
                type="button"
                onClick={() => onSelectHour(item.hour)}
                onMouseEnter={() => onSelectHour(item.hour)}
                aria-label={`${item.hour}시 ${item.price.toFixed(2)} 원/kWh`}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative focus:outline-none"
              >
                {isMin && (
                  <span className="absolute -top-5 px-1 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-mono text-[8px] font-bold whitespace-nowrap z-20">
                    최저
                  </span>
                )}
                {isMax && (
                  <span className="absolute -top-5 px-1 py-0.5 rounded bg-primary text-on-primary font-mono text-[8px] font-bold shadow-xs whitespace-nowrap z-20">
                    최고
                  </span>
                )}
                {isCurrent && !isMax && !isMin && (
                  <span className="absolute -top-4 flex items-center justify-center z-20">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                    </span>
                  </span>
                )}

                <div
                  className={`w-full rounded-t-xs transition-all ${barColor} ${
                    isInspected ? 'ring-2 ring-on-surface ring-offset-1' : ''
                  }`}
                  style={{ height: `${heightPct}%` }}
                />

                <span
                  className={`font-mono text-[8.5px] mt-1.5 leading-none tabular-nums ${
                    isMax || isCurrent
                      ? 'text-primary font-bold'
                      : isMin
                        ? 'text-secondary font-bold'
                        : showLabel
                          ? 'text-on-surface-variant'
                          : 'text-transparent'
                  }`}
                >
                  {isCurrent ? `${item.hour}*` : item.hour}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Touch / Hover Inspector */}
      <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between gap-2 text-on-surface">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
            touch_app
          </span>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-on-surface whitespace-nowrap">
              {inspected.hour === currentHour ? `현재 ${inspected.hour}시` : `${inspected.hour}시 기준`}
            </span>
            <span className="font-metric text-sm font-bold text-primary whitespace-nowrap">
              {inspected.price.toFixed(2)} 원/kWh
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-xs font-semibold text-primary shadow-xs hover:bg-primary-fixed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {showTable ? '표 닫기' : '시간별 표'}
        </button>
      </div>

      {/* Expandable 24-Hour Price Table (per DESIGN.md Hourly Price Table spec) */}
      {showTable && (
        <div className="border border-surface-container-high rounded-xl overflow-hidden">
          <div className="px-3.5 py-2 bg-surface-container-low flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
            <span>24시간대별 상세 단가 (상위 15% 피크 강조)</span>
            <span>원/kWh</span>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-surface-container-low">
            {hours.map((row) => {
              const isPeakTop15 = row.price >= peakThreshold;
              const isSelected = row.hour === selectedHour;
              return (
                <button
                  key={row.hour}
                  type="button"
                  onClick={() => onSelectHour(row.hour)}
                  className={`w-full px-3.5 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary-fixed/70 font-bold text-on-primary-fixed'
                      : isPeakTop15
                        ? 'bg-[#FFF7ED] hover:bg-primary-fixed/40 text-on-surface'
                        : 'bg-surface-container-lowest hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <span className="font-mono tabular-nums flex items-center gap-2">
                    <span>{row.hour}:00</span>
                    {isPeakTop15 && (
                      <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-[10px] font-bold">
                        피크
                      </span>
                    )}
                    {row.hour === minPoint.hour && (
                      <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                        최저
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold tabular-nums">
                    {row.price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
