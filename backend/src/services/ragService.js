import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const knowledgeBaseDir = path.join(__dirname, "..", "data", "kb");
const legacyKnowledgeBasePath = path.join(__dirname, "..", "data", "agriKnowledge.json");

const loadKnowledgeBase = () => {
  if (fs.existsSync(knowledgeBaseDir)) {
    const files = fs
      .readdirSync(knowledgeBaseDir)
      .filter((name) => /^\d{2}_.+\.json$/i.test(name))
      .sort();

    if (files.length) {
      return files.flatMap((name) => {
        const filePath = path.join(knowledgeBaseDir, name);
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      });
    }
  }

  if (fs.existsSync(legacyKnowledgeBasePath)) {
    return JSON.parse(fs.readFileSync(legacyKnowledgeBasePath, "utf-8"));
  }

  return [];
};

const knowledgeBase = loadKnowledgeBase();

const EMBEDDING_MODEL = process.env.RAG_EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2";
const HF_ROUTER_BASE_URL = process.env.HF_ROUTER_BASE_URL || "https://router.huggingface.co/hf-inference/models";
const EMBEDDING_ENDPOINT_URL = `${HF_ROUTER_BASE_URL}/${EMBEDDING_MODEL}`;

const SYNONYM_MAP = new Map([
  ["paddy", "rice"],
  ["dhan", "rice"],
  ["gehun", "wheat"],
  ["sarso", "mustard"],
  ["khaad", "fertilizer"],
  ["mandi", "market"],
  ["bhav", "price"],
]);

const normalizeSynonyms = (text = "") => {
  let normalized = String(text).toLowerCase();
  for (const [from, to] of SYNONYM_MAP.entries()) {
    normalized = normalized.replaceAll(from, to);
  }
  return normalized;
};

const normalizeText = (text = "") => normalizeSynonyms(text).normalize("NFKC").trim();

const tokenize = (text = "") =>
  normalizeText(text)
    .replace(/[^a-z0-9\u0900-\u097f\s]/gi, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);

const scoreDocument = (queryTokens, docTokens) => {
  if (!queryTokens.length || !docTokens.length) return 0;
  const freq = new Map();
  for (const token of docTokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }

  let score = 0;
  for (const queryToken of queryTokens) {
    score += freq.get(queryToken) || 0;
  }
  return score;
};

const toIndexPayload = (entry) => {
  const title = `${entry.title || ""} ${entry.titleHi || ""}`;
  const queryText = `${entry.farmer_query || ""} ${entry.farmer_query_en || ""}`;
  const content = `${entry.content || ""} ${entry.contentHi || ""}`;
  const tags = `${(entry.tags || []).join(" ")}`;
  const metadata = `${entry.category || ""} ${entry.crop_id || ""} ${entry.stage || ""} ${entry.region || ""} ${entry.season || ""}`;

  return {
    indexText: `${title} ${queryText} ${content} ${tags} ${metadata}`,
    normalizedTitle: normalizeText(title),
    normalizedQueryText: normalizeText(queryText),
    titleTokens: tokenize(title),
    queryTokens: tokenize(queryText),
    contentTokens: tokenize(content),
    tagTokens: tokenize(tags),
    metadataTokens: tokenize(metadata),
  };
};

const scoreLexical = (queryTokens, normalizedQuery, doc) => {
  const titleScore = scoreDocument(queryTokens, doc.titleTokens) * 3.5;
  const queryScore = scoreDocument(queryTokens, doc.queryTokens) * 4.5;
  const contentScore = scoreDocument(queryTokens, doc.contentTokens) * 1;
  const tagScore = scoreDocument(queryTokens, doc.tagTokens) * 2;
  const metadataScore = scoreDocument(queryTokens, doc.metadataTokens) * 1.5;

  let exactBoost = 0;
  if (normalizedQuery) {
    if (doc.normalizedQueryText.includes(normalizedQuery)) exactBoost += 16;
    if (doc.normalizedTitle.includes(normalizedQuery)) exactBoost += 8;
  }

  return titleScore + queryScore + contentScore + tagScore + metadataScore + exactBoost;
};

let cachedIndex = knowledgeBase.map((entry) => ({
  ...entry,
  ...toIndexPayload(entry),
}));

let embeddingState = {
  ready: false,
  failed: false,
  vectors: new Map(),
};

const toVector = (embeddingResult) => {
  if (!embeddingResult) return null;

  if (Array.isArray(embeddingResult) && typeof embeddingResult[0] === "number") {
    return embeddingResult;
  }

  if (Array.isArray(embeddingResult) && Array.isArray(embeddingResult[0])) {
    const matrix = embeddingResult;
    const dims = matrix[0].length;
    const avg = new Array(dims).fill(0);

    for (const row of matrix) {
      for (let i = 0; i < dims; i += 1) {
        avg[i] += row[i] || 0;
      }
    }

    for (let i = 0; i < dims; i += 1) {
      avg[i] /= Math.max(matrix.length, 1);
    }

    return avg;
  }

  return null;
};

const cosineSimilarity = (a = [], b = []) => {
  if (!a.length || !b.length || a.length !== b.length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

const fetchEmbedding = async (hf, text) => {
  if (!hf) return null;

  try {
    const result = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      endpointUrl: EMBEDDING_ENDPOINT_URL,
      inputs: text.slice(0, 1200),
    });
    return toVector(result);
  } catch {
    return null;
  }
};

const warmEmbeddingIndex = async (hf) => {
  if (!hf || embeddingState.ready || embeddingState.failed) return;

  for (const item of cachedIndex) {
    const vector = await fetchEmbedding(hf, item.indexText);
    if (!vector) {
      embeddingState.failed = true;
      embeddingState.vectors.clear();
      return;
    }
    embeddingState.vectors.set(item.id, vector);
  }

  embeddingState.ready = true;
};

export const rebuildKnowledgeIndex = () => {
  cachedIndex = knowledgeBase.map((entry) => ({
    ...entry,
    ...toIndexPayload(entry),
  }));
  embeddingState = { ready: false, failed: false, vectors: new Map() };
  return cachedIndex.length;
};

export const retrieveRelevantKnowledge = async ({ query, topK = 3, hf = null }) => {
  const queryTokens = tokenize(query);
  const normalizedQuery = normalizeText(query);
  let queryVector = null;
  let useSemantic = false;

  if (hf) {
    await warmEmbeddingIndex(hf);
    if (embeddingState.ready) {
      queryVector = await fetchEmbedding(hf, query);
      useSemantic = !!queryVector;
    }
  }

  const scored = cachedIndex
    .map((doc) => {
      const lexicalScore = scoreLexical(queryTokens, normalizedQuery, doc);
      let semanticScore = 0;

      if (useSemantic) {
        const docVector = embeddingState.vectors.get(doc.id);
        semanticScore = docVector ? cosineSimilarity(queryVector, docVector) : 0;
      }

      const score = useSemantic ? semanticScore * 0.75 + lexicalScore * 0.25 : lexicalScore;
      return {
        ...doc,
        score,
      };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.id || "").localeCompare(b.id || "");
    })
    .slice(0, topK)
    .map(
      ({
        indexText,
        normalizedTitle,
        normalizedQueryText,
        titleTokens,
        queryTokens: docQueryTokens,
        contentTokens,
        tagTokens,
        metadataTokens,
        ...doc
      }) => doc
    );

  return scored;
};

const intentToCategories = {
  crop_advice: new Set(["crop_management", "irrigation", "soil_health"]),
  pest_disease: new Set(["pest_disease"]),
  fertilizer: new Set(["soil_health", "irrigation"]),
  irrigation: new Set(["irrigation", "soil_health", "crop_management"]),
  weather: new Set(["irrigation", "crop_management"]),
  market: new Set(["market", "post_harvest"]),
  government: new Set(["government_schemes"]),
  general: null,
};

const languageBoost = (doc, languageStyle) => {
  if (languageStyle === "english" && doc.content) return 0.08;
  if (languageStyle !== "english" && doc.contentHi) return 0.08;
  return 0;
};

const entityBoost = (doc, entities = {}) => {
  let score = 0;

  if (entities?.crops?.length && entities.crops.includes(doc.crop_id)) {
    score += 0.2;
  }

  if (entities?.topics?.length && entities.topics.some((topic) => String(doc.category || "").includes(topic))) {
    score += 0.12;
  }

  if (doc.confidence === "high") score += 0.08;
  if (doc.confidence === "medium") score += 0.04;

  return score;
};

export const retrieveIntentAwareKnowledge = async ({
  query,
  entities,
  intent = "general",
  languageStyle = "hindi",
  topK = 4,
  hf = null,
}) => {
  const raw = await retrieveRelevantKnowledge({ query, topK: 12, hf });
  const allowedCategories = intentToCategories[intent] || null;

  const filtered = raw
    .filter((item) => !allowedCategories || allowedCategories.has(item.category))
    .map((item) => ({
      ...item,
      adjustedScore: item.score + entityBoost(item, entities) + languageBoost(item, languageStyle),
    }))
    .sort((left, right) => right.adjustedScore - left.adjustedScore)
    .slice(0, topK);

  const normalizedConfidence =
    filtered.length === 0
      ? 0
      : Number(
          Math.min(
            0.95,
            filtered.reduce((sum, item) => sum + Math.min(item.adjustedScore / 20, 0.35), 0) +
              Math.min(filtered.length * 0.1, 0.3)
          ).toFixed(2)
        );

  return {
    items: filtered,
    confidence: normalizedConfidence,
  };
};

export default {
  rebuildKnowledgeIndex,
  retrieveRelevantKnowledge,
  retrieveIntentAwareKnowledge,
};
