import { useCallback, useEffect, useMemo, useState } from 'react';
import { CsvDataTableMobile } from './components/CsvDataTableMobile';
import { CsvMonthlyChart } from './components/CsvMonthlyChart';
import { RealtimeSupplySection } from './components/RealtimeSupplySection';
import {
  BeginnerGuideView,
  GlossaryView,
  MarketTrendsView,
  RegionalCompareView,
} from './components/SecondaryViews';
import { REGION_LABELS, type NavTab, type RegionKey } from './data/realtimeSmpData';
import type { SmpRecord } from './types/smp';
import { formatKoreanPeriod, formatPrice, loadAttachedSmpCsv } from './utils/csvParser';

function buildSparklinePath(values: number[]): { line: string; area: string } {
  if (values.length === 0) {
    return { line: 'M0,20 L200,20', area: 'M0,20 L200,20 L200,40 L0,40 Z' };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? 100 : (i / (values.length - 1)) * 200;
    const y = 34 - ((v - min) / range) * 28;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${pts.join(' L')}`;
  const area = `${line} L200,40 L0,40 Z`;
  return { line, area };
}

export default function App() {
  const [records, setRecords] = useState<SmpRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [region, setRegion] = useState<RegionKey>('land');
  const [activeTab, setActiveTab] = useState<NavTab>('hourly-smp');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifToast, setShowNotifToast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aiVariant, setAiVariant] = useState(0);
  const [isAiFading, setIsAiFading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCsv = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const parsed = await loadAttachedSmpCsv();
      setRecords(parsed);
      setSelectedPeriod((prev) =>
        prev && parsed.some((r) => r.period === prev) ? prev : parsed[0].period
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCsv();
  }, [fetchCsv]);

  const getRegionValue = useCallback(
    (rec: SmpRecord, reg: RegionKey = region) => {
      if (reg === 'land') return rec.land;
      if (reg === 'jeju') return rec.jeju;
      return rec.integrated;
    },
    [region]
  );

  const selectedIndex = useMemo(
    () => records.findIndex((r) => r.period === selectedPeriod),
    [records, selectedPeriod]
  );

  const selectedRecord = selectedIndex >= 0 ? records[selectedIndex] : records[0] ?? null;
  const previousRecord =
    selectedIndex >= 0 && selectedIndex + 1 < records.length ? records[selectedIndex + 1] : null;

  // Compute real stats from CSV for the selected period & region
  const dashboardStats = useMemo(() => {
    if (!selectedRecord) return null;

    const currentVal = getRegionValue(selectedRecord);
    const prevVal = previousRecord ? getRegionValue(previousRecord) : null;
    const delta = prevVal !== null ? currentVal - prevVal : 0;
    const deltaPct = prevVal && prevVal !== 0 ? (delta / prevVal) * 100 : 0;

    // Year records for year average, year peak, year min
    const sameYear = records.filter((r) => r.year === selectedRecord.year);
    const yearAvg =
      sameYear.length > 0
        ? sameYear.reduce((sum, r) => sum + getRegionValue(r), 0) / sameYear.length
        : currentVal;

    const yearMaxRec = sameYear.reduce(
      (a, b) => (getRegionValue(b) > getRegionValue(a) ? b : a),
      sameYear[0] ?? selectedRecord
    );
    const yearMinRec = sameYear.reduce(
      (a, b) => (getRegionValue(b) < getRegionValue(a) ? b : a),
      sameYear[0] ?? selectedRecord
    );

    // 12-month trailing sparkline up to selectedRecord
    const startIdx = selectedIndex >= 0 ? selectedIndex : 0;
    const trailing12 = records.slice(startIdx, startIdx + 12).reverse();
    const sparkline = buildSparklinePath(trailing12.map((r) => getRegionValue(r)));

    const spreadJejuLand = selectedRecord.jeju - selectedRecord.land;

    return {
      currentVal,
      prevVal,
      delta,
      deltaPct,
      yearAvg,
      yearMaxRec,
      yearMinRec,
      sparkline,
      spreadJejuLand,
    };
  }, [records, selectedRecord, previousRecord, selectedIndex, getRegionValue]);

  const commentary = useMemo(() => {
    if (!selectedRecord || !dashboardStats) {
      return { main: '', tip: '' };
    }
    const regName = REGION_LABELS[region];
    const maxVal = getRegionValue(dashboardStats.yearMaxRec);
    const minVal = getRegionValue(dashboardStats.yearMinRec);
    const spread = (maxVal - minVal).toFixed(2);
    const mainVariants = [
      `${formatKoreanPeriod(selectedRecord.period)} 기준 ${regName} 계통한계가격(SMP)은 ${dashboardStats.currentVal.toFixed(2)} 원/kWh입니다. 같은 해(${selectedRecord.year}년) 중 가장 높았던 시기는 ${dashboardStats.yearMaxRec.period} (${maxVal.toFixed(2)}원), 가장 낮았던 시기는 ${dashboardStats.yearMinRec.period} (${minVal.toFixed(2)}원)로 연간 변동 폭은 ${spread} 원/kWh를 기록했습니다.`,
      `${selectedRecord.period}의 육지 SMP는 ${selectedRecord.land.toFixed(2)}원, 제주 SMP는 ${selectedRecord.jeju.toFixed(2)}원, 통합 SMP는 ${selectedRecord.integrated.toFixed(2)}원이며, 기저한계가격(BLMP)은 ${selectedRecord.blmp.toFixed(2)} 원/kWh입니다. ${previousRecord ? `전월(${previousRecord.period}) 대비 ${dashboardStats.delta >= 0 ? '+' : ''}${dashboardStats.delta.toFixed(2)}원 변동했습니다.` : ''}`,
    ];
    const tipVariants = [
      `2007년 이전 기간(2001/04~2006/12)을 조회하면 기저한계가격(BLMP) 수치를 함께 확인할 수 있으며, 2010년 이후부터는 육지와 제주 지역별 SMP 분리가 본격적으로 반영됩니다.`,
      `상단 기간 드롭다운이나 아래 데이터 표의 행을 누르면 해당 시점의 육지·제주·통합 SMP와 BLMP 수치가 모든 카드에 즉시 반영됩니다.`,
    ];
    return {
      main: mainVariants[aiVariant % mainVariants.length],
      tip: tipVariants[aiVariant % tipVariants.length],
    };
  }, [selectedRecord, previousRecord, dashboardStats, region, aiVariant, getRegionValue]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCsv().finally(() => {
      setTimeout(() => setIsRefreshing(false), 500);
    });
  };

  const handleRegenerateAi = () => {
    setIsAiFading(true);
    setTimeout(() => {
      setAiVariant((v) => v + 1);
      setIsAiFading(false);
    }, 300);
  };

  const handleNavSelect = (tab: NavTab) => {
    setActiveTab(tab);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setActiveTab('market-glossary');
    setSearchOpen(false);
  };

  const navItems: { id: NavTab; icon: string; label: string; shortLabel: string }[] = [
    { id: 'hourly-smp', icon: 'schedule', label: '실시간·기간별 SMP', shortLabel: 'SMP현황' },
    { id: 'regional-spread', icon: 'map', label: '육지·제주 비교', shortLabel: '육지·제주' },
    { id: 'market-trends', icon: 'trending_up', label: '시장 트렌드 분석', shortLabel: '트렌드' },
    { id: 'beginner-guide', icon: 'menu_book', label: '입문자 필수 가이드', shortLabel: '가이드' },
    { id: 'market-glossary', icon: 'help_center', label: '전력 용어 사전', shortLabel: '용어사전' },
  ];

  return (
    <div className="min-h-screen bg-surface-container-low sm:py-4 flex justify-center">
      {/* Smartphone Viewport Shell (max-w-[430px] for smartphone dimensions) */}
      <div className="w-full max-w-[430px] min-h-screen sm:min-h-[844px] bg-surface text-on-surface flex flex-col relative sm:rounded-[28px] sm:shadow-[0_12px_40px_rgba(11,28,48,0.10)] sm:border sm:border-surface-container-high overflow-x-clip">
        {/* Mobile Top App Bar */}
        <header className="sticky top-0 z-40 h-14 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="메뉴 열기"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavSelect('hourly-smp')}
              className="flex items-center gap-2 min-w-0 cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-primary text-[18px]">bolt</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline text-sm font-bold text-on-surface leading-tight truncate">
                  SMP Explorer
                </span>
                <span className="font-mono text-[10px] text-on-surface-variant leading-tight truncate">
                  KPX CSV 데이터 연동
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-lowest rounded-full shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
              </span>
              <span className="font-mono text-[10px] text-on-surface font-semibold whitespace-nowrap">
                CSV 연동
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="검색"
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">search</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNotifToast((prev) => !prev)}
              aria-label="알림"
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
            </button>
          </div>
        </header>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <form
            onSubmit={handleSearchSubmit}
            className="px-4 py-2.5 bg-surface-container-low border-b border-surface-container-high flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SMP, BLMP, 덕 커브 등 용어 검색..."
              autoFocus
              className="bg-transparent text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none flex-1"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer"
            >
              검색
            </button>
          </form>
        )}

        {/* Notification Popover */}
        {showNotifToast && (
          <div className="mx-4 mt-3 p-3 bg-surface-container-lowest rounded-xl shadow-md border border-primary-fixed flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
                info
              </span>
              <div className="text-xs text-on-surface">
                <p className="font-bold">한국전력거래소 CSV 연동 완료</p>
                <p className="text-on-surface-variant mt-0.5">
                  2001/04 ~ 2026/09 ({records.length}개월) 육지·제주·통합 SMP 및 BLMP 데이터가 연결되었습니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowNotifToast(false)}
              className="text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Slide-Over Stitch Sidebar Drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-center">
            <div
              className="fixed inset-0 bg-on-surface/35 backdrop-blur-xs"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="relative w-full max-w-[430px] pointer-events-none flex">
              <aside className="pointer-events-auto w-72 h-full bg-surface-container-low shadow-2xl flex flex-col justify-between py-6 z-10">
                <div className="flex flex-col gap-5">
                  <div className="px-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary text-[20px]">
                          bolt
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline text-lg font-bold text-on-surface leading-tight">
                          SMP Explorer
                        </span>
                        <span className="font-mono text-[11px] text-on-surface-variant">
                          전력거래소 시장 데이터
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      aria-label="메뉴 닫기"
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  <div className="px-4">
                    <div className="px-3 py-2 bg-surface-container rounded-lg flex items-center justify-between">
                      <span className="font-mono text-[11px] text-on-surface-variant">
                        전력망 모드
                      </span>
                      <span className="font-mono text-[11px] text-tertiary font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                        정상 가동
                      </span>
                    </div>
                  </div>

                  <nav className="flex flex-col gap-1 px-4">
                    {navItems.map((item) => {
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavSelect(item.id)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left cursor-pointer ${
                            active
                              ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="px-4 flex flex-col gap-2">
                  <div className="p-3 bg-surface-container-high rounded-xl flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        info
                      </span>
                      <span className="font-mono text-xs text-on-surface font-semibold">
                        KPX CSV 데이터 연동
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      한국전력거래소·공공데이터포털의 계통한계가격({records.length}개월) 데이터를 표시합니다.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* Main Scrollable Content Area */}
        <main className="flex-1 px-4 pt-4 pb-24 flex flex-col gap-4">
          {error ? (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm text-center space-y-3">
              <p className="text-sm font-semibold text-error">{error}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer"
              >
                다시 불러오기
              </button>
            </div>
          ) : isLoading || !selectedRecord || !dashboardStats ? (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="h-24 rounded-2xl bg-surface-container-lowest" />
              <div className="h-44 rounded-2xl bg-surface-container-lowest" />
              <div className="h-64 rounded-2xl bg-surface-container-lowest" />
            </div>
          ) : (
            <>
              {activeTab === 'hourly-smp' && (
                <>
                  {/* Top Header & Global Filter Area */}
                  <section className="flex flex-col gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold tracking-wide">
                          계통한계가격 SMP
                        </span>
                        <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                          KPX CSV 연동 ({records.length}개월)
                        </span>
                      </div>
                      <h1 className="font-headline text-[22px] font-bold text-on-surface tracking-tight leading-snug">
                        계통한계가격 실시간 SMP
                      </h1>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        한국전력거래소 SMP(육지·제주·통합) 및 BLMP 기간별 데이터 조회
                      </p>
                    </div>

                    {/* Smartphone Action Controls: Period Dropdown + Region Chips + Refresh */}
                    <div className="flex flex-col gap-2.5">
                      {/* Period Selection Dropdown */}
                      <div className="relative flex items-center bg-surface-container-lowest shadow-sm rounded-xl px-3.5 py-2">
                        <span className="material-symbols-outlined text-primary text-[20px] mr-2.5 shrink-0">
                          calendar_today
                        </span>
                        <div className="flex flex-col flex-1 min-w-0">
                          <label
                            htmlFor="mobile-period-select"
                            className="font-mono text-[10px] text-on-surface-variant"
                          >
                            조회 기간 선택 (드롭다운)
                          </label>
                          <select
                            id="mobile-period-select"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer appearance-none pr-6 w-full truncate font-mono"
                          >
                            {records.map((rec) => (
                              <option key={rec.period} value={rec.period}>
                                {formatKoreanPeriod(rec.period)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px] pointer-events-none shrink-0">
                          expand_more
                        </span>
                      </div>

                      {/* Region Segmented Chips + Refresh Button */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 flex items-center p-1 bg-surface-container rounded-xl">
                          {(['land', 'jeju', 'integrated'] as RegionKey[]).map((key) => {
                            const active = region === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setRegion(key)}
                                className={`flex-1 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer ${
                                  active
                                    ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                                }`}
                              >
                                {REGION_LABELS[key]}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={handleRefresh}
                          title="데이터 새로고침"
                          aria-label="데이터 새로고침"
                          className="w-10 h-10 bg-surface-container-lowest text-on-surface shadow-sm rounded-xl hover:bg-primary-fixed hover:text-on-primary-fixed transition-all flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <span
                            className={`material-symbols-outlined text-[20px] transition-transform duration-500 ${
                              isRefreshing ? 'rotate-180' : ''
                            }`}
                          >
                            refresh
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Beginner Concept Banner */}
                    <div className="flex items-start gap-2.5 px-3.5 py-3 bg-surface-container-low rounded-xl text-on-surface shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                      <div className="w-7 h-7 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0 mt-0.5 ml-1">
                        <span className="material-symbols-outlined text-[17px]">lightbulb</span>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-primary">
                          SMP(System Marginal Price)란?
                        </span>
                        <span className="text-[11.5px] text-on-surface-variant leading-relaxed">
                          발전소에서 생산된 전기를 구매할 때 적용되는 도매 거래 가격입니다. 아래 표와 카드에서 선택한 기간({selectedRecord.period})의 SMP·BLMP 값을 바로 확인할 수 있습니다.
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Main Selected Period SMP Card */}
                  <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col gap-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-[11px] text-on-surface-variant tracking-wider">
                          {selectedRecord.period} {REGION_LABELS[region]} SMP
                        </span>
                        <div className="flex items-baseline gap-1 mt-1 flex-wrap">
                          <span className="font-metric text-[2.4rem] leading-none font-bold text-on-surface tracking-tight">
                            {dashboardStats.currentVal.toFixed(2)}
                          </span>
                          <span className="text-xs text-on-surface-variant font-semibold whitespace-nowrap">
                            원/kWh
                          </span>
                        </div>
                      </div>

                      {/* Trend Badge */}
                      {previousRecord && (
                        <div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full shadow-xs shrink-0 ${
                            dashboardStats.delta >= 0
                              ? 'bg-primary-fixed text-on-primary-fixed'
                              : 'bg-secondary-fixed text-on-secondary-fixed'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">
                            {dashboardStats.delta >= 0 ? 'trending_up' : 'trending_down'}
                          </span>
                          <span className="font-mono text-[11px] font-bold whitespace-nowrap tabular-nums">
                            {dashboardStats.delta >= 0 ? '+' : ''}
                            {dashboardStats.delta.toFixed(2)} (
                            {dashboardStats.deltaPct >= 0 ? '+' : ''}
                            {dashboardStats.deltaPct.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 12-Month Sparkline Vector from CSV */}
                    <div className="w-full h-11 py-1">
                      <svg
                        className="w-full h-full text-primary"
                        fill="none"
                        preserveAspectRatio="none"
                        viewBox="0 0 200 40"
                      >
                        <path
                          d={dashboardStats.sparkline.line}
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                        />
                        <path
                          d={dashboardStats.sparkline.area}
                          fill="currentColor"
                          fillOpacity="0.12"
                        />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[11px] text-on-surface-variant bg-surface-container-low px-3 py-2.5 rounded-xl gap-2">
                      <span className="truncate">
                        전월({previousRecord ? previousRecord.period : '-'}):{' '}
                        <strong className="text-on-surface font-semibold font-metric">
                          {dashboardStats.prevVal !== null
                            ? dashboardStats.prevVal.toFixed(2)
                            : '-'}
                        </strong>{' '}
                        원
                      </span>
                      <span className="truncate">
                        {selectedRecord.year}년 평균:{' '}
                        <strong className="text-on-surface font-semibold font-metric">
                          {dashboardStats.yearAvg.toFixed(2)}
                        </strong>{' '}
                        원
                      </span>
                    </div>
                  </div>

                  {/* High / Low Metric Strip (Year Peak & Year Low from CSV) */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Year Peak Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedPeriod(dashboardStats.yearMaxRec.period)}
                      className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex flex-col gap-1.5 text-left hover:ring-1 hover:ring-primary/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10.5px] text-primary font-bold flex items-center gap-0.5 whitespace-nowrap">
                          <span className="material-symbols-outlined text-[15px]">
                            local_fire_department
                          </span>
                          연중 최고
                        </span>
                        <span className="px-1.5 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-md font-mono text-[10px] font-bold whitespace-nowrap">
                          {dashboardStats.yearMaxRec.period}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-metric text-lg font-bold text-on-surface">
                          {getRegionValue(dashboardStats.yearMaxRec).toFixed(2)}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">원/kWh</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant leading-snug">
                        {selectedRecord.year}년 {REGION_LABELS[region]} 최고월
                      </span>
                    </button>

                    {/* Year Low Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedPeriod(dashboardStats.yearMinRec.period)}
                      className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex flex-col gap-1.5 text-left hover:ring-1 hover:ring-secondary/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10.5px] text-secondary font-bold flex items-center gap-0.5 whitespace-nowrap">
                          <span className="material-symbols-outlined text-[15px]">nightlight</span>
                          연중 최저
                        </span>
                        <span className="px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-mono text-[10px] font-bold rounded-md whitespace-nowrap">
                          {dashboardStats.yearMinRec.period}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-metric text-lg font-bold text-on-surface">
                          {getRegionValue(dashboardStats.yearMinRec).toFixed(2)}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">원/kWh</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant leading-snug">
                        {selectedRecord.year}년 {REGION_LABELS[region]} 최저월
                      </span>
                    </button>
                  </div>

                  {/* Selected Period Full Breakdown Card (육지 · 제주 · 통합 · BLMP) */}
                  <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-surface-container-low">
                      <span className="font-mono text-[10px] text-on-surface-variant block">
                        SMP 육지
                      </span>
                      <span className="font-metric text-sm font-bold text-on-surface">
                        {formatPrice(selectedRecord.land)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-surface-container-low">
                      <span className="font-mono text-[10px] text-on-surface-variant block">
                        SMP 제주
                      </span>
                      <span className="font-metric text-sm font-bold text-secondary">
                        {formatPrice(selectedRecord.jeju)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-primary-fixed/60">
                      <span className="font-mono text-[10px] text-on-primary-fixed block">
                        SMP 통합
                      </span>
                      <span className="font-metric text-sm font-bold text-primary">
                        {formatPrice(selectedRecord.integrated)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-surface-container-low">
                      <span className="font-mono text-[10px] text-on-surface-variant block">
                        BLMP
                      </span>
                      <span className="font-metric text-sm font-bold text-on-surface">
                        {formatPrice(selectedRecord.blmp)}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Monthly SMP Bar Chart (Connected to CSV) */}
                  <CsvMonthlyChart
                    records={records}
                    selectedRecord={selectedRecord}
                    region={region}
                    onSelectPeriod={setSelectedPeriod}
                  />

                  {/* Connected CSV Data Table (기간, SMP(육지,제주,통합), BLMP + Unit & Source) */}
                  <CsvDataTableMobile
                    records={records}
                    selectedPeriod={selectedPeriod}
                    onSelectPeriod={setSelectedPeriod}
                  />

                  {/* 실시간 전력 수급 (KPX Open API 연동) */}
                  <RealtimeSupplySection />

                  {/* Regional Quick Compare Card */}
                  <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[22px]">
                          compare_arrows
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-on-surface truncate">
                          육지 vs 제주 스프레드
                        </span>
                        <span className="text-xs text-on-surface-variant truncate">
                          제주 {selectedRecord.jeju.toFixed(2)}원 (차이:{' '}
                          {dashboardStats.spreadJejuLand >= 0 ? '+' : ''}
                          {dashboardStats.spreadJejuLand.toFixed(2)}원)
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNavSelect('regional-spread')}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-high text-xs font-semibold text-primary hover:bg-primary hover:text-on-primary transition-all whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      상세비교
                    </button>
                  </div>

                  {/* Beginner Learning Checklist Card */}
                  <div className="bg-primary-fixed/40 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        school
                      </span>
                      <span className="text-sm font-bold text-on-primary-fixed">
                        입문자 전력시장 체크포인트
                      </span>
                    </div>
                    <ul className="flex flex-col gap-2 text-xs text-on-surface leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold shrink-0">▪</span>
                        <span>
                          한 줄의 데이터는 <strong>기간, SMP(육지·제주·통합), BLMP</strong>로 구성되며 단위는 <strong>원/kWh</strong>입니다.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold shrink-0">▪</span>
                        <span>
                          2001/04~2006/12 기간은 통합 SMP와 <strong>기저한계가격(BLMP)</strong>이 함께 산정되었고, 2007년 이후 BLMP는 0.00으로 표기됩니다.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold shrink-0">▪</span>
                        <span>
                          SMP는 태양광·신재생 발전소(RPS) 사업자의 핵심 판매 수익(SMP+REC) 구성 요소입니다.
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Market Analysis Card */}
                  <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-on-primary shadow-xs shrink-0">
                          <span className="material-symbols-outlined text-[15px]">
                            auto_awesome
                          </span>
                          <span className="font-mono text-[10.5px] font-bold whitespace-nowrap">
                            시장 해설
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-on-surface truncate">
                          {selectedRecord.period} SMP 요약 분석
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={handleRegenerateAi}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">sync</span>
                        <span>새로고침</span>
                      </button>
                    </div>

                    <div
                      className={`p-3.5 bg-surface-container-low rounded-xl flex flex-col gap-3 text-xs leading-relaxed text-on-surface transition-opacity duration-300 ${
                        isAiFading ? 'opacity-50' : 'opacity-100'
                      }`}
                    >
                      <p>{commentary.main}</p>
                      <div className="p-3 bg-surface-container-lowest rounded-lg flex items-start gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                          tips_and_updates
                        </span>
                        <p className="text-[11.5px] text-on-surface-variant leading-relaxed">
                          <strong className="text-primary font-semibold">참고 안내:</strong>{' '}
                          {commentary.tip}
                        </p>
                      </div>
                    </div>

                    {/* Footer KPX Attribution */}
                    <div className="flex flex-col gap-1.5 pt-1 text-on-surface-variant font-mono text-[10.5px]">
                      <div className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">
                          database
                        </span>
                        <span>
                          출처: <strong>한국전력거래소(KPX) · 공공데이터포털</strong> (시간별 SMP)
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span>단위: 원/kWh</span>
                        <span>
                          선택 기간:{' '}
                          <strong className="text-on-surface font-semibold">
                            {selectedRecord.period}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'regional-spread' && (
                <RegionalCompareView
                  records={records}
                  selectedRecord={selectedRecord}
                  onSelectPeriod={setSelectedPeriod}
                />
              )}

              {activeTab === 'market-trends' && (
                <MarketTrendsView
                  records={records}
                  selectedPeriod={selectedPeriod}
                  onSelectPeriod={(p) => {
                    setSelectedPeriod(p);
                    setActiveTab('hourly-smp');
                  }}
                />
              )}

              {activeTab === 'beginner-guide' && <BeginnerGuideView />}

              {activeTab === 'market-glossary' && <GlossaryView initialQuery={searchTerm} />}
            </>
          )}
        </main>

        {/* Smartphone Bottom Tab Bar */}
        <nav
          aria-label="하단 메뉴"
          className="fixed bottom-0 w-full max-w-[430px] h-14 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container-high z-30 flex items-center justify-around px-1 sm:rounded-b-[28px]"
        >
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavSelect(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors cursor-pointer ${
                  active ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="text-[10px] leading-none whitespace-nowrap">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
