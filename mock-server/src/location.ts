import { dataStore } from './data/store.js';
import { paginateResults } from './shared/core/pagination.js';
import { simulateLatency } from './shared/core/utils.js';
import { Location, PaginatedResponse } from './shared/core/types.js';

export interface GetLocationsParams {
  id__in?: string[];
  pageToken?: string;
  pageSize?: number;
}

/**
 * Get locations with filtering and pagination
 */
export async function getLocations(
  params: GetLocationsParams = {}
): Promise<PaginatedResponse<Location>> {
  return simulateLatency(() => {
    let locations = dataStore.getLocations();

    // Apply filters
    if (params.id__in && params.id__in.length > 0) {
      locations = locations.filter(l => params.id__in!.includes(l.id));
    }

    // Paginate results
    return paginateResults(
      locations,
      params.pageToken,
      params.pageSize || 100,
      {
        id__in: params.id__in
      }
    );
  });
}

/**
 * Get a single location by ID
 */
export async function getLocationById(
  locationId: string
): Promise<Location | null> {
  return simulateLatency(() => {
    return dataStore.getLocationById(locationId) || null;
  });
}
