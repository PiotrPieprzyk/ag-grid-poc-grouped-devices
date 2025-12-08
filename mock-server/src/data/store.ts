import { Camera, Bridge, Location, EntityStatus } from '../shared/core/types.js';
import { generateInitialData } from './generator.js';

/**
 * Mutable in-memory data store
 * Singleton pattern to maintain state across API calls
 */
class DataStore {
  private locations: Location[];
  private bridges: Bridge[];
  private cameras: Camera[];

  constructor() {
    const data = generateInitialData();
    this.locations = data.locations;
    this.bridges = data.bridges;
    this.cameras = data.cameras;

    console.log(`[DataStore] Initialized with:
      - ${this.locations.length} locations
      - ${this.bridges.length} bridges
      - ${this.cameras.length} cameras`);
  }

  // Getters (return shallow copies to prevent external mutation)
  getLocations(): Location[] {
    return [...this.locations];
  }

  getBridges(): Bridge[] {
    return [...this.bridges];
  }

  getCameras(): Camera[] {
    return [...this.cameras];
  }

  // Mutation methods for bridges
  updateBridgeStatus(bridgeId: string, status: EntityStatus): boolean {
    const bridge = this.bridges.find(b => b.id === bridgeId);
    if (bridge) {
      console.log(`[DataStore] Updating ${bridgeId} status: ${bridge.status} → ${status}`);
      bridge.status = status;
      return true;
    }
    console.warn(`[DataStore] Bridge not found: ${bridgeId}`);
    return false;
  }

  getBridgeById(id: string): Bridge | undefined {
    return this.bridges.find(b => b.id === id);
  }

  // Mutation methods for cameras
  updateCameraStatus(cameraId: string, status: EntityStatus): boolean {
    const camera = this.cameras.find(c => c.id === cameraId);
    if (camera) {
      console.log(`[DataStore] Updating ${cameraId} status: ${camera.status} → ${status}`);
      camera.status = status;
      return true;
    }
    console.warn(`[DataStore] Camera not found: ${cameraId}`);
    return false;
  }

  getCameraById(id: string): Camera | undefined {
    return this.cameras.find(c => c.id === id);
  }

  getLocationById(id: string): Location | undefined {
    return this.locations.find(l => l.id === id);
  }

  // Statistics methods (useful for debugging)
  getStats() {
    const bridgeStatuses = this.bridges.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const cameraStatuses = this.cameras.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      locations: this.locations.length,
      bridges: {
        total: this.bridges.length,
        byStatus: bridgeStatuses
      },
      cameras: {
        total: this.cameras.length,
        byStatus: cameraStatuses
      }
    };
  }
}

// Export singleton instance
export const dataStore = new DataStore();
