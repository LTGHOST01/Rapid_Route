import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import type { Priority, RoadStatus, TrafficLevel, VehicleStatus } from "../types";

export function StatusChip({
  tone,
  children,
}: {
  tone: "critical" | "warning" | "clear" | "neutral" | "nav";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "critical" && "bg-red-50 text-critical",
        tone === "warning" && "bg-amber-50 text-amber-700",
        tone === "clear" && "bg-emerald-50 text-clear",
        tone === "neutral" && "bg-slate-100 text-muted",
        tone === "nav" && "bg-blue-50 text-nav",
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
  if (status === "ASSIGNED") return "nav" as const;
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
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-nav text-white hover:bg-nav-dark",
        variant === "ghost" && "border border-line bg-white text-ink hover:bg-soft",
        variant === "danger" && "bg-critical text-white hover:bg-red-700",
        variant === "warn" && "bg-amber-500 text-white hover:bg-amber-600",
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
      <span className="text-[12px] font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export function inputClass() {
  return "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-slate-400 focus:border-nav";
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
    <section className={cn("px-5 py-4", className)}>
      {title && (
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
