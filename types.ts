export interface UserPreferences {
  vibeScore: number; // 0 (Instagram) to 100 (Authentic)
  vibeDescription: string; // User typed description e.g. "Cyberpunk neon"
  dietary: string[];
  location: string;
  budget: 'ECONOMY' | 'MODERATE' | 'LUXURY';
  fixedCommitments: FixedCommitment[];
}

export interface FixedCommitment {
  id: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  location: string;
  description: string;
  lat?: number;
  lng?: number;
}

export enum ActivityType {
  FOOD = 'FOOD',
  SIGHTSEEING = 'SIGHTSEEING',
  ACTIVITY = 'ACTIVITY',
  TRANSIT = 'TRANSIT',
  COMMITMENT = 'COMMITMENT'
}

export interface Stop {
  id: string;
  name: string;
  description: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  durationMinutes: number;
  type: ActivityType;
  authenticityScore: number; // 1-10
  instagramScore: number; // 1-10
  isFixed?: boolean; // True if it was a user commitment
  estimatedCost: string; // e.g. "Free", "$20", "¥5000"
  bestPhotoSpot?: string; // Specific suggestion for a photo
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  travelToNext?: {
    mode: string; // Walk, Train, Taxi
    duration: string; // "15 min"
  };
  dietaryNotes?: string; // Specific notes about allergy safety
  tags: string[];
}

export interface Itinerary {
  id: string;
  title: string;
  stops: Stop[];
  totalAuthenticityScore: number;
  totalInstagramScore: number;
  summary: string;
}