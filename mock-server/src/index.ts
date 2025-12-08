// Import data store first
import { dataStore } from './data/store.js';

// Export all API functions
export * from './camera.js';
export * from './location.js';
export * from './bridge.js';

// Export types
export * from './shared/core/types.js';

// Export data store for testing purposes
export { dataStore };

// Log startup message
console.log('='.repeat(60));
console.log('Mock Server API - Ready');
console.log('='.repeat(60));
console.log('');
console.log('Available APIs:');
console.log('  - getCameras(params)');
console.log('  - updateCameraStatus(id, status)');
console.log('  - getCameraById(id)');
console.log('  - getBridges(params)');
console.log('  - updateBridgeStatus(id, status)');
console.log('  - getBridgeById(id)');
console.log('  - getLocations(params)');
console.log('  - getLocationById(id)');
console.log('');
console.log('Data Store Stats:');
console.log(JSON.stringify(dataStore.getStats(), null, 2));
console.log('='.repeat(60));
