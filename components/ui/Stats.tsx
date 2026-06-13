import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  iconColor?: string;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-[hsl(var(--primary))]",
  subtitle,
}: StatCardProps) {
  return (
    <div className="card-elevated rounded-xl p-6 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{title}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{subtitle}</p>
          )}
          {change && (
            <p
              className={cn(
                "mt-2 text-sm font-medium",
                changeType === "positive" && "text-emerald-400",
                changeType === "negative" && "text-red-400",
                changeType === "neutral" && "text-[hsl(var(--muted-foreground))]"
              )}
            >
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("rounded-lg bg-[hsl(var(--accent))] p-3", iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  percentage?: string;
  color?: "blue" | "green" | "amber" | "red" | "purple";
}

export function MetricCard({ label, value, percentage, color = "blue" }: MetricCardProps) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
    green: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
    red: "from-red-500/20 to-red-600/5 border-red-500/30",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/30",
  };

  const textColors = {
    blue: "text-blue-400",
    green: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
    purple: "text-purple-400",
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br p-4",
        colorClasses[color]
      )}
    >
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={cn("text-2xl font-bold tabular-nums", textColors[color])}>
          {value}
        </span>
        {percentage && (
          <span className="text-sm text-[hsl(var(--muted-foreground))]">{percentage}</span>
        )}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: "blue" | "green" | "amber" | "red";
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = "blue",
  size = "md",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="mb-1 flex items-center justify-between text-sm">
          {label && <span className="text-[hsl(var(--muted-foreground))]">{label}</span>}
          {showPercentage && (
            <span className="tabular-nums text-[hsl(var(--foreground))]">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className={cn("w-full rounded-full bg-[hsl(var(--accent))]", sizeClasses[size])}>
        <div
          className={cn("rounded-full transition-all duration-500", colorClasses[color], sizeClasses[size])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
