import { useState } from "react";
import { format } from "date-fns";
import { MapPin, Clock, Route, Users, Briefcase, CheckCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DetectedTrip } from "@/services/tripDetection";
import { TripPurpose, Companion, TransportMode } from "@/types/trip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TripConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedTrip: DetectedTrip | null;
  onConfirm?: () => void;
}

const TripConfirmationModal = ({
  isOpen,
  onClose,
  detectedTrip,
  onConfirm,
}: TripConfirmationModalProps) => {
  const { toast } = useToast();
  const [purpose, setPurpose] = useState<TripPurpose>("other");
  const [companion, setCompanion] = useState<Companion>("alone");
  const [mode, setMode] = useState<TransportMode>(detectedTrip?.mode || "other");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!detectedTrip) return null;

  const duration = Math.round(
    (detectedTrip.endTime.getTime() - detectedTrip.startTime.getTime()) / 60000
  );

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save your trips",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("trips").insert({
        user_id: user.id,
        origin_name: detectedTrip.origin.name,
        origin_lat: detectedTrip.origin.coordinates.lat,
        origin_lng: detectedTrip.origin.coordinates.lng,
        destination_name: detectedTrip.destination.name,
        destination_lat: detectedTrip.destination.coordinates.lat,
        destination_lng: detectedTrip.destination.coordinates.lng,
        start_time: detectedTrip.startTime.toISOString(),
        end_time: detectedTrip.endTime.toISOString(),
        distance: detectedTrip.distance,
        duration,
        mode,
        purpose,
        companion,
        notes: notes || null,
        is_auto_detected: true,
        is_confirmed: true,
      });

      if (error) throw error;

      toast({
        title: "Trip saved",
        description: "Your trip has been successfully recorded",
      });
      
      onConfirm?.();
      onClose();
    } catch (error) {
      console.error("Failed to save trip:", error);
      toast({
        title: "Error",
        description: "Failed to save trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    // Mark as skipped in the database or local storage
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Trip Detected
          </DialogTitle>
          <DialogDescription>
            We detected a trip. Please confirm the details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trip Summary */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">{detectedTrip.origin.name}</p>
                  <p className="text-muted-foreground">to</p>
                  <p className="font-medium">{detectedTrip.destination.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p>{format(detectedTrip.startTime, "h:mm a")} - {format(detectedTrip.endTime, "h:mm a")}</p>
                  <p className="text-muted-foreground">{duration} minutes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Route className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{detectedTrip.distance.toFixed(1)} km</p>
              </div>
            </div>
          </Card>

          {/* Transport Mode */}
          <div className="space-y-2">
            <Label>Transport Mode</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as TransportMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk">🚶 Walking</SelectItem>
                <SelectItem value="bike">🚴 Bicycle</SelectItem>
                <SelectItem value="car">🚗 Car</SelectItem>
                <SelectItem value="bus">🚌 Bus</SelectItem>
                <SelectItem value="train">🚂 Train</SelectItem>
                <SelectItem value="other">🔄 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trip Purpose */}
          <div className="space-y-2">
            <Label>Trip Purpose</Label>
            <RadioGroup value={purpose} onValueChange={(value) => setPurpose(value as TripPurpose)}>
              <div className="grid grid-cols-2 gap-2">
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="work" />
                  <span className="text-sm">Work</span>
                </Label>
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="education" />
                  <span className="text-sm">Education</span>
                </Label>
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="shopping" />
                  <span className="text-sm">Shopping</span>
                </Label>
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="leisure" />
                  <span className="text-sm">Leisure</span>
                </Label>
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="personal" />
                  <span className="text-sm">Personal</span>
                </Label>
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="medical" />
                  <span className="text-sm">Medical</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Companions */}
          <div className="space-y-2">
            <Label>Who were you with?</Label>
            <Select value={companion} onValueChange={(value) => setCompanion(value as Companion)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alone">Alone</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="friends">Friends</SelectItem>
                <SelectItem value="colleagues">Colleagues</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Add any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1" />
              Skip
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirm Trip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripConfirmationModal;