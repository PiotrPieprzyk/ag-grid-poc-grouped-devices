import type {IServerSideDatasource, IServerSideGetRowsParams} from 'ag-grid-community';
import {getCameras, getBridges, getLocations} from 'mock-server';
import type {GroupingMode} from './useGroupingConfig';

interface DatasourceConfig {
    groupingMode: GroupingMode;
}

interface TokenCache {
    nextPageToken?: string;
    prevPageToken?: string;
    lastStartRow: number;
}

// Token cache keyed by hierarchy path (e.g., "level:0" or "level:2:locationId:bridgeId")
const tokenCache = new Map<string, TokenCache>();

/**
 * Generate a unique cache key for a given hierarchy level and group keys
 */
function getCacheKey(level: number, groupKeys: string[]): string {
    return `level:${level}:${groupKeys.join(':')}`;
}

/**
 * Determine which page token to use based on navigation direction
 */
function getPageToken(cacheKey: string, startRow: number): string | undefined {
    const cached = tokenCache.get(cacheKey);

    if (!cached) {
        // First request for this cache key
        console.log(`[Token Cache] No cached tokens for ${cacheKey}, starting fresh`);
        return undefined;
    }

    if (startRow === 0) {
        // Going back to the beginning
        console.log(`[Token Cache] Going back to start for ${cacheKey}`);
        return undefined;
    }

    if (startRow > cached.lastStartRow) {
        // Moving forward - use next token
        console.log(`[Token Cache] Moving forward for ${cacheKey}, using nextPageToken`);
        return cached.nextPageToken;
    } else if (startRow < cached.lastStartRow) {
        // Moving backward - use prev token
        console.log(`[Token Cache] Moving backward for ${cacheKey}, using prevPageToken`);
        return cached.prevPageToken;
    }

    // Same startRow - shouldn't happen normally, but return undefined to be safe
    console.log(`[Token Cache] Same startRow for ${cacheKey}, using undefined`);
    return undefined;
}

/**
 * Update token cache with new tokens from response
 */
function updateTokenCache(
    cacheKey: string,
    startRow: number,
    nextPageToken?: string,
    prevPageToken?: string
): void {
    console.log(`[Token Cache] Updating cache for ${cacheKey}`, {
        startRow,
        hasNextToken: !!nextPageToken,
        hasPrevToken: !!prevPageToken
    });
    tokenCache.set(cacheKey, {
        nextPageToken,
        prevPageToken,
        lastStartRow: startRow
    });
}

/**
 * Create server-side datasource for AG Grid
 * Handles hierarchical loading based on groupKeys
 */
export function createServerSideDatasource(config: DatasourceConfig): IServerSideDatasource {
    return {
        async getRows(params: IServerSideGetRowsParams) {
            const {groupKeys, startRow, endRow, filterModel, sortModel} = params.request;
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

const mapCamera = (cam: any) => ({
    ...cam,
    cameraId: cam.id,
    id: undefined
});

const mapBridge = (bridge: any) => ({
    ...bridge,
    bridgeId: bridge.id,
    id: undefined,
    group: true
});

const mapLocation = (loc: any) => ({
    ...loc,
    locationId: loc.id,
    id: undefined,
    group: true
});
                                    

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
    const cacheKey = getCacheKey(level, groupKeys);

    if (level === 0) {
        // Load top-level: Locations
        const pageToken = getPageToken(cacheKey, startRow);
        const response = await getLocations({
            pageSize,
            pageToken
        });

        response.nextPageToken && console.log('[Datasource] Locations response nextPageToken:', JSON.parse(atob(response.nextPageToken)));
        response.prevPageToken && console.log('[Datasource] Locations response prevPageToken:', JSON.parse(atob(response.prevPageToken)))
        
        updateTokenCache(cacheKey, startRow, response.nextPageToken, response.prevPageToken);

        params.success({
            rowData: response.results.map(mapLocation),
            ...(params.request.endRow === response.totalSize ? {rowCount: params.request.endRow} : {}) // Provide rowCount only if more pages exist
        });
    } else if (level === 1) {
        // Load Bridges for a Location
        const locationId = groupKeys[0];
        const pageToken = getPageToken(cacheKey, startRow);
        const response = await getBridges({
            locationId,
            status__in: statusFilter,
            pageSize,
            pageToken
        });

        updateTokenCache(cacheKey, startRow, response.nextPageToken, response.prevPageToken);

        params.success({
            rowData: response.results.map(mapBridge),
            ...(params.request.endRow === response.totalSize ? {rowCount: params.request.endRow} : {}) // Provide rowCount only if more pages exist
        });
    } else if (level === 2) {
        // Load Cameras for a Bridge
        const locationId = groupKeys[0];
        const bridgeId = groupKeys[1];
        const pageToken = getPageToken(cacheKey, startRow);
        const response = await getCameras({
            locationId,
            bridgeId,
            status__in: statusFilter,
            pageSize,
            pageToken
        });

        updateTokenCache(cacheKey, startRow, response.nextPageToken, response.prevPageToken);

        params.success({
            rowData: response.results.map(mapCamera), // Leaf nodes - no group: true
            ...(params.request.endRow === response.totalSize ? {rowCount: params.request.endRow} : {}) // Provide rowCount only if more pages exist
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
    const cacheKey = getCacheKey(level, groupKeys);

    if (level === 0) {
        // Load top-level: Locations
        const pageToken = getPageToken(cacheKey, startRow);
        const response = await getLocations({
            pageSize,
            pageToken
        });

        updateTokenCache(cacheKey, startRow, response.nextPageToken, response.prevPageToken);

        params.success({
            rowData: response.results.map(mapLocation),
            ...(params.request.endRow === response.totalSize ? {rowCount: params.request.endRow} : {}) // Provide rowCount only if more pages exist
        });
    } else if (level === 1) {
        // Load Cameras for a Location (skip bridges)
        const locationId = groupKeys[0];
        const pageToken = getPageToken(cacheKey, startRow);
        const response = await getCameras({
            locationId,
            status__in: statusFilter,
            pageSize,
            pageToken
        });

        updateTokenCache(cacheKey, startRow, response.nextPageToken, response.prevPageToken);

        params.success({
            rowData: response.results.map(mapCamera), // Leaf nodes - no group: true
            ...(params.request.endRow === response.totalSize ? {rowCount: params.request.endRow} : {}) // Provide rowCount only if more pages exist
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
    const cacheKey = getCacheKey(level, groupKeys);

    if (level === 0) {
        // Load top-level: Bridges (all bridges, not grouped by location)
        const pageToken = getPageToken(cacheKey, startRow);
        const response = await getBridges({
            status__in: statusFilter,
            pageSize,
            pageToken
        });

        updateTokenCache(cacheKey, startRow, response.nextPageToken, response.prevPageToken);

        params.success({
            rowData: response.results.map(mapBridge),
            ...(params.request.endRow === response.totalSize ? {rowCount: params.request.endRow} : {}) // Provide rowCount only if more pages exist
        });
    } else if (level === 1) {
        // Load Cameras for a Bridge
        const bridgeId = groupKeys[0];
        const pageToken = getPageToken(cacheKey, startRow);
        const response = await getCameras({
            bridgeId,
            status__in: statusFilter,
            pageSize,
            pageToken
        });

        updateTokenCache(cacheKey, startRow, response.nextPageToken, response.prevPageToken);

        params.success({
            rowData: response.results.map(mapCamera), // Leaf nodes - no group: true
            ...(params.request.endRow === response.totalSize ? {rowCount: params.request.endRow} : {}) // Provide rowCount only if more pages exist
        });
    }
}

