import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const knowledgeBasePath = path.join(__dirname, "..", "data", "agriKnowledge.json");
const knowledgeBase = JSON.parse(fs.readFileSync(knowledgeBasePath, "utf-8"));

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

const tokenize = (text = "") =>
  normalizeSynonyms(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

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

const toIndexText = (entry) =>
  `${entry.title || ""} ${entry.titleHi || ""} ${entry.content || ""} ${entry.contentHi || ""} ${entry.category || ""} ${(entry.tags || []).join(" ")}`;

let cachedIndex = knowledgeBase.map((entry) => ({
  ...entry,
  indexText: toIndexText(entry),
  tokens: tokenize(toIndexText(entry)),
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
    indexText: toIndexText(entry),
    tokens: tokenize(toIndexText(entry)),
  }));
  embeddingState = { ready: false, failed: false, vectors: new Map() };
  return cachedIndex.length;
};

export const retrieveRelevantKnowledge = async ({ query, topK = 3, hf = null }) => {
  const queryTokens = tokenize(query);
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
      const lexicalScore = scoreDocument(queryTokens, doc.tokens);
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
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ tokens, indexText, ...doc }) => doc);

  return scored;
};

export default {
  rebuildKnowledgeIndex,
  retrieveRelevantKnowledge,
};
