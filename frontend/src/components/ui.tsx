import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import type { Priority, RoadStatus, TrafficLevel, VehicleStatus } from "../types";

export function StatusChip({
  tone,
  children,
}: {
  tone: "critical" | "warning" | "clear" | "neutral" | "brass";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]",
        tone === "critical" && "border-critical/40 bg-critical-soft text-red-200",
        tone === "warning" && "border-warning/40 bg-warning-soft text-amber-200",
        tone === "clear" && "border-clear/40 bg-clear-soft text-emerald-200",
        tone === "neutral" && "border-ink-600 bg-ink-800 text-ash-300",
        tone === "brass" && "border-brass/40 bg-[#2a2418] text-brass",
      )}
    >
      {children}
    </span>
  );
}

export function priorityTone(priority: Priority) {
  return priority === "CRITICAL" ? "critical" : priority === "HIGH" ? "warning" : "neutral";
}

export function roadTone(status: RoadStatus) {
  if (status === "BLOCKED") return "critical" as const;
  if (status === "CONGESTED") return "warning" as const;
  if (status === "CLEAR") return "clear" as const;
  return "neutral" as const;
}

export function trafficTone(level: TrafficLevel) {
  if (level === "HIGH") return "critical" as const;
  if (level === "MEDIUM") return "warning" as const;
  if (level === "LOW") return "clear" as const;
  return "neutral" as const;
}

export function vehicleTone(status: VehicleStatus) {
  if (status === "AVAILABLE") return "clear" as const;
  if (status === "ASSIGNED") return "brass" as const;
  return "neutral" as const;
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "warn";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm px-3 py-2 text-[13px] font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-paper text-ink-950 hover:bg-paper-2",
        variant === "ghost" && "border border-ink-600 bg-transparent text-paper hover:border-ash-400",
        variant === "danger" && "bg-critical text-white hover:bg-red-700",
        variant === "warn" && "bg-warning text-ink-950 hover:bg-amber-600",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ash-400">
        {label}
      </span>
      {children}
    </label>
  );
}

export function inputClass() {
  return "w-full rounded-sm border border-ink-600 bg-ink-950 px-2.5 py-2 text-[13px] text-paper outline-none placeholder:text-ink-500 focus:border-brass";
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-ink-700 last:border-b-0", className)}>
      {title && (
        <header className="flex items-center justify-between px-4 py-2.5">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-ash-400">
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}
