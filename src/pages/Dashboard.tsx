import { Home, Sprout, Sun, FileText, AlertTriangle, User, Droplets, Wind, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Chatbot from "@/components/Chatbot";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { SettingsBar } from "@/components/SettingsBar";
import { safeJsonParse } from "@/lib/safeJson";

interface FarmData {
  selectedCrops?: string[];
  distributions?: { name: string; area: number }[];
}

const LiveWeather = () => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<{ temp?: number; condition?: string; wind?: number; humidity?: number }>({});

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const json = await res.json();
        if (json && json.current_weather) {
          setWeather({ temp: json.current_weather.temperature, condition: json.current_weather.weathercode?.toString() || "", wind: json.current_weather.windspeed });
        }
      } catch (e) {
        console.error("Weather fetch error:", e);
      }
    });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <Sun className="w-16 h-16 text-yellow-500" />
        <div className="text-right">
          <div className="text-3xl font-bold">{weather.temp ? `${weather.temp}°C` : `--°C`}</div>
          <div className="text-sm text-muted-foreground">{weather.condition || t("common.loading")}</div>
        </div>
      </div>
      <div className="flex items-center justify-around pt-4 border-t">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-1">
            <Wind className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="text-xs font-semibold">{weather.wind ?? "--"} km/h</div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-1">
            <span className="text-xs font-bold text-primary-foreground">AQI</span>
          </div>
          <div className="text-xs font-semibold">--</div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-1">
            <Droplets className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="text-xs font-semibold">{weather.humidity ?? "--"}%</div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [farmData, setFarmData] = useState<FarmData | null>(null);

  useEffect(() => {
    const fetchFarmData = async () => {
      try {
        const result = await api.farm.get();
        if (result.farm) {
          setFarmData(result.farm);
        }
      } catch (error) {
        console.warn("Failed to fetch farm data:", error);
      }
    };
    fetchFarmData();
  }, []);

  const storedDist = typeof window !== "undefined" ? localStorage.getItem("farmDistributions") : null;
  const parsedDist: { name: string; area: number }[] = storedDist
    ? safeJsonParse<{ name: string; area: number }[]>(storedDist, [])
    : farmData?.distributions || [];

  const palette = ["#8B5CF6", "#EF4444", "#06B6D4", "#F97316", "#3B82F6", "#10B981", "#A855F7", "#F59E0B"];

  const fieldData = parsedDist.length > 0 ? parsedDist.map((d, i) => ({ name: d.name, value: d.area, color: palette[i % palette.length] })) : [
    { name: "Potato", value: 32.22, color: "#8B5CF6" },
    { name: "Tomato", value: 16.67, color: "#EF4444" },
    { name: "Onion", value: 11.11, color: "#06B6D4" },
    { name: "Cucumber", value: 22.22, color: "#F97316" },
  ];

  const defaultCrops = [
    { name: "Potato", price: 10, change: 3.3, trend: [12, 15, 13, 18, 16, 20, 18], positive: true },
    { name: "Onion", price: 13, change: 3.3, trend: [10, 12, 11, 15, 14, 17, 16], positive: true },
    { name: "Tomato", price: 17, change: -9.8, trend: [20, 22, 21, 19, 18, 17, 17], positive: false },
    { name: "Cucumber", price: 11, change: 3.3, trend: [8, 10, 9, 12, 11, 14, 13], positive: true },
  ];

  const selectedNames = farmData?.selectedCrops || [];
  const cropMap: Record<string, typeof defaultCrops[0]> = {};
  defaultCrops.forEach((c) => (cropMap[c.name] = c));

  const crops = (selectedNames.length > 0
    ? selectedNames.map((name: string) => cropMap[name] ?? { name, price: 0, change: 0, trend: [0, 0, 0, 0, 0, 0, 0], positive: true })
    : defaultCrops
  );

  return (
    <div className="p-4 md:p-6">
      <main className="mx-auto max-w-7xl rounded-[28px] border border-border bg-card p-4 md:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">{t("dashboard.title")}</h1>
          <div className="flex items-center gap-4">
            <SettingsBar />
            <Button variant="outline" onClick={logout}>
              {t("dashboard.logout")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">{t("dashboard.weather")}</h3>
            <LiveWeather />
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">{t("dashboard.soil")}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🧪</div>
                <div className="text-lg font-semibold text-primary">{t("pages.dashboard.soilNeutral")}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl">💧</div>
                <div className="text-lg font-semibold text-primary">{t("pages.dashboard.soilHigh")}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl">💊</div>
                <div className="text-lg font-semibold text-primary">{t("pages.dashboard.soilRequired")}</div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">{t("dashboard.fieldDistribution")}</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={fieldData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {fieldData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1 text-xs">
                {fieldData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">{t("dashboard.yourCrops")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {crops.map((crop) => (
              <Card key={crop.name} className="p-5">
                <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center text-3xl">
                  {crop.name === "Potato" && "🥔"}
                  {crop.name === "Onion" && "🧅"}
                  {crop.name === "Tomato" && "🍅"}
                  {crop.name === "Cucumber" && "🥒"}
                </div>
                <h3 className="text-center text-lg font-semibold mb-2">{crop.name}</h3>
                <div className="text-center text-xl font-bold mb-1">
                  {crop.price}<span className="text-sm text-muted-foreground">/kg</span>
                </div>
                <div className={`text-center text-sm font-semibold mb-3 ${crop.positive ? "text-green-600" : "text-orange-600"}`}>
                  {crop.positive ? "+" : ""}{crop.change}%
                </div>
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart data={crop.trend.map((val, i) => ({ value: val }))}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={crop.positive ? "#10B981" : "#F97316"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Button
        onClick={() => setChatOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-transform duration-300 ${chatOpen ? "rotate-90" : "rotate-0"}`}
        size="icon"
        aria-label={chatOpen ? "Close chatbot" : "Open chatbot"}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      <div
        className={`fixed bottom-24 right-6 z-40 h-[70vh] max-h-[36rem] w-[min(24rem,calc(100vw-1.5rem))] origin-bottom-right transition-all duration-300 ease-out ${
          chatOpen
            ? "pointer-events-auto translate-y-0 rotate-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-6 rotate-[8deg] scale-95 opacity-0"
        }`}
      >
        <Card className="relative h-full p-4 shadow-2xl">
          <Button
            onClick={() => setChatOpen(false)}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 z-10"
            aria-label="Close chatbot panel"
          >
            ✕
          </Button>
          <div className="h-full pt-2">
            <Chatbot />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
