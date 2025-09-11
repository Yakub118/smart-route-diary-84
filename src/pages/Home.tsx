import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, TrendingUp, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StatsCard from "@/components/StatsCard";
import TripCard from "@/components/TripCard";
import TripDetectionToggle from "@/components/TripDetectionToggle";
import { Trip, TransportMode, TripPurpose, Companion } from "@/types/trip";
import { useTripDetection } from "@/hooks/useTripDetection";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const navigate = useNavigate();
  const { isTracking, currentLocation, startTracking, stopTracking, confirmationModal } = useTripDetection();
  const [todayTrips, setTodayTrips] = useState<Trip[]>([]);
  const [weekStats, setWeekStats] = useState({
    totalDistance: 0,
    totalTrips: 0,
    carbonSaved: 0,
    mostUsedMode: "bus" as TransportMode,
  });

  useEffect(() => {
    const onboardingComplete = localStorage.getItem("onboardingComplete");
    if (!onboardingComplete) {
      navigate("/onboarding");
    }
    fetchTodayTrips();
    fetchWeekStats();
  }, [navigate]);

  const fetchTodayTrips = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', today.toISOString())
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching trips:', error);
      return;
    }

    if (data) {
      const trips: Trip[] = data.map(trip => ({
        id: trip.id,
        userId: trip.user_id,
        origin: {
          name: trip.origin_name,
          coordinates: trip.origin_lat && trip.origin_lng ? {
            lat: trip.origin_lat,
            lng: trip.origin_lng,
          } : undefined,
        },
        destination: {
          name: trip.destination_name,
          coordinates: trip.destination_lat && trip.destination_lng ? {
            lat: trip.destination_lat,
            lng: trip.destination_lng,
          } : undefined,
        },
        startTime: new Date(trip.start_time),
        endTime: new Date(trip.end_time),
        mode: trip.mode as TransportMode,
        purpose: trip.purpose as TripPurpose,
        companion: trip.companion as Companion,
        distance: trip.distance,
        duration: trip.duration,
        notes: trip.notes,
        isAutoDetected: trip.is_auto_detected,
        isConfirmed: trip.is_confirmed,
        createdAt: new Date(trip.created_at),
        updatedAt: new Date(trip.updated_at),
      }));
      setTodayTrips(trips);
    }
  };

  const fetchWeekStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from('trips')
      .select('distance, mode')
      .eq('user_id', user.id)
      .gte('start_time', weekAgo.toISOString());

    if (error) {
      console.error('Error fetching stats:', error);
      return;
    }

    if (data) {
      const totalDistance = data.reduce((sum, trip) => sum + (trip.distance || 0), 0);
      const modeCount: Record<string, number> = {};
      
      data.forEach(trip => {
        if (trip.mode) {
          modeCount[trip.mode] = (modeCount[trip.mode] || 0) + 1;
        }
      });
      
      const mostUsedMode = Object.entries(modeCount).reduce((a, b) => 
        modeCount[a[0]] > modeCount[b[0]] ? a : b, ['bus', 0])[0];
      
      // Calculate carbon saved (simplified calculation)
      const carbonSaved = data.reduce((sum, trip) => {
        if (trip.mode === 'walk' || trip.mode === 'bike') return sum + (trip.distance || 0) * 0.2;
        if (trip.mode === 'bus' || trip.mode === 'train') return sum + (trip.distance || 0) * 0.1;
        return sum;
      }, 0);
      
      setWeekStats({
        totalDistance,
        totalTrips: data.length,
        carbonSaved: Math.round(carbonSaved * 10) / 10,
        mostUsedMode: mostUsedMode as TransportMode,
      });
    }
  };

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-ocean text-white p-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Good morning! 👋</h1>
            <p className="text-white/80 text-sm">Let's track your journey today</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-full p-3">
            <MapPin className="h-5 w-5" />
          </div>
        </div>

        {/* Quick Add Button */}
        <Button
          variant="glass"
          size="lg"
          className="w-full"
          onClick={() => navigate("/add-trip")}
        >
          <Plus className="mr-2 h-5 w-5" />
          Quick Add Trip
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="px-4 -mt-6">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatsCard
            title="This Week"
            value={weekStats.totalDistance.toFixed(1)}
            unit="km"
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Total Trips"
            value={weekStats.totalTrips}
            icon={<Calendar className="h-5 w-5 text-accent" />}
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        {/* Unconfirmed Trips Alert */}
        {todayTrips.some(t => !t.isConfirmed) && (
          <Card className="p-4 mb-6 bg-accent/10 border-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Unconfirmed trips</p>
                <p className="text-xs text-muted-foreground">
                  Review and confirm your auto-detected trips
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/history")}>
                Review
              </Button>
            </div>
          </Card>
        )}

        {/* Today's Trips */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Today's Trips</h2>
          <div className="space-y-3">
            {todayTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => navigate(`/trip/${trip.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Carbon Saved Widget */}
        <Card className="p-4 bg-gradient-card mb-20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Carbon Saved</p>
              <p className="text-2xl font-bold">{weekStats.carbonSaved} kg</p>
              <p className="text-xs text-mode-walk">By using public transport 🌱</p>
            </div>
            <div className="text-5xl">🌍</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Home;