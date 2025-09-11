import { MapPin, Navigation, Activity, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TripDetectionToggleProps {
  isTracking: boolean;
  onToggle: () => void;
  currentLocation?: GeolocationPosition | null;
  hasMotionSensors?: boolean;
}

const TripDetectionToggle = ({ isTracking, onToggle, currentLocation, hasMotionSensors = false }: TripDetectionToggleProps) => {
  return (
    <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isTracking ? 'bg-primary/20 animate-pulse' : 'bg-muted'}`}>
            <Navigation className={`h-5 w-5 ${isTracking ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="font-medium text-sm">Auto Trip Detection</p>
            <p className="text-xs text-muted-foreground">
              {isTracking ? 'Tracking with GPS + Motion sensors' : 'Enable smart trip detection'}
            </p>
          </div>
        </div>
        <Switch checked={isTracking} onCheckedChange={onToggle} />
      </div>
      
      {isTracking && currentLocation && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              GPS Active
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              Accuracy: {Math.round(currentLocation.coords.accuracy)}m
            </span>
          </div>
          
          {hasMotionSensors && (
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                <Smartphone className="h-3 w-3 mr-1" />
                Motion Sensors Active
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                Enhanced mode detection
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default TripDetectionToggle;