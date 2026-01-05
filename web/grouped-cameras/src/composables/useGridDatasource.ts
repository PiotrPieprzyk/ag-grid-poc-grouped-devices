import type {IServerSideDatasource, IServerSideGetRowsParams} from 'ag-grid-community';
import {getBridges, getCameras, PaginatedResponse} from 'mock-server';
import {cameraGridTokenCache} from "../service/CameraGridTokenCache.ts";

interface DatasourceConfig {
    groupingMode: GroupingMode;
}

export type GroupingMode = 'bridge-camera';

export const mapCamera = (cam: any) => ({
    ...cam,
    cameraId: cam.id
});

export const mapBridge = (bridge: any) => ({
    ...bridge,
    bridgeId: bridge.id,
    group: true
});

/**
 * Create server-side datasource for AG Grid
 * Handles hierarchical loading based on groupKeys
 */
export function createServerSideDatasource(config: DatasourceConfig): IServerSideDatasource {
    return {
        async getRows(params: IServerSideGetRowsParams) {
            const {
                groupKeys,
                startRow,
                endRow,
            } = params.request;
            const currentLevel = groupKeys.length;
            const pageSize = endRow! - startRow!;

            try {
                if (startRow === undefined) {
                    params.fail();
                    return
                }
                const cacheKey = cameraGridTokenCache.getCacheKey(currentLevel, groupKeys);
                const pageToken = cameraGridTokenCache.getPageToken(cacheKey, startRow);

                const api = (
                    currentLevel === 0 ? getBridges : getCameras
                ) as (...props: unknown[]) => Promise<PaginatedResponse<unknown>>;
                const filters = currentLevel === 1 ? { bridgeId: groupKeys[0] } : undefined;
                const mapper = currentLevel === 0 ? mapBridge : mapCamera;

                const response = await api({
                    pageSize,
                    pageToken,
                    ...(filters || {})
                })
                cameraGridTokenCache.updateTokenCache(cacheKey, response.nextPageToken);
                
                params.success({
                    rowData: response.results.map(mapper),
                    ...(params.request.endRow === response.totalSize ? {rowCount: params.request.endRow} : {}) // Provide rowCount only if more pages exist
                });
                
            } catch (error) {
                console.error('[Datasource] Error:', error);
                params.fail();
            }
        }
    };
}



