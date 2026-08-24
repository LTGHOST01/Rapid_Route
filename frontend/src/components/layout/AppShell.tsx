import { NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
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

  const source = health.data?.googleRoutesConfigured ? "Google Routes ready" : "Demo fallback only";

  return (
    <div className="flex h-full flex-col bg-white text-ink">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-critical text-[15px] font-semibold text-white">
              +
            </span>
            <span className="text-[18px] font-semibold tracking-tight">RapidRoute</span>
          </div>
          <nav className="flex items-center gap-5 text-[14px]">
            <ShellLink to="/" label="Dispatch" />
            <ShellLink to="/admin" label="Admin" />
          </nav>
        </div>
        <div className="flex items-center gap-4 text-[13px]">
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-clear sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-clear" />
            {source}
          </span>
          <div className="hidden items-center gap-2 md:flex">
            <span className="h-2 w-2 rounded-full bg-clear" />
            <div className="leading-tight">
              <div className="text-[11px] text-muted">Operator</div>
              <div className="text-[13px] font-medium">{user?.name}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-muted hover:text-ink"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

function ShellLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "relative py-4 text-muted hover:text-ink",
          isActive && "font-medium text-critical",
        )
      }
    >
      {({ isActive }) => (
        <>
          {label}
          {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-critical" />}
        </>
      )}
    </NavLink>
  );
}

