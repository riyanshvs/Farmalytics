import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, MapPin, RefreshCw } from "lucide-react";

const WeatherSoil = () => {
  const [activeTab, setActiveTab] = useState("weather");
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="p-4 md:p-8">
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

        <TabsContent value="weather" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-6 h-6 text-blue-500" />
                Current Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Thermometer className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="text-4xl font-bold">28 C</div>
                  <div className="text-sm text-muted-foreground">Temperature</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Droplets className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold">65%</div>
                  <div className="text-sm text-muted-foreground">Humidity</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Wind className="w-8 h-8 text-gray-500" />
                  </div>
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-sm text-muted-foreground">Wind (km/h)</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Sun className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold">1013</div>
                  <div className="text-sm text-muted-foreground">Pressure (hPa)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="soil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Soil Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">6.8</div>
                  <div className="text-sm text-muted-foreground">pH Level</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">45%</div>
                  <div className="text-sm text-muted-foreground">Moisture</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">26 C</div>
                  <div className="text-sm text-muted-foreground">Temperature</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">Clay</div>
                  <div className="text-sm text-muted-foreground">Soil Type</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WeatherSoil;