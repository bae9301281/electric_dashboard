import { useMemo, useState } from 'react';
import type { SmpRecord, SortOrder, TableViewMode } from '../types/smp';
import { exportSmpCsv, formatPrice } from '../utils/csvParser';

interface CsvDataTableMobileProps {
  records: SmpRecord[];
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
}

export function CsvDataTableMobile({
  records,
  selectedPeriod,
  onSelectPeriod,
}: CsvDataTableMobileProps) {
  const [viewMode, setViewMode] = useState<TableViewMode>('year');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const selectedYear = selectedPeriod ? selectedPeriod.split('/')[0] : '';

  const displayedRecords = useMemo(() => {
    let list = records;
    if (viewMode === 'year' && selectedYear) {
      list = records.filter((r) => r.year === selectedYear);
    } else if (viewMode === 'selected' && selectedPeriod) {
      list = records.filter((r) => r.period === selectedPeriod);
    }
    return sortOrder === 'asc' ? [...list].reverse() : list;
  }, [records, viewMode, selectedYear, selectedPeriod, sortOrder]);

  return (
    <section
      id="csv-data-table"
      className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3.5"
    >
      {/* Table Header: Title + Unit & Source right next to title */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="font-headline text-[17px] font-bold text-on-surface tracking-tight">
            시간별 SMP · BLMP 데이터 표
          </h2>
          <span className="font-mono text-[11px] text-on-surface-variant">
            단위: 원/kWh · 출처: 한국전력거래소, 공공데이터포털
          </span>
        </div>

        {/* Filter Chips & Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-surface-container rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('year')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'year'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {selectedYear ? `${selectedYear}년` : '선택 연도'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              전체 ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('selected')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'selected'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              선택 월만
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))}
              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-[11px] font-semibold text-on-surface flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">swap_vert</span>
              <span>{sortOrder === 'desc' ? '최신순' : '과거순'}</span>
            </button>

            <button
              type="button"
              onClick={() => exportSmpCsv(displayedRecords, `kpx_smp_${viewMode}.csv`)}
              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-primary-fixed text-[11px] font-semibold text-primary flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exact 2-Tier Table: 기간, SMP(육지,제주,통합), BLMP */}
      <div className="border border-surface-container-high rounded-xl overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full border-collapse text-[11.5px] font-mono tabular-nums">
          <thead className="sticky top-0 z-10 bg-surface-container-low text-on-surface">
            <tr className="border-b border-surface-container-high">
              <th
                rowSpan={2}
                scope="col"
                className="px-2.5 py-2 text-left font-bold border-r border-surface-container-high whitespace-nowrap bg-surface-container-low"
              >
                기간
              </th>
              <th
                colSpan={3}
                scope="colgroup"
                className="px-2 py-1.5 text-center font-bold border-r border-surface-container-high border-b border-surface-container-high whitespace-nowrap bg-surface-container-low"
              >
                SMP(육지,제주,통합)
              </th>
              <th
                rowSpan={2}
                scope="col"
                className="px-2.5 py-2 text-right font-bold whitespace-nowrap bg-surface-container-low"
              >
                BLMP
              </th>
            </tr>
            <tr className="border-b border-surface-container-high bg-surface-container-low/80">
              <th
                scope="col"
                className="px-2 py-1.5 text-right font-semibold border-r border-surface-container-high whitespace-nowrap"
              >
                육지
              </th>
              <th
                scope="col"
                className="px-2 py-1.5 text-right font-semibold border-r border-surface-container-high whitespace-nowrap"
              >
                제주
              </th>
              <th
                scope="col"
                className="px-2 py-1.5 text-right font-bold text-primary border-r border-surface-container-high whitespace-nowrap"
              >
                통합
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-surface-container-low bg-surface-container-lowest">
            {displayedRecords.map((row) => {
              const isSelected = row.period === selectedPeriod;
              return (
                <tr
                  key={row.period}
                  onClick={() => onSelectPeriod(row.period)}
                  aria-selected={isSelected}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary-fixed/65 font-bold text-on-primary-fixed'
                      : 'hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <td className="px-2.5 py-2 text-left border-r border-surface-container-low whitespace-nowrap">
                    <span>{row.period}</span>
                    {isSelected && (
                      <span className="ml-1 text-[9px] font-sans font-bold text-primary">
                        ●
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-2 py-2 text-right border-r border-surface-container-low whitespace-nowrap ${
                      row.land === 0 && !isSelected ? 'text-on-surface-variant/45' : ''
                    }`}
                  >
                    {formatPrice(row.land)}
                  </td>
                  <td
                    className={`px-2 py-2 text-right border-r border-surface-container-low whitespace-nowrap ${
                      row.jeju === 0 && !isSelected ? 'text-on-surface-variant/45' : ''
                    }`}
                  >
                    {formatPrice(row.jeju)}
                  </td>
                  <td
                    className={`px-2 py-2 text-right border-r border-surface-container-low whitespace-nowrap ${
                      row.integrated === 0 && !isSelected
                        ? 'text-on-surface-variant/45'
                        : 'text-primary font-semibold'
                    }`}
                  >
                    {formatPrice(row.integrated)}
                  </td>
                  <td
                    className={`px-2.5 py-2 text-right whitespace-nowrap ${
                      row.blmp === 0 && !isSelected ? 'text-on-surface-variant/45' : ''
                    }`}
                  >
                    {formatPrice(row.blmp)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
