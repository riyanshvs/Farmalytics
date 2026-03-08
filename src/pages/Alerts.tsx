import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Settings,
  RefreshCw,
  Clock,
  MapPin,
  Droplets,
  Bug,
  Sun,
  CloudRain,
  TrendingUp,
  Filter
} from "lucide-react";

// Mock alerts data - in production, this would come from backend API
const alertsData = [
  {
    id: 1,
    type: "weather",
    priority: "critical",
    title: "Heavy Rainfall Warning",
    message: "Heavy to very heavy rainfall expected in your area from March 10-12. Take immediate precautions for crop protection.",
    location: "Your Farm Area",
    timestamp: "2024-03-08T08:30:00Z",
    isRead: false,
    actions: ["Secure crops", "Check drainage", "Monitor soil moisture"],
    icon: "🌧️"
  },
  {
    id: 2,
    type: "pest",
    priority: "high",
    title: "Pest Alert: Aphid Infestation Detected",
    message: "Early signs of aphid infestation detected in nearby tomato fields. Monitor your crops closely.",
    location: "Nearby Fields",
    timestamp: "2024-03-08T06:15:00Z",
    isRead: false,
    actions: ["Inspect crops", "Apply organic pesticides", "Contact extension officer"],
    icon: "🐛"
  },
  {
    id: 3,
    type: "market",
    priority: "medium",
    title: "Price Surge Alert",
    message: "Onion prices have increased by 15% in local markets. Consider timing your harvest strategically.",
    location: "Local Markets",
    timestamp: "2024-03-07T14:20:00Z",
    isRead: true,
    actions: ["Check current prices", "Plan storage", "Consider early harvest"],
    icon: "📈"
  },
  {
    id: 4,
    type: "government",
    priority: "medium",
    title: "New Subsidy Scheme Available",
    message: "PM-KISAN scheme applications are now open. Eligible farmers can apply for the next installment.",
    location: "State-wide",
    timestamp: "2024-03-07T10:00:00Z",
    isRead: true,
    actions: ["Check eligibility", "Apply online", "Contact local office"],
    icon: "🏛️"
  },
  {
    id: 5,
    type: "soil",
    priority: "low",
    title: "Soil Moisture Update",
    message: "Current soil moisture levels are optimal for most crops. No irrigation needed in the next 48 hours.",
    location: "Your Farm",
    timestamp: "2024-03-07T08:00:00Z",
    isRead: true,
    actions: ["Monitor weather", "Check soil sensors", "Plan irrigation"],
    icon: "💧"
  }
];

const notificationSettings = {
  weather: { enabled: true, critical: true, high: true, medium: false, low: false },
  pest: { enabled: true, critical: true, high: true, medium: true, low: false },
  market: { enabled: true, critical: true, high: true, medium: true, low: false },
  government: { enabled: true, critical: true, high: true, medium: true, low: true },
  soil: { enabled: false, critical: true, high: true, medium: true, low: true }
};

const Alerts = () => {
  const [activeTab, setActiveTab] = useState("alerts");
  const [alerts, setAlerts] = useState(alertsData);
  const [settings, setSettings] = useState(notificationSettings);
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    // In production, this would call backend API to refresh alerts
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const markAsRead = (alertId: number) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const dismissAlert = (alertId: number) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const updateSetting = (category: string, setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weather': return <CloudRain className="w-5 h-5" />;
      case 'pest': return <Bug className="w-5 h-5" />;
      case 'market': return <TrendingUp className="w-5 h-5" />;
      case 'government': return <Info className="w-5 h-5" />;
      case 'soil': return <Droplets className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesPriority = filterPriority === 'all' || alert.priority === filterPriority;
    return matchesType && matchesPriority;
  });

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-8 h-8 text-primary" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">Alerts & Notifications</h1>
              <p className="text-muted-foreground">Stay informed about farming conditions and opportunities</p>
            </div>
          </div>
          <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="weather">Weather</SelectItem>
              <SelectItem value="pest">Pest</SelectItem>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="soil">Soil</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alerts ({filteredAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">No alerts match your current filters.</p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <Card key={alert.id} className={`border-l-4 ${!alert.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{alert.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getPriorityColor(alert.priority)}>
                              {alert.priority.toUpperCase()}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              {getTypeIcon(alert.type)}
                              <span className="capitalize">{alert.type}</span>
                            </div>
                          </div>
                          <CardTitle className="text-lg mb-1">{alert.title}</CardTitle>
                          <p className="text-muted-foreground text-sm mb-2">{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {alert.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(alert.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!alert.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(alert.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {alert.actions && alert.actions.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Recommended Actions:</h4>
                        <div className="flex flex-wrap gap-2">
                          {alert.actions.map((action, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(settings).map(([category, config]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(category)}
                        <span className="font-semibold capitalize">{category} Alerts</span>
                      </div>
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(checked) => updateSetting(category, 'enabled', checked)}
                      />
                    </div>

                    {config.enabled && (
                      <div className="ml-7 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Critical Priority</span>
                          <Switch
                            checked={config.critical}
                            onCheckedChange={(checked) => updateSetting(category, 'critical', checked)}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>High Priority</span>
                          <Switch
                            checked={config.high}
                            onCheckedChange={(checked) => updateSetting(category, 'high', checked)}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Medium Priority</span>
                          <Switch
                            checked={config.medium}
                            onCheckedChange={(checked) => updateSetting(category, 'medium', checked)}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Low Priority</span>
                          <Switch
                            checked={config.low}
                            onCheckedChange={(checked) => updateSetting(category, 'low', checked)}
                            size="sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alert Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {alerts.filter(a => a.priority === 'critical' && !a.isRead).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Critical</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {alerts.filter(a => a.priority === 'high' && !a.isRead).length}
                    </div>
                    <div className="text-sm text-muted-foreground">High</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {alerts.filter(a => a.priority === 'medium' && !a.isRead).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Medium</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {alerts.filter(a => a.priority === 'low' && !a.isRead).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Low</div>
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

export default Alerts;