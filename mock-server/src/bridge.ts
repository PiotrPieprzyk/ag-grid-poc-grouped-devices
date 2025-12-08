import { dataStore } from './data/store.js';
import { paginateResults } from './shared/core/pagination.js';
import { simulateLatency } from './shared/core/utils.js';
import { Bridge, PaginatedResponse, EntityStatus } from './shared/core/types.js';

export interface GetBridgesParams {
  id__in?: string[];
  locationId?: string;
  status__in?: string[];
  pageToken?: string;
  pageSize?: number;
}

/**
 * Get bridges with filtering and pagination
 */
export async function getBridges(
  params: GetBridgesParams = {}
): Promise<PaginatedResponse<Bridge>> {
  return simulateLatency(() => {
    let bridges = dataStore.getBridges();

    // Apply filters
    if (params.locationId) {
      bridges = bridges.filter(b => b.locationId === params.locationId);
    }

    if (params.status__in && params.status__in.length > 0) {
      bridges = bridges.filter(b => params.status__in!.includes(b.status));
    }

    if (params.id__in && params.id__in.length > 0) {
      bridges = bridges.filter(b => params.id__in!.includes(b.id));
    }

    // Paginate results
    return paginateResults(
      bridges,
      params.pageToken,
      params.pageSize || 100,
      {
        locationId: params.locationId,
        status__in: params.status__in,
        id__in: params.id__in
      }
    );
  });
}

/**
 * Update bridge status
 */
export async function updateBridgeStatus(
  bridgeId: string,
  status: EntityStatus
): Promise<{ success: boolean; message?: string }> {
  return simulateLatency(() => {
    const success = dataStore.updateBridgeStatus(bridgeId, status);
    return {
      success,
      message: success
        ? `Bridge ${bridgeId} status updated to ${status}`
        : `Bridge ${bridgeId} not found`
    };
  });
}

/**
 * Get a single bridge by ID
 */
export async function getBridgeById(
  bridgeId: string
): Promise<Bridge | null> {
  return simulateLatency(() => {
    return dataStore.getBridgeById(bridgeId) || null;
  });
}
