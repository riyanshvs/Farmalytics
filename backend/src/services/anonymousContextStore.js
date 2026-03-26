const store = new Map();
const TTL_MS = 24 * 60 * 60 * 1000;

const prune = () => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now - value.updatedAt > TTL_MS) {
      store.delete(key);
    }
  }
};

export const getAnonymousContext = (conversationId) => {
  if (!conversationId) return null;
  prune();
  return store.get(conversationId) || null;
};

export const updateAnonymousContext = (conversationId, entities = {}) => {
  if (!conversationId) return;

  const current = store.get(conversationId) || {
    crops: [],
    locations: [],
    topics: [],
    dates: [],
    updatedAt: Date.now(),
  };

  const next = {
    crops: Array.from(new Set([...(current.crops || []), ...(entities.crops || [])])),
    locations: Array.from(new Set([...(current.locations || []), ...(entities.locations || [])])),
    topics: Array.from(new Set([...(current.topics || []), ...(entities.topics || [])])),
    dates: Array.from(new Set([...(current.dates || []), ...(entities.dates || [])])),
    updatedAt: Date.now(),
  };

  store.set(conversationId, next);
};

export default {
  getAnonymousContext,
  updateAnonymousContext,
};
