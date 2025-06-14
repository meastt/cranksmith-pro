// lib/database.js
// Import the V2 database from your original file
export { componentDatabaseV2 as componentDatabase } from './componentDatabase';

// Add Pro-specific enhancements
export const proFeatures = {
  // Real-world compatibility data
  compatibility: new Map(),
  
  // Performance cache
  performanceCache: new Map(),
  
  // User preferences
  preferences: {
    units: 'metric',
    wheelSize: 700,
    defaultCadence: 90
  }
};