import { firebaseAuth } from "@/lib/firebase";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim();
const API_TIMEOUT_MS = 10000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getIdToken = async (): Promise<string | null> => {
  const user = firebaseAuth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken(true);
  } catch {
    return null;
  }
};

const buildAuthHeaders = async (headers?: HeadersInit): Promise<Headers> => {
  const merged = new Headers(headers || {});
  const token = await getIdToken();
  if (token) {
    merged.set("Authorization", `Bearer ${token}`);
  }
  return merged;
};

const authFetch = async (url: string, init?: RequestInit) => {
  const headers = await buildAuthHeaders(init?.headers);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    return await fetch(url, {
    ...init,
    headers,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
};

const parseJsonSafe = async <T>(res: Response): Promise<T | null> => {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

const fetchJsonOrThrow = async <T>(url: string, init?: RequestInit, fallbackMessage = "Request failed"): Promise<T> => {
  const res = await authFetch(url, init);
  const data = await parseJsonSafe<{ message?: string } & T>(res);
  if (!res.ok) {
    throw new Error(data?.message || `${fallbackMessage} (${res.status})`);
  }
  return (data || ({} as T)) as T;
};

const getChatFallbackReply = (message: string, language: string) => {
  const input = message.toLowerCase();
  const isEnglish = language === "en";
  const hasAny = (keywords: string[]) => keywords.some((k) => input.includes(k));

  if (hasAny(["soil", "rabi", "मिट्टी", "रबी"])) {
    return isEnglish
      ? "For most rabi crops, well-drained loamy to clay-loam soil with pH 6.0-7.5 works best. Add compost before sowing and avoid waterlogging."
      : "Rabi fasal ke liye achhi drainage wali loamy ya clay-loam mitti (pH 6.0-7.5) best hoti hai. Bowaai se pehle compost daalein aur pani jama na hone dein.";
  }

  if (hasAny(["fertilizer", "fertiliser", "urea", "dap", "npk", "खाद", "khaad"])) {
    return isEnglish
      ? "Use soil-test based fertilizer planning, split nitrogen doses, and avoid overuse of urea. Share crop + stage for a better dose plan."
      : "Soil test ke hisab se khaad dein, nitrogen split dose me dein, aur urea ka atiyadhik upyog na karein. Crop + stage batayein to behtar plan dunga.";
  }

  if (hasAny(["pest", "aphid", "whitefly", "thrips", "disease", "कीट", "रोग"])) {
    return isEnglish
      ? "For pest issues, use IPM: regular scouting, remove infected parts, and spray only recommended products as per label/local advisory."
      : "Keet/rog ke liye IPM use karein: niyamit nigrani, sankramit hisson ko hatayein, aur spray label/local salah ke anusar karein.";
  }

  return isEnglish
    ? `Chat AI is temporarily offline. I received: "${message.slice(0, 80)}". Share crop, location, and stage for a practical farming suggestion.`
    : `Chat AI filhal offline hai. Maine yeh sawal liya: "${message.slice(0, 80)}". Crop, location aur stage batayein, main upyogi salah dunga.`;
};

export const api = {
  auth: {
    getProfile: async () => {
      const data = await fetchJsonOrThrow<{ user: Record<string, unknown> }>(
        `${API_URL}/auth/me`,
        undefined,
        "Failed to get profile"
      );
      return { user: data.user };
    },

    updateProfile: async (data: { name?: string; language?: string }) => {
      const result = await fetchJsonOrThrow<{ user?: Record<string, unknown> }>(
        `${API_URL}/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
        "Failed to update profile"
      );

      if (result?.user) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(result.user));
      }

      return { user: result.user };
    },

    logout: async () => {
      await fetchJsonOrThrow<{ success?: boolean }>(
        `${API_URL}/auth/logout`,
        {
          method: "POST",
        },
        "Failed to logout"
      );
      return { success: true };
    },
  },

  farm: {
    get: async () => {
      const res = await authFetch(`${API_URL}/farm`);
      if (!res.ok) {
        throw new Error(`Failed to fetch farm data (${res.status})`);
      }
      return res.json();
    },

    save: async (data: {
      location?: { state: string; district: string };
      farmSize?: number;
      selectedCrops?: string[];
      distributions?: { name: string; area: number }[];
    }) => {
      const res = await authFetch(`${API_URL}/farm`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Failed to save farm data (${res.status})`);
      }

      return res.json();
    },
  },

  weather: {
    getSummary: async (params?: { lat?: number; lon?: number; state?: string; district?: string }) => {
      const query = new URLSearchParams();
      if (params?.lat !== undefined) query.set("lat", String(params.lat));
      if (params?.lon !== undefined) query.set("lon", String(params.lon));
      if (params?.state) query.set("state", params.state);
      if (params?.district) query.set("district", params.district);

      const suffix = query.toString() ? `?${query.toString()}` : "";
      return fetchJsonOrThrow(`${API_URL}/weather/summary${suffix}`, undefined, "Failed to load weather summary");
    },
  },

  market: {
    getAll: async (params?: { state?: string; district?: string; crops?: string[]; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.state) query.set("state", params.state);
      if (params?.district) query.set("district", params.district);
      if (Array.isArray(params?.crops) && params.crops.length > 0) query.set("crops", params.crops.join(","));
      if (params?.limit !== undefined) query.set("limit", String(params.limit));

      const suffix = query.toString() ? `?${query.toString()}` : "";
      return fetchJsonOrThrow(`${API_URL}/market${suffix}`, undefined, "Failed to load market prices");
    },
  },

  alerts: {
    getAll: async (params?: { lat?: number; lon?: number; state?: string; district?: string }) => {
      const query = new URLSearchParams();
      if (params?.lat !== undefined) query.set("lat", String(params.lat));
      if (params?.lon !== undefined) query.set("lon", String(params.lon));
      if (params?.state) query.set("state", params.state);
      if (params?.district) query.set("district", params.district);

      const suffix = query.toString() ? `?${query.toString()}` : "";
      return fetchJsonOrThrow(`${API_URL}/alerts${suffix}`, undefined, "Failed to load alerts");
    },

    markRead: async (alertId: number) => {
      return fetchJsonOrThrow(
        `${API_URL}/alerts/read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ alertId }),
        },
        "Failed to mark alert as read"
      );
    },

    dismiss: async (alertId: number) => {
      return fetchJsonOrThrow(
        `${API_URL}/alerts/dismiss`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ alertId }),
        },
        "Failed to dismiss alert"
      );
    },

    resetState: async () => {
      return fetchJsonOrThrow(
        `${API_URL}/alerts/reset`,
        {
          method: "POST",
        },
        "Failed to reset alert state"
      );
    },
  },

  news: {
    getAll: async (params?: {
      language?: "en" | "hi";
      category?: "all" | "weather" | "market_update" | "technology" | "success_story" | "policy";
      priority?: "all" | "critical" | "high" | "medium" | "low";
      state?: string;
      district?: string;
      limit?: number;
      offset?: number;
      forceRefresh?: boolean;
    }) => {
      const query = new URLSearchParams();
      if (params?.language) query.set("language", params.language);
      if (params?.category) query.set("category", params.category);
      if (params?.priority) query.set("priority", params.priority);
      if (params?.state) query.set("state", params.state);
      if (params?.district) query.set("district", params.district);
      if (params?.limit !== undefined) query.set("limit", String(params.limit));
      if (params?.offset !== undefined) query.set("offset", String(params.offset));
      if (params?.forceRefresh) query.set("forceRefresh", "true");

      const suffix = query.toString() ? `?${query.toString()}` : "";
      return fetchJsonOrThrow(`${API_URL}/news${suffix}`, undefined, "Failed to load news feed");
    },
  },

  chat: {
    send: async (message: string, language: string = "hi", conversationId?: string) => {
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const res = await authFetch(`${API_URL}/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message, language, conversationId }),
          });

          if (!res.ok) {
            throw new Error(`Chat request failed (${res.status})`);
          }

          const data = await res.json();
          if (data?.reply) return data;
        } catch (error) {
          if (attempt < maxAttempts) {
            await sleep(300 * attempt);
            continue;
          }
          console.error("Chat API unavailable, using fallback response:", error);
        }
      }

      return {
        reply: getChatFallbackReply(message, language),
        source: "frontend-fallback",
        mode: "fallback_safe",
        languageUsed: language,
        confidence: 0,
        sourcesUsed: ["fallback"],
        degraded: true,
        recommendations: [],
        quickReplies: [],
      };
    },

    getHistory: async (conversationId: string) => {
      const res = await authFetch(
        `${API_URL}/chat/history?conversationId=${encodeURIComponent(conversationId)}`
      );

      if (!res.ok) {
        throw new Error("Failed to load chat history");
      }

      const data = await res.json();
      return data?.messages || [];
    },

    submitFeedback: async (payload: {
      conversationId: string;
      messageId: string;
      helpful: boolean;
      comment?: string;
      mode?: string;
      confidence?: number;
      sourcesUsed?: string[];
    }) => {
      const result = await fetchJsonOrThrow<{ success?: boolean }>(
        `${API_URL}/chat/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        "Failed to submit chat feedback"
      );
      return result;
    },
  },
};

export const USER_DATA_KEY = "userData";

type AuthUser = Record<string, unknown>;

export const setAuth = (user: AuthUser) => {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(USER_DATA_KEY);
};

export const getAuth = () => {
  const userStr = localStorage.getItem(USER_DATA_KEY);
  if (!userStr) {
    return { user: null };
  }

  try {
    return { user: JSON.parse(userStr) };
  } catch {
    return { user: null };
  }
};
