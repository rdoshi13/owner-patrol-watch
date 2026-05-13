import type { DashboardConfig } from "./types";

const env = import.meta.env;

export const config: DashboardConfig = {
  tableName: env.VITE_SUPABASE_PATROL_TABLE || "patrol_hour_records",
  societyId: env.VITE_SUPABASE_SOCIETY_ID || "vihav_trade_center",
  timezone: env.VITE_SOCIETY_TIMEZONE || "Asia/Kolkata",
  ownerPassword: env.VITE_OWNER_PASSWORD || "",
  supabaseUrl: env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || "",
};

export const isSupabaseConfigured = Boolean(
  config.supabaseUrl && config.supabaseAnonKey,
);
