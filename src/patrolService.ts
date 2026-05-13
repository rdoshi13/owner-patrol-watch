import { createClient } from "@supabase/supabase-js";
import { config, isSupabaseConfigured } from "./config";
import { getDemoPatrolRecords } from "./demoData";
import type { DataMode, PatrolRecord } from "./types";

const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

type FetchPatrolsResult = {
  mode: DataMode;
  records: PatrolRecord[];
};

export async function fetchPatrolRecords(dateKey: string): Promise<FetchPatrolsResult> {
  if (!supabase) {
    return {
      mode: "demo",
      records: getDemoPatrolRecords(dateKey, config.societyId),
    };
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
    mode: "supabase",
    records: (data ?? []) as PatrolRecord[],
  };
}
