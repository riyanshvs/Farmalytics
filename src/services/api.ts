const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  auth: {
    sendOTP: async (phone: string) => {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      return res.json();
    },

    verifyOTP: async (phone: string, otp: string) => {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      return res.json();
    },

    getProfile: async () => {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { ...getAuthHeaders() },
      });
      return res.json();
    },

    updateProfile: async (data: { name?: string; language?: string }) => {
      const res = await fetch(`${API_URL}/auth/profile`, {
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
    send: async (message: string, language: string = "hi") => {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, language }),
      });
      return res.json();
    },
  },
};

export const AUTH_TOKEN_KEY = "token";
export const USER_DATA_KEY = "userData";

export const setAuth = (token: string, user: any) => {
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
