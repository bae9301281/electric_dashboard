import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KPX_ENDPOINT =
  'https://apis.data.go.kr/B552115/SmpWithForecastDemand/getSmpWithForecastDemand';

interface RawKpxItem {
  tradeYmd?: string;
  date?: string;
  time?: string | number;
  hour?: string | number;
  tradeHour?: string | number;
  areaNm?: string;
  areaName?: string;
  smp?: string | number;
  mlfd?: string | number;
  jlfd?: string | number;
  slfd?: string | number;
  forecastDemand?: string | number;
  fcstDemand?: string | number;
  demand?: string | number;
}

export interface RealtimeSupplyItem {
  tradeYmd: string;
  hour: string;
  areaNm: string;
  smp: number;
  forecastDemand: number;
  totalDemand: number;
}

function getTodayKstYmd(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function extractXmlTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
}

function normalizeItems(rawList: RawKpxItem[], fallbackDate: string): RealtimeSupplyItem[] {
  return rawList
    .map((item) => {
      const rawHour = item.time ?? item.hour ?? item.tradeHour ?? '';
      const hourNum = Number.parseInt(String(rawHour), 10);
      const hourStr = Number.isNaN(hourNum)
        ? String(rawHour)
        : String(hourNum).padStart(2, '0');

      const area = String(item.areaNm ?? item.areaName ?? '육지').trim();
      const smpVal = Number.parseFloat(String(item.smp ?? '0'));

      // KPX SmpWithForecastDemand returns mlfd (육지), jlfd (제주), slfd (합계)
      const areaDemandRaw = area.includes('제주')
        ? item.jlfd ?? item.forecastDemand ?? item.fcstDemand ?? item.demand ?? '0'
        : item.mlfd ?? item.forecastDemand ?? item.fcstDemand ?? item.demand ?? '0';
      const totalDemandRaw = item.slfd ?? areaDemandRaw;

      const demandVal = Number.parseFloat(String(areaDemandRaw));
      const totalDemandVal = Number.parseFloat(String(totalDemandRaw));

      return {
        tradeYmd: String(item.tradeYmd ?? item.date ?? fallbackDate).trim(),
        hour: hourStr,
        areaNm: area,
        smp: Number.isNaN(smpVal) ? 0 : smpVal,
        forecastDemand: Number.isNaN(demandVal) ? 0 : demandVal,
        totalDemand: Number.isNaN(totalDemandVal) ? 0 : totalDemandVal,
      };
    })
    .filter((item) => item.hour !== '')
    .sort((a, b) => a.hour.localeCompare(b.hour));
}

async function startServer() {
  const app = express();
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  app.get('/api/realtime-supply', async (req, res) => {
    // Re-read .env so user edits to .env take effect without restarting
    dotenv.config({ override: true });

    const rawKey = (
      process.env.KPX_API_KEY ||
      process.env.DATA_GO_KR_API_KEY ||
      process.env.SERVICE_KEY ||
      ''
    ).trim();

    if (!rawKey) {
      res.status(400).json({
        ok: false,
        errorCode: 'MISSING_API_KEY',
        message: '.env 파일에 인증키(KPX_API_KEY)가 설정되어 있지 않습니다.',
        detail:
          '프로젝트 루트의 .env 파일에 공공데이터포털 인증키(KPX_API_KEY)를 입력한 뒤 다시 조회해 주세요.',
        endpoint: KPX_ENDPOINT,
      });
      return;
    }

    const queryDate =
      typeof req.query.date === 'string' && /^\d{8}$/.test(req.query.date)
        ? req.query.date
        : getTodayKstYmd();

    // Avoid double-encoding if user pasted an already URL-encoded serviceKey
    const encodedServiceKey = rawKey.includes('%') ? rawKey : encodeURIComponent(rawKey);
    const requestUrl =
      `${KPX_ENDPOINT}?serviceKey=${encodedServiceKey}` +
      `&pageNo=1&numOfRows=48&dataType=JSON&date=${encodeURIComponent(queryDate)}`;

    try {
      const upstream = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(10000),
      });

      const rawText = await upstream.text();

      if (!upstream.ok) {
        res.status(502).json({
          ok: false,
          errorCode: `HTTP_${upstream.status}`,
          message: `공공데이터포털 API 요청이 실패했습니다. (HTTP ${upstream.status})`,
          detail: rawText.slice(0, 300) || upstream.statusText,
          endpoint: KPX_ENDPOINT,
        });
        return;
      }

      const trimmed = rawText.trim();
      if (trimmed.startsWith('<')) {
        const reasonCode = extractXmlTag(trimmed, 'returnReasonCode') ?? 'XML_ERROR';
        const authMsg =
          extractXmlTag(trimmed, 'returnAuthMsg') ??
          extractXmlTag(trimmed, 'errMsg') ??
          '공공데이터포털 XML 오류 응답이 반환되었습니다.';
        res.status(502).json({
          ok: false,
          errorCode: reasonCode,
          message: `API 오류 (${reasonCode}): ${authMsg}`,
          detail: trimmed.slice(0, 300),
          endpoint: KPX_ENDPOINT,
        });
        return;
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        res.status(502).json({
          ok: false,
          errorCode: 'INVALID_JSON',
          message: 'API 응답을 JSON으로 해석하지 못했습니다.',
          detail: trimmed.slice(0, 300),
          endpoint: KPX_ENDPOINT,
        });
        return;
      }

      const responseObj = parsed.response as
        | {
            header?: { resultCode?: string; resultMsg?: string };
            body?: {
              items?: { item?: RawKpxItem | RawKpxItem[] } | string;
              totalCount?: number;
            };
          }
        | undefined;

      const resultCode = responseObj?.header?.resultCode;
      const resultMsg = responseObj?.header?.resultMsg;

      if (resultCode && resultCode !== '00') {
        res.status(502).json({
          ok: false,
          errorCode: resultCode,
          message: `KPX API 오류 (${resultCode}): ${resultMsg ?? '알 수 없는 오류'}`,
          detail: JSON.stringify(responseObj?.header ?? {}),
          endpoint: KPX_ENDPOINT,
        });
        return;
      }

      const rawItemsContainer = responseObj?.body?.items;
      let rawArray: RawKpxItem[] = [];
      if (
        rawItemsContainer &&
        typeof rawItemsContainer === 'object' &&
        'item' in rawItemsContainer &&
        rawItemsContainer.item
      ) {
        rawArray = Array.isArray(rawItemsContainer.item)
          ? rawItemsContainer.item
          : [rawItemsContainer.item];
      }

      const items = normalizeItems(rawArray, queryDate);

      if (items.length === 0) {
        res.status(404).json({
          ok: false,
          errorCode: 'EMPTY_DATA',
          message: `${queryDate} 일자의 실시간 전력 수급 데이터가 존재하지 않습니다.`,
          detail:
            '해당 날짜의 하루전 발전계획 데이터가 아직 공시되지 않았거나 조회 결과가 0건입니다.',
          endpoint: KPX_ENDPOINT,
        });
        return;
      }

      res.json({
        ok: true,
        date: queryDate,
        endpoint: KPX_ENDPOINT,
        fetchedAt: new Date().toISOString(),
        items,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 네트워크 오류가 발생했습니다.';
      res.status(502).json({
        ok: false,
        errorCode: 'NETWORK_ERROR',
        message: '공공데이터포털 API 서버에 연결하지 못했습니다.',
        detail: errorMessage,
        endpoint: KPX_ENDPOINT,
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
