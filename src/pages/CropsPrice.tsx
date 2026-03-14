import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { SettingsBar } from "@/components/SettingsBar";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

type CropCard = {
  name: string;
  price: number;
  unit: string;
  change: number;
  trend: number[];
  lineColor: string;
  image: string;
};

const fieldDistribution = [
  { name: "Potato", value: 22.22, color: "#7C6CF0" },
  { name: "Tomato", value: 16.67, color: "#F07C78" },
  { name: "Onion", value: 11.11, color: "#43B6D6" },
  { name: "Cucumber", value: 22.22, color: "#F4A740" },
  { name: "Ginger", value: 16.67, color: "#4F78DF" },
  { name: "Garlic", value: 5.56, color: "#72C47D" },
  { name: "Others", value: 5.56, color: "#9A6ADE" },
];

const crops: CropCard[] = [
  {
    name: "Potato",
    price: 10,
    unit: "kg",
    change: 3.3,
    trend: [11, 12, 9, 13, 10, 14, 11, 12],
    lineColor: "#36A56C",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=220&q=80",
  },
  {
    name: "Onion",
    price: 13,
    unit: "kg",
    change: 3.3,
    trend: [9, 8, 10, 7, 11, 8, 10, 9],
    lineColor: "#36A56C",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=220&q=80",
  },
  {
    name: "Tomato",
    price: 17,
    unit: "kg",
    change: -9.8,
    trend: [14, 13, 12, 10, 11, 13, 9, 10],
    lineColor: "#F08A39",
    image: "https://images.unsplash.com/photo-1546470427-e5ac89cd0b7f?auto=format&fit=crop&w=220&q=80",
  },
  {
    name: "Cucumber",
    price: 11,
    unit: "kg",
    change: 3.3,
    trend: [7, 8, 9, 8, 10, 9, 8, 11],
    lineColor: "#36A56C",
    image: "https://images.unsplash.com/photo-1604977046807-267ed64b9f8d?auto=format&fit=crop&w=220&q=80",
  },
  {
    name: "Garlic",
    price: 5,
    unit: "kg",
    change: 3.3,
    trend: [5, 6, 5, 7, 6, 8, 5, 6],
    lineColor: "#36A56C",
    image: "https://images.unsplash.com/photo-1615477550927-6ec8445d98b4?auto=format&fit=crop&w=220&q=80",
  },
  {
    name: "Ginger",
    price: 7,
    unit: "kg",
    change: 3.3,
    trend: [8, 7, 6, 8, 5, 9, 6, 7],
    lineColor: "#36A56C",
    image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=220&q=80",
  },
];

const monthlyValues = [
  { label: "Last Month", value: 34253 },
  { label: "Jan'25", value: 24253 },
  { label: "Dec'24", value: 19253 },
  { label: "Nov'24", value: 14253 },
];

const SparkLine = ({ data, color }: { data: number[]; color: string }) => (
  <ResponsiveContainer width="100%" height={48}>
    <LineChart data={data.map((value, index) => ({ index, value }))}>
      <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.8} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

const CropMiniCard = ({ crop, getCropLabel, perUnitLabel }: { crop: CropCard; getCropLabel: (name: string) => string; perUnitLabel: string }) => (
  <Card className="border border-border shadow-sm rounded-2xl">
    <CardContent className="p-4 text-center">
      <img src={crop.image} alt={crop.name} className="w-20 h-20 rounded-full mx-auto object-cover mb-3" />
      <p className="text-[28px] leading-none mb-2">{crop.name === "Potato" ? "🥔" : crop.name === "Onion" ? "🧅" : crop.name === "Tomato" ? "🍅" : crop.name === "Cucumber" ? "🥒" : crop.name === "Garlic" ? "🧄" : "🫚"}</p>
      <h4 className="text-[26px] leading-none mb-2">{getCropLabel(crop.name)}</h4>
      <div className="text-xl font-bold">
        ${crop.price}
        <span className="text-sm font-medium text-muted-foreground">/{perUnitLabel}</span>
      </div>
      <div className={`mt-2 font-semibold ${crop.change >= 0 ? "text-emerald-600" : "text-orange-500"}`}>
        {crop.change > 0 ? "+" : ""}
        {crop.change}%
      </div>
      <div className="mt-2">
        <SparkLine data={crop.trend} color={crop.lineColor} />
      </div>
    </CardContent>
  </Card>
);

const CropsPrice = () => {
  const { logout } = useAuth();
  const { t } = useTranslation();

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

  const monthLabelMap: Record<string, string> = {
    "Last Month": t("pages.cropsPrice.lastMonth"),
    "Jan'25": t("pages.cropsPrice.jan25"),
    "Dec'24": t("pages.cropsPrice.dec24"),
    "Nov'24": t("pages.cropsPrice.nov24"),
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-border bg-card p-2 md:p-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-2 md:px-4 pt-2 pb-4">
          <h1 className="text-3xl md:text-4xl font-bold">{t("pages.cropsPrice.title")}</h1>
          <div className="flex items-center gap-3">
            <SettingsBar />
            <Button variant="outline" onClick={logout}>{t("dashboard.logout")}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 p-2 md:p-1">
          <div className="xl:col-span-6 space-y-4">
            <Card className="border border-border shadow-sm rounded-2xl">
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl">{t("dashboard.fieldDistribution")}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
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
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">{t("pages.cropsPrice.totalValue")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-5xl font-extrabold text-emerald-600 mb-6">$51273</div>
                <div className="space-y-2">
                  {monthlyValues.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-lg">
                      <span className="font-semibold text-foreground/80">{monthLabelMap[item.label] || item.label}</span>
                      <span className="font-bold text-foreground/80">${item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="xl:col-span-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {crops.map((crop) => (
                <CropMiniCard key={crop.name} crop={crop} getCropLabel={getCropLabel} perUnitLabel={t("pages.cropsPrice.perKg")} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropsPrice;