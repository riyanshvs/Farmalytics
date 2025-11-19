import { Home, Sprout, Sun, FileText, AlertTriangle, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MessageCircle, X } from "lucide-react";

const Dashboard = () => {
  const [chatOpen, setChatOpen] = useState(false);

  const fieldData = [
    { name: "Potato", value: 32.22, color: "#8B5CF6" },
    { name: "Tomato", value: 16.67, color: "#EF4444" },
    { name: "Onion", value: 11.11, color: "#06B6D4" },
    { name: "Cucumber", value: 22.22, color: "#F97316" },
    { name: "Ginger", value: 16.67, color: "#3B82F6" },
    { name: "Garlic", value: 5.56, color: "#10B981" },
    { name: "Others", value: 5.56, color: "#A855F7" },
  ];

  const crops = [
    { name: "Potato", price: 10, change: 3.3, trend: [12, 15, 13, 18, 16, 20, 18], positive: true },
    { name: "Onion", price: 13, change: 3.3, trend: [10, 12, 11, 15, 14, 17, 16], positive: true },
    { name: "Tomato", price: 17, change: -9.8, trend: [20, 22, 21, 19, 18, 17, 17], positive: false },
    { name: "Cucumber", price: 11, change: 3.3, trend: [8, 10, 9, 12, 11, 14, 13], positive: true },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-[280px] bg-card border-r border-border p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Sprout className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">Farmalytics</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-accent transition-colors"
            activeClassName="bg-accent text-primary font-semibold"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/crops-price"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-accent transition-colors"
            activeClassName="bg-accent text-primary font-semibold"
          >
            <Sprout className="w-5 h-5" />
            <span>Crops & Price</span>
          </NavLink>

          <NavLink
            to="/weather-soil"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-accent transition-colors"
            activeClassName="bg-accent text-primary font-semibold"
          >
            <Sun className="w-5 h-5" />
            <span>Weather & Soil</span>
          </NavLink>

          <NavLink
            to="/news-reports"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-accent transition-colors"
            activeClassName="bg-accent text-primary font-semibold"
          >
            <FileText className="w-5 h-5" />
            <span>News Reports</span>
          </NavLink>

          <NavLink
            to="/alerts"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-accent transition-colors"
            activeClassName="bg-accent text-primary font-semibold"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Alerts</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-3 mt-8 p-3 bg-accent rounded-lg">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">Michael</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
            <Sun className="w-5 h-5" />
          </Button>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Weather Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Weather</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Sun className="w-16 h-16 text-yellow-500" />
                <div className="text-right">
                  <div className="text-4xl font-bold">27°</div>
                  <div className="text-sm text-muted-foreground">Clear</div>
                </div>
              </div>
              <div className="flex items-center justify-around pt-4 border-t">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-xs font-bold text-primary-foreground">💨</span>
                  </div>
                  <div className="text-xs font-semibold">23.7km/h</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-xs font-bold text-primary-foreground">AQI</span>
                  </div>
                  <div className="text-xs font-semibold">73</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-xs font-bold text-primary-foreground">💧</span>
                  </div>
                  <div className="text-xs font-semibold">83%</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Soil Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Soil</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">💧</div>
                <div className="text-lg font-semibold text-primary">Neutral</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl">💧💧</div>
                <div className="text-lg font-semibold text-primary">High</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl">💊</div>
                <div className="text-lg font-semibold text-primary">Required</div>
              </div>
            </div>
          </Card>

          {/* Field Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Field Distribution</h3>
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

        {/* Your Crops */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Crops</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {crops.map((crop) => (
              <Card key={crop.name} className="p-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center text-4xl">
                  {crop.name === "Potato" && "🥔"}
                  {crop.name === "Onion" && "🧅"}
                  {crop.name === "Tomato" && "🍅"}
                  {crop.name === "Cucumber" && "🥒"}
                </div>
                <h3 className="text-center text-lg font-semibold mb-2">{crop.name}</h3>
                <div className="text-center text-2xl font-bold mb-1">
                  ${crop.price}<span className="text-sm text-muted-foreground">/kg</span>
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
            <Card className="p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-accent transition-colors">
              <div className="text-6xl mb-2">+</div>
              <div className="text-lg font-semibold underline">View All</div>
            </Card>
          </div>
        </div>
      </main>

      {/* Chatbot Button */}
      <Button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chatbot Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="w-16 h-16 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Assistant</h2>
            <p className="text-muted-foreground text-center">Coming Soon</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
