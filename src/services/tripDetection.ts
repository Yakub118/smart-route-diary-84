import { Trip } from "@/types/trip";
import { supabase } from "@/integrations/supabase/client";

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface MotionData {
  acceleration: AccelerometerData;
  rotationRate: {
    alpha: number;
    beta: number;
    gamma: number;
  };
}

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
  motionData: MotionData[];
  isMotionPermissionGranted: boolean;
}

class TripDetectionService {
  private state: TripDetectionState = {
    isTracking: false,
    currentTrip: null,
    lastPosition: null,
    watchId: null,
    motionData: [],
    isMotionPermissionGranted: false,
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
      // Request location permission
      const locationPermission = await this.requestLocationPermission();
      if (!locationPermission) {
        throw new Error('Location permission denied');
      }

      // Request motion permission (for accelerometer data)
      await this.requestMotionPermission();

      this.state.isTracking = true;
      
      // Start watching position
      this.state.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionUpdate(position),
        (error) => this.handleLocationError(error),
        this.LOCATION_OPTIONS
      );

      // Start motion data collection
      if (this.state.isMotionPermissionGranted) {
        this.startMotionDetection();
      }

      console.log('Trip detection started with GPS and motion sensors');
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
    
    // Stop motion detection
    this.stopMotionDetection();
    
    this.state.isTracking = false;
    this.state.currentTrip = null;
    this.state.motionData = [];
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

    // Calculate average speed from GPS
    const totalDistance = this.calculateTotalDistance(path) * 1000; // in meters
    const totalTime = (path[path.length - 1].timestamp - path[0].timestamp) / 1000; // in seconds
    const avgSpeed = (totalDistance / totalTime) * 3.6; // Convert to km/h

    // Analyze motion data for transport mode classification
    const motionClassification = this.analyzeMotionPattern();
    
    // Combined decision based on speed and motion patterns
    if (avgSpeed < 5) {
      return motionClassification.isWalking ? 'walk' : 'other';
    }
    
    if (avgSpeed < 15) {
      return motionClassification.isCycling ? 'bike' : 'walk';
    }
    
    if (avgSpeed < 40) {
      // Check motion patterns to distinguish between bus and car
      if (motionClassification.isVehicleWithStops) {
        return 'bus';
      }
      return 'car';
    }
    
    if (avgSpeed < 80) {
      return motionClassification.isSmoothVehicle ? 'train' : 'car';
    }
    
    return 'train';
  }

  private analyzeMotionPattern(): {
    isWalking: boolean;
    isCycling: boolean;
    isVehicleWithStops: boolean;
    isSmoothVehicle: boolean;
  } {
    if (this.state.motionData.length < 10) {
      // Not enough data, return neutral classification
      return {
        isWalking: false,
        isCycling: false,
        isVehicleWithStops: false,
        isSmoothVehicle: false,
      };
    }

    // Calculate motion characteristics
    const accelerations = this.state.motionData.map(data => 
      Math.sqrt(data.acceleration.x ** 2 + data.acceleration.y ** 2 + data.acceleration.z ** 2)
    );
    
    const avgAcceleration = accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
    const accelerationVariance = this.calculateVariance(accelerations);
    
    // Walking: Regular rhythmic pattern, moderate acceleration variance
    const isWalking = avgAcceleration > 1 && avgAcceleration < 3 && accelerationVariance > 0.5;
    
    // Cycling: Smoother than walking, lower acceleration variance
    const isCycling = avgAcceleration > 0.5 && avgAcceleration < 2 && accelerationVariance < 0.3;
    
    // Vehicle with stops (bus): Variable acceleration with periods of high variance
    const isVehicleWithStops = accelerationVariance > 1 && avgAcceleration > 0.8;
    
    // Smooth vehicle (train): Low acceleration variance, steady motion
    const isSmoothVehicle = accelerationVariance < 0.2 && avgAcceleration < 1;

    return {
      isWalking,
      isCycling,
      isVehicleWithStops,
      isSmoothVehicle,
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
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

  private async requestMotionPermission(): Promise<void> {
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        // iOS 13+ requires explicit permission
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        this.state.isMotionPermissionGranted = permissionState === 'granted';
      } else if ('DeviceMotionEvent' in window) {
        // Android and older iOS versions
        this.state.isMotionPermissionGranted = true;
      } else {
        console.warn('Device motion not supported');
        this.state.isMotionPermissionGranted = false;
      }
    } catch (error) {
      console.warn('Motion permission request failed:', error);
      this.state.isMotionPermissionGranted = false;
    }
  }

  private startMotionDetection() {
    if (!this.state.isMotionPermissionGranted) return;
    
    window.addEventListener('devicemotion', this.handleMotionData.bind(this));
    console.log('Motion detection started');
  }

  private stopMotionDetection() {
    window.removeEventListener('devicemotion', this.handleMotionData.bind(this));
  }

  private handleMotionData(event: DeviceMotionEvent) {
    if (!event.acceleration) return;

    const motionData: MotionData = {
      acceleration: {
        x: event.acceleration.x || 0,
        y: event.acceleration.y || 0,
        z: event.acceleration.z || 0,
        timestamp: Date.now(),
      },
      rotationRate: {
        alpha: event.rotationRate?.alpha || 0,
        beta: event.rotationRate?.beta || 0,
        gamma: event.rotationRate?.gamma || 0,
      },
    };

    // Keep only last 50 motion readings (about 2-3 seconds of data)
    this.state.motionData.push(motionData);
    if (this.state.motionData.length > 50) {
      this.state.motionData.shift();
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