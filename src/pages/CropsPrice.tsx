import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { SettingsBar } from "@/components/SettingsBar";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { safeJsonParse } from "@/lib/safeJson";
import { api } from "@/services/api";
import { AlertCircle, MapPin, RadioTower, RefreshCw, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import queryKeys from "@/lib/queryKeys";

type FarmDistribution = {
  name: string;
  area: number;
};

type MarketItem = {
  id: string;
  crop: string;
  commodity: string;
  market: string;
  district: string;
  state: string;
  arrivalDate: string;
  variety: string;
  grade: string;
  minPrice: number | null;
  maxPrice: number | null;
  modalPrice: number | null;
  commodityCode: string;
};

const CropsPrice = () => {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [distributions, setDistributions] = useState<FarmDistribution[]>([]);

  useEffect(() => {
    const localCrops = safeJsonParse<string[]>(localStorage.getItem("selectedCrops"), []);
    const localDistributions = safeJsonParse<FarmDistribution[]>(localStorage.getItem("farmDistributions"), []);

    if (localCrops.length > 0) {
      setSelectedCrops(localCrops);
    }

    if (localDistributions.length > 0) {
      setDistributions(localDistributions);
    }

    void api.farm
      .get()
      .then((result) => {
        if (Array.isArray(result?.farm?.selectedCrops) && result.farm.selectedCrops.length > 0) {
          setSelectedCrops(result.farm.selectedCrops);
        }

        if (Array.isArray(result?.farm?.distributions) && result.farm.distributions.length > 0) {
          setDistributions(result.farm.distributions);
        }
      })
      .catch((error) => {
        console.warn("Failed to hydrate crop market view:", error);
      });
  }, []);

  const palette = ["#7C6CF0", "#F07C78", "#43B6D6", "#F4A740", "#4F78DF", "#72C47D", "#9A6ADE"];
  const fieldDistribution = useMemo(() => {
    if (distributions.length === 0) return [];
    return distributions.map((item, index) => ({
      name: item.name,
      value: item.area,
      color: palette[index % palette.length],
    }));
  }, [distributions]);

  const marketQuery = useQuery({
    queryKey: queryKeys.market({ crops: selectedCrops }),
    enabled: selectedCrops.length > 0,
    queryFn: () =>
      api.market.getAll({
        crops: selectedCrops,
        limit: Math.max(selectedCrops.length * 4, 12),
      }),
  });

  const marketItems = Array.isArray(marketQuery.data?.market?.items)
    ? (marketQuery.data.market.items as MarketItem[])
    : [];
  const matchedCrops = Array.isArray(marketQuery.data?.market?.matchedCrops)
    ? (marketQuery.data.market.matchedCrops as string[])
    : [];
  const locationLabel = [marketQuery.data?.location?.district, marketQuery.data?.location?.state].filter(Boolean).join(", ");

  const cropStatus = useMemo(
    () =>
      selectedCrops.map((crop) => ({
        crop,
        matched: matchedCrops.some((item) => item.toLowerCase() === crop.toLowerCase()),
        area: distributions.find((item) => item.name === crop)?.area ?? null,
      })),
    [distributions, matchedCrops, selectedCrops]
  );

  const getCropLabel = (name: string) => {
    const map: Record<string, string> = {
      Potato: t("pages.cropsPrice.crops.potato"),
      Onion: t("pages.cropsPrice.crops.onion"),
      Tomato: t("pages.cropsPrice.crops.tomato"),
      Cucumber: t("pages.cropsPrice.crops.cucumber"),
      Garlic: t("pages.cropsPrice.crops.garlic"),
      Ginger: t("pages.cropsPrice.crops.ginger"),
      Others: t("pages.cropsPrice.crops.others"),
    };

    return map[name] || name;
  };

  const formatPrice = (value: number | null) =>
    value == null
      ? t("common.loading", { defaultValue: "--" })
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(value);

  const formatArrivalDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-border bg-card p-2 md:p-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-2 md:px-4 pt-2 pb-4">
          <h1 className="text-3xl md:text-4xl font-bold">{t("pages.cropsPrice.title")}</h1>
          <div className="flex items-center gap-3">
            <SettingsBar />
            <Button variant="outline" onClick={logout}>
              {t("dashboard.logout")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 p-2 md:p-1">
          <div className="xl:col-span-6 space-y-4">
            <Card className="border border-border shadow-sm rounded-2xl">
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl">{t("dashboard.fieldDistribution")}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {fieldDistribution.length > 0 ? (
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="w-[240px] h-[210px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={fieldDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={95} innerRadius={0}>
                            {fieldDistribution.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 text-sm">
                      {fieldDistribution.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{getCropLabel(item.name)}</span>
                          <span className="text-muted-foreground">
                            {t("pages.cropsPrice.areaValue", {
                              defaultValue: "{{value}} acres",
                              value: item.value,
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    {t("pages.cropsPrice.noDistribution", {
                      defaultValue: "Field distribution will appear here after onboarding data is available.",
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {t("pages.cropsPrice.marketFeedTitle", { defaultValue: "Live Market Feed" })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {locationLabel ||
                          t("pages.cropsPrice.locationPending", {
                            defaultValue: "Location will be taken from onboarding data.",
                          })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("pages.cropsPrice.feedSubtext", {
                        defaultValue: "Live mandi prices are fetched for the crops selected during onboarding.",
                      })}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => void marketQuery.refetch()} disabled={marketQuery.isFetching}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${marketQuery.isFetching ? "animate-spin" : ""}`} />
                    {t("pages.cropsPrice.refreshFeed", { defaultValue: "Refresh feed" })}
                  </Button>
                </div>

                {marketQuery.isLoading && (
                  <div className="rounded-2xl border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                    {t("pages.cropsPrice.loadingFeed", { defaultValue: "Loading live mandi prices..." })}
                  </div>
                )}

                {marketQuery.isError && (
                  <div className="rounded-2xl border border-red-300 bg-red-50 p-5">
                    <div className="mb-2 flex items-center gap-2 text-red-900">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-semibold">
                        {t("pages.cropsPrice.loadErrorTitle", {
                          defaultValue: "The market feed could not be loaded right now.",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-red-900/80">
                      {(marketQuery.error as Error)?.message ||
                        t("pages.cropsPrice.loadErrorBody", {
                          defaultValue: "Please try again in a moment.",
                        })}
                    </p>
                  </div>
                )}

                {!marketQuery.isLoading && !marketQuery.isError && marketQuery.data?.degraded && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
                    <div className="mb-3 flex items-center gap-2 text-amber-900">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-semibold">
                        {t("pages.cropsPrice.integrationPending", {
                          defaultValue: "Live crop-price integration is still pending.",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-amber-900/85">
                      {t("pages.cropsPrice.integrationPendingBody", {
                        defaultValue:
                          "Add your Data.gov API key and market resource ID in the backend environment to display real mandi values here.",
                      })}
                    </p>
                  </div>
                )}

                {!marketQuery.isLoading && !marketQuery.isError && !marketQuery.data?.degraded && marketItems.length === 0 && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
                    <div className="mb-3 flex items-center gap-2 text-amber-900">
                      <RadioTower className="h-5 w-5" />
                      <span className="font-semibold">
                        {t("pages.cropsPrice.noMatchesTitle", {
                          defaultValue: "No matching mandi prices were found for the selected crops yet.",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-amber-900/85">
                      {t("pages.cropsPrice.noMatchesBody", {
                        defaultValue:
                          "This usually means the source did not return recent records for the saved district, state, or crop names.",
                      })}
                    </p>
                  </div>
                )}

                {marketItems.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {marketItems.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-emerald-700" />
                              <h3 className="text-lg font-semibold text-emerald-950">{getCropLabel(item.crop)}</h3>
                            </div>
                            <p className="text-sm text-emerald-900/80">
                              {item.market}, {item.district}
                            </p>
                          </div>
                          <Badge variant="secondary">{formatArrivalDate(item.arrivalDate)}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="rounded-xl bg-white/80 p-3">
                            <div className="text-xs text-muted-foreground">
                              {t("pages.cropsPrice.minPrice", { defaultValue: "Min" })}
                            </div>
                            <div className="mt-1 font-semibold">{formatPrice(item.minPrice)}</div>
                          </div>
                          <div className="rounded-xl bg-white/80 p-3">
                            <div className="text-xs text-muted-foreground">
                              {t("pages.cropsPrice.modalPrice", { defaultValue: "Modal" })}
                            </div>
                            <div className="mt-1 font-semibold">{formatPrice(item.modalPrice)}</div>
                          </div>
                          <div className="rounded-xl bg-white/80 p-3">
                            <div className="text-xs text-muted-foreground">
                              {t("pages.cropsPrice.maxPrice", { defaultValue: "Max" })}
                            </div>
                            <div className="mt-1 font-semibold">{formatPrice(item.maxPrice)}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-950/80">
                          <Badge variant="outline">{item.variety}</Badge>
                          <Badge variant="outline">{item.grade}</Badge>
                          {item.commodityCode ? <Badge variant="outline">#{item.commodityCode}</Badge> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-6">
            <Card className="border border-border shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {t("pages.cropsPrice.selectedCropsTitle", { defaultValue: "Selected Crops" })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cropStatus.length > 0 ? (
                  <div className="space-y-3">
                    {cropStatus.map(({ crop, matched, area }) => (
                      <div key={crop} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                        <div>
                          <div className="mb-1 text-lg font-semibold">{getCropLabel(crop)}</div>
                          <div className="text-sm text-muted-foreground">
                            {area != null
                              ? t("pages.cropsPrice.areaValue", {
                                  defaultValue: "{{value}} acres assigned",
                                  value: area,
                                })
                              : t("pages.cropsPrice.areaPending", {
                                  defaultValue: "Area pending",
                                })}
                          </div>
                        </div>
                        <Badge variant={matched ? "default" : "secondary"}>
                          {matched
                            ? t("pages.cropsPrice.marketStatusLive", { defaultValue: "Market feed matched" })
                            : t("pages.cropsPrice.marketStatusWaiting", { defaultValue: "Waiting for market match" })}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    {t("pages.cropsPrice.noCropsSelected", {
                      defaultValue: "No crops are available yet. Complete onboarding to personalize this page.",
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropsPrice;
