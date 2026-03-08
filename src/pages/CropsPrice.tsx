import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Search, RefreshCw, Calendar, MapPin } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Mock data - in production, this would come from backend API
const cropPriceData = [
  {
    name: "Potato",
    emoji: "🥔",
    currentPrice: 12.50,
    change: 2.3,
    trend: "up",
    marketPrices: [
      { market: "Azadpur", price: 12.50, change: 2.3 },
      { market: "Lasalgaon", price: 11.80, change: -1.2 },
      { market: "Bangalore", price: 13.20, change: 1.8 },
      { market: "Pune", price: 12.90, change: 0.5 }
    ],
    weeklyTrend: [
      { day: "Mon", price: 11.20 },
      { day: "Tue", price: 11.80 },
      { day: "Wed", price: 12.10 },
      { day: "Thu", price: 11.90 },
      { day: "Fri", price: 12.30 },
      { day: "Sat", price: 12.50 },
      { day: "Sun", price: 12.50 }
    ]
  },
  {
    name: "Tomato",
    emoji: "🍅",
    currentPrice: 18.75,
    change: -3.2,
    trend: "down",
    marketPrices: [
      { market: "Azadpur", price: 18.75, change: -3.2 },
      { market: "Nashik", price: 17.50, change: -2.1 },
      { market: "Mumbai", price: 19.20, change: -1.5 },
      { market: "Pune", price: 18.90, change: -0.8 }
    ],
    weeklyTrend: [
      { day: "Mon", price: 19.50 },
      { day: "Tue", price: 19.20 },
      { day: "Wed", price: 19.00 },
      { day: "Thu", price: 18.80 },
      { day: "Fri", price: 18.90 },
      { day: "Sat", price: 18.75 },
      { day: "Sun", price: 18.75 }
    ]
  },
  {
    name: "Onion",
    emoji: "🧅",
    currentPrice: 14.25,
    change: 1.8,
    trend: "up",
    marketPrices: [
      { market: "Lasalgaon", price: 14.25, change: 1.8 },
      { market: "Pune", price: 13.90, change: 2.1 },
      { market: "Nashik", price: 14.50, change: 1.2 },
      { market: "Mumbai", price: 14.80, change: 0.9 }
    ],
    weeklyTrend: [
      { day: "Mon", price: 13.80 },
      { day: "Tue", price: 14.00 },
      { day: "Wed", price: 13.90 },
      { day: "Thu", price: 14.10 },
      { day: "Fri", price: 14.20 },
      { day: "Sat", price: 14.25 },
      { day: "Sun", price: 14.25 }
    ]
  }
];

const CropsPrice = () => {
  const [selectedCrop, setSelectedCrop] = useState(cropPriceData[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Filter crops based on search
  const filteredCrops = cropPriceData.filter(crop =>
    crop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = async () => {
    setIsLoading(true);
    // In production, this would call backend API to refresh prices
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Crops & Price</h1>
            <p className="text-muted-foreground text-sm md:text-base">Real-time market prices and trends</p>
          </div>
          <Button onClick={handleRefresh} disabled={isLoading} variant="outline" className="self-start sm:self-auto">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search crops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 md:h-11"
            />
          </div>
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger className="w-full sm:w-48 h-10 md:h-11">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select market" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              <SelectItem value="azadpur">Azadpur Mandi</SelectItem>
              <SelectItem value="lasalgaon">Lasalgaon</SelectItem>
              <SelectItem value="pune">Pune</SelectItem>
              <SelectItem value="mumbai">Mumbai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Crop Cards Grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {filteredCrops.map((crop) => (
              <Card
                key={crop.name}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedCrop.name === crop.name ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedCrop(crop)}
              >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{crop.emoji}</span>
                    <CardTitle className="text-lg">{crop.name}</CardTitle>
                  </div>
                  <Badge variant={crop.trend === 'up' ? 'default' : 'destructive'}>
                    {crop.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(crop.change)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary mb-2">
                  ₹{crop.currentPrice}/kg
                </div>
                <div className="text-sm text-muted-foreground">
                  Current market price
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed View */}
        {selectedCrop && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedCrop.emoji}</span>
                  {selectedCrop.name} - Weekly Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedCrop.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`₹${value}`, 'Price']}
                      labelFormatter={(label) => `Day: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Market Prices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Market Prices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedCrop.marketPrices.map((market) => (
                    <div key={market.market} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-semibold">{market.market}</div>
                        <div className="text-sm text-muted-foreground">Mandi</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">₹{market.price}</div>
                        <div className={`text-sm flex items-center gap-1 ${
                          market.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {market.change >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {market.change >= 0 ? '+' : ''}{market.change}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Market Insights */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Market Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">+2.3%</div>
                <div className="text-sm text-muted-foreground">Average Price Increase</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">₹15.83</div>
                <div className="text-sm text-muted-foreground">Average Market Price</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-1">4</div>
                <div className="text-sm text-muted-foreground">Active Markets</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CropsPrice;