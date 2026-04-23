const cropEmojiMap = {
  wheat: "🌾",
  rice: "🌾",
  paddy: "🌾",
  mustard: "🌼",
  tomato: "🍅",
  potato: "🥔",
  onion: "🧅",
  cucumber: "🥒",
  chana: "🌱",
  maize: "🌽",
  cotton: "🧵",
};

const getSeason = (date = new Date()) => {
  const month = date.getMonth() + 1;
  if (month >= 11 || month <= 3) return "rabi";
  if (month >= 6 && month <= 10) return "kharif";
  return "zaid";
};

const getSeasonalPrompt = (season, language) => {
  if (language === "en") {
    if (season === "rabi") return "Rabi season nutrient and irrigation check";
    if (season === "kharif") return "Kharif rainfall and drainage planning";
    return "Zaid heat-stress and irrigation advisory";
  }

  if (season === "rabi") return "रबी सीजन पोषण और सिंचाई जाँच";
  if (season === "kharif") return "खरीफ वर्षा और ड्रेनेज योजना";
  return "जायद गर्मी और सिंचाई सलाह";
};

const inferCropFromHistory = (history = []) => {
  const cropHints = ["wheat", "rice", "paddy", "mustard", "chana", "maize", "cotton", "tomato", "onion", "potato"];
  const text = history.map((item) => String(item.message || "").toLowerCase()).join(" ");
  return cropHints.find((crop) => text.includes(crop)) || null;
};

export const buildQuickReplies = ({ entities, farm, language = "hi", history = [] }) => {
  const replies = [];
  const season = getSeason();
  const inferredHistoryCrop = inferCropFromHistory(history);
  const crops = entities?.crops?.length ? entities.crops : farm?.selectedCrops?.length ? farm.selectedCrops : inferredHistoryCrop ? [inferredHistoryCrop] : [];
  const lastUserMessage = [...history].reverse().find((m) => m.role === "user")?.message?.toLowerCase() || "";

  const inferredTopic = entities?.topics?.[0] ||
    (lastUserMessage.includes("price") || lastUserMessage.includes("mandi") ? "market" : "general");

  if (crops.length > 0) {
    const crop = crops[0];
    replies.push(
      language === "en"
        ? `MSP/market trend for ${crop}?`
        : `${crop} ka MSP/mandi trend kya hai?`
    );
    replies.push(
      language === "en"
        ? `Best fertilizer schedule for ${crop}`
        : `${crop} ke liye best khaad schedule`
    );
    replies.push(
      language === "en"
        ? `${crop} pest risk this ${season}`
        : `${crop} me ${season} ke dauran keet risk`
    );
  } else {
    replies.push(language === "en" ? "Suggest crops for my district" : "Mere district ke liye fasal sujhav");
    replies.push(language === "en" ? "How to improve my soil health" : "Mitti ki sehat kaise sudharein");
  }

  if (inferredTopic === "market") {
    replies.push(language === "en" ? "Best day to sell in mandi" : "Mandi me bechne ka best din");
  }

  replies.push(getSeasonalPrompt(season, language));
  replies.push(language === "en" ? "Weather risk this week" : "Is hafte ka mausam risk");

  return Array.from(new Set(replies)).slice(0, 4);
};

export const buildAdvisoryQuickReplies = ({
  entities,
  farm,
  language = "hi",
  history = [],
  mode = "fallback_safe",
  intent = "general",
  missingSlots = [],
  liveContext = {},
}) => {
  const replies = [];
  const isEnglish = language === "en";
  const crop = entities?.crops?.[0] || farm?.selectedCrops?.[0] || null;

  if (missingSlots.includes("crop")) {
    replies.push(isEnglish ? "My crop is tomato" : "Meri crop tomato hai");
    replies.push(isEnglish ? "My crop is wheat" : "Meri crop gehun hai");
  }

  if (missingSlots.includes("stage")) {
    replies.push(isEnglish ? "Stage is sowing" : "Stage sowing hai");
    replies.push(isEnglish ? "Stage is flowering" : "Stage flowering hai");
  }

  if (missingSlots.includes("location")) {
    replies.push(isEnglish ? "My district is Nashik" : "Mera district Nashik hai");
  }

  if (intent !== "weather") {
    replies.push(isEnglish ? "Show weather risk" : "Mausam risk dikhao");
  }

  if (crop) {
    replies.push(isEnglish ? `Fertilizer plan for ${crop}` : `${crop} ke liye khaad plan`);
    replies.push(isEnglish ? `Pest risk in ${crop}` : `${crop} me pest risk`);
    replies.push(isEnglish ? `Mandi explanation for ${crop}` : `${crop} ke mandi daam samjhao`);
  } else {
    replies.push(isEnglish ? "Share crop stage" : "Crop stage batata hoon");
  }

  if (liveContext?.alerts?.length && mode !== "clarifying_question") {
    replies.push(isEnglish ? "Explain active alerts" : "Active alerts samjhao");
  }

  return Array.from(new Set(replies)).slice(0, 4);
};

export const buildRecommendations = ({ entities, knowledge = [], language = "hi" }) => {
  const recs = [];

  if (entities?.crops?.length) {
    const crop = entities.crops[0];
    const emoji = cropEmojiMap[crop] || "🌱";
    recs.push(
      language === "en"
        ? `${emoji} Prioritize stage-wise planning for ${crop}`
        : `${emoji} ${crop} ke liye stage-wise planning karein`
    );
  }

  if (knowledge.length) {
    const title = language === "en" ? knowledge[0].title : knowledge[0].titleHi || knowledge[0].title;
    recs.push(language === "en" ? `Apply guidance from: ${title}` : `Is margdarshan ko apply karein: ${title}`);
  }

  return recs.slice(0, 3);
};

export const buildStructuredResponse = ({
  reply,
  source,
  conversationId,
  entities,
  knowledge,
  language,
  farm,
  history,
  mode = "fallback_safe",
  confidence = 0,
  degraded = false,
  sourcesUsed = [],
  languageUsed = language,
  quickReplyContext = {},
}) => ({
  reply,
  source,
  conversationId,
  entities,
  recommendations: buildRecommendations({ entities, knowledge, language }),
  quickReplies:
    mode === "clarifying_question" || quickReplyContext?.missingSlots?.length
      ? buildAdvisoryQuickReplies({
          entities,
          farm,
          language,
          history,
          mode,
          intent: quickReplyContext?.intent,
          missingSlots: quickReplyContext?.missingSlots || [],
          liveContext: quickReplyContext?.liveContext || {},
        })
      : buildAdvisoryQuickReplies({
          entities,
          farm,
          language,
          history,
          mode,
          intent: quickReplyContext?.intent,
          missingSlots: [],
          liveContext: quickReplyContext?.liveContext || {},
        }),
  contextUsed: {
    knowledgeCount: knowledge.length,
    hasFarmContext: !!farm,
  },
  mode,
  languageUsed,
  confidence,
  sourcesUsed,
  degraded,
});

export default {
  buildStructuredResponse,
  buildQuickReplies,
  buildAdvisoryQuickReplies,
  buildRecommendations,
};
