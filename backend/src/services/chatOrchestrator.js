import { retrieveIntentAwareKnowledge } from "./ragService.js";

const structuredPrompt = ({ languageStyle, contextBlock, liveBlock, knowledgeBlock, entityBlock }) => [
  'Role:',
  'You are "Kissan Sahayk", a practical farming advisor for Indian farmers.',
  "",
  "Language Policy:",
  `Mirror the user's style. Preferred output style: ${languageStyle}.`,
  "Respond in clear farmer-friendly language. Keep answers short unless details are necessary.",
  "",
  "Grounding Rules:",
  "Use only the supplied farm context, live app context, and retrieved knowledge.",
  "Do not invent prices, weather values, legal scheme rules, pesticide doses, or exact timelines.",
  "If important details are missing, ask one short follow-up question before giving risky advice.",
  "",
  "Safety Rules:",
  "Avoid unsupported chemical dosage advice unless grounded evidence explicitly contains it.",
  "If uncertain, say what is unknown and provide safer general guidance.",
  "",
  "Output Style:",
  "Lead with the direct answer, then 2-4 practical actions if helpful.",
  "Prefer actionable steps over generic explanation.",
  "",
  "Farmer Context:",
  contextBlock || "No saved farm context available.",
  "",
  "Live App Context:",
  liveBlock || "No live app data available.",
  "",
  "Retrieved Knowledge:",
  knowledgeBlock || "No strong knowledge snippets found.",
  "",
  "Detected Entities:",
  entityBlock || "No entities detected.",
].join("\n");

const detectLanguageStyle = (message = "", requestedLanguage = "hi") => {
  if (requestedLanguage === "en") return "english";

  const devanagariChars = (message.match(/[\u0900-\u097f]/g) || []).length;
  const latinChars = (message.match(/[A-Za-z]/g) || []).length;

  if (devanagariChars > 0 && latinChars > 0) return "hinglish";
  if (devanagariChars > 0) return "hindi";
  if (latinChars > 0) return requestedLanguage === "hi" ? "hinglish" : "english";
  return requestedLanguage === "en" ? "english" : "hindi";
};

const detectIntent = ({ message = "", entities = {}, farm = null }) => {
  const input = String(message).toLowerCase();
  const topics = entities?.topics || [];

  if (topics.includes("weather")) return "weather";
  if (topics.includes("market")) return "market";
  if (input.includes("alert") || input.includes("notification")) return "alerts";
  if (topics.includes("fertilizer") || topics.includes("soil")) return "fertilizer";
  if (topics.includes("irrigation")) return "irrigation";
  if (topics.includes("pest") || topics.includes("disease")) return "pest_disease";
  if (topics.includes("scheme")) return "government";
  if (farm?.selectedCrops?.length && (input.includes("my crop") || input.includes("meri fasal") || input.includes("my farm"))) {
    return "crop_advice";
  }

  return "general";
};

const getMissingSlots = ({ intent, entities, farm }) => {
  const missing = [];
  const hasCrop = Boolean(entities?.crops?.length || farm?.selectedCrops?.length);
  const hasLocation = Boolean(farm?.location?.state && farm?.location?.district);
  const hasStage = Boolean(entities?.dates?.some((item) => /stage|sowing|flowering|harvest|vegetative|nursery/i.test(item)));

  if (["fertilizer", "irrigation", "pest_disease", "market", "crop_advice"].includes(intent) && !hasCrop) {
    missing.push("crop");
  }
  if (["market", "weather", "alerts", "crop_advice"].includes(intent) && !hasLocation) {
    missing.push("location");
  }
  if (["fertilizer", "irrigation", "pest_disease"].includes(intent) && !hasStage) {
    missing.push("stage");
  }

  return missing;
};

const getClarifyingQuestion = ({ missingSlots, languageStyle }) => {
  const isEnglish = languageStyle === "english";

  if (missingSlots.includes("crop") && missingSlots.includes("stage")) {
    return isEnglish
      ? "Please share the crop name and crop stage so I can give a safer recommendation."
      : "Kripya crop ka naam aur crop stage batayein, tab main zyada surakshit salah de paunga.";
  }

  if (missingSlots.includes("crop")) {
    return isEnglish
      ? "Please share the crop name so I can tailor the advice."
      : "Kripya crop ka naam batayein, tab main salah ko aapke hisab se bana paunga.";
  }

  if (missingSlots.includes("stage")) {
    return isEnglish
      ? "Please share the crop stage, for example sowing, vegetative, flowering, or harvest."
      : "Kripya crop stage batayein, jaise sowing, vegetative, flowering ya harvest.";
  }

  if (missingSlots.includes("location")) {
    return isEnglish
      ? "Please share your district and state so I can use local conditions."
      : "Kripya apna district aur state batayein, taaki main local conditions ke hisab se jawab doon.";
  }

  return isEnglish
    ? "Please share one more detail so I can answer more safely."
    : "Kripya ek aur zaroori detail batayein, taaki main zyada surakshit jawab doon.";
};

const getFallbackReply = ({ message = "", languageStyle = "hindi", intent = "general" }) => {
  const input = String(message).toLowerCase();
  const isEnglish = languageStyle === "english";

  if (intent === "weather") {
    return isEnglish
      ? "I cannot reach the live weather model right now. Check today’s forecast in the app and avoid spray before rain or strong wind."
      : "Main abhi live weather model tak nahi pahunch pa raha hoon. App me aaj ka forecast dekhein aur barish ya tez hawa se pehle spray na karein.";
  }

  if (intent === "market") {
    return isEnglish
      ? "I cannot verify mandi prices right now. Compare nearby mandi trends for the last few days before selling."
      : "Main abhi mandi daam verify nahi kar pa raha hoon. Bechne se pehle 3-5 din ka najdeeki mandi trend compare karein.";
  }

  if (input.includes("pest") || input.includes("disease")) {
    return isEnglish
      ? "Use IPM: inspect the field regularly, remove heavily affected parts, and use labeled products only after confirming the pest and threshold."
      : "IPM follow karein: khet ki niyamit dekhbhal karein, zyada prabhavit hisson ko hataayein, aur keet ki pushti ke baad hi label ke hisab se dawa use karein.";
  }

  if (input.includes("fertilizer") || input.includes("khaad") || input.includes("soil")) {
    return isEnglish
      ? "For safer fertilizer advice, use a soil test, split nitrogen doses, and balance NPK according to crop and stage."
      : "Surakshit khaad salah ke liye soil test ka use karein, nitrogen ko split dose me dein, aur crop aur stage ke hisab se NPK balance rakhein.";
  }

  return isEnglish
    ? "I can still help with practical farming guidance. Share crop, location, and crop stage for a more grounded answer."
    : "Main abhi bhi practical farming guidance de sakta hoon. Zyada grounded jawab ke liye crop, location aur crop stage batayein.";
};

const formatKnowledgeBlock = (items = [], languageStyle = "hindi") =>
  items
    .map((item, index) => {
      const title = languageStyle === "english" ? item.title : item.titleHi || item.title;
      const content = languageStyle === "english" ? item.content : item.contentHi || item.content;
      return `${index + 1}. [${item.category}] ${title}: ${content}`;
    })
    .join("\n");

const formatLiveBlock = (liveContext = {}, languageStyle = "hindi") => {
  const lines = [];

  if (liveContext.farm) {
    lines.push(`Farm profile: crops=${(liveContext.farm.selectedCrops || []).join(", ") || "not set"}, location=${liveContext.farm.location?.district || "unknown"}, ${liveContext.farm.location?.state || "unknown"}`);
  }

  if (liveContext.weather?.current) {
    lines.push(
      `Weather: temp=${liveContext.weather.current.temperature ?? "na"}C, humidity=${liveContext.weather.current.humidity ?? "na"}%, wind=${liveContext.weather.current.windSpeed ?? "na"} km/h, condition=${liveContext.weather.current.condition || "unknown"}, AQI=${liveContext.weather.current.aqi ?? "na"}`
    );
  }

  if (Array.isArray(liveContext.alerts) && liveContext.alerts.length > 0) {
    lines.push(
      `Alerts: ${liveContext.alerts
        .map((item) => `${item.priority}:${item.title}`)
        .join("; ")}`
    );
  }

  if (liveContext.market?.items?.length) {
    lines.push(
      `Market: ${liveContext.market.items
        .map((item) => `${item.crop} ${item.market} modal=${item.modalPrice ?? "na"}`)
        .join("; ")}`
    );
  }

  return lines.join("\n");
};

const buildDeterministicReply = ({ intent, liveContext, entities, farm, languageStyle }) => {
  const isEnglish = languageStyle === "english";

  if (intent === "weather" && liveContext.weather?.current) {
    const current = liveContext.weather.current;
    const today = liveContext.weather.daily?.[0];
    return isEnglish
      ? `Current weather near your farm is ${current.condition} with ${current.temperature ?? "--"}C, humidity ${current.humidity ?? "--"}%, and wind ${current.windSpeed ?? "--"} km/h. ${Number.isFinite(today?.precipitationProbabilityMax) ? `Rain chance today is about ${Math.round(today.precipitationProbabilityMax)}%. ` : ""}Plan spray and irrigation around this forecast.`
      : `Aapke farm ke paas abhi mausam ${current.condition} hai, temperature ${current.temperature ?? "--"}C, humidity ${current.humidity ?? "--"}%, aur hawa ${current.windSpeed ?? "--"} km/h hai. ${Number.isFinite(today?.precipitationProbabilityMax) ? `Aaj barish ki sambhavna lagbhag ${Math.round(today.precipitationProbabilityMax)}% hai. ` : ""}Isi hisab se spray aur sinchai plan karein.`;
  }

  if (intent === "alerts" && liveContext.alerts?.length) {
    const alert = liveContext.alerts[0];
    return isEnglish
      ? `The main active alert is ${alert.title}. ${alert.message} Start with: ${(alert.actions || []).slice(0, 2).join(", ")}.`
      : `Sabse important active alert ${alert.title} hai. ${alert.message} Shuruaat in kadmon se karein: ${(alert.actions || []).slice(0, 2).join(", ")}.`;
  }

  if (intent === "market" && liveContext.market?.items?.length) {
    const item = liveContext.market.items[0];
    return isEnglish
      ? `The latest mandi signal I have is for ${item.crop} in ${item.market}, ${item.district}. Modal price is about ${item.modalPrice ?? "not available"} and the record date is ${item.arrivalDate?.slice(0, 10) || "recent"}. Compare nearby markets before selling.`
      : `Mere paas sabse naya mandi signal ${item.crop} ke liye ${item.market}, ${item.district} se hai. Modal price lagbhag ${item.modalPrice ?? "upalabdh nahi"} hai aur record date ${item.arrivalDate?.slice(0, 10) || "recent"} hai. Bechne se pehle najdeeki markets compare karein.`;
  }

  if (intent === "crop_advice" && farm?.selectedCrops?.length) {
    return isEnglish
      ? `Your saved crops are ${(farm.selectedCrops || []).join(", ")} in ${farm.location?.district || "your district"}, ${farm.location?.state || "your state"}. Ask me about weather risk, irrigation, fertilizer, pest, or mandi planning for any of these crops.`
      : `Aapki saved crops ${(farm.selectedCrops || []).join(", ")} hain, location ${farm.location?.district || "aapka district"}, ${farm.location?.state || "aapka state"} hai. In crops ke liye mausam risk, sinchai, khaad, keet ya mandi planning pooch sakte hain.`;
  }

  return null;
};

const postValidateReply = ({ reply, sourcesUsed = [], confidence = 0 }) => {
  const hardClaimRegex = /\b\d+(\.\d+)?\s?(ml|l|kg|g|ha|acre|₹|rs|%|percent|days?)\b/i;
  const hasStrongSource = sourcesUsed.some((item) => ["knowledge", "weather", "market"].includes(item));

  if (hardClaimRegex.test(reply) && !hasStrongSource && confidence < 0.45) {
    return false;
  }

  if (/msp/i.test(reply) && !sourcesUsed.includes("market")) {
    return false;
  }

  return true;
};

export const buildChatResponse = async ({
  message,
  requestedLanguage = "hi",
  conversationId,
  entities,
  history = [],
  chatContext = {},
  provider,
  liveContext,
}) => {
  const languageStyle = detectLanguageStyle(message, requestedLanguage);
  const languageUsed = languageStyle === "english" ? "en" : languageStyle === "hindi" ? "hi" : "hinglish";
  const intent = detectIntent({ message, entities, farm: chatContext?.farm });
  const missingSlots = getMissingSlots({ intent, entities, farm: chatContext?.farm });

  const knowledgeBundle = await retrieveIntentAwareKnowledge({
    query: message,
    entities,
    intent,
    languageStyle,
    topK: 4,
    hf: null,
  });

  const sourcesUsed = new Set(liveContext?.sourcesUsed || []);
  if (knowledgeBundle.items.length > 0) {
    sourcesUsed.add("knowledge");
  }

  if (missingSlots.length > 0 && ["fertilizer", "irrigation", "pest_disease", "market", "crop_advice"].includes(intent)) {
    const reply = getClarifyingQuestion({ missingSlots, languageStyle });
    return {
      reply,
      conversationId,
      source: "fallback",
      mode: "clarifying_question",
      languageUsed,
      confidence: 0.35,
      degraded: false,
      entities,
      knowledge: knowledgeBundle.items,
      liveContext,
      sourcesUsed: Array.from(sourcesUsed),
      quickReplyContext: {
        intent,
        missingSlots,
        liveContext,
      },
    };
  }

  const deterministicReply = buildDeterministicReply({
    intent,
    liveContext,
    entities,
    farm: chatContext?.farm,
    languageStyle,
  });

  if (deterministicReply) {
    return {
      reply: deterministicReply,
      conversationId,
      source: "fallback",
      mode: "deterministic_template",
      languageUsed,
      confidence: 0.8,
      degraded: false,
      entities,
      knowledge: knowledgeBundle.items,
      liveContext,
      sourcesUsed: Array.from(sourcesUsed),
      quickReplyContext: {
        intent,
        missingSlots,
        liveContext,
      },
    };
  }

  const contextBlock = chatContext?.promptContext || "User context unavailable.";
  const liveBlock = formatLiveBlock(liveContext, languageStyle);
  const knowledgeBlock = formatKnowledgeBlock(knowledgeBundle.items, languageStyle);
  const entityBlock = `crops=${entities.crops.join(", ") || "none"}; topics=${entities.topics.join(", ") || "none"}; locations=${entities.locations.join(", ") || "none"}; dates=${entities.dates.join(", ") || "none"}`;

  if (!provider?.configured || knowledgeBundle.confidence < 0.2) {
    const reply = getFallbackReply({ message, languageStyle, intent });
    sourcesUsed.add("fallback");
    return {
      reply,
      conversationId,
      source: "fallback",
      mode: "fallback_safe",
      languageUsed,
      confidence: Math.max(knowledgeBundle.confidence, 0.18),
      degraded: true,
      entities,
      knowledge: knowledgeBundle.items,
      liveContext,
      sourcesUsed: Array.from(sourcesUsed),
      quickReplyContext: {
        intent,
        missingSlots,
        liveContext,
      },
    };
  }

  const systemPrompt = structuredPrompt({
    languageStyle,
    contextBlock,
    liveBlock,
    knowledgeBlock,
    entityBlock,
  });

  const providerResult = await provider.generateAnswer({
    systemPrompt,
    userMessage: message,
    history,
    language: languageUsed,
    context: { liveContext, entities, knowledge: knowledgeBundle.items },
  });

  if (!providerResult?.text) {
    const reply = getFallbackReply({ message, languageStyle, intent });
    sourcesUsed.add("fallback");
    return {
      reply,
      conversationId,
      source: "fallback",
      mode: "fallback_safe",
      languageUsed,
      confidence: Math.max(knowledgeBundle.confidence, 0.22),
      degraded: true,
      entities,
      knowledge: knowledgeBundle.items,
      liveContext,
      sourcesUsed: Array.from(sourcesUsed),
      quickReplyContext: {
        intent,
        missingSlots,
        liveContext,
      },
    };
  }

  const reply = postValidateReply({
    reply: providerResult.text,
    sourcesUsed: Array.from(sourcesUsed),
    confidence: knowledgeBundle.confidence,
  })
    ? providerResult.text
    : getFallbackReply({ message, languageStyle, intent });

  const degraded = reply !== providerResult.text;
  if (degraded) {
    sourcesUsed.add("fallback");
  }

  return {
    reply,
    conversationId,
    source: degraded ? "fallback" : "llm",
    mode: degraded ? "fallback_safe" : "grounded_llm",
    languageUsed,
    confidence: Number(Math.min(Math.max(knowledgeBundle.confidence, 0.25), 0.92).toFixed(2)),
    degraded,
    entities,
    knowledge: knowledgeBundle.items,
    liveContext,
    sourcesUsed: Array.from(sourcesUsed),
    quickReplyContext: {
      intent,
      missingSlots,
      liveContext,
    },
  };
};

export default {
  buildChatResponse,
};
