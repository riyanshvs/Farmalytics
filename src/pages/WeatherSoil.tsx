import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Gauge,
  MapPin,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

// Mock weather data - in production, this would come from backend API
const weatherData = {
  current: {
    temperature: 28,
    humidity: 65,
    windSpeed: 12,
    pressure: 1013,
    visibility: 8,
    uvIndex: 6,
    condition: "Partly Cloudy",
    icon: "⛅"
  },
  forecast: [
    { day: "Today", temp: 28, humidity: 65, rain: 20, icon: "⛅" },
    { day: "Tomorrow", temp: 30, humidity: 60, rain: 15, icon: "☀️" },
    { day: "Day 3", temp: 27, humidity: 70, rain: 45, icon: "🌧️" },
    { day: "Day 4", temp: 26, humidity: 75, rain: 60, icon: "⛈️" },
    { day: "Day 5", temp: 29, humidity: 55, rain: 10, icon: "☀️" }
  ],
  hourly: [
    { time: "6 AM", temp: 24, rain: 0 },
    { time: "9 AM", temp: 26, rain: 5 },
    { time: "12 PM", temp: 28, rain: 10 },
    { time: "3 PM", temp: 30, rain: 15 },
    { time: "6 PM", temp: 29, rain: 20 },
    { time: "9 PM", temp: 27, rain: 25 }
  ]
};

// Mock soil data - in production, this would come from backend API
const soilData = {
  type: "Clay Loam",
  ph: 6.8,
  moisture: 45,
  temperature: 26,
  nutrients: {
    nitrogen: 85,
    phosphorus: 72,
    potassium: 68,
    organicMatter: 3.2
  },
  recommendations: [
    "Soil pH is optimal for most crops",
    "Nitrogen levels are good for current crops",
    "Consider phosphorus supplementation for root development",
    "Organic matter content is adequate"
  ]
};

const WeatherSoil = () => {
  const [activeTab, setActiveTab] = useState("weather");
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    // In production, this would call backend API to refresh data
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const getUVIndexColor = (uv: number) => {
    if (uv <= 2) return "text-green-600";
    if (uv <= 5) return "text-yellow-600";
    if (uv <= 7) return "text-orange-600";
    return "text-red-600";
  };

  const getUVIndexLabel = (uv: number) => {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Moderate";
    if (uv <= 7) return "High";
    return "Very High";
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Weather & Soil</h1>
            <p className="text-muted-foreground text-sm md:text-base">Real-time weather and soil analysis</p>
          </div>
          <Button onClick={handleRefresh} disabled={isLoading} variant="outline" className="self-start sm:self-auto">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>Current Location: Your Farm, Maharashtra</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10 md:h-12 mb-6">
          <TabsTrigger value="weather" className="text-sm md:text-base">Weather</TabsTrigger>
          <TabsTrigger value="soil" className="text-sm md:text-base">Soil Analysis</TabsTrigger>
        </TabsList>

          {/* Weather Tab */}
          <TabsContent value="weather" className="space-y-6">
            {/* Current Weather */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-3xl">{weatherData.current.icon}</span>
                  Current Weather
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Thermometer className="w-8 h-8 text-red-500 mr-2" />
                      <span className="text-4xl font-bold">{weatherData.current.temperature}°C</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Temperature</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Droplets className="w-8 h-8 text-blue-500 mr-2" />
                      <span className="text-2xl font-bold">{weatherData.current.humidity}%</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Humidity</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Wind className="w-8 h-8 text-gray-500 mr-2" />
                      <span className="text-2xl font-bold">{weatherData.current.windSpeed}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Wind (km/h)</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Gauge className="w-8 h-8 text-purple-500 mr-2" />
                      <span className="text-2xl font-bold">{weatherData.current.pressure}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Pressure (hPa)</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-500" />
                      <span>Visibility</span>
                    </div>
                    <span className="font-semibold">{weatherData.current.visibility} km</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sun className="w-5 h-5 text-yellow-500" />
                      <span>UV Index</span>
                    </div>
                    <span className={`font-semibold ${getUVIndexColor(weatherData.current.uvIndex)}`}>
                      {weatherData.current.uvIndex} ({getUVIndexLabel(weatherData.current.uvIndex)})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5-Day Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>5-Day Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {weatherData.forecast.map((day, index) => (
                    <div key={index} className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-lg font-semibold mb-2">{day.day}</div>
                      <div className="text-3xl mb-2">{day.icon}</div>
                      <div className="text-xl font-bold text-primary mb-1">{day.temp}°C</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        💧 {day.humidity}%
                      </div>
                      <div className="text-sm text-blue-600">
                        🌧️ {day.rain}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hourly Temperature Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Temperature Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={weatherData.hourly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value}°C`, 'Temperature']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="temp"
                      stroke="#F97316"
                      fill="#FED7AA"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Soil Analysis Tab */}
          <TabsContent value="soil" className="space-y-6">
            {/* Soil Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Soil Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🌱</div>
                    <div className="text-lg font-bold">{soilData.type}</div>
                    <div className="text-sm text-muted-foreground">Soil Type</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl mb-2">🧪</div>
                    <div className="text-lg font-bold">{soilData.ph}</div>
                    <div className="text-sm text-muted-foreground">pH Level</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl mb-2">💧</div>
                    <div className="text-lg font-bold">{soilData.moisture}%</div>
                    <div className="text-sm text-muted-foreground">Moisture</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl mb-2">🌡️</div>
                    <div className="text-lg font-bold">{soilData.temperature}°C</div>
                    <div className="text-sm text-muted-foreground">Soil Temp</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nutrient Levels */}
            <Card>
              <CardHeader>
                <CardTitle>Nutrient Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Nitrogen (N)</span>
                    <span className="text-sm text-muted-foreground">{soilData.nutrients.nitrogen}%</span>
                  </div>
                  <Progress value={soilData.nutrients.nitrogen} className="h-3" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Phosphorus (P)</span>
                    <span className="text-sm text-muted-foreground">{soilData.nutrients.phosphorus}%</span>
                  </div>
                  <Progress value={soilData.nutrients.phosphorus} className="h-3" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Potassium (K)</span>
                    <span className="text-sm text-muted-foreground">{soilData.nutrients.potassium}%</span>
                  </div>
                  <Progress value={soilData.nutrients.potassium} className="h-3" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Organic Matter</span>
                    <span className="text-sm text-muted-foreground">{soilData.nutrients.organicMatter}%</span>
                  </div>
                  <Progress value={soilData.nutrients.organicMatter * 10} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {soilData.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-5 h-5" />
                  Soil Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span>Phosphorus levels are below optimal range</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span>Consider soil testing every 3 months</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WeatherSoil;