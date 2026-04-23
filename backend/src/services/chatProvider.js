import { HfInference } from "@huggingface/inference";

const HF_ROUTER_BASE_URL = process.env.HF_ROUTER_BASE_URL || "https://router.huggingface.co/hf-inference/models";
const CHAT_MODEL = process.env.HF_CHAT_MODEL || "Qwen/Qwen2.5-7B-Instruct";
const CHAT_TIMEOUT_MS = Number(process.env.HF_CHAT_TIMEOUT_MS || 18000);
const CHAT_MAX_TOKENS = Number(process.env.HF_CHAT_MAX_TOKENS || 500);
const CHAT_RETRY_COUNT = Number(process.env.HF_CHAT_RETRY_COUNT || 2);

const raceWithTimeout = async (promise, timeoutMs) => {
  let timeoutId;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("hf_timeout")), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const createHuggingFaceChatProvider = () => {
  const token = String(process.env.HUGGING_FACE_API_KEY || "").trim();
  const configured = Boolean(token);
  const endpointUrl = `${HF_ROUTER_BASE_URL}/${CHAT_MODEL}`;
  const client = configured ? new HfInference(token) : null;

  return {
    provider: "huggingface",
    model: CHAT_MODEL,
    configured,
    unavailableReason: configured ? null : "missing_api_key",
    async generateAnswer({ systemPrompt, userMessage, history = [] }) {
      if (!client) {
        return {
          text: "",
          provider: "huggingface",
          model: CHAT_MODEL,
          finishReason: "unavailable",
          latencyMs: 0,
          degraded: true,
          unavailableReason: "missing_api_key",
        };
      }

      let lastError = null;

      for (let attempt = 0; attempt <= CHAT_RETRY_COUNT; attempt += 1) {
        const startedAt = Date.now();

        try {
          const result = await raceWithTimeout(
            client.chatCompletion({
              model: CHAT_MODEL,
              endpointUrl,
              messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: userMessage },
              ],
              max_tokens: CHAT_MAX_TOKENS,
            }),
            CHAT_TIMEOUT_MS
          );

          return {
            text: result?.choices?.[0]?.message?.content || "",
            provider: "huggingface",
            model: CHAT_MODEL,
            finishReason: result?.choices?.[0]?.finish_reason || "stop",
            latencyMs: Date.now() - startedAt,
            degraded: false,
            unavailableReason: null,
          };
        } catch (error) {
          lastError = error;
        }
      }

      return {
        text: "",
        provider: "huggingface",
        model: CHAT_MODEL,
        finishReason: "error",
        latencyMs: 0,
        degraded: true,
        unavailableReason: lastError?.message || "hf_error",
      };
    },
  };
};

export default {
  createHuggingFaceChatProvider,
};
