export type TransportMode = 'walk' | 'car' | 'bus' | 'train' | 'bike' | 'other';

export type TripPurpose = 
  | 'work' 
  | 'education' 
  | 'shopping' 
  | 'leisure' 
  | 'personal' 
  | 'medical'
  | 'other';

export type Companion = 'alone' | 'family' | 'friends' | 'colleagues' | 'other';

export interface Trip {
  id: string;
  userId?: string;
  origin: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  destination: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  startTime: Date;
  endTime: Date;
  mode: TransportMode;
  purpose: TripPurpose;
  companion: Companion;
  distance?: number; // in kilometers
  duration?: number; // in minutes
  notes?: string;
  isAutoDetected?: boolean;
  isConfirmed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripStatistics {
  totalDistance: number;
  totalDuration: number;
  tripCount: number;
  modeBreakdown: Record<TransportMode, {
    distance: number;
    duration: number;
    count: number;
  }>;
  purposeBreakdown: Record<TripPurpose, number>;
}