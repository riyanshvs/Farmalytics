import { otpService } from "./otpService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  auth: {
    sendOTP: async (phone: string) => {
      try {
        // Use OTP service for demo/development
        const result = await otpService.sendOTP(phone);
        
        if (result.success) {
          return {
            success: true,
            message: result.message,
            otp: result.otp, // For testing
          };
        }
        return {
          success: false,
          message: result.message,
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
        // Verify with OTP service first
        const verification = await otpService.verifyOTP(phone, otp);
        
        if (!verification.success) {
          return {
            success: false,
            message: verification.message,
          };
        }

        // Generate mock token (in production, backend would issue real JWT)
        const token = btoa(`${phone}-${Date.now()}`);
        const user = {
          id: `user-${phone}`,
          phone,
          language: localStorage.getItem("preferredLanguage") || "en",
        };

        return {
          success: true,
          message: "Login successful",
          token,
          user,
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
        const { user } = getAuth();
        if (!user) {
          return { success: false, message: "Not authenticated" };
        }
        return { success: true, user };
      } catch (error) {
        return { success: false, message: "Failed to get profile" };
      }
    },

    updateProfile: async (data: { name?: string; language?: string }) => {
      try {
        const { user: currentUser } = getAuth();
        if (!currentUser) {
          return { success: false, message: "Not authenticated" };
        }

        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));

        if (data.language) {
          localStorage.setItem("preferredLanguage", data.language);
        }

        return { success: true, user: updatedUser };
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
