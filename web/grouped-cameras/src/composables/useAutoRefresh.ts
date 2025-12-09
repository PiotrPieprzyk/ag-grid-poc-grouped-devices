import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import type { GridApi } from 'ag-grid-community';
import { getCameras, getBridges, getLocations } from 'mock-server';
import { mapLocation, mapBridge, mapCamera } from './useGridDatasource';
import type { GroupingMode } from './useGroupingConfig';

interface VisibleEntities {
  locationIds: Set<string>;
  bridgeIds: Set<string>;
  cameraIds: Set<string>;
}

interface FetchedData {
  locations: any[];
  bridges: any[];
  cameras: any[];
}

interface TransactionBatch {
  route: string[];
  update: any[];
}

/**
 * Extract visible entity IDs from rendered nodes
 */
function extractVisibleEntities(gridApi: GridApi, groupingMode: GroupingMode): VisibleEntities {
  const entities: VisibleEntities = {
    locationIds: new Set(),
    bridgeIds: new Set(),
    cameraIds: new Set()
  };

  const nodes = gridApi.getRenderedNodes();

  nodes.forEach(node => {
    if (!node.data) return;

    const isGroup = node.group === true;
    const level = node.level;

    if (groupingMode === 'location-bridge-camera') {
      if (level === 0 && isGroup) {
        // Top level: Locations
        entities.locationIds.add(node.data.locationId || node.data.id);
      } else if (level === 1 && isGroup) {
        // Second level: Bridges
        entities.bridgeIds.add(node.data.bridgeId || node.data.id);
      } else if (level === 2 && !isGroup) {
        // Third level: Cameras
        entities.cameraIds.add(node.data.cameraId || node.data.id);
      }
    } else if (groupingMode === 'location-camera') {
      if (level === 0 && isGroup) {
        // Top level: Locations
        entities.locationIds.add(node.data.locationId || node.data.id);
      } else if (level === 1 && !isGroup) {
        // Second level: Cameras
        entities.cameraIds.add(node.data.cameraId || node.data.id);
      }
    } else if (groupingMode === 'bridge-camera') {
      if (level === 0 && isGroup) {
        // Top level: Bridges
        entities.bridgeIds.add(node.data.bridgeId || node.data.id);
      } else if (level === 1 && !isGroup) {
        // Second level: Cameras
        entities.cameraIds.add(node.data.cameraId || node.data.id);
      }
    }
  });

  console.log('[AutoRefresh] Extracted entities:', {
    locations: entities.locationIds.size,
    bridges: entities.bridgeIds.size,
    cameras: entities.cameraIds.size
  });

  return entities;
}

/**
 * Fetch fresh data for visible entities
 */
async function fetchVisibleData(
  entities: VisibleEntities,
  filterModel: any
): Promise<FetchedData> {
  const statusFilter = filterModel?.status?.values as string[] | undefined;

  const results = await Promise.all([
    // Fetch locations
    entities.locationIds.size > 0
      ? getLocations({
          id__in: Array.from(entities.locationIds)
        }).then(response => response.results)
      : Promise.resolve([]),

    // Fetch bridges
    entities.bridgeIds.size > 0
      ? getBridges({
          id__in: Array.from(entities.bridgeIds),
          status__in: statusFilter
        }).then(response => response.results)
      : Promise.resolve([]),

    // Fetch cameras
    entities.cameraIds.size > 0
      ? getCameras({
          id__in: Array.from(entities.cameraIds),
          status__in: statusFilter
        }).then(response => response.results)
      : Promise.resolve([])
  ]);

  console.log('[AutoRefresh] Fetched data:', {
    locations: results[0].length,
    bridges: results[1].length,
    cameras: results[2].length
  });

  return {
    locations: results[0],
    bridges: results[1],
    cameras: results[2]
  };
}

/**
 * Group fetched data into transaction batches by route
 */
function groupIntoTransactionBatches(
  data: FetchedData,
  groupingMode: GroupingMode
): TransactionBatch[] {
  const batches: TransactionBatch[] = [];

  // Transform data using mappers
  const mappedLocations = data.locations.map(mapLocation).map(i => ({ ...i, tradeId: i.id }));
  const mappedBridges = data.bridges.map(mapBridge).map(i => ({ ...i, tradeId: i.id }));
  const mappedCameras = data.cameras.map(mapCamera).map(i => ({ ...i, tradeId: i.id }));

  if (groupingMode === 'location-bridge-camera') {
    // Top-level: Locations (route: [])
    if (mappedLocations.length > 0) {
      batches.push({
        route: [],
        update: mappedLocations
      });
    }

    // Second-level: Bridges grouped by locationId (route: [locationId])
    const bridgesByLocation = new Map<string, any[]>();
    mappedBridges.forEach(bridge => {
      const locationId = bridge.locationId;
      if (!bridgesByLocation.has(locationId)) {
        bridgesByLocation.set(locationId, []);
      }
      bridgesByLocation.get(locationId)!.push(bridge);
    });

    bridgesByLocation.forEach((bridges, locationId) => {
      batches.push({
        route: [locationId],
        update: bridges
      });
    });

    // Third-level: Cameras grouped by locationId + bridgeId (route: [locationId, bridgeId])
    const camerasByRoute = new Map<string, any[]>();
    mappedCameras.forEach(camera => {
      const routeKey = `${camera.locationId}:${camera.bridgeId}`;
      if (!camerasByRoute.has(routeKey)) {
        camerasByRoute.set(routeKey, []);
      }
      camerasByRoute.get(routeKey)!.push(camera);
    });

    camerasByRoute.forEach((cameras, routeKey) => {
      const [locationId, bridgeId] = routeKey.split(':');
      batches.push({
        route: [locationId, bridgeId],
        update: cameras
      });
    });

  } else if (groupingMode === 'location-camera') {
    // Top-level: Locations (route: [])
    if (mappedLocations.length > 0) {
      batches.push({
        route: [],
        update: mappedLocations
      });
    }

    // Second-level: Cameras grouped by locationId (route: [locationId])
    const camerasByLocation = new Map<string, any[]>();
    mappedCameras.forEach(camera => {
      const locationId = camera.locationId;
      if (!camerasByLocation.has(locationId)) {
        camerasByLocation.set(locationId, []);
      }
      camerasByLocation.get(locationId)!.push(camera);
    });

    camerasByLocation.forEach((cameras, locationId) => {
      batches.push({
        route: [locationId],
        update: cameras
      });
    });

  } else if (groupingMode === 'bridge-camera') {
    // Top-level: Bridges (route: [])
    if (mappedBridges.length > 0) {
      batches.push({
        route: [],
        update: mappedBridges
      });
    }

    // Second-level: Cameras grouped by bridgeId (route: [bridgeId])
    const camerasByBridge = new Map<string, any[]>();
    mappedCameras.forEach(camera => {
      const bridgeId = camera.bridgeId;
      if (!camerasByBridge.has(bridgeId)) {
        camerasByBridge.set(bridgeId, []);
      }
      camerasByBridge.get(bridgeId)!.push(camera);
    });

    camerasByBridge.forEach((cameras, bridgeId) => {
      batches.push({
        route: [bridgeId],
        update: cameras
      });
    });
  }

  console.log('[AutoRefresh] Created transaction batches:', batches.length);

  return batches;
}

/**
 * Auto-refresh composable for AG Grid
 * Refreshes visible/expanded rows at a specified interval using getRenderedNodes and transactions
 */
export function useAutoRefresh(
  gridApiRef: Ref<GridApi | null>,
  groupingMode: Ref<GroupingMode>,
  intervalMs: number = 30000
) {
  const isEnabled = ref(true);
  let intervalId: number | null = null;

  async function refreshVisibleRows() {
    if (!gridApiRef.value || !isEnabled.value) return;

    try {
      console.log('[AutoRefresh] Refreshing visible rows...');

      // 1. Extract visible entity IDs
      const entities = extractVisibleEntities(gridApiRef.value, groupingMode.value);

      if (entities.locationIds.size === 0 &&
          entities.bridgeIds.size === 0 &&
          entities.cameraIds.size === 0) {
        console.log('[AutoRefresh] No visible entities, skipping refresh');
        return;
      }

      // 2. Fetch fresh data with filters
      const filterModel = gridApiRef.value.getFilterModel();
      const fetchedData = await fetchVisibleData(entities, filterModel);

      // 3. Create transaction batches
      const batches = groupIntoTransactionBatches(fetchedData, groupingMode.value);

      // 4. Apply transactions
      batches.forEach(batch => {
        const result = gridApiRef.value!.applyServerSideTransaction({
          route: batch.route,
          update: batch.update
        });
        console.log(`[AutoRefresh] Applied transaction for route: [${batch.route.join(', ')}]`, result);
      });

      console.log('[AutoRefresh] Refresh complete');
    } catch (error) {
      console.error('[AutoRefresh] Error during refresh:', error);
    }
  }

  function startAutoRefresh() {
    if (intervalId) return;

    intervalId = window.setInterval(() => {
      refreshVisibleRows();
    }, intervalMs);

    console.log(`[AutoRefresh] Started (interval: ${intervalMs}ms)`);
  }

  function stopAutoRefresh() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      console.log('[AutoRefresh] Stopped');
    }
  }

  function toggleAutoRefresh() {
    isEnabled.value = !isEnabled.value;
    if (isEnabled.value) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }

  onMounted(() => {
    if (isEnabled.value) {
      startAutoRefresh();
    }
  });

  onUnmounted(() => {
    stopAutoRefresh();
  });

  return {
    isEnabled,
    refreshVisibleRows,
    toggleAutoRefresh,
    startAutoRefresh,
    stopAutoRefresh
  };
}
