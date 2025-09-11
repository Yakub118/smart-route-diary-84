import { TransportMode } from "@/types/trip";

// CO₂ emission factors (g/km)
const EMISSION_FACTORS: Record<TransportMode, number> = {
  car: 120,
  bus: 80,
  train: 40,
  bike: 0, // Electric/human-powered
  walk: 0, // Human-powered
  other: 90, // Average estimate
};

export const calculateCO2Emission = (mode: TransportMode, distanceKm: number): number => {
  return (EMISSION_FACTORS[mode] || 90) * distanceKm;
};

export const calculateCO2Saved = (trips: Array<{ mode: TransportMode; distance?: number }>) => {
  const carEmissionFactor = EMISSION_FACTORS.car;
  
  return trips.reduce((totalSaved, trip) => {
    if (!trip.distance) return totalSaved;
    
    const actualEmission = calculateCO2Emission(trip.mode, trip.distance);
    const carEmission = carEmissionFactor * trip.distance;
    
    // Only count as "saved" if the chosen mode emits less than car
    return totalSaved + Math.max(0, carEmission - actualEmission);
  }, 0);
};

export const getEmissionFactors = () => EMISSION_FACTORS;