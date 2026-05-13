export type PatrolStatus = "IN_PROGRESS" | "COMPLETED" | "MISSED";

export type ScanPoint = {
  point_id?: string;
  point_name?: string;
  scanned_at?: string;
  status?: string;
  [key: string]: unknown;
};

export type PatrolRecord = {
  record_id?: string;
  society_id: string;
  society?: string;
  date_key: string;
  hour_start: string;
  hour_window?: string;
  guard_id: string;
  guard_name: string;
  status: PatrolStatus;
  completed_count: number;
  total_points: number;
  points_scanned?: string[] | null;
  scans?: ScanPoint[] | Record<string, unknown> | string | null;
  updated_at?: string | null;
};

export type DataMode = "demo" | "supabase";

export type LoadState =
  | { status: "idle" | "loading"; message?: string }
  | { status: "success"; message?: string }
  | { status: "error"; message: string };

export type DashboardConfig = {
  tableName: string;
  societyId: string;
  timezone: string;
  ownerPassword: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};
