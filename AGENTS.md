# AGENTS.md

Repository-specific guidance for coding agents working in `owner-patrol-watch`.

## Project Purpose

- Build an owner/admin-facing web dashboard for monitoring guard patrol QR completion.
- Treat the guard-facing React Native app as the writer of patrol records.
- This owner app should read patrol data from Supabase and display monitoring state; do not create or update patrol rows in the MVP.

## Data Model

- Primary Supabase table: `patrol_hour_records`.
- Important fields include `society_id`, `society`, `date_key`, `hour_start`, `hour_window`, `guard_id`, `guard_name`, `status`, `completed_count`, `total_points`, `points_scanned`, `scans`, and `updated_at`.
- Preserve status semantics from the data source: `IN_PROGRESS`, `COMPLETED`, and `MISSED`.
- The scanner app creates deterministic `record_id` values from society, date, hour, and guard ID; avoid changing that contract from this repo.

## Expected Product Behavior

- Prioritize a web-first dashboard for patrol monitoring.
- Core views should show today's patrol status, current hour progress such as `7 / 10`, guard/date filters, scanned point details from `scans`, and auto-refresh or Supabase realtime updates.
- Keep the owner experience read-only unless the task explicitly changes product scope.
- Design for quick operational scanning: clear statuses, dense but readable tables/lists, and obvious stale or missing patrol signals.

## Stack Guidance

- The README suggests React + Vite or Next.js with the Supabase JS client; follow whichever stack is already present once the app is scaffolded.
- Use the repo's existing scripts, routing, styling, and component conventions after they exist.
- Environment variables should follow the chosen framework:
  - Vite: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_PATROL_TABLE`.
  - Next.js: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PATROL_TABLE`.
- Do not hard-code Supabase credentials, society IDs, or production-only values.

## Engineering Rules

- Prefer simple, maintainable solutions over complex abstractions.
- Make the smallest change that fully solves the task.
- Preserve existing architecture, style, and conventions.
- Avoid unrelated refactors and avoid new dependencies unless clearly justified.
- Use descriptive names and keep functions/components focused.
- When external library or SDK behavior is uncertain, verify it from authoritative docs, preferably with `context7` when available.

## Workflow

1. Inspect relevant files before editing.
2. State a brief implementation approach before substantial changes.
3. Implement the minimal correct fix or feature.
4. Add or update tests when behavior changes.
5. Run the narrowest useful validation first, then broaden when needed.
6. Summarize what changed, why, and any assumptions or risks.

## Testing And Validation

- No project test/build commands exist yet. Once scripts are added, prefer the local package manager and repo-defined commands.
- For UI work, verify the dashboard renders and core patrol data states are visible.
- For Supabase logic, cover loading, empty, error, filtered, and realtime or refresh states when feasible.
- If validation cannot be run, state that clearly in the final response.
