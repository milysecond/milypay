// Australian weather via Open-Meteo. Uses the default forecast endpoint, which
// auto-selects the best model for the location (BOM ACCESS-G for Australia when
// available, global models otherwise) so results are always populated.
// Free tier is non-commercial (CC BY 4.0); a commercial Open-Meteo plan is needed
// for paid production use. Attribution is returned with every response.

const WMO: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  56: "Freezing drizzle", 57: "Freezing drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  66: "Freezing rain", 67: "Freezing rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Light showers", 81: "Showers", 82: "Violent showers",
  85: "Snow showers", 86: "Snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail",
};

function describe(code: number | null): string {
  return code === null ? "Unknown" : WMO[code] ?? "Unknown";
}

export interface Weather {
  timezone: string;
  current: {
    time: string;
    temperature: number | null;
    apparentTemperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
    weatherCode: number | null;
    weather: string;
  };
  daily: {
    date: string;
    tempMax: number | null;
    tempMin: number | null;
    precipitation: number | null;
    weatherCode: number | null;
    weather: string;
  }[];
}

interface RawForecast {
  timezone?: string;
  current?: {
    time?: string;
    temperature_2m?: number | null;
    apparent_temperature?: number | null;
    relative_humidity_2m?: number | null;
    wind_speed_10m?: number | null;
    weather_code?: number | null;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_sum?: (number | null)[];
    weather_code?: (number | null)[];
  };
}

export async function getWeather(lat: number, lng: number, days = 7): Promise<Weather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(Math.min(Math.max(days, 1), 16)));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`weather upstream ${res.status}`);
  const d = (await res.json()) as RawForecast;

  const c = d.current || {};
  const day = d.daily || {};
  const dates = day.time || [];
  return {
    timezone: d.timezone || "UTC",
    current: {
      time: c.time || "",
      temperature: c.temperature_2m ?? null,
      apparentTemperature: c.apparent_temperature ?? null,
      humidity: c.relative_humidity_2m ?? null,
      windSpeed: c.wind_speed_10m ?? null,
      weatherCode: c.weather_code ?? null,
      weather: describe(c.weather_code ?? null),
    },
    daily: dates.map((date, i) => ({
      date,
      tempMax: day.temperature_2m_max?.[i] ?? null,
      tempMin: day.temperature_2m_min?.[i] ?? null,
      precipitation: day.precipitation_sum?.[i] ?? null,
      weatherCode: day.weather_code?.[i] ?? null,
      weather: describe(day.weather_code?.[i] ?? null),
    })),
  };
}
