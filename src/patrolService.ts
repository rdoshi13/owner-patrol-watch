import { createClient } from "@supabase/supabase-js";
import { config, isSupabaseConfigured } from "./config";
import type { PatrolRecord } from "./types";

const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

type FetchPatrolsResult = {
  records: PatrolRecord[];
};

export async function fetchPatrolRecords(dateKey: string): Promise<FetchPatrolsResult> {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_SUPABASE_SOCIETY_ID, then restart the app.",
    );
  }

  const { data, error } = await supabase
    .from(config.tableName)
    .select("*")
    .eq("society_id", config.societyId)
    .eq("date_key", dateKey)
    .order("hour_start", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    records: (data ?? []) as PatrolRecord[],
  };
}
