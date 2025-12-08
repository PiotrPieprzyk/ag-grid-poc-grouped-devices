import type { IServerSideDatasource, IServerSideGetRowsParams } from 'ag-grid-community';
import { getCameras, getBridges, getLocations } from 'mock-server';
import type { GroupingMode } from './useGroupingConfig';

interface DatasourceConfig {
  groupingMode: GroupingMode;
}

/**
 * Create server-side datasource for AG Grid
 * Handles hierarchical loading based on groupKeys
 */
export function createServerSideDatasource(config: DatasourceConfig): IServerSideDatasource {
  return {
    async getRows(params: IServerSideGetRowsParams) {
      const { groupKeys, startRow, endRow, filterModel, sortModel } = params.request;
      const currentLevel = groupKeys.length;
      const pageSize = endRow! - startRow!;

      console.log('[Datasource] getRows called:', {
        groupKeys,
        startRow,
        endRow,
        currentLevel,
        groupingMode: config.groupingMode,
        filterModel,
        sortModel
      });

      try {
        // Extract status filter if present
        const statusFilter = filterModel?.status?.values as string[] | undefined;

        // Determine what to load based on hierarchy level and grouping mode
        if (config.groupingMode === 'location-bridge-camera') {
          await handleLocationBridgeCameraMode(
            params,
            currentLevel,
            groupKeys,
            pageSize,
            startRow!,
            statusFilter
          );
        } else if (config.groupingMode === 'location-camera') {
          await handleLocationCameraMode(
            params,
            currentLevel,
            groupKeys,
            pageSize,
            startRow!,
            statusFilter
          );
        } else if (config.groupingMode === 'bridge-camera') {
          await handleBridgeCameraMode(
            params,
            currentLevel,
            groupKeys,
            pageSize,
            startRow!,
            statusFilter
          );
        }
      } catch (error) {
        console.error('[Datasource] Error:', error);
        params.fail();
      }
    }
  };
}

/**
 * Handle Location → Bridge → Camera grouping
 */
async function handleLocationBridgeCameraMode(
  params: IServerSideGetRowsParams,
  level: number,
  groupKeys: string[],
  pageSize: number,
  startRow: number,
  statusFilter?: string[]
) {
  if (level === 0) {
    // Load top-level: Locations
    const response = await getLocations({
      pageSize,
      pageToken: startRow > 0 ? encodePageToken(startRow) : undefined
    });

    params.success({
      rowData: response.results.map(loc => ({
        ...loc,
        group: true
      })),
      rowCount: response.totalSize
    });
  } else if (level === 1) {
    // Load Bridges for a Location
    const locationId = groupKeys[0];
    const response = await getBridges({
      locationId,
      status__in: statusFilter,
      pageSize,
      pageToken: startRow > 0 ? encodePageToken(startRow) : undefined
    });

    params.success({
      rowData: response.results.map(bridge => ({
        ...bridge,
        group: true
      })),
      rowCount: response.totalSize
    });
  } else if (level === 2) {
    // Load Cameras for a Bridge
    const locationId = groupKeys[0];
    const bridgeId = groupKeys[1];
    const response = await getCameras({
      locationId,
      bridgeId,
      status__in: statusFilter,
      pageSize,
      pageToken: startRow > 0 ? encodePageToken(startRow) : undefined
    });

    params.success({
      rowData: response.results, // Leaf nodes - no group: true
      rowCount: response.totalSize
    });
  }
}

/**
 * Handle Location → Camera grouping (skip Bridge level)
 */
async function handleLocationCameraMode(
  params: IServerSideGetRowsParams,
  level: number,
  groupKeys: string[],
  pageSize: number,
  startRow: number,
  statusFilter?: string[]
) {
  if (level === 0) {
    // Load top-level: Locations
    const response = await getLocations({
      pageSize,
      pageToken: startRow > 0 ? encodePageToken(startRow) : undefined
    });

    params.success({
      rowData: response.results.map(loc => ({
        ...loc,
        group: true
      })),
      rowCount: response.totalSize
    });
  } else if (level === 1) {
    // Load Cameras for a Location (skip bridges)
    const locationId = groupKeys[0];
    const response = await getCameras({
      locationId,
      status__in: statusFilter,
      pageSize,
      pageToken: startRow > 0 ? encodePageToken(startRow) : undefined
    });

    params.success({
      rowData: response.results, // Leaf nodes - no group: true
      rowCount: response.totalSize
    });
  }
}

/**
 * Handle Bridge → Camera grouping (skip Location level)
 */
async function handleBridgeCameraMode(
  params: IServerSideGetRowsParams,
  level: number,
  groupKeys: string[],
  pageSize: number,
  startRow: number,
  statusFilter?: string[]
) {
  if (level === 0) {
    // Load top-level: Bridges (all bridges, not grouped by location)
    const response = await getBridges({
      status__in: statusFilter,
      pageSize,
      pageToken: startRow > 0 ? encodePageToken(startRow) : undefined
    });

    params.success({
      rowData: response.results.map(bridge => ({
        ...bridge,
        group: true
      })),
      rowCount: response.totalSize
    });
  } else if (level === 1) {
    // Load Cameras for a Bridge
    const bridgeId = groupKeys[0];
    const response = await getCameras({
      bridgeId,
      status__in: statusFilter,
      pageSize,
      pageToken: startRow > 0 ? encodePageToken(startRow) : undefined
    });

    params.success({
      rowData: response.results, // Leaf nodes - no group: true
      rowCount: response.totalSize
    });
  }
}

/**
 * Simple page token encoding (offset-based)
 */
function encodePageToken(offset: number): string {
  return btoa(JSON.stringify({ offset }));
}
