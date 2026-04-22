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
import { AlertCircle, RadioTower } from "lucide-react";

type FarmDistribution = {
  name: string;
  area: number;
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
                        "This view is ready to display selected-crop market prices, but it needs your market data API or dataset source before real mandi values can be shown.",
                    })}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                  <div className="mb-2 flex items-center gap-2 text-emerald-900">
                    <RadioTower className="h-5 w-5" />
                    <span className="font-semibold">
                      {t("pages.cropsPrice.readyNow", { defaultValue: "Already ready in the UI" })}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-emerald-900/85">
                    <p>{t("pages.cropsPrice.readyPoint1", { defaultValue: "Selected crops can be mapped directly from onboarding data." })}</p>
                    <p>{t("pages.cropsPrice.readyPoint2", { defaultValue: "Location-aware cards and charts can render once market data is returned." })}</p>
                    <p>{t("pages.cropsPrice.readyPoint3", { defaultValue: "This page now avoids fake prices until the live source is connected." })}</p>
                  </div>
                </div>
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
                {selectedCrops.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {selectedCrops.map((crop) => {
                      const distribution = distributions.find((item) => item.name === crop);
                      return (
                        <div key={crop} className="rounded-2xl border border-border bg-muted/30 p-4">
                          <div className="mb-2 text-lg font-semibold">{getCropLabel(crop)}</div>
                          <Badge variant="secondary">
                            {distribution
                              ? t("pages.cropsPrice.areaValue", {
                                  defaultValue: "{{value}} acres assigned",
                                  value: distribution.area,
                                })
                              : t("pages.cropsPrice.areaPending", {
                                  defaultValue: "Area pending",
                                })}
                          </Badge>
                        </div>
                      );
                    })}
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
