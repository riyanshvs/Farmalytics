import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wind, Droplets } from "lucide-react";
import { SettingsBar } from "@/components/SettingsBar";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api";
import { safeJsonParse } from "@/lib/safeJson";

type WeatherSummaryResponse = {
  location?: { label?: string };
  weather?: {
    current?: {
      temperature?: number;
      humidity?: number;
      windSpeed?: number;
      precipitation?: number;
      condition?: string;
    };
    hourly?: Array<{ time: string; temperature: number | null }>;
    daily?: Array<{
      date: string;
      min: number | null;
      max: number | null;
      condition: string;
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

const conditionToLabel = (condition: string, t: (key: string) => string) => {
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

const WeatherSoil = () => {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [weatherData, setWeatherData] = useState<WeatherSummaryResponse | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const userLocationRaw = localStorage.getItem("userLocation");
        const userLocation = safeJsonParse<{ state?: string; district?: string } | null>(userLocationRaw, null);

        const response = await api.weather.getSummary({
          state: userLocation?.state,
          district: userLocation?.district,
        });

        setWeatherData(response);
      } catch (error) {
        console.error("Failed to load weather summary:", error);
        setErrorMessage(t("pages.weatherSoil.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadWeather();
  }, [t]);

  const current = weatherData?.weather?.current;
  const daily = weatherData?.weather?.daily || [];
  const hourly = weatherData?.weather?.hourly || [];

  const todayCard = {
    temp: current?.temperature ?? 0,
    condition: current?.condition || "clear",
  };

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

  const locationLabel = weatherData?.location?.label || t("pages.weatherSoil.locationUnknown");

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-border bg-card p-2 md:p-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-2 md:px-4 pt-2 pb-4">
          <h1 className="text-3xl md:text-4xl font-bold">{t("pages.weatherSoil.title")}</h1>
          <div className="flex items-center gap-3">
            <SettingsBar />
            <Button variant="outline" onClick={logout}>{t("dashboard.logout")}</Button>
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

              {errorMessage && (
                <div className="lg:col-span-12 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  {errorMessage}
                </div>
              )}

              <div className="lg:col-span-2 border border-green-300 rounded-2xl p-4 text-center shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">{t("pages.weatherSoil.today")}</div>
                <div className="text-5xl">{conditionToEmoji(todayCard.condition)}</div>
                <div className="text-4xl font-bold">{Math.round(todayCard.temp)}</div>
                <div className="text-muted-foreground">{conditionToLabel(todayCard.condition, t)}</div>
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
                    <div className="w-14 h-14 rounded-full bg-green-500 text-black flex items-center justify-center mx-auto mb-2 font-bold">AQI</div>
                    <div className="text-2xl text-green-600 font-semibold">--</div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground flex items-end justify-between mt-6">
                  <span>☀️ {t("pages.weatherSoil.sunrise")} {formatTime(weatherData?.weather?.sun?.sunrise)}</span>
                  <span>☀️ {t("pages.weatherSoil.sunset")} {formatTime(weatherData?.weather?.sun?.sunset)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <Card className="lg:col-span-4 border border-border shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-3xl">{t("dashboard.soil")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-2xl">
                <div className="flex items-center gap-3"><span>🧪</span><span className="text-emerald-700 font-semibold">{t("pages.dashboard.soilNeutral")}</span></div>
                <div className="flex items-center gap-3"><span>💧</span><span className="text-emerald-700 font-semibold">{t("pages.dashboard.soilHigh")}</span></div>
                <div className="flex items-center gap-3"><span>💊</span><span className="text-emerald-700 font-semibold">{t("pages.dashboard.soilRequired")}</span></div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-8 border border-border shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-3xl">{t("pages.weatherSoil.reminders")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4 text-2xl font-semibold text-foreground/90">
                  <li>{t("pages.weatherSoil.reminder1")}</li>
                  <li>{t("pages.weatherSoil.reminder2")}</li>
                  <li>{t("pages.weatherSoil.reminder3")}</li>
                  <li>{t("pages.weatherSoil.reminder4")}</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherSoil;