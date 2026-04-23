export const queryKeys = {
  profile: ["profile"] as const,
  farm: ["farm"] as const,
  weatherSummary: (params?: Record<string, unknown>) => ["weatherSummary", params || {}] as const,
  market: (params?: Record<string, unknown>) => ["market", params || {}] as const,
  alerts: (params?: Record<string, unknown>) => ["alerts", params || {}] as const,
  news: (params?: Record<string, unknown>) => ["news", params || {}] as const,
  chatHistory: (conversationId: string) => ["chatHistory", conversationId] as const,
};

export default queryKeys;
