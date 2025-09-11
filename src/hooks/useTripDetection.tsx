import { useEffect, useState, useCallback } from "react";
import { tripDetectionService, DetectedTrip } from "@/services/tripDetection";
import { useToast } from "@/hooks/use-toast";
import TripConfirmationModal from "@/components/TripConfirmationModal";

export const useTripDetection = () => {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [detectedTrip, setDetectedTrip] = useState<DetectedTrip | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    // Set up callbacks
    tripDetectionService.onTripDetected((trip) => {
      setDetectedTrip(trip);
      setShowConfirmation(true);
      
      // Show notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Trip Detected! 🚗", {
          body: `Trip from ${trip.origin.name} to ${trip.destination.name}`,
          icon: "/favicon.ico",
        });
      } else {
        toast({
          title: "Trip Detected! 🚗",
          description: `Trip from ${trip.origin.name} to ${trip.destination.name}. Please confirm the details.`,
        });
      }
    });

    tripDetectionService.onLocationUpdate((position) => {
      setCurrentLocation(position);
    });

    // Check for auto-detection preference
    const autoDetectionEnabled = localStorage.getItem("autoDetectionEnabled");
    if (autoDetectionEnabled === "true") {
      startTracking();
    }

    // Sync pending trips on mount
    tripDetectionService.syncPendingTrips();

    return () => {
      if (isTracking) {
        tripDetectionService.stopTracking();
      }
    };
  }, []);

  const startTracking = useCallback(async () => {
    try {
      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }

      await tripDetectionService.startTracking();
      setIsTracking(true);
      localStorage.setItem("autoDetectionEnabled", "true");
      
      toast({
        title: "Trip detection started",
        description: "We'll automatically detect your trips and notify you.",
      });
    } catch (error) {
      console.error("Failed to start tracking:", error);
      toast({
        title: "Failed to start tracking",
        description: "Please check your location permissions and try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopTracking = useCallback(() => {
    tripDetectionService.stopTracking();
    setIsTracking(false);
    localStorage.setItem("autoDetectionEnabled", "false");
    
    toast({
      title: "Trip detection stopped",
      description: "Automatic trip detection has been disabled.",
    });
  }, [toast]);

  const handleConfirmTrip = useCallback(() => {
    setShowConfirmation(false);
    setDetectedTrip(null);
    
    // Refresh trips list if needed
    window.location.reload();
  }, []);

  const handleCloseConfirmation = useCallback(() => {
    setShowConfirmation(false);
    setDetectedTrip(null);
  }, []);

  return {
    isTracking,
    currentLocation,
    startTracking,
    stopTracking,
    confirmationModal: (
      <TripConfirmationModal
        isOpen={showConfirmation}
        onClose={handleCloseConfirmation}
        detectedTrip={detectedTrip}
        onConfirm={handleConfirmTrip}
      />
    ),
  };
};