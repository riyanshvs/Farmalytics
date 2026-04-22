import { useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wind, Droplets, CloudRain, Sprout } from "lucide-react";
import { SettingsBar } from "@/components/SettingsBar";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api";
import { safeJsonParse } from "@/lib/safeJson";
import { useQuery } from "@tanstack/react-query";
import queryKeys from "@/lib/queryKeys";

type WeatherSummaryResponse = {
  location?: { label?: string };
  degraded?: boolean;
  degradedReason?: string;
  weather?: {
    current?: {
      temperature?: number;
      humidity?: number;
      windSpeed?: number;
      aqi?: number | null;
      precipitation?: number;
      condition?: string;
    };
    hourly?: Array<{ time: string; temperature: number | null }>;
    daily?: Array<{
      date: string;
      min: number | null;
      max: number | null;
      condition: string;
      precipitationProbabilityMax?: number | null;
    }>;
    sun?: { sunrise?: string | null; sunset?: string | null };
  };
};

const conditionToEmoji = (condition: string) => {
  switch (condition) {
    case "clear":
      return "☀️";
    case "partlyCloudy":
      return "🌤️";
    case "cloudy":
      return "☁️";
    case "rainy":
    case "drizzle":
      return "🌧️";
    case "stormy":
      return "⛈️";
    case "fog":
      return "🌫️";
    case "snow":
      return "❄️";
    default:
      return "🌤️";
  }
};

const conditionToLabel = (condition: string, t: (key: string, options?: Record<string, unknown>) => string) => {
  switch (condition) {
    case "clear":
      return t("pages.weatherSoil.clear");
    case "partlyCloudy":
      return t("pages.weatherSoil.partlyCloudy");
    case "cloudy":
      return t("pages.weatherSoil.cloudy");
    case "rainy":
    case "drizzle":
      return t("pages.weatherSoil.rainy");
    case "stormy":
      return t("pages.weatherSoil.stormy");
    case "fog":
      return t("pages.weatherSoil.fog");
    case "snow":
      return t("pages.weatherSoil.snow");
    default:
      return t("pages.weatherSoil.clear");
  }
};

const formatTime = (iso?: string | null) => {
  if (!iso) return "--:--";
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "--:--";
  }
};

const getLiveCoordinates = () =>
  new Promise<{ lat: number; lon: number } | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      () => {
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

const WeatherSoil = () => {
  const { logout } = useAuth();
  const { t } = useTranslation();

  const { data: weatherData, isLoading, isError } = useQuery<WeatherSummaryResponse>({
    queryKey: queryKeys.weatherSummary(),
    queryFn: async () => {
      const userLocationRaw = localStorage.getItem("userLocation");
      const userLocation = safeJsonParse<{ state?: string; district?: string } | null>(userLocationRaw, null);
      const liveCoords = await getLiveCoordinates();

      return api.weather.getSummary({
        lat: liveCoords?.lat,
        lon: liveCoords?.lon,
        state: userLocation?.state,
        district: userLocation?.district,
      });
    },
  });

  const current = weatherData?.weather?.current;
  const daily = useMemo(() => weatherData?.weather?.daily || [], [weatherData?.weather?.daily]);
  const hourly = useMemo(() => weatherData?.weather?.hourly || [], [weatherData?.weather?.hourly]);

  const weekly = useMemo(() => {
    return daily.slice(0, 5).map((item, idx) => ({
      day:
        idx === 0
          ? t("pages.weatherSoil.today")
          : idx === 1
            ? t("pages.weatherSoil.tomorrow")
            : new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase(),
      icon: conditionToEmoji(item.condition),
      temp: `${Math.round(item.min ?? 0)}°/${Math.round(item.max ?? 0)}°`,
      note: conditionToLabel(item.condition, t),
    }));
  }, [daily, t]);

  const hourlyForecast = hourly.slice(0, 5).map((row) => ({
    value: row.temperature ?? 0,
    label: formatTime(row.time),
  }));

  const advisories = useMemo(() => {
    const items: string[] = [];
    const rainChance = daily[0]?.precipitationProbabilityMax ?? null;

    if (rainChance !== null && rainChance >= 60) {
      items.push(
        t("pages.weatherSoil.rainAdvisory", {
          defaultValue: "Rain is likely today. Delay spraying and protect harvested produce.",
        })
      );
    } else {
      items.push(
        t("pages.weatherSoil.sprayAdvisory", {
          defaultValue: "Weather looks steady. Spraying and field work are safer in the early morning or evening.",
        })
      );
    }

    if ((current?.windSpeed ?? 0) >= 25) {
      items.push(
        t("pages.weatherSoil.windAdvisory", {
          defaultValue: "Strong wind conditions detected. Avoid pesticide spray and support light crop structures.",
        })
      );
    } else {
      items.push(
        t("pages.weatherSoil.windNormalAdvisory", {
          defaultValue: "Wind conditions are manageable for routine field operations.",
        })
      );
    }

    if ((current?.aqi ?? 0) >= 150) {
      items.push(
        t("pages.weatherSoil.aqiAdvisory", {
          defaultValue: "Air quality is poor today. Limit prolonged outdoor exposure during peak afternoon hours.",
        })
      );
    } else {
      items.push(
        t("pages.weatherSoil.aqiNormalAdvisory", {
          defaultValue: "Air quality is acceptable for normal outdoor farm activity.",
        })
      );
    }

    items.push(
      t("pages.weatherSoil.irrigationAdvisory", {
        defaultValue: "Plan irrigation by forecast and crop stage, not by a fixed daily routine.",
      })
    );

    return items;
  }, [current?.aqi, current?.windSpeed, daily, t]);

  const locationLabel = weatherData?.location?.label || t("pages.weatherSoil.locationUnknown");
  const todayCondition = current?.condition || "clear";
  const todayTemp = Math.round(current?.temperature ?? 0);

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-border bg-card p-2 md:p-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-2 md:px-4 pt-2 pb-4">
          <h1 className="text-3xl md:text-4xl font-bold">{t("pages.weatherSoil.title")}</h1>
          <div className="flex items-center gap-3">
            <SettingsBar />
            <Button variant="outline" onClick={logout}>
              {t("dashboard.logout")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-2 md:p-1">
          <Card className="border border-border shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-3xl">{t("dashboard.weather")}</CardTitle>
              <p className="text-sm text-muted-foreground">{locationLabel}</p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {isLoading && (
                <div className="lg:col-span-12 rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
                  {t("common.loading")}
                </div>
              )}

              {isError && !isLoading && (
                <div className="lg:col-span-12 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  {t("pages.weatherSoil.loadFailed")}
                </div>
              )}

              {weatherData?.degraded && (
                <div className="lg:col-span-12 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  {t("pages.weatherSoil.degradedMode", {
                    defaultValue: "Live weather service is in degraded mode ({{reason}}).",
                    reason: weatherData.degradedReason || "unavailable dependency",
                  })}
                </div>
              )}

              <div className="lg:col-span-2 border border-green-300 rounded-2xl p-4 text-center shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">{t("pages.weatherSoil.today")}</div>
                <div className="text-5xl">{conditionToEmoji(todayCondition)}</div>
                <div className="text-4xl font-bold">{todayTemp}</div>
                <div className="text-muted-foreground">{conditionToLabel(todayCondition, t)}</div>
              </div>

              <div className="lg:col-span-5 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {weekly.map((day) => (
                    <div key={day.day} className="border border-border rounded-xl p-2 text-center shadow-sm">
                      <div className="text-[10px] text-muted-foreground mb-1">{day.day}</div>
                      <div className="text-2xl">{day.icon}</div>
                      <div className="text-sm font-semibold">{day.temp}</div>
                      <div className="text-[11px] text-muted-foreground">{day.note}</div>
                    </div>
                  ))}
                </div>

                <div className="border border-border rounded-xl p-3 shadow-sm">
                  <div className="text-sm text-muted-foreground mb-2">{t("pages.weatherSoil.hourlyForecast")}</div>
                  <ResponsiveContainer width="100%" height={60}>
                    <LineChart data={hourlyForecast.map((item, index) => ({ x: index, value: item.value }))}>
                      <Line type="monotone" dataKey="value" stroke="#53BA4E" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    {hourlyForecast.map((item, idx) => (
                      <span key={`${item.label}-${idx}`}>{item.label}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 border border-green-300 rounded-2xl p-4 shadow-sm">
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-2">
                      <Wind className="w-6 h-6" />
                    </div>
                    <div className="text-2xl text-green-600 font-semibold">{Math.round(current?.windSpeed ?? 0)}km/h</div>
                  </div>
                  <div>
                    <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-2">
                      <Droplets className="w-6 h-6" />
                    </div>
                    <div className="text-2xl text-green-600 font-semibold">{Math.round(current?.humidity ?? 0)}%</div>
                  </div>
                  <div>
                    <div className="w-14 h-14 rounded-full bg-green-500 text-black flex items-center justify-center mx-auto mb-2 font-bold">
                      AQI
                    </div>
                    <div className="text-2xl text-green-600 font-semibold">{current?.aqi != null ? Math.round(current.aqi) : "--"}</div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground flex items-end justify-between mt-6">
                  <span>☀️ {t("pages.weatherSoil.sunrise")} {formatTime(weatherData?.weather?.sun?.sunrise)}</span>
                  <span>🌙 {t("pages.weatherSoil.sunset")} {formatTime(weatherData?.weather?.sun?.sunset)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-3xl">
                {t("pages.weatherSoil.reminders", { defaultValue: "Field Advisories" })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {advisories.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-base font-medium text-foreground"
                  >
                    <Sprout className="mt-0.5 h-5 w-5 text-emerald-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-900">
                    <CloudRain className="h-4 w-4" />
                    {t("pages.weatherSoil.forecastNoteTitle", { defaultValue: "Forecast Use" })}
                  </div>
                  <p className="text-sm text-sky-900/80">
                    {t("pages.weatherSoil.forecastNoteBody", {
                      defaultValue: "Use this page for daily planning, spray timing, irrigation decisions, and rain risk checks.",
                    })}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <Droplets className="h-4 w-4" />
                    {t("pages.weatherSoil.soilDeferredTitle", { defaultValue: "Soil Module" })}
                  </div>
                  <p className="text-sm text-amber-900/80">
                    {t("pages.weatherSoil.soilDeferredBody", {
                      defaultValue: "Soil insights are temporarily hidden until device-based or verified field data is connected.",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WeatherSoil;
