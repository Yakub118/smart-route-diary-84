import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard = ({ title, value, unit, icon, trend, className }: StatsCardProps) => {
  return (
    <Card className={cn("p-4 bg-gradient-card shadow-card", className)}>
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend.isPositive ? "bg-mode-walk/10 text-mode-walk" : "bg-destructive/10 text-destructive"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold">
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </p>
      </div>
    </Card>
  );
};

export default StatsCard;