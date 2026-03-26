import { firebaseAuth } from "@/lib/firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getIdToken = async (): Promise<string | null> => {
  const user = firebaseAuth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken();
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
  return fetch(url, {
    ...init,
    headers,
  });
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
      try {
        const res = await authFetch(`${API_URL}/auth/me`);
        const data = await res.json();

        if (!res.ok) {
          return { success: false, message: data?.message || "Failed to get profile" };
        }

        return { success: true, user: data.user };
      } catch {
        return { success: false, message: "Failed to get profile" };
      }
    },

    updateProfile: async (data: { name?: string; language?: string }) => {
      try {
        const res = await authFetch(`${API_URL}/auth/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await res.json();
        if (!res.ok) {
          return { success: false, message: result?.message || "Failed to update profile" };
        }

        if (result?.user) {
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(result.user));
        }

        return { success: true, user: result.user };
      } catch {
        return { success: false, message: "Failed to update profile" };
      }
    },

    logout: async () => {
      try {
        const res = await authFetch(`${API_URL}/auth/logout`, {
          method: "POST",
        });

        const data = await res.json();
        return { success: !!data?.success };
      } catch {
        return { success: false };
      }
    },
  },

  farm: {
    get: async () => {
      const res = await authFetch(`${API_URL}/farm`);
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
      return res.json();
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
    }) => {
      try {
        const res = await authFetch(`${API_URL}/chat/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        return res.json();
      } catch {
        return { success: false };
      }
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
