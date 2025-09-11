import { useMemo } from "react";
import { BarChart3, TrendingUp, Clock, Zap, Leaf, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/StatsCard";
import { Trip, TransportMode, TripPurpose } from "@/types/trip";
import { calculateCO2Emission, calculateCO2Saved } from "@/utils/co2Calculator";
import { format, startOfWeek, eachWeekOfInterval, subWeeks } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface EnhancedStatsProps {
  trips: Trip[];
}

const MODE_COLORS = {
  walk: "hsl(var(--mode-walk))",
  car: "hsl(var(--mode-car))", 
  bus: "hsl(var(--mode-bus))",
  train: "hsl(var(--mode-train))",
  bike: "hsl(var(--mode-bike))",
  other: "hsl(var(--muted-foreground))",
};

const EnhancedStats = ({ trips }: EnhancedStatsProps) => {
  const stats = useMemo(() => {
    const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0);
    const totalDuration = trips.reduce((sum, trip) => sum + (trip.duration || 0), 0);
    const totalCO2Saved = calculateCO2Saved(trips);
    
    // Mode breakdown
    const modeStats = trips.reduce((acc, trip) => {
      const mode = trip.mode;
      if (!acc[mode]) {
        acc[mode] = { distance: 0, duration: 0, count: 0, co2: 0 };
      }
      acc[mode].distance += trip.distance || 0;
      acc[mode].duration += trip.duration || 0;
      acc[mode].count += 1;
      acc[mode].co2 += calculateCO2Emission(mode, trip.distance || 0);
      return acc;
    }, {} as Record<TransportMode, { distance: number; duration: number; count: number; co2: number }>);

    // Purpose breakdown
    const purposeStats = trips.reduce((acc, trip) => {
      acc[trip.purpose] = (acc[trip.purpose] || 0) + 1;
      return acc;
    }, {} as Record<TripPurpose, number>);

    // Weekly trends (last 8 weeks)
    const startDate = subWeeks(new Date(), 8);
    const weeks = eachWeekOfInterval({
      start: startDate,
      end: new Date()
    });

    const weeklyData = weeks.map(weekStart => {
      const weekTrips = trips.filter(trip => {
        const tripWeek = startOfWeek(new Date(trip.startTime));
        return tripWeek.getTime() === weekStart.getTime();
      });

      return {
        week: format(weekStart, "MMM d"),
        distance: weekTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0),
        duration: weekTrips.reduce((sum, trip) => sum + (trip.duration || 0), 0) / 60, // Convert to hours
        co2Saved: calculateCO2Saved(weekTrips) / 1000, // Convert to kg
        trips: weekTrips.length
      };
    });

    return {
      totalDistance,
      totalDuration,
      totalCO2Saved,
      tripCount: trips.length,
      modeStats,
      purposeStats,
      weeklyData
    };
  }, [trips]);

  // Prepare chart data
  const modeChartData = Object.entries(stats.modeStats).map(([mode, data]) => ({
    mode: mode.charAt(0).toUpperCase() + mode.slice(1),
    distance: data.distance,
    count: data.count,
    co2: data.co2 / 1000, // Convert to kg
    fill: MODE_COLORS[mode as TransportMode]
  }));

  const purposeChartData = Object.entries(stats.purposeStats).map(([purpose, count]) => ({
    purpose: purpose.charAt(0).toUpperCase() + purpose.slice(1),
    count,
    fill: `hsl(${Math.random() * 360} 60% 50%)`
  }));

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          title="Total Distance"
          value={stats.totalDistance.toFixed(1)}
          unit="km"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          trend={stats.weeklyData.length > 1 ? {
            value: Math.round(((stats.weeklyData[stats.weeklyData.length - 1]?.distance || 0) - 
                               (stats.weeklyData[stats.weeklyData.length - 2]?.distance || 0)) / 
                               (stats.weeklyData[stats.weeklyData.length - 2]?.distance || 1) * 100),
            isPositive: true
          } : undefined}
        />
        <StatsCard
          title="Total Time"
          value={(stats.totalDuration / 60).toFixed(1)}
          unit="hrs"
          icon={<Clock className="h-5 w-5 text-accent" />}
        />
        <StatsCard
          title="Trips Count"
          value={stats.tripCount}
          icon={<BarChart3 className="h-5 w-5 text-mode-bus" />}
        />
        <StatsCard
          title="CO₂ Saved"
          value={(stats.totalCO2Saved / 1000).toFixed(1)}
          unit="kg"
          icon={<Leaf className="h-5 w-5 text-mode-walk" />}
        />
      </div>

      {/* Weekly Trends Chart */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Weekly Trends
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Line 
                type="monotone" 
                dataKey="distance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
              <Line 
                type="monotone" 
                dataKey="co2Saved" 
                stroke="hsl(var(--mode-walk))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--mode-walk))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-muted-foreground">Distance (km)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-mode-walk rounded-full"></div>
            <span className="text-muted-foreground">CO₂ Saved (kg)</span>
          </div>
        </div>
      </Card>

      {/* Mode Breakdown */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Transport Mode Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="mode" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Bar dataKey="distance" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modeChartData}
                  dataKey="count"
                  nameKey="mode"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={(entry) => `${entry.mode}: ${entry.count}`}
                >
                  {modeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Environmental Impact */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Leaf className="h-4 w-4 text-mode-walk" />
          Environmental Impact
        </h3>
        
        <div className="space-y-4">
          {Object.entries(stats.modeStats).map(([mode, data]) => (
            <div key={mode} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="capitalize">{mode}</span>
                <span className="text-muted-foreground">
                  {(data.co2 / 1000).toFixed(2)} kg CO₂
                </span>
              </div>
              <Progress 
                value={(data.distance / stats.totalDistance) * 100} 
                className="h-2"
              />
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-mode-walk/10 rounded-lg border border-mode-walk/20">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-mode-walk" />
              <span className="font-medium text-mode-walk">
                Total CO₂ footprint: {(Object.values(stats.modeStats).reduce((sum, data) => sum + data.co2, 0) / 1000).toFixed(1)} kg
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You saved {(stats.totalCO2Saved / 1000).toFixed(1)} kg CO₂ by choosing sustainable transport!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EnhancedStats;