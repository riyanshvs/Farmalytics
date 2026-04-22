import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Info,
  CheckCircle,
  X,
  Settings,
  RefreshCw,
  Clock,
  MapPin,
  CloudRain,
  TrendingUp,
  Filter,
  Building2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api";
import { safeJsonParse } from "@/lib/safeJson";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import queryKeys from "@/lib/queryKeys";

type AlertItem = {
  id: number;
  type: "weather" | "market" | "government";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  location: string;
  timestamp: string;
  isRead: boolean;
  actions?: string[];
  icon?: string;
};

const notificationSettings = {
  weather: { enabled: true, critical: true, high: true, medium: false, low: false },
  market: { enabled: true, critical: true, high: true, medium: true, low: false },
  government: { enabled: true, critical: true, high: true, medium: true, low: true },
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case "weather":
    case "rain":
      return <CloudRain className="w-6 h-6 text-blue-500" />;
    case "market":
      return <TrendingUp className="w-6 h-6 text-green-500" />;
    case "government":
      return <Building2 className="w-6 h-6 text-purple-500" />;
    default:
      return <Bell className="w-6 h-6 text-gray-500" />;
  }
};

const Alerts = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("alerts");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [settings, setSettings] = useState(notificationSettings);
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const queryClient = useQueryClient();

  const userLocationRaw = localStorage.getItem("userLocation");
  const userLocation = safeJsonParse<{ state?: string; district?: string } | null>(userLocationRaw, null);
  const alertsQuery = useQuery({
    queryKey: queryKeys.alerts({ state: userLocation?.state, district: userLocation?.district }),
    queryFn: () =>
      api.alerts.getAll({
        state: userLocation?.state,
        district: userLocation?.district,
      }),
  });

  useEffect(() => {
    if (Array.isArray(alertsQuery.data?.alerts)) {
      setAlerts(alertsQuery.data.alerts as AlertItem[]);
    }
  }, [alertsQuery.data]);

  const markReadMutation = useMutation({
    mutationFn: (alertId: number) => api.alerts.markRead(alertId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.alerts({ state: userLocation?.state, district: userLocation?.district }),
      });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (alertId: number) => api.alerts.dismiss(alertId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.alerts({ state: userLocation?.state, district: userLocation?.district }),
      });
    },
  });

  const markAsRead = async (alertId: number) => {
    const previousAlerts = alerts;
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) => (alert.id === alertId ? { ...alert, isRead: true } : alert))
    );

    try {
      await markReadMutation.mutateAsync(alertId);
    } catch (error) {
      console.error("Failed to persist read state:", error);
      setAlerts(previousAlerts);
    }
  };

  const dismissAlert = async (alertId: number) => {
    const previousAlerts = alerts;
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== alertId));

    try {
      await dismissMutation.mutateAsync(alertId);
    } catch (error) {
      console.error("Failed to persist dismissed state:", error);
      setAlerts(previousAlerts);
    }
  };

  const updateSetting = (category: string, setting: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "weather":
        return <CloudRain className="w-5 h-5" />;
      case "market":
        return <TrendingUp className="w-5 h-5" />;
      case "government":
        return <Info className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesType = filterType === "all" || alert.type === filterType;
    const matchesPriority = filterPriority === "all" || alert.priority === filterPriority;
    return matchesType && matchesPriority;
  });

  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  const getAlertTitle = (id: number, fallback: string) => t(`pages.alerts.alert${id}.title`, { defaultValue: fallback });
  const getAlertMessage = (id: number, fallback: string) =>
    t(`pages.alerts.alert${id}.message`, { defaultValue: fallback });
  const getAlertAction = (id: number, index: number, fallback: string) =>
    t(`pages.alerts.alert${id}.actions.${index}`, { defaultValue: fallback });

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-border bg-card p-3 md:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        {alertsQuery.data?.degraded && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            Alerts are in degraded mode ({alertsQuery.data?.degradedReason || "unavailable dependency"}).
          </div>
        )}

        {!alertsQuery.isLoading && alerts.length > 0 && (
          <div className="mb-4 rounded-lg border border-sky-300 bg-sky-50 p-3 text-sm text-sky-900">
            {t("pages.alerts.liveNote", {
              defaultValue: "Alerts are currently generated from live weather plus market and government advisories.",
            })}
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-6 md:w-8 h-6 md:h-8 text-primary" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 md:w-5 h-4 md:h-5 flex items-center justify-center">
                    {unreadCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-primary">{t("pages.alerts.title")}</h1>
                <p className="text-muted-foreground text-sm md:text-base">{t("pages.alerts.subtitle")}</p>
              </div>
            </div>
            <Button onClick={() => void alertsQuery.refetch()} disabled={alertsQuery.isFetching} variant="outline" className="self-start sm:self-auto">
              <RefreshCw className={`w-4 h-4 mr-2 ${alertsQuery.isFetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{t("pages.alerts.refresh")}</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40 h-10 md:h-11">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t("pages.alerts.filterByType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("pages.alerts.allTypes")}</SelectItem>
                <SelectItem value="weather">{t("pages.alerts.typeWeather")}</SelectItem>
                <SelectItem value="market">{t("pages.alerts.typeMarket")}</SelectItem>
                <SelectItem value="government">{t("pages.alerts.typeGovernment")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full sm:w-40 h-10 md:h-11">
                <SelectValue placeholder={t("pages.alerts.filterByPriority")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("pages.alerts.allPriorities")}</SelectItem>
                <SelectItem value="critical">{t("pages.alerts.priorityCritical")}</SelectItem>
                <SelectItem value="high">{t("pages.alerts.priorityHigh")}</SelectItem>
                <SelectItem value="medium">{t("pages.alerts.priorityMedium")}</SelectItem>
                <SelectItem value="low">{t("pages.alerts.priorityLow")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="relative grid w-full grid-cols-2 h-11 md:h-12 mb-6 p-1 rounded-xl border border-emerald-200 bg-emerald-100/70 dark:border-emerald-800 dark:bg-emerald-950/30">
            <div
              className={`absolute left-1 top-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)] rounded-lg bg-emerald-500 shadow-sm transition-transform duration-300 ease-out ${
                activeTab === "alerts" ? "translate-x-0" : "translate-x-[calc(100%+0.5rem)]"
              }`}
              aria-hidden="true"
            />
            <TabsTrigger
              value="alerts"
              className="relative z-10 text-sm md:text-base flex items-center gap-2 bg-transparent text-emerald-900 transition-colors duration-300 data-[state=active]:bg-transparent data-[state=active]:text-white dark:text-emerald-200"
            >
              <Bell className="w-4 h-4" />
              {t("pages.alerts.alertsTab", { count: filteredAlerts.length })}
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="relative z-10 text-sm md:text-base flex items-center gap-2 bg-transparent text-emerald-900 transition-colors duration-300 data-[state=active]:bg-transparent data-[state=active]:text-white dark:text-emerald-200"
            >
              <Settings className="w-4 h-4" />
              {t("dashboard.settings")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t("pages.alerts.allCaughtUp")}</h3>
                  <p className="text-muted-foreground">{t("pages.alerts.noAlertsForFilters")}</p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <Card key={alert.id} className={`border-l-4 ${!alert.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.icon || alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getPriorityColor(alert.priority)}>
                              {t(`pages.alerts.priority${alert.priority.charAt(0).toUpperCase()}${alert.priority.slice(1)}`).toUpperCase()}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              {getTypeIcon(alert.type)}
                              <span className="capitalize">{t(`pages.alerts.type${alert.type.charAt(0).toUpperCase()}${alert.type.slice(1)}`)}</span>
                            </div>
                          </div>
                          <CardTitle className="text-lg mb-1">{getAlertTitle(alert.id, alert.title)}</CardTitle>
                          <p className="text-muted-foreground text-sm mb-2">{getAlertMessage(alert.id, alert.message)}</p>
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
                          <Button variant="ghost" size="sm" onClick={() => void markAsRead(alert.id)}>
                            {t("pages.alerts.markRead")}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => void dismissAlert(alert.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {alert.actions && alert.actions.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">{t("pages.alerts.recommendedActions")}</h4>
                        <div className="flex flex-wrap gap-2">
                          {alert.actions.map((action, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {getAlertAction(alert.id, index, action)}
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

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {t("pages.alerts.notificationPreferences")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  {t("pages.alerts.settingsLocalOnly", {
                    defaultValue: "These preferences are currently local to this device until notification delivery is connected.",
                  })}
                </p>
                {Object.entries(settings).map(([category, config]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(category)}
                        <span className="font-semibold capitalize">
                          {t(`pages.alerts.type${category.charAt(0).toUpperCase()}${category.slice(1)}`)} {t("pages.alerts.alertsLabel")}
                        </span>
                      </div>
                      <Switch checked={config.enabled} onCheckedChange={(checked) => updateSetting(category, "enabled", checked)} />
                    </div>

                    {config.enabled && (
                      <div className="ml-7 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{t("pages.alerts.criticalPriority")}</span>
                          <Switch checked={config.critical} onCheckedChange={(checked) => updateSetting(category, "critical", checked)} />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>{t("pages.alerts.highPriority")}</span>
                          <Switch checked={config.high} onCheckedChange={(checked) => updateSetting(category, "high", checked)} />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>{t("pages.alerts.mediumPriority")}</span>
                          <Switch checked={config.medium} onCheckedChange={(checked) => updateSetting(category, "medium", checked)} />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>{t("pages.alerts.lowPriority")}</span>
                          <Switch checked={config.low} onCheckedChange={(checked) => updateSetting(category, "low", checked)} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("pages.alerts.alertSummary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {alerts.filter((a) => a.priority === "critical" && !a.isRead).length}
                    </div>
                    <div className="text-sm text-muted-foreground">{t("pages.alerts.priorityCritical")}</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {alerts.filter((a) => a.priority === "high" && !a.isRead).length}
                    </div>
                    <div className="text-sm text-muted-foreground">{t("pages.alerts.priorityHigh")}</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {alerts.filter((a) => a.priority === "medium" && !a.isRead).length}
                    </div>
                    <div className="text-sm text-muted-foreground">{t("pages.alerts.priorityMedium")}</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {alerts.filter((a) => a.priority === "low" && !a.isRead).length}
                    </div>
                    <div className="text-sm text-muted-foreground">{t("pages.alerts.priorityLow")}</div>
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
