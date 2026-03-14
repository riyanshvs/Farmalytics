const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
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
    sendOTP: async (phone: string) => {
      try {
        const res = await fetch(`${API_URL}/auth/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });

        const data = await res.json();
        return {
          success: !!data?.success,
          message: data?.message || (res.ok ? "OTP sent successfully" : "Failed to send OTP"),
          otp: data?.otp,
        };
      } catch (error) {
        console.error("OTP send error:", error);
        return {
          success: false,
          message: "Failed to send OTP",
        };
      }
    },

    verifyOTP: async (phone: string, otp: string) => {
      try {
        const res = await fetch(`${API_URL}/auth/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp }),
        });

        const data = await res.json();
        if (!res.ok || !data?.success) {
          return {
            success: false,
            message: data?.message || "Verification failed",
          };
        }

        return {
          success: true,
          message: data?.message || "Login successful",
          token: data.token,
          user: data.user,
        };
      } catch (error) {
        console.error("OTP verify error:", error);
        return {
          success: false,
          message: "Verification failed",
        };
      }
    },

    getProfile: async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { ...getAuthHeaders() },
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data?.message || "Failed to get profile" };
        }

        return { success: true, user: data.user };
      } catch (error) {
        return { success: false, message: "Failed to get profile" };
      }
    },

    updateProfile: async (data: { name?: string; language?: string }) => {
      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
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
      } catch (error) {
        return { success: false, message: "Failed to update profile" };
      }
    },
  },

  farm: {
    get: async () => {
      const res = await fetch(`${API_URL}/farm`, {
        headers: { ...getAuthHeaders() },
      });
      return res.json();
    },

    save: async (data: {
      location?: { state: string; district: string };
      farmSize?: number;
      selectedCrops?: string[];
      distributions?: { name: string; area: number }[];
    }) => {
      const res = await fetch(`${API_URL}/farm`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
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
          const res = await fetch(`${API_URL}/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
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
      const res = await fetch(`${API_URL}/chat/history?conversationId=${encodeURIComponent(conversationId)}`, {
        headers: { ...getAuthHeaders() },
      });

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
        const res = await fetch(`${API_URL}/chat/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
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

export const AUTH_TOKEN_KEY = "token";
export const USER_DATA_KEY = "userData";

type AuthUser = Record<string, unknown>;

export const setAuth = (token: string, user: AuthUser) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
};

export const getAuth = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const userStr = localStorage.getItem(USER_DATA_KEY);
  const user = userStr ? JSON.parse(userStr) : null;
  return { token, user };
};
