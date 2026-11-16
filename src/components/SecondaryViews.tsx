import { useMemo, useState } from 'react';
import { GLOSSARY_ITEMS } from '../data/realtimeSmpData';
import type { SmpRecord } from '../types/smp';
import { formatKoreanPeriod, formatPrice } from '../utils/csvParser';

export function RegionalCompareView({
  records,
  selectedRecord,
  onSelectPeriod,
}: {
  records: SmpRecord[];
  selectedRecord: SmpRecord;
  onSelectPeriod: (period: string) => void;
}) {
  const spread = selectedRecord.jeju - selectedRecord.land;
  const yearRecords = useMemo(
    () =>
      records
        .filter((r) => r.year === selectedRecord.year)
        .sort((a, b) => b.month.localeCompare(a.month)),
    [records, selectedRecord.year]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="self-start font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold">
          지역별 가격 비교
        </span>
        <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">
          육지 · 제주 SMP 스프레드
        </h1>
        <p className="text-xs text-on-surface-variant">
          {formatKoreanPeriod(selectedRecord.period)} 기준 육지·제주 계통한계가격 격차 (단위: 원/kWh)
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-xl bg-surface-container-low">
            <span className="font-mono text-[10px] text-on-surface-variant block">육지 SMP</span>
            <span className="font-metric text-lg font-bold text-on-surface">
              {formatPrice(selectedRecord.land)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-surface-container-low">
            <span className="font-mono text-[10px] text-on-surface-variant block">제주 SMP</span>
            <span className="font-metric text-lg font-bold text-secondary">
              {formatPrice(selectedRecord.jeju)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-primary-fixed/60">
            <span className="font-mono text-[10px] text-on-primary-fixed block">
              격차 (제주-육지)
            </span>
            <span className="font-metric text-lg font-bold text-primary">
              {spread >= 0 ? `+${spread.toFixed(2)}` : spread.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="border border-surface-container-high rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 px-3 py-2 bg-surface-container-low font-mono text-[11px] font-bold text-on-surface-variant">
            <span>기간</span>
            <span className="text-right">육지</span>
            <span className="text-right">제주</span>
            <span className="text-right">차이</span>
          </div>
          <div className="divide-y divide-surface-container-low max-h-[380px] overflow-y-auto">
            {yearRecords.map((row) => {
              const diff = row.jeju - row.land;
              const isSelected = row.period === selectedRecord.period;
              return (
                <button
                  key={row.period}
                  type="button"
                  onClick={() => onSelectPeriod(row.period)}
                  className={`w-full grid grid-cols-4 px-3 py-2.5 text-xs font-mono tabular-nums items-center text-left cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary-fixed/60 font-bold text-on-primary-fixed'
                      : 'hover:bg-surface-container-low'
                  }`}
                >
                  <span className="font-medium">{row.period}</span>
                  <span className="text-right">{formatPrice(row.land)}</span>
                  <span className="text-right text-secondary font-semibold">
                    {formatPrice(row.jeju)}
                  </span>
                  <span className="text-right text-primary font-bold">
                    {diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketTrendsView({
  records,
  selectedPeriod,
  onSelectPeriod,
}: {
  records: SmpRecord[];
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
}) {
  const yearlyStats = useMemo(() => {
    const map = new Map<string, { sumInt: number; sumBlmp: number; count: number; maxInt: number }>();
    for (const r of records) {
      const curr = map.get(r.year) ?? { sumInt: 0, sumBlmp: 0, count: 0, maxInt: 0 };
      curr.sumInt += r.integrated;
      curr.sumBlmp += r.blmp;
      curr.count += 1;
      curr.maxInt = Math.max(curr.maxInt, r.integrated);
      map.set(r.year, curr);
    }
    return Array.from(map.entries()).map(([year, stat]) => ({
      year,
      avgInt: stat.sumInt / stat.count,
      avgBlmp: stat.sumBlmp / stat.count,
      maxInt: stat.maxInt,
      months: stat.count,
    }));
  }, [records]);

  const maxYearAvg = useMemo(
    () => Math.max(1, ...yearlyStats.map((y) => y.avgInt)),
    [yearlyStats]
  );

  const selectedYear = selectedPeriod.split('/')[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="self-start font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold">
          2001 ~ 2026 장기 추세
        </span>
        <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">
          연도별 시장 트렌드 분석
        </h1>
        <p className="text-xs text-on-surface-variant">
          단위: 원/kWh · 출처: 한국전력거래소, 공공데이터포털 (연도 막대를 누르면 해당 연도 조회)
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant pb-1 border-b border-surface-container-high">
          <span>연도 (수록 월)</span>
          <span>연평균 통합 SMP / BLMP</span>
        </div>

        <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
          {yearlyStats.map((item) => {
            const widthPct = Math.max(8, Math.round((item.avgInt / maxYearAvg) * 100));
            const isSelectedYear = item.year === selectedYear;
            return (
              <button
                key={item.year}
                type="button"
                onClick={() => {
                  const target = records.find((r) => r.year === item.year);
                  if (target) onSelectPeriod(target.period);
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-colors cursor-pointer ${
                  isSelectedYear
                    ? 'bg-primary-fixed/60 ring-1 ring-primary'
                    : 'bg-surface-container-low/70 hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="font-bold text-on-surface">
                    {item.year}년{' '}
                    <span className="text-[10px] font-normal text-on-surface-variant">
                      ({item.months}개월)
                    </span>
                  </span>
                  <span className="tabular-nums">
                    <strong className="text-primary">{item.avgInt.toFixed(2)}</strong>
                    <span className="text-on-surface-variant">
                      {item.avgBlmp > 0 ? ` · BLMP ${item.avgBlmp.toFixed(2)}` : ''}
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isSelectedYear ? 'bg-primary' : 'bg-primary-container/75'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function BeginnerGuideView() {
  const steps = [
    {
      num: '01',
      title: '계통한계가격(SMP)은 어떻게 정해질까요?',
      body: '전력거래소는 시간대별 전력 수요를 맞추기 위해 발전 단가가 저렴한 발전기(원자력·석탄)부터 차례로 가동합니다. 마지막에 투입된 가장 비싼 발전기(주로 LNG)의 단가가 그 시간의 SMP가 됩니다.',
    },
    {
      num: '02',
      title: '2001~2006년 BLMP와 2007년 이후의 차이',
      body: '2006년 12월까지는 기저발전기(원자력·석탄)에 별도의 기저한계가격(BLMP)이 적용되었고, 2007년부터는 BLMP가 폐지되어 CSV 데이터상 0.00으로 기록됩니다. 2010년부터는 육지와 제주 SMP가 분리 공시됩니다.',
    },
    {
      num: '03',
      title: '발전 사업자 수익(SMP + REC) 구조',
      body: '신재생에너지 발전 사업자는 생산한 전기를 SMP 단가로 한국전력에 판매하고, 별도로 발급되는 공급인증서(REC)를 현물·계약 시장에 팔아 수익을 창출합니다.',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="self-start font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold">
          입문자 교육 모듈
        </span>
        <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">
          입문자 필수 가이드
        </h1>
        <p className="text-xs text-on-surface-variant">
          도매 전력시장과 계통한계가격(SMP)·기저한계가격(BLMP)의 핵심 원리를 이해해 보세요.
        </p>
      </div>

      {steps.map((step) => (
        <div
          key={step.num}
          className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col gap-2"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-primary-fixed text-on-primary-fixed">
              {step.num}
            </span>
            <h2 className="font-headline text-base font-bold text-on-surface">{step.title}</h2>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{step.body}</p>
        </div>
      ))}
    </div>
  );
}

export function GlossaryView({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY_ITEMS;
    return GLOSSARY_ITEMS.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.english.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="self-start font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-bold">
          MARKET GLOSSARY
        </span>
        <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">
          전력 용어 사전
        </h1>
      </div>

      <div className="flex items-center bg-surface-container-lowest rounded-xl px-3.5 py-2.5 gap-2 shadow-sm">
        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SMP, BLMP, 덕 커브, REC 등 용어 검색..."
          className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none w-full"
        />
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center text-sm text-on-surface-variant shadow-sm">
            검색어와 일치하는 전력 용어가 없습니다.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.term}
              className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-headline text-base font-bold text-on-surface">{item.term}</h2>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-semibold shrink-0">
                  {item.category}
                </span>
              </div>
              <span className="font-mono text-[11px] text-primary font-semibold">
                {item.english}
              </span>
              <p className="text-xs font-semibold text-on-surface">{item.summary}</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">{item.detail}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
