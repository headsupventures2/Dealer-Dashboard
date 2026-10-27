import { demoStore } from "./demo";
import { previewStore } from "./preview";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const baseStore = isSupabaseConfigured ? supabaseStore : previewStore;

// Demo mode swaps in the in-browser demo store, even when Supabase is live.
const DEMO_FLAG = "led-demo";

export function isDemo() {
  try {
    return localStorage.getItem(DEMO_FLAG) === "1";
  } catch {
    return false;
  }
}

export function setDemo(on: boolean) {
  try {
    if (on) localStorage.setItem(DEMO_FLAG, "1");
    else localStorage.removeItem(DEMO_FLAG);
  } catch {}
}

/** Every call goes to whichever store is active right now (demo or the real one). */
export const store: Store = new Proxy({} as Store, {
  get(_, key: keyof Store) {
    const active = isDemo() ? demoStore : baseStore;
    const value = active[key];
    return typeof value === "function" ? value.bind(active) : value;
  },
});
