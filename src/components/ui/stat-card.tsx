import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
  trend?: { value: string; positive: boolean };
}

export function StatCard({ icon: Icon, label, value, color = "#3ECB8E", trend }: StatCardProps) {
  return (
    <div className="txd-card p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-bold">{value}</div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{label}</span>
        {trend && (
          <span className={`text-[10px] font-medium ${trend.positive ? "text-green-400" : "text-red-400"}`}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
