"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Stats {
  totalUsers: number;
  totalRecords: number;
  recordsToday: number;
  newUsersThisWeek: number;
}
interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  plan: string;
  planExpiry: string | null;
  createdAt: string;
  _count: { records: number };
}
interface AdminRecord {
  id: string;
  company: string;
  jdTitle: string;
  results: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

function Avatar({ src, name, size = 32 }: { src?: string | null; name?: string | null; size?: number }) {
  const initials = name?.charAt(0)?.toUpperCase() ?? "?";
  return src ? (
    <img src={src} alt={name ?? ""} width={size} height={size}
      className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full bg-[#EADDFF] flex items-center justify-center text-[#6750A4] font-semibold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-[#FFFBFF] rounded-[16px] border border-[#CAC4D0] p-5 flex items-center gap-4"
      style={{ boxShadow: "var(--md-elevation-1)" }}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-[#1C1B1F]">{value.toLocaleString()}</div>
        <div className="text-xs text-[#49454F] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function PlanBadge({ plan, planExpiry }: { plan: string; planExpiry: string | null }) {
  if (plan === "pro") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 text-white inline-block">
          Pro
        </span>
        {planExpiry && (
          <span className="text-[10px] text-[#79747E]">
            until {new Date(planExpiry).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#E8DEF8] text-[#625B71]">
      Free
    </span>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "users" | "records">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/login"); return; }
    if (status === "authenticated" && session.user.role !== "admin") { router.replace("/"); return; }
    if (status === "authenticated") loadAll();
  }, [status]);

  const loadAll = async () => {
    setLoading(true);
    const [s, u, r] = await Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/records").then((r) => r.json()),
    ]);
    setStats(s);
    setUsers(Array.isArray(u) ? u : []);
    setRecords(Array.isArray(r) ? r : []);
    setLoading(false);
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user and all their records?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setUsers((p) => p.filter((u) => u.id !== id));
  };

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    await fetch(`/api/admin/records/${id}`, { method: "DELETE" });
    setRecords((p) => p.filter((r) => r.id !== id));
    setStats((p) => p ? { ...p, totalRecords: p.totalRecords - 1 } : p);
  };

  const filteredUsers = users.filter((u) =>
    !userSearch || [u.name, u.email].some((s) => s?.toLowerCase().includes(userSearch.toLowerCase()))
  );
  const filteredRecords = records.filter((r) =>
    !recordSearch || [r.company, r.jdTitle, r.user.email, r.user.name].some(
      (s) => s?.toLowerCase().includes(recordSearch.toLowerCase())
    )
  );

  const proCount = users.filter((u) => u.plan === "pro").length;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--md-background)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#6750A4] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#49454F] text-sm">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  const tabs: { key: typeof tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "users", label: `Users (${users.length})`, icon: "👥" },
    { key: "records", label: `Records (${records.length})`, icon: "📋" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F6F2FB" }}>

      {/* Header */}
      <header className="bg-[#0d0d0d] border-b border-white/[0.07] px-6 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="7" r="2.8" fill="white" />
                <path d="M12 11.5 L13.2 15.2 L17 16.5 L13.2 17.8 L12 21.5 L10.8 17.8 L7 16.5 L10.8 15.2 Z" fill="white" />
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">Jobna Admin</span>
            <span className="text-white/30 text-xs hidden sm:block">· Super Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar src={session?.user.image} name={session?.user.name} size={28} />
              <span className="text-white/70 text-xs hidden sm:block">{session?.user.email}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-white/50 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/[0.08]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Tab bar */}
        <div className="flex gap-1 bg-[#FFFBFF] rounded-full border border-[#CAC4D0] p-1 self-start"
          style={{ boxShadow: "var(--md-elevation-1)" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-[#6750A4] text-white shadow-sm"
                  : "text-[#49454F] hover:bg-[#F3EDF7]"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && stats && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Total Users" value={stats.totalUsers} icon="👥" color="bg-[#EADDFF]" />
              <StatCard label="Total Records" value={stats.totalRecords} icon="📋" color="bg-[#E8DEF8]" />
              <StatCard label="Records Today" value={stats.recordsToday} icon="📅" color="bg-[#D0BCFF]/40" />
              <StatCard label="New Users (7d)" value={stats.newUsersThisWeek} icon="✨" color="bg-[#EADDFF]" />
              <StatCard label="Pro Users" value={proCount} icon="⚡" color="bg-gradient-to-br from-violet-100 to-indigo-100" />
            </div>

            {/* Recent records preview */}
            <div className="bg-[#FFFBFF] rounded-[16px] border border-[#CAC4D0] overflow-hidden"
              style={{ boxShadow: "var(--md-elevation-1)" }}>
              <div className="px-5 py-4 border-b border-[#E7E0EC] flex items-center justify-between">
                <span className="font-semibold text-[#1C1B1F] text-sm">Recent Activity</span>
                <button onClick={() => setTab("records")} className="text-xs text-[#6750A4] hover:underline">View all</button>
              </div>
              <div className="divide-y divide-[#E7E0EC]">
                {records.slice(0, 8).map((r) => (
                  <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                    <Avatar src={r.user.image} name={r.user.name} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#1C1B1F] truncate">
                          {r.company || "No company"}
                        </span>
                        {Object.keys(JSON.parse(r.results || "{}")).length > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#EADDFF] text-[#6750A4]">
                            {Object.keys(JSON.parse(r.results || "{}")).length} results
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#79747E] truncate">{r.user.email}</div>
                    </div>
                    <div className="text-xs text-[#79747E] flex-shrink-0">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === "users" && (
          <div className="bg-[#FFFBFF] rounded-[16px] border border-[#CAC4D0] overflow-hidden"
            style={{ boxShadow: "var(--md-elevation-1)" }}>
            <div className="px-5 py-4 border-b border-[#E7E0EC] flex items-center gap-3">
              <svg className="w-4 h-4 text-[#79747E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="flex-1 text-sm outline-none bg-transparent text-[#1C1B1F] placeholder-[#79747E]"
              />
              <span className="text-xs text-[#79747E]">{filteredUsers.length} users · {proCount} Pro</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F7F2FA] border-b border-[#E7E0EC]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#49454F] uppercase tracking-wide">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#49454F] uppercase tracking-wide">Plan</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#49454F] uppercase tracking-wide">Role</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#49454F] uppercase tracking-wide">Records</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#49454F] uppercase tracking-wide">Joined</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E0EC]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F7F2FA] transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={u.image} name={u.name} size={32} />
                          <div>
                            <div className="font-medium text-[#1C1B1F]">{u.name ?? "—"}</div>
                            <div className="text-xs text-[#79747E]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <PlanBadge plan={u.plan} planExpiry={u.planExpiry} />
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          u.role === "admin"
                            ? "bg-[#6750A4] text-white"
                            : "bg-[#E8DEF8] text-[#625B71]"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-[#1C1B1F]">{u._count.records}</span>
                      </td>
                      <td className="px-5 py-3 text-[#79747E] text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {u.email !== "yylwdyx@gmail.com" && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="text-xs text-[#B3261E] hover:bg-[#F9DEDC] px-2.5 py-1.5 rounded-full transition"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-[#79747E] text-sm">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Records ── */}
        {tab === "records" && (
          <div className="bg-[#FFFBFF] rounded-[16px] border border-[#CAC4D0] overflow-hidden"
            style={{ boxShadow: "var(--md-elevation-1)" }}>
            <div className="px-5 py-4 border-b border-[#E7E0EC] flex items-center gap-3">
              <svg className="w-4 h-4 text-[#79747E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                placeholder="Search by company, JD, or user…"
                className="flex-1 text-sm outline-none bg-transparent text-[#1C1B1F] placeholder-[#79747E]"
              />
              <span className="text-xs text-[#79747E]">{filteredRecords.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F7F2FA] border-b border-[#E7E0EC]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#49454F] uppercase tracking-wide">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#49454F] uppercase tracking-wide">Company</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#49454F] uppercase tracking-wide">JD Preview</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#49454F] uppercase tracking-wide">Results</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#49454F] uppercase tracking-wide">Date</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E0EC]">
                  {filteredRecords.map((r) => {
                    let resultKeys: string[] = [];
                    try { resultKeys = Object.keys(JSON.parse(r.results)); } catch { /* */ }
                    const resultIcons: Record<string, string> = {
                      "optimize-resume": "✨",
                      "job-intel": "🔍",
                      "interview-questions": "📝",
                    };
                    return (
                      <tr key={r.id} className="hover:bg-[#F7F2FA] transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar src={r.user.image} name={r.user.name} size={28} />
                            <span className="text-xs text-[#79747E] truncate max-w-[100px]">{r.user.email}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-medium text-[#1C1B1F]">
                          {r.company || <span className="text-[#79747E]">—</span>}
                        </td>
                        <td className="px-5 py-3 text-[#79747E] max-w-[200px]">
                          <span className="line-clamp-1 text-xs">{r.jdTitle || "—"}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1">
                            {resultKeys.map((k) => (
                              <span key={k} title={k}
                                className="w-6 h-6 rounded-full bg-[#EADDFF] flex items-center justify-center text-xs">
                                {resultIcons[k] ?? "•"}
                              </span>
                            ))}
                            {resultKeys.length === 0 && <span className="text-xs text-[#CAC4D0]">none</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#79747E]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => deleteRecord(r.id)}
                            className="text-xs text-[#B3261E] hover:bg-[#F9DEDC] px-2.5 py-1.5 rounded-full transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-[#79747E] text-sm">No records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
