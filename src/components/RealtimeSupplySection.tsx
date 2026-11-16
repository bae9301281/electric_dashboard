import { useCallback, useEffect, useMemo, useState } from 'react';

interface RealtimeSupplyItem {
  tradeYmd: string;
  hour: string;
  areaNm: string;
  smp: number;
  forecastDemand: number;
}

interface ApiSuccessPayload {
  ok: true;
  date: string;
  endpoint: string;
  fetchedAt: string;
  items: RealtimeSupplyItem[];
}

interface ApiErrorPayload {
  ok: false;
  errorCode: string;
  message: string;
  detail?: string;
  endpoint?: string;
}

function getTodayKstInputDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function RealtimeSupplySection() {
  const [dateInput, setDateInput] = useState<string>(getTodayKstInputDate);
  const [areaFilter, setAreaFilter] = useState<'육지' | '제주'>('육지');
  const [items, setItems] = useState<RealtimeSupplyItem[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<ApiErrorPayload | null>(null);

  const loadSupplyData = useCallback(async (targetDateInput: string) => {
    setIsLoading(true);
    setErrorInfo(null);
    const ymd = targetDateInput.replaceAll('-', '');

    try {
      const response = await fetch(`/api/realtime-supply?date=${encodeURIComponent(ymd)}`);
      const rawText = await response.text();

      let data: ApiSuccessPayload | ApiErrorPayload;
      try {
        data = JSON.parse(rawText) as ApiSuccessPayload | ApiErrorPayload;
      } catch {
        setItems([]);
        setErrorInfo({
          ok: false,
          errorCode: `HTTP_${response.status}`,
          message: `서버 응답을 해석하지 못했습니다. (HTTP ${response.status})`,
          detail: rawText.slice(0, 240) || response.statusText,
          endpoint: 'https://apis.data.go.kr/B552115/SmpWithForecastDemand',
        });
        return;
      }

      if (!response.ok || !data.ok) {
        const errPayload = !data.ok
          ? data
          : {
              ok: false as const,
              errorCode: `HTTP_${response.status}`,
              message: '실시간 전력 수급 API 요청에 실패했습니다.',
            };
        setItems([]);
        setErrorInfo(errPayload);
        return;
      }

      setItems(data.items);
      setFetchedAt(data.fetchedAt);
    } catch (err) {
      setItems([]);
      setErrorInfo({
        ok: false,
        errorCode: 'FETCH_FAILED',
        message: '실시간 전력 수급 API 요청 중 네트워크 오류가 발생했습니다.',
        detail: err instanceof Error ? err.message : String(err),
        endpoint: 'https://apis.data.go.kr/B552115/SmpWithForecastDemand',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupplyData(dateInput);
  }, [dateInput, loadSupplyData]);

  const [selectedHour, setSelectedHour] = useState<string>('');

  const filteredItems = useMemo(() => {
    const matched = items.filter((item) => item.areaNm.includes(areaFilter));
    return matched.length > 0 ? matched : items;
  }, [items, areaFilter]);

  const stats = useMemo(() => {
    if (filteredItems.length === 0) return null;
    const peakItem = filteredItems.reduce(
      (a, b) => (b.forecastDemand > a.forecastDemand ? b : a),
      filteredItems[0]
    );
    const minDemandItem = filteredItems.reduce(
      (a, b) => (b.forecastDemand < a.forecastDemand ? b : a),
      filteredItems[0]
    );
    const maxSmpItem = filteredItems.reduce(
      (a, b) => (b.smp > a.smp ? b : a),
      filteredItems[0]
    );
    const minSmpItem = filteredItems.reduce(
      (a, b) => (b.smp < a.smp ? b : a),
      filteredItems[0]
    );

    const avgSmp =
      filteredItems.reduce((sum, item) => sum + item.smp, 0) / filteredItems.length;
    const maxDemand = Math.max(1, peakItem.forecastDemand);
    const demandFloor = Math.max(
      0,
      Math.floor((minDemandItem.forecastDemand * 0.85) / 100) * 100
    );
    const demandCeil = Math.max(demandFloor + 100, peakItem.forecastDemand * 1.05);

    const smpFloor = Math.max(0, Math.floor((minSmpItem.smp - 10) / 10) * 10);
    const smpCeil = Math.max(smpFloor + 20, Math.ceil((maxSmpItem.smp + 10) / 10) * 10);

    // Build SVG polyline points in 0..240 x 0..100 coordinate space for SMP overlay
    const smpPoints = filteredItems.map((item, idx) => {
      const x =
        filteredItems.length === 1
          ? 120
          : ((idx + 0.5) / filteredItems.length) * 240;
      const yRatio = (item.smp - smpFloor) / (smpCeil - smpFloor);
      const y = 92 - Math.min(1, Math.max(0, yRatio)) * 80;
      return { x, y, item };
    });

    const smpLinePath = smpPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');

    return {
      peakItem,
      minDemandItem,
      avgSmp,
      maxDemand,
      demandFloor,
      demandCeil,
      smpFloor,
      smpCeil,
      smpPoints,
      smpLinePath,
    };
  }, [filteredItems]);

  const inspectedItem = useMemo(() => {
    if (!stats || filteredItems.length === 0) return null;
    return (
      filteredItems.find((i) => i.hour === selectedHour) ?? stats.peakItem
    );
  }, [filteredItems, selectedHour, stats]);

  return (
    <section
      id="realtime-supply-section"
      aria-labelledby="realtime-supply-title"
      className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3.5"
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold whitespace-nowrap">
              Open API 연동
            </span>
            <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium whitespace-nowrap">
              SmpWithForecastDemand
            </span>
          </div>

          <button
            type="button"
            onClick={() => loadSupplyData(dateInput)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <span
              className={`material-symbols-outlined text-[14px] ${
                isLoading ? 'animate-spin' : ''
              }`}
            >
              sync
            </span>
            <span>다시 조회</span>
          </button>
        </div>

        <div>
          <h2
            id="realtime-supply-title"
            className="font-headline text-[17px] font-bold text-on-surface tracking-tight"
          >
            실시간 전력 수급
          </h2>
          <p className="text-[11.5px] text-on-surface-variant mt-0.5">
            한국전력거래소 계통한계가격 및 하루전 발전계획 수요예측 실시간 조회
          </p>
        </div>

        {/* Date & Area Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
          <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-1.5 gap-1.5">
            <span className="material-symbols-outlined text-primary text-[16px]">
              calendar_today
            </span>
            <input
              type="date"
              aria-label="실시간 전력 수급 조회 일자"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="bg-transparent font-mono text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center p-1 bg-surface-container rounded-xl">
            {(['육지', '제주'] as const).map((area) => {
              const active = areaFilter === area;
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => setAreaFilter(area)}
                  className={`px-3 py-1 rounded-lg text-[11px] transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface font-medium'
                  }`}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-2.5 animate-pulse py-1">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="h-16 rounded-xl bg-surface-container-low" />
            <div className="h-16 rounded-xl bg-surface-container-low" />
          </div>
          <div className="h-44 rounded-xl bg-surface-container-low" />
          <div className="h-32 rounded-xl bg-surface-container-low" />
        </div>
      ) : errorInfo ? (
        /* Error State rendered directly inside the section */
        <div
          role="alert"
          className="bg-error-container/60 border border-error/25 rounded-xl p-4 flex flex-col gap-2.5 text-on-error-container"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span className="material-symbols-outlined text-error text-[18px]">error</span>
              <span>실시간 전력 수급 API 요청 실패</span>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-error/10 text-error whitespace-nowrap">
              {errorInfo.errorCode}
            </span>
          </div>

          <p className="text-xs font-semibold leading-relaxed text-on-surface">
            {errorInfo.message}
          </p>

          {errorInfo.detail && (
            <p className="font-mono text-[11px] leading-relaxed bg-surface-container-lowest/80 rounded-lg p-2.5 text-on-error-container break-all">
              {errorInfo.detail}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <span className="font-mono text-[10px] text-on-surface-variant truncate max-w-[230px]">
              요청: {errorInfo.endpoint ?? 'https://apis.data.go.kr/B552115/SmpWithForecastDemand'}
            </span>
            <button
              type="button"
              onClick={() => loadSupplyData(dateInput)}
              className="px-3 py-1.5 rounded-lg bg-error text-on-error text-[11px] font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
            >
              다시 요청
            </button>
          </div>
        </div>
      ) : stats ? (
        /* Success State */
        <div className="flex flex-col gap-3.5">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
              <span className="font-mono text-[10px] text-on-surface-variant">
                최대 예측 수요 ({stats.peakItem.hour}:00)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-metric text-lg font-bold text-on-surface">
                  {Math.round(stats.peakItem.forecastDemand).toLocaleString('ko-KR')}
                </span>
                <span className="text-[11px] text-on-surface-variant">MW</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary-fixed/50 flex flex-col gap-1">
              <span className="font-mono text-[10px] text-on-primary-fixed">
                평균 예측 SMP ({areaFilter})
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-metric text-lg font-bold text-primary">
                  {stats.avgSmp.toFixed(2)}
                </span>
                <span className="text-[11px] text-on-primary-fixed">원/kWh</span>
              </div>
            </div>
          </div>

          {/* 실시간 전력 수급 그래프 (수요예측 막대 + SMP 추이선) */}
          <div className="bg-surface-container-low/70 rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-on-surface">
                시간별 전력 수급 그래프 ({areaFilter})
              </span>
              <div className="flex items-center gap-3 text-[10.5px] font-mono text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-secondary-container inline-block" />
                  예측수요(MW)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-primary inline-block" />
                  SMP(원)
                </span>
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative w-full pt-5 pb-1 select-none flex flex-col gap-1.5">
              {/* Plot Box (Gridlines + Demand Bars + SMP Line Overlay) */}
              <div className="relative w-full h-36 flex items-end">
                {/* Background Horizontal Gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[1, 0.5, 0].map((ratio, idx) => {
                    const demandTick = Math.round(
                      stats.demandFloor + (stats.demandCeil - stats.demandFloor) * ratio
                    );
                    return (
                      <div
                        key={idx}
                        className="w-full flex items-center justify-between text-on-surface-variant font-mono text-[9px]"
                      >
                        <div className="w-full border-b border-surface-container-high" />
                        <span className="pl-1.5 w-11 text-right shrink-0 tabular-nums">
                          {demandTick.toLocaleString('ko-KR')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bars + SVG SMP Line Overlay (exact same bounding box) */}
                <div className="relative z-10 w-[calc(100%-2.75rem)] h-full flex items-end justify-between gap-[2px]">
                  <svg
                    viewBox="0 0 240 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
                  >
                    <path
                      d={stats.smpLinePath}
                      fill="none"
                      stroke="#a33900"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {stats.smpPoints.map(({ x, y, item }) => {
                      const isFocused = inspectedItem?.hour === item.hour;
                      return (
                        <circle
                          key={item.hour}
                          cx={x}
                          cy={y}
                          r={isFocused ? 3.8 : 1.8}
                          fill={isFocused ? '#a33900' : '#fffbff'}
                          stroke="#a33900"
                          strokeWidth={isFocused ? 1.5 : 1.2}
                        />
                      );
                    })}
                  </svg>

                  {filteredItems.map((item) => {
                    const pct = Math.min(
                      96,
                      Math.max(
                        12,
                        Math.round(
                          ((item.forecastDemand - stats.demandFloor) /
                            (stats.demandCeil - stats.demandFloor)) *
                            100
                        )
                      )
                    );
                    const isPeak = item.hour === stats.peakItem.hour;
                    const isFocused = inspectedItem?.hour === item.hour;

                    return (
                      <button
                        key={`${item.areaNm}-${item.hour}`}
                        type="button"
                        onClick={() => setSelectedHour(item.hour)}
                        onMouseEnter={() => setSelectedHour(item.hour)}
                        aria-label={`${item.hour}시 수요 ${Math.round(item.forecastDemand)}MW SMP ${item.smp.toFixed(2)}원`}
                        className="flex-1 h-full flex flex-col items-center justify-end relative cursor-pointer focus:outline-none z-10"
                      >
                        {isPeak && (
                          <span className="absolute -top-4 px-1 py-0.5 rounded bg-secondary text-on-secondary font-mono text-[8px] font-bold whitespace-nowrap z-30">
                            피크
                          </span>
                        )}
                        <div
                          className={`w-full rounded-t-xs transition-all ${
                            isFocused
                              ? 'bg-secondary ring-1 ring-on-surface/70'
                              : isPeak
                                ? 'bg-secondary/85'
                                : 'bg-secondary-container/80 hover:bg-secondary/75'
                          }`}
                          style={{ height: `${pct}%` }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* X-Axis Hour Labels */}
              <div className="w-[calc(100%-2.75rem)] flex items-center justify-between gap-[2px]">
                {filteredItems.map((item) => {
                  const isPeak = item.hour === stats.peakItem.hour;
                  const isFocused = inspectedItem?.hour === item.hour;
                  const hourNum = Number.parseInt(item.hour, 10);
                  const showLabel =
                    hourNum === 1 || hourNum % 4 === 0 || isPeak || item.hour === '24';
                  return (
                    <span
                      key={`lbl-${item.hour}`}
                      className={`flex-1 text-center font-mono text-[8.5px] leading-none tabular-nums ${
                        isFocused
                          ? 'text-primary font-bold'
                          : isPeak
                            ? 'text-secondary font-bold'
                            : showLabel
                              ? 'text-on-surface-variant'
                              : 'text-transparent'
                      }`}
                    >
                      {item.hour}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Interactive Inspector Strip */}
            {inspectedItem && (
              <div className="px-3 py-2 bg-surface-container-lowest rounded-lg flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                <span className="font-bold text-on-surface">
                  {inspectedItem.hour}:00 기준
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-secondary font-semibold">
                    수요 {Math.round(inspectedItem.forecastDemand).toLocaleString('ko-KR')} MW
                  </span>
                  <span className="text-primary font-bold">
                    SMP {inspectedItem.smp.toFixed(2)} 원
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Hourly Table */}
          <div className="border border-surface-container-high rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 px-3 py-2 bg-surface-container-low font-mono text-[10.5px] font-bold text-on-surface-variant">
              <span className="col-span-3">시각</span>
              <span className="col-span-5 text-right">예측 수요(MW)</span>
              <span className="col-span-4 text-right">SMP(원/kWh)</span>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-surface-container-low">
              {filteredItems.map((item, idx) => {
                const barPct = Math.max(8, Math.round((item.forecastDemand / stats.maxDemand) * 100));
                const isPeak = item.hour === stats.peakItem.hour;
                const isFocused = inspectedItem?.hour === item.hour;
                return (
                  <button
                    key={`${item.areaNm}-${item.hour}-${idx}`}
                    type="button"
                    onClick={() => setSelectedHour(item.hour)}
                    className={`w-full grid grid-cols-12 px-3 py-2 text-xs font-mono tabular-nums items-center text-left cursor-pointer transition-colors ${
                      isFocused
                        ? 'bg-primary-fixed/55 font-bold'
                        : isPeak
                          ? 'bg-[#FFF7ED] hover:bg-primary-fixed/30'
                          : 'bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="col-span-3 font-medium text-on-surface">
                      {item.hour}:00
                    </span>
                    <div className="col-span-5 flex flex-col items-end gap-1">
                      <span className="text-on-surface font-semibold">
                        {Math.round(item.forecastDemand).toLocaleString('ko-KR')}
                      </span>
                      <div className="w-16 h-1 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full rounded-full bg-secondary"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`col-span-4 text-right font-bold ${
                        isPeak ? 'text-primary' : 'text-on-surface'
                      }`}
                    >
                      {item.smp.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant pt-0.5">
            <span>출처: 공공데이터포털 · 한국전력거래소</span>
            <span>
              갱신:{' '}
              {fetchedAt
                ? new Date(fetchedAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-'}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
