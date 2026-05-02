export type SupportedCrop = {
  id: string;
  label: string;
  emoji: string;
};

export type MarketPriceRow = {
  id: string;
  cropId: string;
  cropLabel: string;
  commodityGroup: string;
  msp: number | null;
  priceOn30Apr2026: number;
  priceOn29Apr2026: number | null;
  priceOn28Apr2026: number | null;
  arrivalOn30Apr2026: number;
  arrivalOn29Apr2026: number | null;
  arrivalOn28Apr2026: number | null;
};

export const supportedCrops: SupportedCrop[] = [
  { id: "bajra", label: "Bajra (Pearl Millet/Cumbu)", emoji: "🌾" },
  { id: "barley", label: "Barley (Jau)", emoji: "🌾" },
  { id: "jowar", label: "Jowar (Sorghum)", emoji: "🌾" },
  { id: "maize", label: "Maize", emoji: "🌽" },
  { id: "paddy", label: "Paddy (Common)", emoji: "🌾" },
  { id: "ragi", label: "Ragi (Finger Millet)", emoji: "🌾" },
  { id: "wheat", label: "Wheat", emoji: "🌾" },
  { id: "cotton", label: "Cotton", emoji: "☁️" },
  { id: "copra", label: "Copra", emoji: "🥥" },
  { id: "groundnut", label: "Groundnut", emoji: "🥜" },
  { id: "mustard", label: "Mustard", emoji: "🌼" },
  { id: "niger-seed", label: "Niger Seed (Ramtil)", emoji: "🌱" },
  { id: "safflower", label: "Safflower", emoji: "🌻" },
  { id: "sesamum", label: "Sesamum (Sesame, Gingelly, Til)", emoji: "🌱" },
  { id: "soyabean", label: "Soyabean", emoji: "🫘" },
  { id: "sunflower", label: "Sunflower / Sunflower Seed", emoji: "🌻" },
  { id: "sugarcane", label: "Sugarcane", emoji: "🎋" },
  { id: "arhar", label: "Arhar (Tur/Red Gram) (Whole)", emoji: "🫘" },
  { id: "bengal-gram", label: "Bengal Gram (Gram) (Whole)", emoji: "🫘" },
  { id: "black-gram", label: "Black Gram (Urd Beans) (Whole)", emoji: "🫘" },
  { id: "green-gram", label: "Green Gram (Moong) (Whole)", emoji: "🫘" },
  { id: "lentil", label: "Lentil (Masur) (Whole)", emoji: "🫘" },
  { id: "onion", label: "Onion", emoji: "🧅" },
  { id: "potato", label: "Potato", emoji: "🥔" },
  { id: "tomato", label: "Tomato", emoji: "🍅" },
];

export const supportedCropIds = supportedCrops.map((crop) => crop.id);

const aliasMap: Record<string, string> = {
  sesame: "sesamum",
  urad: "black-gram",
  moong: "green-gram",
  chana: "bengal-gram",
  rice: "paddy",
};

const normalizeCropId = (value: string) => {
  const key = String(value || "").trim().toLowerCase();
  return aliasMap[key] || key;
};

export const getCropLabel = (cropId: string) => {
  const normalized = normalizeCropId(cropId);
  return supportedCrops.find((crop) => crop.id === normalized)?.label || cropId;
};

export const getCropEmoji = (cropId: string) => {
  const normalized = normalizeCropId(cropId);
  return supportedCrops.find((crop) => crop.id === normalized)?.emoji || "🌱";
};

export const normalizeSupportedCropSelection = (crops: string[] | undefined | null) => {
  const normalized = Array.isArray(crops)
    ? crops.map((crop) => normalizeCropId(crop)).filter((crop) => supportedCropIds.includes(crop))
    : [];

  return Array.from(new Set(normalized));
};

const marketRows: MarketPriceRow[] = [
  { id: "bajra", cropId: "bajra", cropLabel: "Bajra (Pearl Millet/Cumbu)", commodityGroup: "Cereals", msp: 2775, priceOn30Apr2026: 2055.19, priceOn29Apr2026: 1980.38, priceOn28Apr2026: 2147.85, arrivalOn30Apr2026: 1471.98, arrivalOn29Apr2026: 1190.39, arrivalOn28Apr2026: 1158.77 },
  { id: "barley", cropId: "barley", cropLabel: "Barley (Jau)", commodityGroup: "Cereals", msp: 2150, priceOn30Apr2026: 2187.04, priceOn29Apr2026: 2159.07, priceOn28Apr2026: 2182.34, arrivalOn30Apr2026: 1120.41, arrivalOn29Apr2026: 2153, arrivalOn28Apr2026: 950.99 },
  { id: "jowar", cropId: "jowar", cropLabel: "Jowar (Sorghum)", commodityGroup: "Cereals", msp: 3699, priceOn30Apr2026: 4171.78, priceOn29Apr2026: 4278.31, priceOn28Apr2026: 4733.17, arrivalOn30Apr2026: 258.67, arrivalOn29Apr2026: 388.96, arrivalOn28Apr2026: 216.18 },
  { id: "maize", cropId: "maize", cropLabel: "Maize", commodityGroup: "Cereals", msp: 2400, priceOn30Apr2026: 1889.39, priceOn29Apr2026: 1823.19, priceOn28Apr2026: 1844.78, arrivalOn30Apr2026: 23429.52, arrivalOn29Apr2026: 20647.76, arrivalOn28Apr2026: 27544.22 },
  { id: "paddy", cropId: "paddy", cropLabel: "Paddy (Common)", commodityGroup: "Cereals", msp: 2369, priceOn30Apr2026: 2411.64, priceOn29Apr2026: 2507.84, priceOn28Apr2026: 2565.54, arrivalOn30Apr2026: 16493.19, arrivalOn29Apr2026: 13081.9, arrivalOn28Apr2026: 10285.59 },
  { id: "ragi", cropId: "ragi", cropLabel: "Ragi (Finger Millet)", commodityGroup: "Cereals", msp: 4886, priceOn30Apr2026: 3591.8, priceOn29Apr2026: 3574.57, priceOn28Apr2026: 3408.36, arrivalOn30Apr2026: 123.6, arrivalOn29Apr2026: 165.6, arrivalOn28Apr2026: 125.6 },
  { id: "wheat", cropId: "wheat", cropLabel: "Wheat", commodityGroup: "Cereals", msp: 2585, priceOn30Apr2026: 2504.02, priceOn29Apr2026: 2508.49, priceOn28Apr2026: 2505.55, arrivalOn30Apr2026: 283008.75, arrivalOn29Apr2026: 284886.63, arrivalOn28Apr2026: 295123.33 },
  { id: "cotton", cropId: "cotton", cropLabel: "Cotton", commodityGroup: "Fibre Crops", msp: 7710, priceOn30Apr2026: 8307.19, priceOn29Apr2026: 8518.69, priceOn28Apr2026: 8456.02, arrivalOn30Apr2026: 1172.92, arrivalOn29Apr2026: 2205.16, arrivalOn28Apr2026: 2171.39 },
  { id: "copra", cropId: "copra", cropLabel: "Copra", commodityGroup: "Oil Seeds", msp: 12100, priceOn30Apr2026: 23031.53, priceOn29Apr2026: 18398.95, priceOn28Apr2026: 15146.54, arrivalOn30Apr2026: 33.3, arrivalOn29Apr2026: 14.35, arrivalOn28Apr2026: 39.97 },
  { id: "groundnut", cropId: "groundnut", cropLabel: "Groundnut", commodityGroup: "Oil Seeds", msp: 7263, priceOn30Apr2026: 7226.73, priceOn29Apr2026: 6639.97, priceOn28Apr2026: 6382.7, arrivalOn30Apr2026: 1668.19, arrivalOn29Apr2026: 1101.25, arrivalOn28Apr2026: 1350.24 },
  { id: "mustard", cropId: "mustard", cropLabel: "Mustard", commodityGroup: "Oil Seeds", msp: 6200, priceOn30Apr2026: 6413.24, priceOn29Apr2026: 6388.79, priceOn28Apr2026: 6320.97, arrivalOn30Apr2026: 10472.28, arrivalOn29Apr2026: 10706.06, arrivalOn28Apr2026: 8339.86 },
  { id: "niger-seed", cropId: "niger-seed", cropLabel: "Niger Seed (Ramtil)", commodityGroup: "Oil Seeds", msp: 9537, priceOn30Apr2026: 10030, priceOn29Apr2026: null, priceOn28Apr2026: 10020, arrivalOn30Apr2026: 3.7, arrivalOn29Apr2026: null, arrivalOn28Apr2026: 3.9 },
  { id: "safflower", cropId: "safflower", cropLabel: "Safflower", commodityGroup: "Oil Seeds", msp: 6540, priceOn30Apr2026: 5200, priceOn29Apr2026: 5000, priceOn28Apr2026: 5220.56, arrivalOn30Apr2026: 0.49, arrivalOn29Apr2026: 0.7, arrivalOn28Apr2026: 5.4 },
  { id: "sesamum", cropId: "sesamum", cropLabel: "Sesamum (Sesame, Gingelly, Til)", commodityGroup: "Oil Seeds", msp: 9846, priceOn30Apr2026: 12977.89, priceOn29Apr2026: 11877.63, priceOn28Apr2026: 11005.32, arrivalOn30Apr2026: 189.01, arrivalOn29Apr2026: 166.08, arrivalOn28Apr2026: 204.81 },
  { id: "soyabean", cropId: "soyabean", cropLabel: "Soyabean", commodityGroup: "Oil Seeds", msp: 5328, priceOn30Apr2026: 5990.85, priceOn29Apr2026: 6002.73, priceOn28Apr2026: 5871.78, arrivalOn30Apr2026: 6724.83, arrivalOn29Apr2026: 8725.81, arrivalOn28Apr2026: 10659.53 },
  { id: "sunflower", cropId: "sunflower", cropLabel: "Sunflower / Sunflower Seed", commodityGroup: "Oil Seeds", msp: 7721, priceOn30Apr2026: 6602.57, priceOn29Apr2026: 6552.03, priceOn28Apr2026: 6623.79, arrivalOn30Apr2026: 176.5, arrivalOn29Apr2026: 280.8, arrivalOn28Apr2026: 355.3 },
  { id: "sugarcane", cropId: "sugarcane", cropLabel: "Sugarcane", commodityGroup: "Others", msp: 285, priceOn30Apr2026: 360, priceOn29Apr2026: null, priceOn28Apr2026: null, arrivalOn30Apr2026: 172.5, arrivalOn29Apr2026: null, arrivalOn28Apr2026: null },
  { id: "arhar", cropId: "arhar", cropLabel: "Arhar (Tur/Red Gram) (Whole)", commodityGroup: "Pulses", msp: 8000, priceOn30Apr2026: 7324.72, priceOn29Apr2026: 7201.04, priceOn28Apr2026: 7268.55, arrivalOn30Apr2026: 1041.02, arrivalOn29Apr2026: 1207.73, arrivalOn28Apr2026: 1651.31 },
  { id: "bengal-gram", cropId: "bengal-gram", cropLabel: "Bengal Gram (Gram) (Whole)", commodityGroup: "Pulses", msp: 5875, priceOn30Apr2026: 5349.16, priceOn29Apr2026: 5329.26, priceOn28Apr2026: 5336.24, arrivalOn30Apr2026: 7808.15, arrivalOn29Apr2026: 7993.67, arrivalOn28Apr2026: 7330.03 },
  { id: "black-gram", cropId: "black-gram", cropLabel: "Black Gram (Urd Beans) (Whole)", commodityGroup: "Pulses", msp: 7800, priceOn30Apr2026: 7705.4, priceOn29Apr2026: 7609.42, priceOn28Apr2026: 7935.8, arrivalOn30Apr2026: 287.74, arrivalOn29Apr2026: 139.87, arrivalOn28Apr2026: 245.01 },
  { id: "green-gram", cropId: "green-gram", cropLabel: "Green Gram (Moong) (Whole)", commodityGroup: "Pulses", msp: 8768, priceOn30Apr2026: 8303.05, priceOn29Apr2026: 8158.52, priceOn28Apr2026: 8489.95, arrivalOn30Apr2026: 413.09, arrivalOn29Apr2026: 372.36, arrivalOn28Apr2026: 424.48 },
  { id: "lentil", cropId: "lentil", cropLabel: "Lentil (Masur) (Whole)", commodityGroup: "Pulses", msp: 7000, priceOn30Apr2026: 6906.04, priceOn29Apr2026: 7163.54, priceOn28Apr2026: 7189.65, arrivalOn30Apr2026: 1934.02, arrivalOn29Apr2026: 2208.24, arrivalOn28Apr2026: 2253.67 },
  { id: "onion", cropId: "onion", cropLabel: "Onion", commodityGroup: "Vegetables", msp: null, priceOn30Apr2026: 1035.33, priceOn29Apr2026: 1124.47, priceOn28Apr2026: 1093.49, arrivalOn30Apr2026: 38194.23, arrivalOn29Apr2026: 25865.92, arrivalOn28Apr2026: 27089.52 },
  { id: "potato", cropId: "potato", cropLabel: "Potato", commodityGroup: "Vegetables", msp: null, priceOn30Apr2026: 566.99, priceOn29Apr2026: 526.04, priceOn28Apr2026: 609.7, arrivalOn30Apr2026: 39331.2, arrivalOn29Apr2026: 39033.29, arrivalOn28Apr2026: 26837.97 },
  { id: "tomato", cropId: "tomato", cropLabel: "Tomato", commodityGroup: "Vegetables", msp: null, priceOn30Apr2026: 1332.01, priceOn29Apr2026: 1564.68, priceOn28Apr2026: 1770.66, arrivalOn30Apr2026: 11558.71, arrivalOn29Apr2026: 6155.11, arrivalOn28Apr2026: 5906.68 },
];

const marketDate = "2026-04-30";

export const buildHardcodedMarketResponse = (requestedCrops?: string[], limit?: number) => {
  const normalizedRequested = normalizeSupportedCropSelection(requestedCrops || []);
  const selectedIds = normalizedRequested.length > 0 ? normalizedRequested : supportedCropIds;
  const limitedIds = typeof limit === "number" && Number.isFinite(limit) ? selectedIds.slice(0, Math.max(1, Math.floor(limit))) : selectedIds;
  const items = marketRows
    .filter((row) => limitedIds.includes(row.cropId))
    .map((row) => ({
      id: row.id,
      crop: row.cropId,
      commodity: row.cropLabel,
      market: row.commodityGroup,
      district: "India",
      state: "All India",
      arrivalDate: marketDate,
      variety: row.cropLabel,
      grade: "Standard",
      minPrice: row.priceOn28Apr2026,
      maxPrice: row.priceOn29Apr2026 ?? row.priceOn30Apr2026,
      modalPrice: row.priceOn30Apr2026,
      commodityCode: row.id.toUpperCase(),
      arrivalMetricTonnes: row.arrivalOn30Apr2026,
      previousPrices: {
        "30-04-2026": row.priceOn30Apr2026,
        "29-04-2026": row.priceOn29Apr2026,
        "28-04-2026": row.priceOn28Apr2026,
      },
      previousArrivals: {
        "30-04-2026": row.arrivalOn30Apr2026,
        "29-04-2026": row.arrivalOn29Apr2026,
        "28-04-2026": row.arrivalOn28Apr2026,
      },
    }));

  return {
    market: {
      items,
      matchedCrops: items.map((item) => item.crop),
      location: {
        state: "All India",
        district: "National Market Report",
      },
      configured: true,
    },
    selectedCrops: items.map((item) => item.crop),
    location: {
      state: "All India",
      district: "National Market Report",
    },
    degraded: false,
    degradedReason: null,
    reportDate: marketDate,
  };
};
