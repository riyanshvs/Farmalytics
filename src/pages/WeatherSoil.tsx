import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, CloudRain, Wind, Droplets } from "lucide-react";
import { SettingsBar } from "@/components/SettingsBar";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

const WeatherSoil = () => {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const hourlyForecast = [21, 24, 23, 25, 23];
  const weekly = [
    { day: t("pages.weatherSoil.today"), icon: "☀️", temp: "21°/33°", note: t("pages.weatherSoil.clear") },
    { day: t("pages.weatherSoil.tomorrow"), icon: "🌧️", temp: "19°/27°", note: t("pages.weatherSoil.stormy") },
    { day: "22 FEB", icon: "🌧️", temp: "16°/24°", note: t("pages.weatherSoil.rainy") },
    { day: "23 FEB", icon: "⛈️", temp: "17°/28°", note: t("pages.weatherSoil.stormy") },
    { day: "24 FEB", icon: "🌤️", temp: "22°/36°", note: t("pages.weatherSoil.clear") },
  ];

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
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-2 border border-green-300 rounded-2xl p-4 text-center shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">{t("pages.weatherSoil.today")}</div>
                <div className="text-5xl">☀️</div>
                <div className="text-4xl font-bold">27</div>
                <div className="text-muted-foreground">{t("pages.weatherSoil.clear")}</div>
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
                    <LineChart data={hourlyForecast.map((value, index) => ({ x: index, value }))}>
                      <Line type="monotone" dataKey="value" stroke="#53BA4E" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>09:00</span>
                    <span>10:00</span>
                    <span>11:00</span>
                    <span>12:00</span>
                    <span>13:00</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 border border-green-300 rounded-2xl p-4 shadow-sm">
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-2">
                      <Wind className="w-6 h-6" />
                    </div>
                    <div className="text-2xl text-green-600 font-semibold">13.7km/h</div>
                  </div>
                  <div>
                    <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-2">
                      <Droplets className="w-6 h-6" />
                    </div>
                    <div className="text-2xl text-green-600 font-semibold">2%</div>
                  </div>
                  <div>
                    <div className="w-14 h-14 rounded-full bg-green-500 text-black flex items-center justify-center mx-auto mb-2 font-bold">AQI</div>
                    <div className="text-2xl text-green-600 font-semibold">73</div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground flex items-end justify-between mt-6">
                  <span>☀️ Sunrise 06:55</span>
                  <span>☀️ Sunset 18:14</span>
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