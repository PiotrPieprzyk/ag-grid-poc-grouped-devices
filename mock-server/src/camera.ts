import { dataStore } from './data/store.js';
import { paginateResults } from './shared/core/pagination.js';
import { simulateLatency } from './shared/core/utils.js';
import { Camera, PaginatedResponse, EntityStatus } from './shared/core/types.js';

export interface GetCamerasParams {
  locationId?: string;
  bridgeId?: string;
  status__in?: string[];
  id__in?: string[];
  pageToken?: string;
  pageSize?: number;
}

/**
 * Get cameras with filtering and pagination
 */
export async function getCameras(
  params: GetCamerasParams = {}
): Promise<PaginatedResponse<Camera>> {
  return simulateLatency(() => {
    let cameras = dataStore.getCameras();

    // Apply filters
    if (params.locationId) {
      cameras = cameras.filter(c => c.locationId === params.locationId);
    }

    if (params.bridgeId) {
      cameras = cameras.filter(c => c.bridgeId === params.bridgeId);
    }

    if (params.status__in && params.status__in.length > 0) {
      cameras = cameras.filter(c => params.status__in!.includes(c.status));
    }

    if (params.id__in && params.id__in.length > 0) {
      cameras = cameras.filter(c => params.id__in!.includes(c.id));
    }

    // Paginate results
    return paginateResults(
      cameras,
      params.pageToken,
      params.pageSize || 100,
      {
        locationId: params.locationId,
        bridgeId: params.bridgeId,
        status__in: params.status__in,
        id__in: params.id__in
      }
    );
  });
}

/**
 * Update camera status
 */
export async function updateCameraStatus(
  cameraId: string,
  status: EntityStatus
): Promise<{ success: boolean; message?: string }> {
  return simulateLatency(() => {
    const success = dataStore.updateCameraStatus(cameraId, status);
    return {
      success,
      message: success
        ? `Camera ${cameraId} status updated to ${status}`
        : `Camera ${cameraId} not found`
    };
  });
}

/**
 * Get a single camera by ID
 */
export async function getCameraById(
  cameraId: string
): Promise<Camera | null> {
  return simulateLatency(() => {
    return dataStore.getCameraById(cameraId) || null;
  });
}
