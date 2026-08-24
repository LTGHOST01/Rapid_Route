import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Shield, LogOut } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import type { Health } from "../../types";
import { cn } from "../../lib/cn";

export function AppShell() {
  const { user, logout } = useAuth();
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => api<Health>("/health"),
    refetchInterval: 15000,
  });

  const source = health.data?.googleRoutesConfigured
    ? "Google Routes ready"
    : "Demo fallback only";

  return (
    <div className="flex h-full flex-col bg-ink-950 text-paper">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-ink-700 px-3 md:px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-brass/40 bg-ink-900 text-[11px] font-semibold tracking-wide text-brass">
              RR
            </span>
            <div>
              <div className="text-[13px] font-semibold tracking-[0.14em]">RAPIDROUTE</div>
              <div className="hidden text-[10px] uppercase tracking-[0.16em] text-ash-400 sm:block">
                Emergency route decision
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <ShellLink to="/" icon={<LayoutDashboard size={14} />} label="Dispatch" />
            <ShellLink to="/admin" icon={<Shield size={14} />} label="Admin" />
          </nav>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <div className="hidden items-center gap-2 sm:flex">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                health.data?.ok ? "bg-emerald-500" : "bg-critical",
              )}
            />
            <span className="text-ash-300">{source}</span>
          </div>
          <div className="hidden items-baseline gap-2 text-ash-300 md:flex">
            <span>{user?.name}</span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-ash-400">
              {user?.role.toLowerCase()}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-ash-400 hover:text-paper"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

function ShellLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[12px] tracking-wide",
          isActive ? "bg-ink-800 text-paper" : "text-ash-400 hover:text-paper",
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
