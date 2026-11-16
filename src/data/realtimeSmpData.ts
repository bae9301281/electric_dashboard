export type RegionKey = 'land' | 'jeju' | 'integrated';

export type NavTab =
  | 'hourly-smp'
  | 'regional-spread'
  | 'market-trends'
  | 'beginner-guide'
  | 'market-glossary';

export interface HourlyPoint {
  hour: string;
  price: number;
}

export interface RegionDayData {
  avg: number;
  prevAvg: number;
  weeklyAvg: number;
  delta: number;
  deltaPct: number;
  hours: HourlyPoint[];
}

export interface DailySmpDataset {
  dateId: string;
  label: string;
  shortLabel: string;
  currentHour: string;
  updatedAt: string;
  regions: Record<RegionKey, RegionDayData>;
}

const HOURS_2025_05_15_LAND: HourlyPoint[] = [
  { hour: '01', price: 120.4 },
  { hour: '02', price: 118.2 },
  { hour: '03', price: 116.5 },
  { hour: '04', price: 115.1 },
  { hour: '05', price: 119.8 },
  { hour: '06', price: 128.4 },
  { hour: '07', price: 136.2 },
  { hour: '08', price: 144.9 },
  { hour: '09', price: 149.3 },
  { hour: '10', price: 147.1 },
  { hour: '11', price: 139.5 },
  { hour: '12', price: 135.2 },
  { hour: '13', price: 137.8 },
  { hour: '14', price: 142.1 },
  { hour: '15', price: 145.6 },
  { hour: '16', price: 152.0 },
  { hour: '17', price: 162.7 },
  { hour: '18', price: 166.8 },
  { hour: '19', price: 168.4 },
  { hour: '20', price: 163.5 },
  { hour: '21', price: 155.1 },
  { hour: '22', price: 144.3 },
  { hour: '23', price: 134.0 },
  { hour: '24', price: 124.6 },
];

function shiftHours(base: HourlyPoint[], offset: number, wave = 0): HourlyPoint[] {
  return base.map((item, idx) => {
    const jitter = Math.sin(idx * 0.7 + wave) * 2.1;
    return {
      hour: item.hour,
      price: Number((item.price + offset + jitter).toFixed(2)),
    };
  });
}

const HOURS_2025_05_15_JEJU: HourlyPoint[] = [
  { hour: '01', price: 128.9 },
  { hour: '02', price: 126.4 },
  { hour: '03', price: 124.8 },
  { hour: '04', price: 123.5 },
  { hour: '05', price: 127.6 },
  { hour: '06', price: 135.8 },
  { hour: '07', price: 144.2 },
  { hour: '08', price: 153.4 },
  { hour: '09', price: 158.1 },
  { hour: '10', price: 155.2 },
  { hour: '11', price: 146.3 },
  { hour: '12', price: 141.7 },
  { hour: '13', price: 144.9 },
  { hour: '14', price: 149.8 },
  { hour: '15', price: 154.5 },
  { hour: '16', price: 161.2 },
  { hour: '17', price: 171.8 },
  { hour: '18', price: 175.4 },
  { hour: '19', price: 177.2 },
  { hour: '20', price: 172.6 },
  { hour: '21', price: 164.0 },
  { hour: '22', price: 153.7 },
  { hour: '23', price: 142.9 },
  { hour: '24', price: 133.1 },
];

const HOURS_2025_05_15_INT: HourlyPoint[] = HOURS_2025_05_15_LAND.map((item, idx) => ({
  hour: item.hour,
  price: Number((item.price * 0.96 + HOURS_2025_05_15_JEJU[idx].price * 0.04).toFixed(2)),
}));

export const DAILY_SMP_DATASETS: DailySmpDataset[] = [
  {
    dateId: '2025-05-15',
    label: '2025년 5월 15일 (목)',
    shortLabel: '2025.05.15 (목)',
    currentHour: '14',
    updatedAt: '2025-05-15 15:30:00 KST',
    regions: {
      land: {
        avg: 142.85,
        prevAvg: 138.65,
        weeklyAvg: 140.12,
        delta: 4.2,
        deltaPct: 3.03,
        hours: HOURS_2025_05_15_LAND,
      },
      jeju: {
        avg: 151.3,
        prevAvg: 148.1,
        weeklyAvg: 149.55,
        delta: 3.2,
        deltaPct: 2.16,
        hours: HOURS_2025_05_15_JEJU,
      },
      integrated: {
        avg: 143.19,
        prevAvg: 139.03,
        weeklyAvg: 140.5,
        delta: 4.16,
        deltaPct: 2.99,
        hours: HOURS_2025_05_15_INT,
      },
    },
  },
  {
    dateId: '2025-05-14',
    label: '2025년 5월 14일 (수)',
    shortLabel: '2025.05.14 (수)',
    currentHour: '24',
    updatedAt: '2025-05-14 24:00:00 KST',
    regions: {
      land: {
        avg: 138.65,
        prevAvg: 140.2,
        weeklyAvg: 139.7,
        delta: -1.55,
        deltaPct: -1.11,
        hours: shiftHours(HOURS_2025_05_15_LAND, -4.1, 1.2),
      },
      jeju: {
        avg: 148.1,
        prevAvg: 149.4,
        weeklyAvg: 149.0,
        delta: -1.3,
        deltaPct: -0.87,
        hours: shiftHours(HOURS_2025_05_15_JEJU, -3.2, 1.2),
      },
      integrated: {
        avg: 139.03,
        prevAvg: 140.57,
        weeklyAvg: 140.07,
        delta: -1.54,
        deltaPct: -1.1,
        hours: shiftHours(HOURS_2025_05_15_INT, -4.0, 1.2),
      },
    },
  },
  {
    dateId: '2025-05-13',
    label: '2025년 5월 13일 (화)',
    shortLabel: '2025.05.13 (화)',
    currentHour: '24',
    updatedAt: '2025-05-13 24:00:00 KST',
    regions: {
      land: {
        avg: 140.2,
        prevAvg: 137.45,
        weeklyAvg: 139.9,
        delta: 2.75,
        deltaPct: 2.0,
        hours: shiftHours(HOURS_2025_05_15_LAND, -2.5, 2.4),
      },
      jeju: {
        avg: 149.4,
        prevAvg: 146.9,
        weeklyAvg: 148.8,
        delta: 2.5,
        deltaPct: 1.7,
        hours: shiftHours(HOURS_2025_05_15_JEJU, -1.9, 2.4),
      },
      integrated: {
        avg: 140.57,
        prevAvg: 137.83,
        weeklyAvg: 140.26,
        delta: 2.74,
        deltaPct: 1.99,
        hours: shiftHours(HOURS_2025_05_15_INT, -2.4, 2.4),
      },
    },
  },
];

export interface GlossaryItem {
  term: string;
  english: string;
  category: string;
  summary: string;
  detail: string;
}

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: '계통한계가격 (SMP)',
    english: 'System Marginal Price',
    category: '시장 가격',
    summary: '시간대별 전력 수요를 맞추기 위해 투입된 가장 비싼 발전기의 변동비',
    detail:
      '한국전력공사가 발전사업자로부터 전기를 구매할 때 적용하는 도매 정산 단가입니다. 수요가 많은 피크 시간대에는 연료비가 높은 LNG 발전기가 가격을 결정하므로 SMP가 상승합니다.',
  },
  {
    term: '기저한계가격 (BLMP)',
    english: 'Base Load Marginal Price',
    category: '과거 제도',
    summary: '원자력·석탄 등 기저발전기에 별도로 적용되던 한계가격(2006년 폐지)',
    detail:
      '과거 기저발전기의 초과이윤을 조정하기 위해 일반 SMP와 분리 운영하던 가격 지표입니다. 2007년 이후 정산조정계수 도입과 함께 폐지되어 CSV 데이터에서도 0.00으로 표기됩니다.',
  },
  {
    term: '덕 커브 (Duck Curve)',
    english: 'Duck Curve',
    category: '수요 패턴',
    summary: '낮 시간대 태양광 발전 급증으로 순부하와 SMP가 오리 등처럼 움푹 파이는 현상',
    detail:
      '11시~14시 태양광 발전량이 최대치에 달하면 기존 화력발전 수요가 줄어 SMP가 낮아지다가, 해가 지는 17시 이후 급격히 치솟아 저녁 피크를 형성합니다.',
  },
  {
    term: '육지·제주 가격 분리',
    english: 'Regional Price Separation',
    category: '지역 계통',
    summary: '해저 연계선 제약과 발전원 구성 차이로 발생하는 육지·제주 간 SMP 격차',
    detail:
      '제주는 내륙과 송전 용량이 제한되어 있으며 LNG 및 중유 발전 비중이 높아 통상 육지 SMP보다 높은 가격을 형성합니다.',
  },
  {
    term: 'RPS & REC',
    english: 'Renewable Portfolio Standard',
    category: '신재생 수익',
    summary: '발전사업자의 전력 판매 수익 = 전력 도매가(SMP) + 신재생 인증서(REC)',
    detail:
      '태양광·풍력 발전소는 시간별 SMP로 전기를 판매함과 동시에, 생산량에 가중치를 곱한 REC를 추가 판매하여 전체 매출을 구성합니다.',
  },
];

export const REGION_LABELS: Record<RegionKey, string> = {
  land: '육지',
  jeju: '제주',
  integrated: '통합',
};

export function generateAiCommentary(
  region: RegionKey,
  dayData: RegionDayData,
  variantIndex: number
): { main: string; tip: string } {
  const regionName = REGION_LABELS[region];
  const maxPoint = dayData.hours.reduce((a, b) => (b.price > a.price ? b : a));
  const minPoint = dayData.hours.reduce((a, b) => (b.price < a.price ? b : a));
  const spread = (maxPoint.price - minPoint.price).toFixed(2);

  const mainVariants = [
    `오늘 ${regionName} SMP는 저녁 시간대(18~20시) 냉방 및 조명 수요 집중과 LNG 복합화력 발전기 가동 증가로 인해 최고 ${maxPoint.price.toFixed(2)} 원/kWh(${maxPoint.hour}:00)까지 상승했습니다. 반면 심야 시간대(02~06시)는 기저부하 발전(원자력·석탄) 비중이 높아 ${minPoint.price.toFixed(2)} 원/kWh(${minPoint.hour}:00)의 안정적인 흐름을 유지했습니다.`,
    `${regionName} 기준 일간 가중평균 SMP는 ${dayData.avg.toFixed(2)} 원/kWh로 전일(${dayData.prevAvg.toFixed(2)} 원) 대비 ${dayData.delta >= 0 ? '+' : ''}${dayData.delta.toFixed(2)}원 변동했습니다. 하루 최고가와 최저가의 일교차는 ${spread} 원/kWh이며, 17시~20시 피크 구간에 단가가 가장 높게 형성되었습니다.`,
  ];

  const tipVariants = [
    `태양광 발전 비중이 높은 낮 시간(11~14시)에는 신재생에너지 공급 확대로 인해 피크 시간 대비 SMP 상승폭이 제한되는 경향이 뚜렷합니다. ESS 충·방전 스케줄링 시 저녁 피크(17~20시) 방전을 고려하는 것이 수익성에 유리합니다.`,
    `시간별 정산에서는 ${minPoint.hour}시 경부하와 ${maxPoint.hour}시 피크 구간의 단가 차이가 ${spread}원/kWh에 달합니다. 수요반응(DR) 참여나 에너지 저장 장치 운용 시 피크 전후 시간대를 집중 모니터링하세요.`,
  ];

  return {
    main: mainVariants[variantIndex % mainVariants.length],
    tip: tipVariants[variantIndex % tipVariants.length],
  };
}
