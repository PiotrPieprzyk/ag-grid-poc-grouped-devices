import { Location, Bridge, Camera, EntityStatus } from '../shared/core/types.js';

/**
 * Generate random status with distribution: 70% online, 20% offline, 10% error
 */
function randomStatus(): EntityStatus {
  const rand = Math.random();
  if (rand < 0.7) return 'online';
  if (rand < 0.9) return 'offline';
  return 'error';
}

/**
 * Generate locations: "Location-1", "Location-2", ...
 */
export function generateLocations(count: number): Location[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `Location-${i + 1}`
  }));
}

/**
 * Generate bridges distributed across locations
 * @param locationCount - Number of locations
 * @param bridgesPerLocation - Average bridges per location
 */
export function generateBridges(
  locationCount: number,
  bridgesPerLocation: number
): Bridge[] {
  const bridges: Bridge[] = [];
  let bridgeId = 1;

  for (let locId = 1; locId <= locationCount; locId++) {
    const locationId = `Location-${locId}`;
    for (let b = 0; b < bridgesPerLocation; b++) {
      bridges.push({
        id: `Bridge-${bridgeId++}`,
        locationId,
        status: randomStatus()
      });
    }
  }
  return bridges;
}

/**
 * Generate cameras distributed across bridges
 * @param bridges - Array of bridges
 * @param camerasPerBridge - Average cameras per bridge
 */
export function generateCameras(
  bridges: Bridge[],
  camerasPerBridge: number
): Camera[] {
  const cameras: Camera[] = [];
  let cameraId = 1;

  for (const bridge of bridges) {
    for (let c = 0; c < camerasPerBridge; c++) {
      cameras.push({
        id: `Camera-${cameraId++}`,
        locationId: bridge.locationId,
        bridgeId: bridge.id,
        status: randomStatus()
      });
    }
  }
  return cameras;
}

/**
 * Generate complete initial dataset
 * 100 locations × 5 bridges × 10 cameras = 5000 cameras
 */
export function generateInitialData() {
  console.log('[Generator] Generating initial dataset...');

  const locations = generateLocations(2);
  const bridges = generateBridges(2, 2);
  const cameras = generateCameras(bridges, 50);

  console.log(`[Generator] Generated:
    - ${locations.length} locations
    - ${bridges.length} bridges
    - ${cameras.length} cameras`);

  return { locations, bridges, cameras };
}
