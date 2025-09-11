import { Trip } from "@/types/trip";
import { supabase } from "@/integrations/supabase/client";

export interface DetectedTrip {
  origin: { name: string; coordinates: { lat: number; lng: number } };
  destination: { name: string; coordinates: { lat: number; lng: number } };
  startTime: Date;
  endTime: Date;
  distance: number;
  mode: 'walk' | 'car' | 'bus' | 'train' | 'bike' | 'other';
  path: { lat: number; lng: number; timestamp: number }[];
}

interface TripDetectionState {
  isTracking: boolean;
  currentTrip: Partial<DetectedTrip> | null;
  lastPosition: GeolocationPosition | null;
  watchId: number | null;
}

class TripDetectionService {
  private state: TripDetectionState = {
    isTracking: false,
    currentTrip: null,
    lastPosition: null,
    watchId: null,
  };

  private callbacks: {
    onTripDetected?: (trip: DetectedTrip) => void;
    onLocationUpdate?: (position: GeolocationPosition) => void;
  } = {};

  // Configuration
  private readonly MIN_DISTANCE_THRESHOLD = 200; // meters
  private readonly STOP_DURATION_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  private readonly LOCATION_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  constructor() {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  async startTracking() {
    if (this.state.isTracking) return;

    try {
      // Request permission
      const permission = await this.requestLocationPermission();
      if (!permission) {
        throw new Error('Location permission denied');
      }

      this.state.isTracking = true;
      
      // Start watching position
      this.state.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionUpdate(position),
        (error) => this.handleLocationError(error),
        this.LOCATION_OPTIONS
      );

      console.log('Trip detection started');
    } catch (error) {
      console.error('Failed to start trip detection:', error);
      throw error;
    }
  }

  stopTracking() {
    if (this.state.watchId !== null) {
      navigator.geolocation.clearWatch(this.state.watchId);
      this.state.watchId = null;
    }
    this.state.isTracking = false;
    this.state.currentTrip = null;
    console.log('Trip detection stopped');
  }

  private async requestLocationPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state === 'granted' || result.state === 'prompt';
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      return true;
    }
  }

  private handlePositionUpdate(position: GeolocationPosition) {
    this.callbacks.onLocationUpdate?.(position);

    if (!this.state.lastPosition) {
      // First position update
      this.state.lastPosition = position;
      return;
    }

    const distance = this.calculateDistance(
      this.state.lastPosition.coords.latitude,
      this.state.lastPosition.coords.longitude,
      position.coords.latitude,
      position.coords.longitude
    );

    const timeDiff = position.timestamp - this.state.lastPosition.timestamp;

    // Check if a trip should start
    if (!this.state.currentTrip && distance > this.MIN_DISTANCE_THRESHOLD) {
      this.startTrip(this.state.lastPosition, position);
    }
    // Check if current trip should end (stopped for 5+ minutes)
    else if (this.state.currentTrip && distance < 10 && timeDiff > this.STOP_DURATION_THRESHOLD) {
      this.endTrip(position);
    }
    // Update current trip
    else if (this.state.currentTrip) {
      this.updateTrip(position);
    }

    this.state.lastPosition = position;
  }

  private startTrip(startPosition: GeolocationPosition, currentPosition: GeolocationPosition) {
    this.state.currentTrip = {
      origin: {
        name: 'Current Location',
        coordinates: {
          lat: startPosition.coords.latitude,
          lng: startPosition.coords.longitude,
        },
      },
      startTime: new Date(startPosition.timestamp),
      path: [
        {
          lat: startPosition.coords.latitude,
          lng: startPosition.coords.longitude,
          timestamp: startPosition.timestamp,
        },
        {
          lat: currentPosition.coords.latitude,
          lng: currentPosition.coords.longitude,
          timestamp: currentPosition.timestamp,
        },
      ],
    };
    console.log('Trip started');
  }

  private updateTrip(position: GeolocationPosition) {
    if (!this.state.currentTrip) return;

    this.state.currentTrip.path?.push({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: position.timestamp,
    });
  }

  private async endTrip(endPosition: GeolocationPosition) {
    if (!this.state.currentTrip || !this.state.currentTrip.path) return;

    const trip: DetectedTrip = {
      ...this.state.currentTrip,
      destination: {
        name: 'Current Location',
        coordinates: {
          lat: endPosition.coords.latitude,
          lng: endPosition.coords.longitude,
        },
      },
      endTime: new Date(endPosition.timestamp),
      distance: this.calculateTotalDistance(this.state.currentTrip.path),
      mode: this.detectTransportMode(this.state.currentTrip.path),
    } as DetectedTrip;

    console.log('Trip ended:', trip);
    
    // Notify callback
    this.callbacks.onTripDetected?.(trip);
    
    // Save to database
    await this.saveTripToDatabase(trip);
    
    // Reset current trip
    this.state.currentTrip = null;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  private calculateTotalDistance(path: { lat: number; lng: number }[]): number {
    let totalDistance = 0;
    for (let i = 1; i < path.length; i++) {
      totalDistance += this.calculateDistance(
        path[i - 1].lat,
        path[i - 1].lng,
        path[i].lat,
        path[i].lng
      );
    }
    return totalDistance / 1000; // Convert to kilometers
  }

  private detectTransportMode(path: { lat: number; lng: number; timestamp: number }[]): Trip['mode'] {
    if (path.length < 2) return 'other';

    // Calculate average speed
    const totalDistance = this.calculateTotalDistance(path) * 1000; // in meters
    const totalTime = (path[path.length - 1].timestamp - path[0].timestamp) / 1000; // in seconds
    const avgSpeed = (totalDistance / totalTime) * 3.6; // Convert to km/h

    // Simple speed-based detection (can be improved with accelerometer data)
    if (avgSpeed < 5) return 'walk';
    if (avgSpeed < 15) return 'bike';
    if (avgSpeed < 40) return 'bus';
    if (avgSpeed < 80) return 'car';
    return 'train';
  }

  private async saveTripToDatabase(trip: DetectedTrip) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Save to local storage if not authenticated
        this.saveToLocalStorage(trip);
        return;
      }

      const { error } = await supabase.from('trips').insert({
        user_id: user.id,
        origin_name: trip.origin.name,
        origin_lat: trip.origin.coordinates.lat,
        origin_lng: trip.origin.coordinates.lng,
        destination_name: trip.destination.name,
        destination_lat: trip.destination.coordinates.lat,
        destination_lng: trip.destination.coordinates.lng,
        start_time: trip.startTime.toISOString(),
        end_time: trip.endTime.toISOString(),
        distance: trip.distance,
        duration: Math.round((trip.endTime.getTime() - trip.startTime.getTime()) / 60000), // in minutes
        mode: trip.mode,
        purpose: 'other', // Will be set during confirmation
        companion: 'alone', // Will be set during confirmation
        is_auto_detected: true,
        is_confirmed: false,
      });

      if (error) {
        console.error('Failed to save trip to database:', error);
        this.saveToLocalStorage(trip);
      }
    } catch (error) {
      console.error('Error saving trip:', error);
      this.saveToLocalStorage(trip);
    }
  }

  private saveToLocalStorage(trip: DetectedTrip) {
    try {
      const storedTrips = localStorage.getItem('pendingTrips');
      const trips = storedTrips ? JSON.parse(storedTrips) : [];
      trips.push(trip);
      localStorage.setItem('pendingTrips', JSON.stringify(trips));
      console.log('Trip saved to local storage for later sync');
    } catch (error) {
      console.error('Failed to save trip to local storage:', error);
    }
  }

  async syncPendingTrips() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const storedTrips = localStorage.getItem('pendingTrips');
    if (!storedTrips) return;

    try {
      const trips = JSON.parse(storedTrips);
      for (const trip of trips) {
        await this.saveTripToDatabase(trip);
      }
      localStorage.removeItem('pendingTrips');
      console.log('Pending trips synced successfully');
    } catch (error) {
      console.error('Failed to sync pending trips:', error);
    }
  }

  private handleLocationError(error: GeolocationPositionError) {
    console.error('Location error:', error);
    // Handle different error types
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('User denied location permission');
        break;
      case error.POSITION_UNAVAILABLE:
        console.error('Location information unavailable');
        break;
      case error.TIMEOUT:
        console.error('Location request timed out');
        break;
    }
  }

  onTripDetected(callback: (trip: DetectedTrip) => void) {
    this.callbacks.onTripDetected = callback;
  }

  onLocationUpdate(callback: (position: GeolocationPosition) => void) {
    this.callbacks.onLocationUpdate = callback;
  }
}

export const tripDetectionService = new TripDetectionService();