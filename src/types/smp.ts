export interface SmpRecord {
  period: string;
  year: string;
  month: string;
  land: number;
  jeju: number;
  integrated: number;
  blmp: number;
}

export type TableViewMode = 'all' | 'year' | 'selected';
export type SortOrder = 'desc' | 'asc';
