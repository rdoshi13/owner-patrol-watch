import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  EyeOff,
  Filter,
  Lock,
  LogOut,
  RefreshCcw,
  UserRound,
  XCircle,
} from "lucide-react";
import { isUnlocked, lockSession, unlockSession } from "./auth";
import { config } from "./config";
import { fetchPatrolRecords } from "./patrolService";
import { formatDateTime, formatTimeOnly, getDateKeyForTimezone } from "./time";
import type {
  LoadState,
  PatrolRecord,
  PatrolStatus,
  ScanPoint,
} from "./types";

const REFRESH_INTERVAL_MS = 30_000;

const statusStyles: Record<PatrolStatus, string> = {
  COMPLETED: "bg-emerald-50 text-patrol-green ring-emerald-200",
  IN_PROGRESS: "bg-sky-50 text-patrol-blue ring-sky-200",
  MISSED: "bg-rose-50 text-patrol-red ring-rose-200",
};

const statusIcons: Record<PatrolStatus, typeof CheckCircle2> = {
  COMPLETED: CheckCircle2,
  IN_PROGRESS: Clock3,
  MISSED: XCircle,
};

function App() {
  const passwordRequired = Boolean(config.ownerPassword);
  const [unlocked, setUnlocked] = useState(
    () => !passwordRequired || isUnlocked(),
  );
  const [dateKey, setDateKey] = useState(() =>
    getDateKeyForTimezone(config.timezone),
  );
  const [guardFilter, setGuardFilter] = useState("all");
  const [records, setRecords] = useState<PatrolRecord[]>([]);
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadPatrols(showLoading = true) {
    if (showLoading) {
      setLoadState({ status: "loading" });
    }

    try {
      const result = await fetchPatrolRecords(dateKey);
      setRecords(result.records);
      setLastLoadedAt(new Date());
      setLoadState({ status: "success" });
    } catch (error) {
      setLoadState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load patrol records.",
      });
    }
  }

  useEffect(() => {
    if (!unlocked) {
      return;
    }

    void loadPatrols();
  }, [dateKey, unlocked]);

  useEffect(() => {
    if (!unlocked) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadPatrols(false);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [dateKey, unlocked]);

  const guards = useMemo(() => {
    const uniqueGuards = new Map<string, string>();
    records.forEach((record) =>
      uniqueGuards.set(record.guard_id, record.guard_name),
    );
    return Array.from(uniqueGuards, ([id, name]) => ({ id, name })).sort(
      (a, b) => a.name.localeCompare(b.name),
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (guardFilter === "all") {
      return records;
    }

    return records.filter((record) => record.guard_id === guardFilter);
  }, [guardFilter, records]);

  const summary = useMemo(() => {
    return {
      total: filteredRecords.length,
      completed: filteredRecords.filter(
        (record) => record.status === "COMPLETED",
      ).length,
      missed: filteredRecords.filter((record) => record.status === "MISSED")
        .length,
      active: filteredRecords.filter(
        (record) => record.status === "IN_PROGRESS",
      ).length,
    };
  }, [filteredRecords]);

  const currentPatrol =
    filteredRecords.find((record) => record.status === "IN_PROGRESS") ??
    filteredRecords[0];

  if (!unlocked) {
    return (
      <PasswordGate
        onUnlock={() => {
          unlockSession();
          setUnlocked(true);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-patrol-paper text-ink">
      <section className="border-b border-patrol-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <LogoLockup />
              <h1 className="mt-4 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
                Patrol monitoring dashboard
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void loadPatrols()}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-patrol-line bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Refresh
              </button>
              {passwordRequired ? (
                <button
                  type="button"
                  onClick={() => {
                    lockSession();
                    setUnlocked(false);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-patrol-line bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Lock
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Total hours" value={summary.total} icon={Clock3} />
            <Metric
              label="Completed"
              value={summary.completed}
              icon={CheckCircle2}
              tone="green"
            />
            <Metric
              label="In progress"
              value={summary.active}
              icon={Eye}
              tone="blue"
            />
            <Metric
              label="Missed"
              value={summary.missed}
              icon={AlertTriangle}
              tone="red"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-lg border border-patrol-line bg-white p-4 shadow-panel">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Filter
                  className="h-4 w-4 text-patrol-blue"
                  aria-hidden="true"
                />
                Filters
              </div>

              <label
                className="mt-4 block text-sm font-medium text-slate-700"
                htmlFor="date"
              >
                Patrol date
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-patrol-line bg-white px-3">
                <CalendarDays
                  className="h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="date"
                  type="date"
                  value={dateKey}
                  onChange={(event) => {
                    setDateKey(event.target.value);
                    setExpandedId(null);
                  }}
                  className="h-10 w-full bg-transparent text-sm font-medium outline-none"
                />
              </div>

              <label
                className="mt-4 block text-sm font-medium text-slate-700"
                htmlFor="guard"
              >
                Guard
              </label>
              <select
                id="guard"
                value={guardFilter}
                onChange={(event) => {
                  setGuardFilter(event.target.value);
                  setExpandedId(null);
                }}
                className="mt-2 h-10 w-full rounded-md border border-patrol-line bg-white px-3 text-sm font-medium outline-none transition focus:border-patrol-blue"
              >
                <option value="all">All guards</option>
                {guards.map((guard) => (
                  <option key={guard.id} value={guard.id}>
                    {guard.name}
                  </option>
                ))}
              </select>
            </div>

            <CurrentPatrol record={currentPatrol} />

            <div className="rounded-lg border border-patrol-line bg-white p-4 text-sm text-slate-600 shadow-panel">
              <p className="font-semibold text-ink">Data status</p>
              <p className="mt-2">
                Connected to Supabase with read-only dashboard queries.
              </p>
              {!passwordRequired ? (
                <p className="mt-3 rounded-md bg-amber-50 p-3 text-patrol-amber ring-1 ring-amber-200">
                  No owner password is configured. Add `VITE_OWNER_PASSWORD` in
                  Vercel for the MVP gate.
                </p>
              ) : null}
              <p className="mt-3">
                Last refresh:{" "}
                <span className="font-medium text-ink">
                  {lastLoadedAt
                    ? formatDateTime(
                        lastLoadedAt.toISOString(),
                        config.timezone,
                      )
                    : "Not yet"}
                </span>
              </p>
            </div>
          </aside>

          <section className="min-w-0 rounded-lg border border-patrol-line bg-white shadow-panel">
            <div className="flex flex-col justify-between gap-3 border-b border-patrol-line p-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  Hourly patrol records
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {filteredRecords.length} record
                  {filteredRecords.length === 1 ? "" : "s"} for {dateKey}
                </p>
              </div>
              <StatusMessage loadState={loadState} />
            </div>

            {loadState.status === "error" ? (
              <EmptyState
                icon={AlertTriangle}
                title="Unable to load patrol records"
                message={loadState.message}
              />
            ) : filteredRecords.length === 0 &&
              loadState.status !== "loading" ? (
              <EmptyState
                icon={Clock3}
                title="No patrol records found"
                message="Try another date or guard filter. The dashboard will keep refreshing every 30 seconds."
              />
            ) : (
              <div className="divide-y divide-patrol-line">
                {filteredRecords.map((record) => {
                  const rowId = getRecordId(record);
                  return (
                    <PatrolRow
                      key={rowId}
                      record={record}
                      expanded={expandedId === rowId}
                      onToggle={() =>
                        setExpandedId(expandedId === rowId ? null : rowId)
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function LogoLockup() {
  return (
    <div className="flex items-center gap-3" aria-label="Owner Patrol Watch">
      <svg
        className="h-11 w-11 shrink-0"
        viewBox="0 0 44 44"
        role="img"
        aria-hidden="true"
      >
        <rect width="44" height="44" rx="10" fill="#17202a" />
        <path
          d="M22 8.8 34 14.1v8.4c0 8-4.5 13.1-12 15.6-7.5-2.5-12-7.6-12-15.6v-8.4L22 8.8Z"
          fill="#f7f9fb"
        />
        <path
          d="m16.8 23 4.1 4.1 7.9-9.1"
          fill="none"
          stroke="#157f59"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <p className="text-lg font-semibold leading-5 text-ink">
          Owner Patrol Watch
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-patrol-blue">
          Patrol assurance
        </p>
      </div>
    </div>
  );
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (password === config.ownerPassword) {
      onUnlock();
      return;
    }

    setError("That password did not match.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-patrol-paper px-4 text-ink">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-patrol-line bg-white p-6 shadow-panel"
      >
        <LogoLockup />
        <h1 className="mt-6 text-2xl font-semibold tracking-normal">
          Owner access
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter the dashboard password to view patrol records.
        </p>
        <label
          className="mt-5 block text-sm font-medium text-slate-700"
          htmlFor="password"
        >
          Password
        </label>
        <input
          type="text"
          name="username"
          value="owner"
          readOnly
          className="sr-only"
          autoComplete="username"
          tabIndex={-1}
        />
        <div className="relative mt-2">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            className="h-11 w-full rounded-md border border-patrol-line py-2 pl-3 pr-12 text-base outline-none transition focus:border-patrol-blue"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-patrol-blue focus:ring-offset-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm font-medium text-patrol-red">{error}</p>
        ) : null}
        <button
          type="submit"
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Unlock dashboard
        </button>
      </form>
    </main>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: typeof Clock3;
  tone?: "neutral" | "green" | "blue" | "red";
}) {
  const toneClass = {
    neutral: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-patrol-green",
    blue: "bg-sky-50 text-patrol-blue",
    red: "bg-rose-50 text-patrol-red",
  }[tone];

  return (
    <div className="rounded-lg border border-patrol-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-md ${toneClass}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}

function CurrentPatrol({ record }: { record?: PatrolRecord }) {
  if (!record) {
    return (
      <div className="rounded-lg border border-patrol-line bg-white p-4 shadow-panel">
        <p className="text-sm font-semibold text-ink">Current patrol</p>
        <p className="mt-3 text-sm text-slate-600">
          No patrol record is available for this selection.
        </p>
      </div>
    );
  }

  const percent = getProgressPercent(record);

  return (
    <div className="rounded-lg border border-patrol-line bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Current patrol</p>
          <p className="mt-1 text-sm text-slate-600">
            {record.hour_window || record.hour_start}
          </p>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="mt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600">Progress</p>
            <p className="mt-1 text-3xl font-semibold tracking-normal">
              {record.completed_count} / {record.total_points}
            </p>
          </div>
          <p className="text-sm font-medium text-slate-600">{percent}%</p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-patrol-blue transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
        <UserRound className="h-4 w-4" aria-hidden="true" />
        {record.guard_name}
      </div>
    </div>
  );
}

function PatrolRow({
  record,
  expanded,
  onToggle,
}: {
  record: PatrolRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const percent = getProgressPercent(record);

  return (
    <article className="p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(160px,1.2fr)_minmax(140px,1fr)_120px_120px_44px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">
              {record.hour_window || record.hour_start}
            </p>
            <StatusBadge status={record.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Started {formatTimeOnly(record.hour_start, config.timezone)}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-700">
          <UserRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <span className="font-medium">{record.guard_name}</span>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">
            {record.completed_count} / {record.total_points}
          </p>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-patrol-green"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-slate-600">
          {formatDateTime(record.updated_at, config.timezone)}
        </p>

        <button
          type="button"
          onClick={onToggle}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-patrol-line text-slate-700 transition hover:bg-slate-50"
          aria-expanded={expanded}
          aria-label={expanded ? "Hide scan details" : "Show scan details"}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {expanded ? <ScanDetails record={record} /> : null}
    </article>
  );
}

function StatusBadge({ status }: { status: PatrolStatus }) {
  const Icon = statusIcons[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ring-1 ${statusStyles[status]}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {status.replace("_", " ")}
    </span>
  );
}

function ScanDetails({ record }: { record: PatrolRecord }) {
  const scans = normalizeScans(record.scans);

  return (
    <div className="mt-4 rounded-lg border border-patrol-line bg-slate-50 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Scan details</p>
          <p className="mt-1 text-xs text-slate-600">
            {scans.length > 0
              ? `${scans.length} scanned point${scans.length === 1 ? "" : "s"} recorded for this patrol.`
              : "No point-level scan details are available for this patrol."}
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500">
          Progress: {record.completed_count} / {record.total_points}
        </p>
      </div>
      {scans.length > 0 ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {scans.map((scan, index) => (
            <div
              key={`${getScanPointLabel(scan, index)}-${index}`}
              className="rounded-md bg-white p-3 ring-1 ring-patrol-line"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {getScanPointLabel(scan, index)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Scanned at {getScanTimeLabel(scan)}
                  </p>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-patrol-green ring-1 ring-emerald-200">
                  Scanned
                </span>
              </div>
              {getScanQrLabel(scan) ? (
                <p className="mt-3 break-words rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
                  QR code:{" "}
                  <span className="font-medium text-slate-800">
                    {getScanQrLabel(scan)}
                  </span>
                </p>
              ) : null}
              {scan.status ? (
                <p className="mt-1 text-xs text-slate-600">
                  Status: {scan.status}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-md bg-white p-4 text-sm text-slate-600 ring-1 ring-patrol-line">
          The guard app did not send readable scan details for this record yet.
        </div>
      )}
    </div>
  );
}

function StatusMessage({ loadState }: { loadState: LoadState }) {
  if (loadState.status === "loading") {
    return (
      <p className="text-sm font-medium text-patrol-blue">Loading records...</p>
    );
  }

  if (loadState.status === "error") {
    return (
      <p className="text-sm font-medium text-patrol-red">Refresh failed</p>
    );
  }

  return (
    <p className="text-sm font-medium text-patrol-green">
      Auto-refresh every 30 seconds
    </p>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: typeof Clock3;
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        {message}
      </p>
    </div>
  );
}

function getProgressPercent(record: PatrolRecord) {
  if (!record.total_points) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((record.completed_count / record.total_points) * 100),
  );
}

function getRecordId(record: PatrolRecord) {
  return (
    record.record_id ??
    `${record.date_key}-${record.hour_start}-${record.guard_id}`
  );
}

function normalizeScans(scans: PatrolRecord["scans"]): ScanPoint[] {
  if (Array.isArray(scans)) {
    return scans
      .filter((scan): scan is ScanPoint =>
        Boolean(scan && typeof scan === "object"),
      )
      .sort(compareScanPoints);
  }

  if (typeof scans === "string") {
    try {
      const parsed = JSON.parse(scans) as unknown;
      return normalizeScans(parsed as PatrolRecord["scans"]);
    } catch {
      return [];
    }
  }

  if (scans && typeof scans === "object") {
    return Object.entries(scans)
      .reduce<ScanPoint[]>((parsedScans, [key, value]) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          return parsedScans;
        }

        const scan = value as ScanPoint;
        parsedScans.push({
          ...scan,
          point: scan.point ?? key,
        });

        return parsedScans;
      }, [])
      .sort(compareScanPoints);
  }

  return [];
}

function compareScanPoints(first: ScanPoint, second: ScanPoint) {
  return getScanPointNumber(first) - getScanPointNumber(second);
}

function getScanPointNumber(scan: ScanPoint) {
  const value = scan.point ?? scan.point_id;
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.MAX_SAFE_INTEGER;
}

function getScanPointLabel(scan: ScanPoint, index: number) {
  if (scan.point_name) {
    return scan.point_name;
  }

  if (scan.point !== undefined && scan.point !== null) {
    return `Point ${scan.point}`;
  }

  if (scan.point_id) {
    return `Point ${scan.point_id}`;
  }

  return `Point ${index + 1}`;
}

function getScanTimeLabel(scan: ScanPoint) {
  const timestamp = scan.scannedAt ?? scan.scanned_at;
  return timestamp ? formatDateTime(timestamp, config.timezone) : "time not available";
}

function getScanQrLabel(scan: ScanPoint) {
  const value = scan.qrData ?? scan.point_id;
  if (typeof value !== "string" || !value) {
    return "";
  }

  return value.replace(/^GUARDPATROL_QR_/, "");
}

export default App;
