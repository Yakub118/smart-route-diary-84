import { format } from "date-fns";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trip, TransportMode } from "@/types/trip";
import { cn } from "@/lib/utils";

interface TravelChainViewProps {
  trips: Trip[];
  selectedDate: Date;
}

const getModeIcon = (mode: TransportMode) => {
  const icons = {
    walk: "🚶",
    car: "🚗", 
    bus: "🚌",
    train: "🚊",
    bike: "🚴",
    other: "🚀"
  };
  return icons[mode] || icons.other;
};

const getModeColor = (mode: TransportMode) => {
  const colors = {
    walk: "text-mode-walk",
    car: "text-mode-car",
    bus: "text-mode-bus", 
    train: "text-mode-train",
    bike: "text-mode-bike",
    other: "text-muted-foreground"
  };
  return colors[mode] || colors.other;
};

const TravelChainView = ({ trips, selectedDate }: TravelChainViewProps) => {
  // Sort trips by start time
  const sortedTrips = [...trips].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0);
  const totalDuration = trips.reduce((sum, trip) => sum + (trip.duration || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card className="p-4 bg-gradient-card shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h2>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {totalDistance.toFixed(1)} km
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.round(totalDuration)} min
            </div>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {trips.length} {trips.length === 1 ? 'trip' : 'trips'} recorded
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        {sortedTrips.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No trips recorded for this date</p>
          </Card>
        ) : (
          sortedTrips.map((trip, index) => (
            <div key={trip.id} className="relative">
              {/* Timeline Line */}
              {index < sortedTrips.length - 1 && (
                <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border z-0" />
              )}
              
              {/* Trip Card */}
              <Card className={cn(
                "relative z-10 p-4 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300",
                !trip.isConfirmed && "border-accent/50"
              )}>
                <div className="flex items-start gap-4">
                  {/* Mode Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl",
                    "bg-primary/10 border-2 border-primary/20"
                  )}>
                    <span className={getModeColor(trip.mode)}>
                      {getModeIcon(trip.mode)}
                    </span>
                  </div>

                  {/* Trip Details */}
                  <div className="flex-1 space-y-2">
                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{trip.origin.name}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{trip.destination.name}</span>
                    </div>

                    {/* Time & Details */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {format(trip.startTime, "HH:mm")} - {format(trip.endTime, "HH:mm")}
                      </span>
                      {trip.distance && (
                        <span>{trip.distance.toFixed(1)} km</span>
                      )}
                      {trip.duration && (
                        <span>{trip.duration} min</span>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {trip.purpose}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {trip.companion}
                      </Badge>
                      {trip.isAutoDetected && (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">
                          Auto-detected
                        </Badge>
                      )}
                      {!trip.isConfirmed && (
                        <Badge variant="destructive" className="text-xs">
                          Needs confirmation
                        </Badge>
                      )}
                    </div>

                    {/* Notes */}
                    {trip.notes && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {trip.notes}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TravelChainView;