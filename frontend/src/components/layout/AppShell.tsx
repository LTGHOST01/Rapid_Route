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
    <div className="flex h-full flex-col bg-soft text-ink">
      <header className="flex h-12 shrink-0 items-center justify-between bg-header px-3 text-white">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[16px] font-bold leading-none">RapidRoute</div>
            <div className="mt-0.5 text-[10px] text-white/70">RIH-PS-011 · Dispatch System</div>
          </div>
          <nav className="flex items-center gap-1 text-[13px]">
            <ShellLink to="/" label="Dispatch" />
            <ShellLink to="/demo" label="Demo" />
            {user?.role === "ADMIN" && <ShellLink to="/admin" label="Admin" />}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <span className="hidden border border-white/25 px-2 py-0.5 text-white/85 sm:inline">
            {source}
          </span>
          <div className="hidden leading-tight md:block">
            <div className="text-[10px] text-white/65">
              {user?.role === "ADMIN" ? "Admin" : "Dispatcher"}
            </div>
            <div className="font-medium">{user?.name}</div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-white/80 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
      <footer className="shrink-0 border-t border-line bg-white px-3 py-1 text-[10px] text-muted">
        RapidRoute v1.0 · RIH-PS-011 · academic prototype
      </footer>
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
          "px-3 py-1.5 text-white/80 hover:bg-white/10 hover:text-white",
          isActive && "bg-white/15 font-medium text-white",
        )
      }
    >
      {label}
    </NavLink>
  );
}

