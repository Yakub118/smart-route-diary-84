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
  const [hasMotionSensors, setHasMotionSensors] = useState(false);

  useEffect(() => {
    // Set up callbacks
    tripDetectionService.onTripDetected((trip) => {
      setDetectedTrip(trip);
      setShowConfirmation(true);
      
      // Show enhanced notification
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification("🚗 Trip Detected!", {
          body: `${trip.mode.charAt(0).toUpperCase() + trip.mode.slice(1)} trip from ${trip.origin.name} to ${trip.destination.name}\nDistance: ${trip.distance.toFixed(1)} km\nClick to confirm details.`,
          icon: "/favicon.ico",
          requireInteraction: true,
        });
        
        notification.onclick = () => {
          setShowConfirmation(true);
          notification.close();
        };
      } else {
        toast({
          title: "🚗 Trip Detected!",
          description: `${trip.mode.charAt(0).toUpperCase() + trip.mode.slice(1)} trip from ${trip.origin.name} to ${trip.destination.name}. Distance: ${trip.distance.toFixed(1)} km. Please confirm the details.`,
          duration: 8000,
        });
      }
    });

    tripDetectionService.onLocationUpdate((position) => {
      setCurrentLocation(position);
    });

    // Check motion sensor availability
    if ('DeviceMotionEvent' in window) {
      setHasMotionSensors(true);
    }

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
    hasMotionSensors,
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