/**
 * 港區天氣資料取得與解讀。
 * 僅在伺服器端執行（天氣面板以伺服器元件方式渲染），資料於伺服器快取後再輸出 HTML。
 */

export interface CurrentWeather {
  /** 氣溫 °C */
  temperature: number;
  /** 體感溫度 °C */
  apparentTemperature: number;
  /** 相對濕度 % */
  humidity: number;
  /** 平均風速 km/h */
  windSpeed: number;
  /** 陣風 km/h */
  windGust: number;
  /** 目前降水量 mm */
  precipitation: number;
  weatherCode: number;
  /** 觀測資料時間（ISO 8601，港區時區） */
  observedAt: string | null;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  maxTemperature: number;
  minTemperature: number;
  precipitationProbability: number | null;
  windGustMax: number | null;
  sunrise: string | null;
  sunset: string | null;
}

export interface WeatherSnapshot {
  current: CurrentWeather;
  daily: DailyForecast[];
  /** 資料取得時間，HH:MM（台灣時間） */
  fetchedAt: string;
}

export const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=25.1309627&longitude=121.7413639" +
  "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_gusts_10m_max,sunrise,sunset" +
  "&timezone=Asia%2FTaipei&forecast_days=7";

export type IconKind =
  | "sun"
  | "partly"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "showers"
  | "storm"
  | "snow";

export const WEATHER_ICON_PATHS: Record<IconKind, string[]> = {
  sun: [
    "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10",
    "M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4",
  ],
  partly: [
    "M16.5 3v2M21 7.5h-2M20.2 3.8l-1.4 1.4",
    "M7.5 19H17a3.5 3.5 0 0 0 .6-7A5.5 5 0 0 0 6.7 12.4 3.6 3.6 0 0 0 7.5 19Z",
  ],
  cloud: ["M7 18h10a4 4 0 0 0 .7-7.9A5.5 5 0 0 0 6.4 10.5 4 4 0 0 0 7 18Z"],
  fog: [
    "M7 15h10a4 4 0 0 0 .7-7.9A5.5 5 0 0 0 6.4 7.5 4 4 0 0 0 7 15Z",
    "M4 18h16",
    "M6 21h12",
  ],
  drizzle: [
    "M7 15h10a4 4 0 0 0 .7-7.9A5.5 5 0 0 0 6.4 7.5 4 4 0 0 0 7 15Z",
    "M8 18.5v.01M12 20.5v.01M16 18.5v.01",
  ],
  rain: [
    "M7 15h10a4 4 0 0 0 .7-7.9A5.5 5 0 0 0 6.4 7.5 4 4 0 0 0 7 15Z",
    "M8 18l-1 3M12 18l-1 3M16 18l-1 3",
  ],
  showers: [
    "M7 14h10a4 4 0 0 0 .7-7.9A5.5 5 0 0 0 6.4 6.5 4 4 0 0 0 7 14Z",
    "M8 17l-1.5 4M12 17l-1.5 4M16 17l-1.5 4",
  ],
  storm: [
    "M7 14h10a4 4 0 0 0 .7-7.9A5.5 5 0 0 0 6.4 6.5 4 4 0 0 0 7 14Z",
    "M12.5 15l-2.5 4h3l-2.5 4",
  ],
  snow: [
    "M7 15h10a4 4 0 0 0 .7-7.9A5.5 5 0 0 0 6.4 7.5 4 4 0 0 0 7 15Z",
    "M8 18v.01M12 20v.01M16 18v.01M10 21v.01M14 17v.01",
  ],
};

export function describeWeatherCode(code: number): { label: string; kind: IconKind } {
  if (code === 0) return { label: "晴朗", kind: "sun" };
  if (code === 1) return { label: "大致晴朗", kind: "sun" };
  if (code === 2) return { label: "多雲時晴", kind: "partly" };
  if (code === 3) return { label: "陰天", kind: "cloud" };
  if (code === 45 || code === 48) return { label: "起霧", kind: "fog" };
  if (code >= 51 && code <= 57) return { label: "毛毛雨", kind: "drizzle" };
  if (code >= 61 && code <= 67) return { label: "有雨", kind: "rain" };
  if (code >= 71 && code <= 77) return { label: "可能降雪", kind: "snow" };
  if (code >= 80 && code <= 82) return { label: "陣雨", kind: "showers" };
  if (code === 85 || code === 86) return { label: "陣雪", kind: "snow" };
  if (code >= 95) return { label: "雷雨", kind: "storm" };
  return { label: "多雲", kind: "cloud" };
}

/** 遊客最在意的判斷：今天出門要不要帶傘。 */
export function umbrellaAdvice(
  code: number,
  precipitationProbability: number | null,
  windSpeed: number,
  windGust = windSpeed
): { tone: "alert" | "warn" | "calm"; title: string; detail: string } {
  const gusty = windGust >= 40 || windSpeed >= 30;

  if (code >= 95) {
    return {
      tone: "alert",
      title: "留意雷雨，彈性調整行程",
      detail: gusty
        ? "預報顯示可能有雷雨，且港邊陣風明顯。廣場是開放空間，建議縮短停留或改走室內行程；強風時雨衣比雨傘實用。"
        : "預報顯示可能有雷雨。廣場是開放空間，建議縮短停留或改走車站、商場等室內行程，並隨身攜帶雨具。",
    };
  }
  if (code >= 61 && code <= 67) {
    return {
      tone: "alert",
      title: "正在下雨，雨具必備",
      detail: gusty
        ? "目前有降雨且港邊風勢明顯。建議穿雨衣、留意隨身物品，木棧平台潮濕時請放慢腳步。"
        : "目前有降雨，請攜帶雨具。雨天的港灣別有氣氛，但木棧平台可能濕滑。",
    };
  }
  if (precipitationProbability !== null && precipitationProbability >= 70) {
    return {
      tone: "alert",
      title: "帶傘必備",
      detail: gusty
        ? "降雨機率高，且港邊陣風明顯。雨衣通常比雨傘實用，也請注意帽子與手機等隨身物品。"
        : "降雨機率高，出門請務必攜帶雨具；木棧平台潮濕時請放慢腳步。",
    };
  }
  if (precipitationProbability !== null && precipitationProbability >= 40) {
    return {
      tone: "warn",
      title: "建議帶傘",
      detail: gusty
        ? "有一定降雨機率，且港邊陣風明顯，建議以雨衣為主、雨傘為備。"
        : "有一定降雨機率，建議攜帶輕便雨具，並視天況調整停留時間。",
    };
  }
  return {
    tone: "calm",
    title: "輕便雨具備用即可",
    detail: gusty
      ? "降雨機率不高，但港邊陣風明顯，請留意帽子、雨傘與手持物品。"
      : "降雨機率不高。基隆全年有雨，隨身放一支輕便雨傘仍比較保險。",
  };
}

/** 體感與穿著建議：把溫濕度與風翻譯成「該怎麼穿」。 */
export function comfortAdvice(
  apparentTemperature: number,
  humidity: number,
  windSpeed: number
): { title: string; detail: string } {
  if (apparentTemperature >= 32) {
    return {
      title: "悶熱，注意防曬補水",
      detail: `體感約 ${apparentTemperature}°C，港邊遮陰有限。建議避開正午、補充水分，並準備帽子與防曬用品。`,
    };
  }
  if (apparentTemperature >= 26) {
    return {
      title: "溫暖偏悶，透氣衣物為主",
      detail: `體感約 ${apparentTemperature}°C、相對濕度 ${humidity}%。建議穿著透氣短袖，並留意午後雷陣雨。`,
    };
  }
  if (apparentTemperature >= 20) {
    return {
      title: "舒適，最適合長時間停留",
      detail: `體感約 ${apparentTemperature}°C，是散步與拍照最舒服的區間；傍晚轉涼可加一件薄外套。`,
    };
  }
  if (apparentTemperature >= 14) {
    return {
      title: "偏涼，建議帶薄外套",
      detail: `體感約 ${apparentTemperature}°C，港邊風速約 ${windSpeed} km/h，體感會比市區更涼，建議採洋蔥式穿法。`,
    };
  }
  return {
    title: "濕冷，注意保暖防風",
    detail: `體感約 ${apparentTemperature}°C，東北季風期間體感會再更低。建議防風外套、手套與防滑鞋。`,
  };
}

export function describeDayLabel(date: string, index: number): string {
  if (index === 0) return "今天";
  if (index === 1) return "明天";
  return new Intl.DateTimeFormat("zh-TW", {
    weekday: "short",
    timeZone: "Asia/Taipei",
  }).format(new Date(`${date}T12:00:00`));
}

export function describeMonthDay(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function formatUpdateTime(date: Date): string {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Taipei",
  }).format(date);
}

/** 將 ISO 時間字串（含時區資料或港區當地時間）轉為 HH:MM。 */
export function formatClock(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  const formatted = new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Taipei",
  }).format(new Date(value));
  return formatted === "24:00" ? `${match[1]}:${match[2]}` : formatted;
}

export interface OpenMeteoResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_gusts_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: (number | null)[];
    wind_gusts_10m_max?: (number | null)[];
    sunrise?: string[];
    sunset?: string[];
  };
}

function parseSnapshot(json: OpenMeteoResponse, fetchedAt: Date): WeatherSnapshot | null {
  const current = json.current;
  const daily = json.daily;
  if (!current || !daily || !Array.isArray(daily.time) || daily.time.length === 0) return null;

  const days: DailyForecast[] = daily.time.map((date, index) => ({
    date,
    weatherCode: daily.weather_code?.[index] ?? 3,
    maxTemperature: Math.round(daily.temperature_2m_max?.[index] ?? 0),
    minTemperature: Math.round(daily.temperature_2m_min?.[index] ?? 0),
    precipitationProbability: daily.precipitation_probability_max?.[index] ?? null,
    windGustMax:
      typeof daily.wind_gusts_10m_max?.[index] === "number"
        ? Math.round(daily.wind_gusts_10m_max[index] as number)
        : null,
    sunrise: daily.sunrise?.[index] ?? null,
    sunset: daily.sunset?.[index] ?? null,
  }));

  return {
    current: {
      temperature: Math.round(current.temperature_2m ?? 0),
      apparentTemperature: Math.round(current.apparent_temperature ?? 0),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      windGust: Math.round(current.wind_gusts_10m ?? 0),
      precipitation: current.precipitation ?? 0,
      weatherCode: current.weather_code ?? 3,
      observedAt: current.time ?? null,
    },
    daily: days,
    fetchedAt: formatUpdateTime(fetchedAt),
  };
}

/** 伺服器端快取時間：10 分鐘。 */
const CACHE_TTL_MS = 10 * 60 * 1000;
let memoryCache: { at: number; data: WeatherSnapshot } | null = null;
let inFlight: Promise<WeatherSnapshot | null> | null = null;

/**
 * 於伺服器端取得天氣快照並快取。
 * 同一快取週期內的多次請求只會呼叫一次上游服務；取得失敗時回傳最後一次成功的資料。
 */
export async function getWeatherSnapshot(): Promise<WeatherSnapshot | null> {
  if (memoryCache && Date.now() - memoryCache.at < CACHE_TTL_MS) {
    return memoryCache.data;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const response = await fetch(OPEN_METEO_URL, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`天氣服務回應異常：${response.status}`);
      const snapshot = parseSnapshot((await response.json()) as OpenMeteoResponse, new Date());
      if (!snapshot) throw new Error("天氣資料不完整");
      memoryCache = { at: Date.now(), data: snapshot };
      return snapshot;
    } catch {
      return memoryCache?.data ?? null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
