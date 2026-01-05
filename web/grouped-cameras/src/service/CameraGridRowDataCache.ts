import { RowDataCache } from './RowDataCache';

// Singleton instance for camera grid
export const cameraGridRowDataCache = new RowDataCache({
  storageType: 'memory',
  maxAge: 0  // No expiry for now
});

// Default cache key for the main camera grid
export const CAMERA_GRID_CACHE_KEY = 'camera-grid-main';
