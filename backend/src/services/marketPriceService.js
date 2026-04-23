const DATAGOV_BASE_URL = (process.env.DATAGOV_BASE_URL || "https://api.data.gov.in/resource").replace(/\/+$/, "");
const DATAGOV_API_KEY = String(process.env.DATAGOV_API_KEY || "").trim();
const DATAGOV_MARKET_RESOURCE_ID = String(
  process.env.DATAGOV_MARKET_RESOURCE_ID || "35985678-0d79-46b4-9ed6-6f13308a1d24"
).trim();
const DATAGOV_TIMEOUT_MS = Number(process.env.DATAGOV_TIMEOUT_MS || 9000);
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

const CROP_ALIASES = {
  potato: ["potato", "potatoes"],
  onion: ["onion", "onions"],
  tomato: ["tomato", "tomatoes"],
  cucumber: ["cucumber", "cucumbers", "khira", "kheera"],
  garlic: ["garlic"],
  ginger: ["ginger", "adrak"],
};

const normalizeValue = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const parsePrice = (value) => {
  const parsed = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseArrivalDate = (value) => {
  const raw = String(value || "").trim();
  const parts = raw.split("/");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;

  return new Date(Date.UTC(year, month - 1, day)).toISOString();
};

const titleCaseWords = (value) =>
  String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const expandCropTerms = (crop) => {
  const normalizedCrop = normalizeValue(crop);
  const aliases = CROP_ALIASES[normalizedCrop] || [];
  return Array.from(new Set([normalizedCrop, ...aliases.map(normalizeValue)])).filter(Boolean);
};

const commodityMatchesCrop = (commodity, crop) => {
  const normalizedCommodity = normalizeValue(commodity);
  if (!normalizedCommodity) return false;

  return expandCropTerms(crop).some((term) => normalizedCommodity === term || normalizedCommodity.includes(term));
};

const mapRecord = (record) => ({
  state: record?.State || "",
  district: record?.District || "",
  market: record?.Market || "",
  commodity: record?.Commodity || "",
  variety: record?.Variety || "",
  grade: record?.Grade || "",
  arrivalDate: parseArrivalDate(record?.Arrival_Date),
  minPrice: parsePrice(record?.Min_Price),
  maxPrice: parsePrice(record?.Max_Price),
  modalPrice: parsePrice(record?.Modal_Price),
  commodityCode: record?.Commodity_Code || "",
});

const buildQuery = ({ state, district, limit }) => {
  const params = new URLSearchParams();
  params.set("api-key", DATAGOV_API_KEY);
  params.set("format", "json");
  params.set("limit", String(Math.min(Math.max(limit || DEFAULT_LIMIT, 1), MAX_LIMIT)));
  params.set("offset", "0");
  params.set("sort[Arrival_Date]", "desc");

  if (state) params.set("filters[State]", state);
  if (district) params.set("filters[District]", district);

  return params.toString();
};

export const isMarketPriceConfigured = () => Boolean(DATAGOV_API_KEY && DATAGOV_MARKET_RESOURCE_ID);

export const fetchMarketPrices = async ({
  state,
  district,
  selectedCrops = [],
  limit = DEFAULT_LIMIT,
} = {}) => {
  if (!isMarketPriceConfigured()) {
    return {
      items: [],
      matchedCrops: [],
      location: {
        state: state || "",
        district: district || "",
      },
      source: "datagov",
      configured: false,
      resourceId: DATAGOV_MARKET_RESOURCE_ID,
      fetchedAt: new Date().toISOString(),
      message: "Market price source is not configured.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DATAGOV_TIMEOUT_MS);

  try {
    const query = buildQuery({ state, district, limit });
    const response = await fetch(`${DATAGOV_BASE_URL}/${DATAGOV_MARKET_RESOURCE_ID}?${query}`, {
      headers: {
        accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Data.gov request failed (${response.status})`);
    }

    const payload = await response.json();
    const records = Array.isArray(payload?.records) ? payload.records : [];
    const normalizedRecords = records
      .map(mapRecord)
      .filter((item) => item.commodity && item.arrivalDate)
      .sort((left, right) => new Date(right.arrivalDate).getTime() - new Date(left.arrivalDate).getTime());

    const crops = selectedCrops.filter(Boolean);
    const filteredRecords =
      crops.length > 0
        ? normalizedRecords.filter((record) => crops.some((crop) => commodityMatchesCrop(record.commodity, crop)))
        : normalizedRecords;

    const grouped = new Map();
    for (const record of filteredRecords) {
      const matchedCrop =
        crops.find((crop) => commodityMatchesCrop(record.commodity, crop)) || titleCaseWords(record.commodity);
      const groupKey = `${normalizeValue(matchedCrop)}::${record.market}::${record.arrivalDate}`;

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          id: groupKey,
          crop: matchedCrop,
          commodity: record.commodity,
          market: record.market,
          district: record.district,
          state: record.state,
          arrivalDate: record.arrivalDate,
          variety: record.variety || "Other",
          grade: record.grade || "FAQ",
          minPrice: record.minPrice,
          maxPrice: record.maxPrice,
          modalPrice: record.modalPrice,
          commodityCode: record.commodityCode,
        });
      }
    }

    const items = Array.from(grouped.values())
      .sort((left, right) => {
        const byDate = new Date(right.arrivalDate).getTime() - new Date(left.arrivalDate).getTime();
        if (byDate !== 0) return byDate;
        return (right.modalPrice || 0) - (left.modalPrice || 0);
      })
      .slice(0, Math.min(crops.length > 0 ? crops.length * 4 : limit, MAX_LIMIT));

    const matchedCrops = Array.from(new Set(items.map((item) => item.crop)));

    return {
      items,
      matchedCrops,
      location: {
        state: state || "",
        district: district || "",
      },
      source: "datagov",
      configured: true,
      resourceId: DATAGOV_MARKET_RESOURCE_ID,
      totalRecords: Number(payload?.total || records.length || 0),
      fetchedAt: new Date().toISOString(),
      count: items.length,
    };
  } finally {
    clearTimeout(timeout);
  }
};

