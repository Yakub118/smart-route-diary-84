import { Trip } from "@/types/trip";
import { MapPin, Clock, Users, Briefcase, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface TripCardProps {
  trip: Trip;
  onClick?: () => void;
}

const modeIcons = {
  walk: "🚶",
  car: "🚗",
  bus: "🚌",
  train: "🚂",
  bike: "🚴",
  other: "🚕",
};

const purposeIcons = {
  work: "💼",
  education: "📚",
  shopping: "🛍️",
  leisure: "🎭",
  personal: "👤",
  medical: "🏥",
  other: "📍",
};

const TripCard = ({ trip, onClick }: TripCardProps) => {
  const duration = trip.duration || Math.round((trip.endTime.getTime() - trip.startTime.getTime()) / 60000);
  
  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-medium",
        "border-l-4",
        `border-l-mode-${trip.mode}`,
        !trip.isConfirmed && "opacity-75"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{modeIcons[trip.mode]}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{trip.origin.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{trip.destination.name}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{format(trip.startTime, "HH:mm")} - {format(trip.endTime, "HH:mm")}</span>
            </div>
            <span>{duration} min</span>
            {trip.distance && <span>{trip.distance.toFixed(1)} km</span>}
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <span className="text-sm">{purposeIcons[trip.purpose]}</span>
              <span className="text-xs text-muted-foreground capitalize">{trip.purpose}</span>
            </div>
            {trip.companion !== 'alone' && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize">{trip.companion}</span>
              </div>
            )}
          </div>
        </div>
        
        {trip.isAutoDetected && !trip.isConfirmed && (
          <div className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs">
            Unconfirmed
          </div>
        )}
      </div>
    </Card>
  );
};

export default TripCard;