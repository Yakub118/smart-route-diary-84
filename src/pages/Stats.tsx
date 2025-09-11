import { BarChart3, TrendingUp, Clock, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import StatsCard from "@/components/StatsCard";

const Stats = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-ocean text-white p-4">
        <h1 className="text-xl font-semibold">Statistics</h1>
      </header>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            title="Total Distance"
            value="342.5"
            unit="km"
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          />
          <StatsCard
            title="Total Time"
            value="48.5"
            unit="hrs"
            icon={<Clock className="h-5 w-5 text-accent" />}
          />
          <StatsCard
            title="Trips Count"
            value="67"
            icon={<BarChart3 className="h-5 w-5 text-mode-bus" />}
          />
          <StatsCard
            title="CO₂ Saved"
            value="24.8"
            unit="kg"
            icon={<Zap className="h-5 w-5 text-mode-walk" />}
          />
        </div>

        <Card className="p-4">
          <h2 className="font-semibold mb-3">Mode Breakdown</h2>
          <div className="space-y-2">
            {[
              { mode: "Bus", percentage: 45, emoji: "🚌" },
              { mode: "Walking", percentage: 25, emoji: "🚶" },
              { mode: "Car", percentage: 20, emoji: "🚗" },
              { mode: "Bike", percentage: 10, emoji: "🚴" },
            ].map((item) => (
              <div key={item.mode} className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.mode}</span>
                    <span className="text-muted-foreground">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-ocean"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Stats;