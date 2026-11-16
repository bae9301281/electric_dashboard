import { ArrowDownUp, Download, RotateCcw } from 'lucide-react';
import { useMemo, useRef } from 'react';
import type { SmpRecord, SortOrder, TableViewMode } from '../types/smp';
import { formatPrice } from '../utils/csvParser';

interface SmpDataTableProps {
  records: SmpRecord[];
  selectedPeriod: string;
  viewMode: TableViewMode;
  sortOrder: SortOrder;
  onChangeViewMode: (mode: TableViewMode) => void;
  onToggleSortOrder: () => void;
  onSelectPeriod: (period: string) => void;
  onExportCsv: () => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function SmpDataTable({
  records,
  selectedPeriod,
  viewMode,
  sortOrder,
  onChangeViewMode,
  onToggleSortOrder,
  onSelectPeriod,
  onExportCsv,
  isLoading,
  error,
  onRetry,
}: SmpDataTableProps) {
  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);
  const selectedYear = selectedPeriod ? selectedPeriod.split('/')[0] : '';

  const filteredRecords = useMemo(() => {
    let list = records;
    if (viewMode === 'year' && selectedYear) {
      list = records.filter((r) => r.year === selectedYear);
    } else if (viewMode === 'selected' && selectedPeriod) {
      list = records.filter((r) => r.period === selectedPeriod);
    }

    if (sortOrder === 'asc') {
      return [...list].reverse();
    }
    return list;
  }, [records, viewMode, selectedYear, selectedPeriod, sortOrder]);

  const scrollToSelectedRow = () => {
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section
      id="smp-table"
      aria-labelledby="smp-table-title"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Table Title + Unit & Source Metadata + Controls */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="smp-table-title" className="text-lg font-semibold text-slate-900 tracking-tight">
            계통한계가격 시간별 SMP 및 BLMP 현황표
          </h2>
          <span className="text-xs sm:text-sm text-slate-600">
            단위: 원/kWh <span aria-hidden="true" className="mx-1 text-slate-300">·</span> 출처: 한국전력거래소, 공공데이터포털
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Segmented View Filter */}
          <div
            role="group"
            aria-label="표시 기간 범위"
            className="inline-flex items-center p-1 bg-slate-100 rounded-lg"
          >
            <button
              type="button"
              onClick={() => onChangeViewMode('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 기간 ({records.length})
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('year')}
              disabled={!selectedYear}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                viewMode === 'year'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {selectedYear ? `${selectedYear}년` : '선택 연도'}
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('selected')}
              disabled={!selectedPeriod}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                viewMode === 'selected'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              선택 기간만
            </button>
          </div>

          {viewMode === 'all' && selectedPeriod && (
            <button
              type="button"
              onClick={scrollToSelectedRow}
              className="h-9 px-3 text-xs font-medium text-blue-700 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              선택 행 위치로
            </button>
          )}

          <button
            type="button"
            onClick={onToggleSortOrder}
            className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>{sortOrder === 'desc' ? '최신순' : '과거순'}</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            disabled={filteredRecords.length === 0}
            className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>표 CSV 저장</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error ? (
        <div className="px-6 py-16 text-center space-y-4">
          <p className="text-sm font-medium text-rose-700">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>다시 불러오기</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
              {/* First Header Row: 기간, SMP(육지,제주,통합), BLMP */}
              <tr className="border-b border-slate-200">
                <th
                  rowSpan={2}
                  scope="col"
                  className="px-5 py-2.5 text-left text-xs font-semibold text-slate-800 border-r border-slate-200 bg-slate-100 whitespace-nowrap w-[20%]"
                >
                  기간
                </th>
                <th
                  colSpan={3}
                  scope="colgroup"
                  className="px-4 py-2 text-center text-xs font-semibold text-slate-800 border-r border-slate-200 bg-slate-100 whitespace-nowrap"
                >
                  SMP(육지,제주,통합)
                </th>
                <th
                  rowSpan={2}
                  scope="col"
                  className="px-5 py-2.5 text-right text-xs font-semibold text-slate-800 bg-slate-100 whitespace-nowrap w-[20%]"
                >
                  BLMP
                </th>
              </tr>
              {/* Second Header Row: 육지, 제주, 통합 */}
              <tr className="border-b border-slate-300 bg-slate-50">
                <th
                  scope="col"
                  className="px-5 py-2 text-right text-xs font-medium text-slate-600 border-r border-slate-200 bg-slate-50 whitespace-nowrap w-[20%]"
                >
                  육지
                </th>
                <th
                  scope="col"
                  className="px-5 py-2 text-right text-xs font-medium text-slate-600 border-r border-slate-200 bg-slate-50 whitespace-nowrap w-[20%]"
                >
                  제주
                </th>
                <th
                  scope="col"
                  className="px-5 py-2 text-right text-xs font-semibold text-slate-800 border-r border-slate-200 bg-slate-50 whitespace-nowrap w-[20%]"
                >
                  통합
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx} className="h-10 animate-pulse">
                    <td className="px-5 py-2.5 border-r border-slate-100">
                      <div className="h-4 w-16 bg-slate-200 rounded" />
                    </td>
                    <td className="px-5 py-2.5 border-r border-slate-100">
                      <div className="h-4 w-14 bg-slate-200 rounded ml-auto" />
                    </td>
                    <td className="px-5 py-2.5 border-r border-slate-100">
                      <div className="h-4 w-14 bg-slate-200 rounded ml-auto" />
                    </td>
                    <td className="px-5 py-2.5 border-r border-slate-100">
                      <div className="h-4 w-14 bg-slate-200 rounded ml-auto" />
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="h-4 w-12 bg-slate-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                    표시할 기간의 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => {
                  const isSelected = row.period === selectedPeriod;
                  return (
                    <tr
                      key={row.period}
                      ref={isSelected ? selectedRowRef : null}
                      onClick={() => onSelectPeriod(row.period)}
                      aria-selected={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectPeriod(row.period);
                        }
                      }}
                      className={`h-10 transition-colors cursor-pointer focus:outline-none focus-visible:bg-blue-50 ${
                        isSelected
                          ? 'bg-blue-50/90 hover:bg-blue-100/70'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td
                        className={`px-5 py-2 text-left font-mono tabular-nums border-r border-slate-100 whitespace-nowrap ${
                          isSelected ? 'font-semibold text-blue-900' : 'font-medium text-slate-800'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span>{row.period}</span>
                          {isSelected && (
                            <span className="font-sans text-[11px] font-semibold text-blue-700">
                              선택됨
                            </span>
                          )}
                        </span>
                      </td>
                      <td
                        className={`px-5 py-2 text-right font-mono tabular-nums border-r border-slate-100 whitespace-nowrap ${
                          row.land === 0
                            ? 'text-slate-400'
                            : isSelected
                              ? 'font-semibold text-blue-950'
                              : 'text-slate-800'
                        }`}
                      >
                        {formatPrice(row.land)}
                      </td>
                      <td
                        className={`px-5 py-2 text-right font-mono tabular-nums border-r border-slate-100 whitespace-nowrap ${
                          row.jeju === 0
                            ? 'text-slate-400'
                            : isSelected
                              ? 'font-semibold text-blue-950'
                              : 'text-slate-800'
                        }`}
                      >
                        {formatPrice(row.jeju)}
                      </td>
                      <td
                        className={`px-5 py-2 text-right font-mono tabular-nums border-r border-slate-100 whitespace-nowrap ${
                          row.integrated === 0
                            ? 'text-slate-400'
                            : isSelected
                              ? 'font-semibold text-blue-800'
                              : 'font-medium text-slate-900'
                        }`}
                      >
                        {formatPrice(row.integrated)}
                      </td>
                      <td
                        className={`px-5 py-2 text-right font-mono tabular-nums whitespace-nowrap ${
                          row.blmp === 0
                            ? 'text-slate-400'
                            : isSelected
                              ? 'font-semibold text-blue-950'
                              : 'text-slate-800'
                        }`}
                      >
                        {formatPrice(row.blmp)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Footer Note */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
        <span>
          행(기간)을 클릭하면 상단 기간 선택 값과 연동되어 해당 월의 SMP·BLMP 수치를 확인할 수 있습니다.
        </span>
        <span className="shrink-0">
          2001/04~2006/12: 통합 SMP·BLMP 제공 · 2007/01 이후: 육지·제주·통합 SMP 제공
        </span>
      </div>
    </section>
  );
}
