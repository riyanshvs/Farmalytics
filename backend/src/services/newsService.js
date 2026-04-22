const GNEWS_BASE_URL = process.env.GNEWS_BASE_URL || "https://gnews.io/api/v4";
const NEWS_PROVIDER = String(process.env.NEWS_PROVIDER || "auto").toLowerCase();

const DATAGOV_BASE_URL = String(process.env.DATAGOV_BASE_URL || "https://api.data.gov.in/resource").trim();
const DATAGOV_API_KEY = String(process.env.DATAGOV_API_KEY || "").trim();
const DATAGOV_RESOURCE_ID = String(process.env.DATAGOV_RESOURCE_ID || "").trim();
const DATAGOV_WEATHER_RESOURCE_ID = String(process.env.DATAGOV_WEATHER_RESOURCE_ID || "").trim();
const DATAGOV_MARKET_RESOURCE_ID = String(process.env.DATAGOV_MARKET_RESOURCE_ID || "").trim();
const DATAGOV_TECH_RESOURCE_ID = String(process.env.DATAGOV_TECH_RESOURCE_ID || "").trim();
const DATAGOV_SUCCESS_RESOURCE_ID = String(process.env.DATAGOV_SUCCESS_RESOURCE_ID || "").trim();
const DATAGOV_TIMEOUT_MS = Number(process.env.DATAGOV_TIMEOUT_MS || 9000);

const SCRAPER_NEWS_API_URL = String(process.env.SCRAPER_NEWS_API_URL || "").trim();
const SCRAPER_NEWS_API_METHOD = String(process.env.SCRAPER_NEWS_API_METHOD || "GET").toUpperCase();
const SCRAPER_NEWS_API_KEY = String(process.env.SCRAPER_NEWS_API_KEY || "").trim();
const SCRAPER_NEWS_API_KEY_HEADER = String(process.env.SCRAPER_NEWS_API_KEY_HEADER || "x-api-key").trim();
const SCRAPER_NEWS_API_KEY_QUERY_PARAM = String(process.env.SCRAPER_NEWS_API_KEY_QUERY_PARAM || "").trim();
const SCRAPER_NEWS_API_TIMEOUT_MS = Number(process.env.SCRAPER_NEWS_API_TIMEOUT_MS || 9000);

const NEWS_CACHE_TTL_MS = Number(process.env.NEWS_CACHE_TTL_MS || 300000);
const NEWS_DEFAULT_LIMIT = Number(process.env.NEWS_DEFAULT_LIMIT || 24);

const memoryCache = new Map();

const getNow = () => Date.now();
const hasScraperConfigured = () => Boolean(SCRAPER_NEWS_API_URL);
const hasGNewsConfigured = () => Boolean(process.env.GNEWS_API_KEY);
const hasDataGovConfigured = () => Boolean(DATAGOV_API_KEY);

const normalizeLanguage = (language) => {
  const raw = String(language || "en").toLowerCase();
  return raw.startsWith("hi") ? "hi" : "en";
};

const sanitizeLocationPart = (value) =>
  String(value || "")
    .trim()
    .slice(0, 80);

const safeText = (value, fallback = "") =>
  String(value || fallback)
    .replace(/\s+/g, " ")
    .trim();

const safeUrl = (value) => {
  try {
    if (!value) return "";
    const parsed = new URL(String(value).trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
};

const buildCacheKey = (params) =>
  JSON.stringify({
    provider: NEWS_PROVIDER,
    language: normalizeLanguage(params.language),
    category: String(params.category || "all"),
    state: sanitizeLocationPart(params.state).toLowerCase(),
    district: sanitizeLocationPart(params.district).toLowerCase(),
    limit: Number(params.limit || NEWS_DEFAULT_LIMIT),
  });

const isCacheFresh = (entry) => !!entry && getNow() - entry.createdAt <= NEWS_CACHE_TTL_MS;

const categoryQueries = {
  weather: {
    en: "agriculture weather forecast rain crops farmers india",
    hi: "कृषि मौसम पूर्वानुमान बारिश फसल किसान भारत",
  },
  market_update: {
    en: "agriculture market prices mandi crop rates farmers india",
    hi: "कृषि मंडी भाव बाजार मूल्य फसल कीमत किसान भारत",
  },
  technology: {
    en: "agriculture technology farming innovation irrigation drones india",
    hi: "कृषि तकनीक खेती नवाचार ड्रोन सिंचाई भारत",
  },
  success_story: {
    en: "farmer success story agriculture innovation india",
    hi: "किसान सफलता कहानी कृषि नवाचार भारत",
  },
};

const keywordTests = {
  weather: [
    "weather", "forecast", "rain", "rainfall", "temperature", "storm", "monsoon",
    "मौसम", "बारिश", "वर्षा", "पूर्वानुमान", "तापमान", "मानसून",
  ],
  market_update: [
    "market", "price", "prices", "mandi", "commodity", "rate", "rates", "trading", "export", "import",
    "बाजार", "मंडी", "भाव", "कीमत", "दर", "निर्यात", "आयात",
  ],
  technology: [
    "technology", "drone", "ai", "sensor", "irrigation tech", "smart farming", "innovation", "startup", "app",
    "तकनीक", "ड्रोन", "सेंसर", "स्मार्ट", "नवाचार", "स्टार्टअप",
  ],
  success_story: [
    "success story", "farmer success", "award", "best practice", "model farmer", "case study",
    "सफलता", "सफल", "कहानी", "उदाहरण", "मॉडल किसान",
  ],
  policy: [
    "government", "ministry", "scheme", "subsidy", "msp", "policy",
    "सरकार", "मंत्रालय", "योजना", "सब्सिडी", "नीति",
  ],
  agriculture: [
    "agriculture", "farming", "farm", "crop", "farmer", "horticulture", "agri",
    "कृषि", "खेती", "फसल", "किसान", "बागवानी",
  ],
};

const includesAny = (text, words) => words.some((word) => text.includes(word));

const categoryAliasMap = {
  weather: "weather",
  weather_alert: "weather",
  forecast: "weather",
  market: "market_update",
  market_update: "market_update",
  marketprice: "market_update",
  mandi: "market_update",
  technology: "technology",
  tech: "technology",
  innovation: "technology",
  success: "success_story",
  success_story: "success_story",
  story: "success_story",
  policy: "policy",
  government: "policy",
};

const normalizeCategoryFromField = (raw) => {
  const key = String(raw || "").toLowerCase().replace(/\s+/g, "_");
  return categoryAliasMap[key] || null;
};

const detectCategoryKey = (text, hintedCategory) => {
  const fromHint = normalizeCategoryFromField(hintedCategory);
  if (fromHint) return fromHint;

  if (includesAny(text, keywordTests.weather)) return "weather";
  if (includesAny(text, keywordTests.market_update)) return "market_update";
  if (includesAny(text, keywordTests.technology)) return "technology";
  if (includesAny(text, keywordTests.success_story)) return "success_story";
  if (includesAny(text, keywordTests.policy)) return "policy";
  return "market_update";
};

const detectPriority = (text, categoryKey) => {
  if (categoryKey === "weather") {
    if (includesAny(text, ["storm", "heavy rain", "warning", "alert", "लाल चेतावनी", "चेतावनी"])) return "critical";
    return "high";
  }

  if (categoryKey === "market_update") {
    if (includesAny(text, ["surge", "spike", "crash", "record high", "तेजी", "गिरावट"])) return "high";
    return "medium";
  }

  if (categoryKey === "technology") return "medium";
  if (categoryKey === "success_story") return "low";
  return "medium";
};

const hashToNumericId = (raw) => {
  let hash = 0;
  const input = String(raw || "");
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const withTimeoutSignal = (timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  };
};

const getDataGovResourceIdForCategory = (categoryKey) => {
  if (categoryKey === "weather" && DATAGOV_WEATHER_RESOURCE_ID) return DATAGOV_WEATHER_RESOURCE_ID;
  if (categoryKey === "market_update" && DATAGOV_MARKET_RESOURCE_ID) return DATAGOV_MARKET_RESOURCE_ID;
  if (categoryKey === "technology" && DATAGOV_TECH_RESOURCE_ID) return DATAGOV_TECH_RESOURCE_ID;
  if (categoryKey === "success_story" && DATAGOV_SUCCESS_RESOURCE_ID) return DATAGOV_SUCCESS_RESOURCE_ID;
  return DATAGOV_RESOURCE_ID;
};

const extractArticlesFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const directKeys = ["articles", "news", "items", "results", "data", "records"];
  for (const key of directKeys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractArticlesFromPayload(value);
      if (nested.length) return nested;
    }
  }

  return [];
};

const buildCommonQuery = ({ categoryKey, language, state, district, maxPerCategory }) => {
  const queryTemplate = categoryQueries[categoryKey]?.[language] || categoryQueries[categoryKey]?.en;
  return {
    q: [queryTemplate, sanitizeLocationPart(district), sanitizeLocationPart(state)].filter(Boolean).join(" "),
    category: categoryKey,
    language,
    lang: language,
    state: sanitizeLocationPart(state),
    district: sanitizeLocationPart(district),
    country: "in",
    max: String(maxPerCategory),
    limit: String(maxPerCategory),
    size: String(maxPerCategory),
    page: "1",
    sortby: "publishedAt",
    sort: "publishedAt",
  };
};

const fetchScraperCategoryFeed = async ({ categoryKey, language, state, district, maxPerCategory }) => {
  if (!hasScraperConfigured()) return [];

  const queryData = buildCommonQuery({ categoryKey, language, state, district, maxPerCategory });
  const headers = {
    Accept: "application/json",
  };

  if (SCRAPER_NEWS_API_KEY && SCRAPER_NEWS_API_KEY_HEADER) {
    headers[SCRAPER_NEWS_API_KEY_HEADER] = SCRAPER_NEWS_API_KEY;
  }

  const url = new URL(SCRAPER_NEWS_API_URL);
  if (SCRAPER_NEWS_API_METHOD === "GET") {
    Object.entries(queryData).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });

    if (SCRAPER_NEWS_API_KEY && SCRAPER_NEWS_API_KEY_QUERY_PARAM) {
      url.searchParams.set(SCRAPER_NEWS_API_KEY_QUERY_PARAM, SCRAPER_NEWS_API_KEY);
    }
  }

  const { signal, cleanup } = withTimeoutSignal(SCRAPER_NEWS_API_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      method: SCRAPER_NEWS_API_METHOD,
      headers:
        SCRAPER_NEWS_API_METHOD === "GET"
          ? headers
          : {
              ...headers,
              "Content-Type": "application/json",
            },
      body: SCRAPER_NEWS_API_METHOD === "GET" ? undefined : JSON.stringify(queryData),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Scraper news request failed (${response.status})`);
    }

    const payload = await response.json();
    return extractArticlesFromPayload(payload);
  } finally {
    cleanup();
  }
};

const fetchDataGovCategoryFeed = async ({ categoryKey, language, state, district, maxPerCategory }) => {
  if (!hasDataGovConfigured()) return [];

  const resourceId = getDataGovResourceIdForCategory(categoryKey);
  if (!resourceId) return [];

  const queryData = buildCommonQuery({ categoryKey, language, state, district, maxPerCategory });
  const url = new URL(`${DATAGOV_BASE_URL.replace(/\/$/, "")}/${resourceId}`);

  url.searchParams.set("api-key", DATAGOV_API_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", queryData.limit);
  url.searchParams.set("offset", "0");

  // Use broad search terms that many Data.gov datasets can match against textual fields.
  if (queryData.q) {
    url.searchParams.set("q", queryData.q);
  }

  const { signal, cleanup } = withTimeoutSignal(DATAGOV_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Data.gov request failed (${response.status})`);
    }

    const payload = await response.json();
    return extractArticlesFromPayload(payload);
  } finally {
    cleanup();
  }
};

const fetchGNewsCategoryFeed = async ({ categoryKey, language, state, district, maxPerCategory }) => {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];

  const queryData = buildCommonQuery({ categoryKey, language, state, district, maxPerCategory });
  const params = new URLSearchParams({
    q: queryData.q,
    lang: queryData.lang,
    country: queryData.country,
    max: queryData.max,
    sortby: queryData.sortby,
    token: apiKey,
  });

  const { signal, cleanup } = withTimeoutSignal(9000);
  try {
    const response = await fetch(`${GNEWS_BASE_URL}/search?${params.toString()}`, {
      signal,
    });

    if (!response.ok) {
      throw new Error(`GNews request failed (${response.status})`);
    }

    const payload = await response.json();
    return Array.isArray(payload?.articles) ? payload.articles : [];
  } finally {
    cleanup();
  }
};

const fetchCategoryFeed = async (params) => {
  const provider = NEWS_PROVIDER;

  if (provider === "datagov") {
    return fetchDataGovCategoryFeed(params);
  }

  if (provider === "scraper") {
    return fetchScraperCategoryFeed(params);
  }

  if (provider === "gnews") {
    return fetchGNewsCategoryFeed(params);
  }

  if (hasDataGovConfigured()) {
    try {
      const dataGovItems = await fetchDataGovCategoryFeed(params);
      if (dataGovItems.length > 0) return dataGovItems;
    } catch {
      // Fall through to next provider in auto mode.
    }
  }

  if (hasScraperConfigured()) {
    try {
      const scraperItems = await fetchScraperCategoryFeed(params);
      if (scraperItems.length > 0) return scraperItems;
    } catch {
      // Fall through to GNews in auto mode.
    }
  }

  return fetchGNewsCategoryFeed(params);
};

const normalizeArticle = (article, language, sourceType = "auto") => {
  const title = safeText(article?.title || article?.headline || article?.name);
  const summary = safeText(
    article?.description || article?.summary || article?.snippet || article?.content,
    "No summary available"
  );

  if (!title) return null;

  const combinedText = `${title} ${summary}`.toLowerCase();
  const categoryHint = article?.category || article?.type || article?.topic;

  if (sourceType === "gnews" && !includesAny(combinedText, keywordTests.agriculture)) {
    return null;
  }

  const categoryKey = detectCategoryKey(combinedText, categoryHint);
  const sourceUrl = safeUrl(article?.url || article?.link || article?.sourceUrl || article?.source_url);
  if (!sourceUrl) return null;

  const imageUrl = safeUrl(article?.image || article?.imageUrl || article?.thumbnail || article?.thumbnailUrl);
  const publishedAtRaw = safeText(article?.publishedAt || article?.published_at || article?.pubDate || article?.date);
  const publishedAt = Number.isNaN(Date.parse(publishedAtRaw)) ? new Date().toISOString() : new Date(publishedAtRaw).toISOString();
  const idSeed = `${sourceUrl}|${title}|${publishedAt}`;

  return {
    id: hashToNumericId(idSeed),
    title,
    summary,
    categoryKey,
    priority: detectPriority(combinedText, categoryKey),
    publishedAt,
    author: safeText(article?.author || article?.source?.name || article?.source?.url || article?.source || "Unknown source"),
    tags: Array.isArray(article?.tags) ? article.tags.slice(0, 5).map((tag) => safeText(tag)).filter(Boolean) : [],
    readTime: Math.max(2, Math.min(8, Math.ceil(summary.split(" ").filter(Boolean).length / 35))),
    image: imageUrl,
    url: sourceUrl,
    language,
  };
};

const deduplicateItems = (items) => {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    const key = `${item.url}|${item.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }

  return output;
};

const buildFallbackNews = (language) => {
  const now = Date.now();
  const makeIso = (hoursAgo) => new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();

  const baseItems = [
    {
      id: 900001,
      categoryKey: "weather",
      priority: "high",
      publishedAt: makeIso(2),
      author: "IMD Advisory",
      tags: ["weather", "india"],
      readTime: 3,
      image: "",
      url: "https://mausam.imd.gov.in/",
      titleEn: "Heavy rainfall advisory issued for central and western India",
      summaryEn: "Farmers are advised to postpone spraying and ensure field drainage in rain-prone districts over the next 48 hours.",
      titleHi: "मध्य और पश्चिम भारत के लिए भारी वर्षा की सलाह जारी",
      summaryHi: "अगले 48 घंटों में वर्षा संभावित जिलों में किसानों को स्प्रे टालने और खेत की निकासी सुनिश्चित करने की सलाह दी गई है।",
    },
    {
      id: 900002,
      categoryKey: "market_update",
      priority: "medium",
      publishedAt: makeIso(4),
      author: "Mandi Watch",
      tags: ["mandi", "prices"],
      readTime: 2,
      image: "",
      url: "https://agmarknet.gov.in/",
      titleEn: "Mandi arrivals improve for onion and tomato in major markets",
      summaryEn: "Fresh arrivals increased in key mandis, with mixed price trends across states. Farmers should compare nearby markets before sale.",
      titleHi: "प्रमुख मंडियों में प्याज और टमाटर की आवक बढ़ी",
      summaryHi: "मुख्य मंडियों में नई आवक बढ़ी है और राज्यों में कीमतों में मिश्रित रुझान दिख रहे हैं। बिक्री से पहले नज़दीकी मंडियों की तुलना करें।",
    },
    {
      id: 900003,
      categoryKey: "technology",
      priority: "medium",
      publishedAt: makeIso(6),
      author: "AgriTech India",
      tags: ["technology", "irrigation"],
      readTime: 3,
      image: "",
      url: "https://icar.org.in/",
      titleEn: "Low-cost precision irrigation practices gain adoption",
      summaryEn: "Field demonstrations show water savings and improved crop consistency using simple sensor-assisted irrigation scheduling.",
      titleHi: "कम लागत वाली सटीक सिंचाई पद्धतियों का प्रसार बढ़ा",
      summaryHi: "फील्ड डेमो में सेंसर-सहायता प्राप्त सिंचाई समय-सारिणी से पानी की बचत और फसल की एकरूपता बेहतर होने के संकेत मिले हैं।",
    },
    {
      id: 900004,
      categoryKey: "success_story",
      priority: "low",
      publishedAt: makeIso(8),
      author: "Farmer Stories",
      tags: ["success", "best-practices"],
      readTime: 3,
      image: "",
      url: "https://agricoop.nic.in/",
      titleEn: "Farmer collective reports better returns through crop planning",
      summaryEn: "A local farmer group improved profitability by aligning sowing schedules and market timing using shared advisories.",
      titleHi: "फसल योजना से किसान समूह को बेहतर लाभ मिला",
      summaryHi: "स्थानीय किसान समूह ने साझा सलाह के आधार पर बुवाई और बिक्री समय मिलाकर लाभ में सुधार दर्ज किया।",
    },
  ];

  return baseItems.map((item) => ({
    id: item.id,
    categoryKey: item.categoryKey,
    priority: item.priority,
    publishedAt: item.publishedAt,
    author: item.author,
    tags: item.tags,
    readTime: item.readTime,
    image: item.image,
    url: item.url,
    title: language === "hi" ? item.titleHi : item.titleEn,
    summary: language === "hi" ? item.summaryHi : item.summaryEn,
    language,
  }));
};

const buildMarketReports = (newsItems, language) => {
  const marketNews = newsItems.filter((item) => item.categoryKey === "market_update").slice(0, 2);

  return marketNews.map((item, index) => {
    const highlights = item.summary
      .split(/[.;:]/)
      .map((segment) => safeText(segment))
      .filter(Boolean)
      .slice(0, 4);

    return {
      id: item.id + index,
      title: language === "hi" ? `बाज़ार रिपोर्ट: ${item.title}` : `Market Brief: ${item.title}`,
      summary: item.summary,
      highlights: highlights.length ? highlights : [item.summary],
      publishedAt: item.publishedAt,
      downloadUrl: item.url,
    };
  });
};

const ensureProviderReady = () => {
  return hasDataGovConfigured() || hasScraperConfigured() || hasGNewsConfigured();
};

const fetchLiveNewsBundle = async ({ language, state, district, limit }) => {
  const normalizedLanguage = normalizeLanguage(language);
  const maxTotal = Number.isFinite(Number(limit)) ? Number(limit) : NEWS_DEFAULT_LIMIT;
  const providerReady = ensureProviderReady();

  if (!providerReady) {
    const fallbackNews = buildFallbackNews(normalizedLanguage).slice(0, maxTotal);
    return {
      news: fallbackNews,
      marketReports: buildMarketReports(fallbackNews, normalizedLanguage),
      lastUpdatedAt: new Date().toISOString(),
      language: normalizedLanguage,
      cacheTtlMs: NEWS_CACHE_TTL_MS,
    };
  }

  const maxPerCategory = Math.max(4, Math.ceil(maxTotal / 4));
  const requestedCategories = ["weather", "market_update", "technology", "success_story"];

  const rawResults = await Promise.all(
    requestedCategories.map((categoryKey) =>
      fetchCategoryFeed({
        categoryKey,
        language: normalizedLanguage,
        state,
        district,
        maxPerCategory,
      }).catch(() => [])
    )
  );

  const sourceType =
    NEWS_PROVIDER === "datagov"
      ? "datagov"
      : NEWS_PROVIDER === "scraper"
        ? "scraper"
        : hasDataGovConfigured()
          ? "datagov"
          : hasScraperConfigured()
            ? "scraper"
            : "gnews";
  const normalized = rawResults.flat().map((article) => normalizeArticle(article, normalizedLanguage, sourceType)).filter(Boolean);

  let deduped = deduplicateItems(normalized);

  if (deduped.length < Math.min(8, maxTotal)) {
    const fallbackLanguage = normalizedLanguage === "hi" ? "en" : "hi";
    const fallbackResults = await Promise.all(
      requestedCategories.map((categoryKey) =>
        fetchCategoryFeed({
          categoryKey,
          language: fallbackLanguage,
          state,
          district,
          maxPerCategory,
        }).catch(() => [])
      )
    );

    const fallbackNormalized = fallbackResults
      .flat()
      .map((article) => normalizeArticle(article, fallbackLanguage, sourceType))
      .filter(Boolean);

    deduped = deduplicateItems([...deduped, ...fallbackNormalized]);
  }

  const sorted = deduped
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, maxTotal);

  const finalNews = sorted.length > 0 ? sorted : buildFallbackNews(normalizedLanguage).slice(0, maxTotal);

  return {
    news: finalNews,
    marketReports: buildMarketReports(finalNews, normalizedLanguage),
    lastUpdatedAt: new Date().toISOString(),
    language: normalizedLanguage,
    cacheTtlMs: NEWS_CACHE_TTL_MS,
  };
};

export const getNewsBundle = async (params = {}) => {
  const cacheKey = buildCacheKey(params);
  const forceRefresh = params.forceRefresh === true;
  const existing = memoryCache.get(cacheKey);

  if (!forceRefresh && isCacheFresh(existing)) {
    return {
      ...existing.payload,
      cache: {
        hit: true,
        stale: false,
        ttlMs: NEWS_CACHE_TTL_MS,
      },
    };
  }

  try {
    const payload = await fetchLiveNewsBundle(params);
    memoryCache.set(cacheKey, {
      createdAt: getNow(),
      payload,
    });

    return {
      ...payload,
      cache: {
        hit: false,
        stale: false,
        ttlMs: NEWS_CACHE_TTL_MS,
      },
    };
  } catch (error) {
    if (existing) {
      return {
        ...existing.payload,
        cache: {
          hit: true,
          stale: true,
          ttlMs: NEWS_CACHE_TTL_MS,
        },
      };
    }

    throw error;
  }
};

export default {
  getNewsBundle,
};
