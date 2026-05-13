# owner-patrol-watch

Owner/admin app for monitoring guard patrol QR completion.

## Purpose

This app reads patrol records from Supabase and shows whether hourly guard patrol scans are complete.

The guard-facing scanner app writes records to Supabase. This owner app is read-only for patrol monitoring.

## Data Source

Supabase table:

```txt
patrol_hour_records
```

Important columns:

- `society_id`
- `society`
- `date_key`
- `hour_start`
- `hour_window`
- `guard_id`
- `guard_name`
- `status`
- `completed_count`
- `total_points`
- `points_scanned`
- `scans`
- `updated_at`

## MVP Features

- Show today’s patrol status.
- Show current hour progress, e.g. `7 / 10`.
- Show status: `IN_PROGRESS`, `COMPLETED`, or `MISSED`.
- Filter by date.
- Filter by guard.
- Show scanned point details from `scans`.
- Auto-refresh or realtime updates from Supabase.

## Suggested Stack

- React + Vite or Next.js
- Supabase JS client
- Web-first dashboard

## Environment

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_PATROL_TABLE=patrol_hour_records
```

For Next.js, use `NEXT_PUBLIC_` instead of `VITE_`.

## Basic Query

```ts
const { data, error } = await supabase
  .from("patrol_hour_records")
  .select("*")
  .eq("society_id", "vihav_trade_center")
  .eq("date_key", todayDateKey)
  .order("hour_start", { ascending: false });
```

## Notes

- The scanner app creates deterministic `record_id` values using society, date, hour, and guard ID.
- The owner app should not create or update patrol rows in the MVP.
- Supabase RLS is currently MVP-friendly. Tighten policies before production.
