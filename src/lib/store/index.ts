import { previewStore } from "./preview";
import { supabaseStore } from "./supabase";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const store = isSupabaseConfigured ? supabaseStore : previewStore;
