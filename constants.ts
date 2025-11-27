import { UserPreferences } from './types';

export const INITIAL_PREFERENCES: UserPreferences = {
  vibeScore: 75,
  vibeDescription: '',
  dietary: [],
  location: '',
  budget: 'MODERATE',
  fixedCommitments: []
};

export const MOCK_START_LOCATION = {
  lat: 35.6892, // Tokyo Station approx
  lng: 139.7024
};

export const DIETARY_OPTIONS = [
  'Gluten-Free',
  'Nut-Free',
  'Shellfish-Free',
  'Vegetarian',
  'Vegan',
  'Dairy-Free'
];

export const BUDGET_OPTIONS = [
  { value: 'ECONOMY', label: 'Economy', icon: '$' },
  { value: 'MODERATE', label: 'Moderate', icon: '$$' },
  { value: 'LUXURY', label: 'Luxury', icon: '$$$' },
];

export const VIBE_COLOR_MAP = {
  high_auth: '#10b981', // emerald-500
  high_insta: '#f43f5e', // rose-500
  balanced: '#8b5cf6', // violet-500
};