import session from "express-session";
import memorystore from "memorystore";

const MemoryStore = memorystore(session);

// Create a single shared store instance
export const sessionStore = new MemoryStore({
  checkPeriod: 60 * 60 * 1000 // Prune expired entries every hour
});

// Helper function to get session from store
export const getSession = (sid: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    sessionStore.get(sid, (err, session) => {
      if (err) reject(err);
      else resolve(session);
    });
  });
};
