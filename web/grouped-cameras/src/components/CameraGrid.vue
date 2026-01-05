<script setup lang="ts">
import {ref, computed, watch, onMounted, onBeforeUnmount} from 'vue';
import {AgGridVue} from 'ag-grid-vue3';
import {
  ModuleRegistry,
  type GridApi,
  type GridReadyEvent,
  type GridOptions
} from 'ag-grid-community';
import {
  ServerSideRowModelModule,
  RowGroupingModule,
  SetFilterModule,
  MenuModule, ServerSideRowModelApiModule
} from 'ag-grid-enterprise';
import {GroupingMode} from '../composables/useGridDatasource.ts';
import {createServerSideDatasource} from '../composables/useGridDatasource';
import {useAutoRefresh} from '../composables/useAutoRefresh';
import {cameraGridRowDataCache, CAMERA_GRID_CACHE_KEY} from '../service/CameraGridRowDataCache';
import type {CachedGridState, RouteData} from '../service/RowDataCache';
import {cameraGridTokenCache} from '../service/CameraGridTokenCache';

// Register AG Grid modules
ModuleRegistry.registerModules([
  ServerSideRowModelModule,
  ServerSideRowModelApiModule,
  RowGroupingModule,
  SetFilterModule,
  MenuModule
]);

const gridApi = ref<GridApi | null>(null);
const currentMode = ref<GroupingMode>('bridge-camera');

// Grid options
const gridOptions = computed<GridOptions>(() => {

  return {
    columnDefs: [
      {
        field: 'bridgeId',
        hide: true,
        showRowGroup: false,
        rowGroup: true
      },
      {
        field: 'cameraId',
        headerName: 'ID',
        minWidth: 150,
        filter: false,
        showRowGroup: false
      },
      {
        field: 'status',
        headerName: 'Status',
      }
    ],
    rowModelType: 'serverSide',
    serverSideDatasource: createServerSideDatasource({
      groupingMode: currentMode.value
    }),

    // Critical: Tell AG Grid which rows are groups
    isServerSideGroup: (dataItem: any) => {
      return dataItem.group === true;
    },

    // Critical: Tell AG Grid how to get the group key
    getServerSideGroupKey: (dataItem: any) => {
      return dataItem.id;
    },

    // Critical: Tell AG Grid how to identify rows for transactions
    getRowId: (params) => {
      return params.data.id;
    },

    cacheBlockSize: 10,
    maxBlocksInCache: 1000,
    maxConcurrentDatasourceRequests: 1,
    blockLoadDebounceMillis: 0,
    animateRows: true,
    rowSelection: 'multiple',
    suppressAggFuncInHeader: true,
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      resizable: true,
      sortable: false
    },
    onRowGroupOpened: (params) => {
      if (!params.expanded) {  // Group was collapsed
        const route = params.node.getRoute(); // Get the group path
        params.api.refreshServerSide({
          route: route,
          purge: true
        });
      }
    },
    onFirstDataRendered: onFirstDataRendered
  };
});

// Setup auto-refresh (30 seconds)
const {refreshVisibleRows} = useAutoRefresh(gridApi, currentMode, 30000);

/**
 * Get current scroll position from grid
 */
function getScrollPosition(): number {
  if (!gridApi.value) return 0;

  try {
    const gridBodyViewport = document.querySelector('.ag-body-viewport');
    if (gridBodyViewport) {
      return gridBodyViewport.scrollTop;
    }
  } catch (error) {
    console.warn('[CameraGrid] Could not get scroll position:', error);
  }

  return 0;
}

/**
 * Capture all loaded row data before unmount
 */
function captureGridState(): CachedGridState {
  if (!gridApi.value) {
    return {
      dataByRoute: new Map(),
      expandedGroups: new Set(),
      scrollTop: 0,
      timestamp: Date.now()
    };
  }

  const dataByRoute = new Map<string, RouteData>();
  const expandedGroups = new Set<string>();

  // Iterate ALL loaded nodes
  gridApi.value.forEachNode((node) => {
    if (!node.data) return;

    // Determine route based on node level and parent
    let route: string[] = [];

    if (node.level === 0) {
      // Bridge rows are at root level, route is empty
      route = [];
    } else if (node.level === 1 && node.parent) {
      // Camera rows - get parent bridge ID
      const parentData = node.parent.data;
      if (parentData && parentData.id) {
        route = [parentData.id];
      }
    }

    const routeKey = route.join('::');

    // Initialize route data if not exists
    if (!dataByRoute.has(routeKey)) {
      dataByRoute.set(routeKey, { rowData: [] });
    }

    // Add row data
    dataByRoute.get(routeKey)!.rowData.push(node.data);

    // Track expanded groups
    if (node.group && node.expanded) {
      expandedGroups.add(node.data.id);
    }
  });

  const scrollTop = getScrollPosition();

  return {
    dataByRoute,
    expandedGroups,
    scrollTop,
    timestamp: Date.now()
  };
}

// Store pending cache state for use in event handlers
const pendingCacheRestore = ref<CachedGridState | null>(null);

/**
 * Inject cached data using AG Grid API
 */
async function applyServerSideRowDataFromCache(cachedState: CachedGridState) {
  if (!gridApi.value) return;

  // Apply data for each route
  for (const [routeKey, routeData] of cachedState.dataByRoute.entries()) {
    const route = routeKey === '' ? [] : routeKey.split('::');

    console.log(`[CameraGrid] Restoring route="${routeKey}" with ${routeData.rowData.length} rows, route array:`, route);

    // Use successParams - same format as datasource params.success()
    gridApi.value.applyServerSideRowData({
      route: route,
      successParams: {
        rowData: routeData.rowData,
        ...(routeData.rowCount && {rowCount: routeData.rowCount} || {})
      }
    });

    console.log(`[CameraGrid] Successfully restored ${routeData.rowData.length} rows for route: ${routeKey || '(root)'}`);
  }
}

/**
 * Restore expanded groups
 */
function restoreExpandedGroups(expandedGroups: Set<string>) {
  if (!gridApi.value || expandedGroups.size === 0) return;

  console.log('[CameraGrid] Restoring expanded groups:', Array.from(expandedGroups));

  gridApi.value.forEachNode((node) => {
    if (node.group && node.data && expandedGroups.has(node.data.id)) {
      node.setExpanded(true);
    }
  });
}

/**
 * Restore scroll position
 */
function restoreScrollPosition(scrollTop: number) {
  if (!gridApi.value || scrollTop === 0) return;

  try {
    const gridBodyViewport = document.querySelector('.ag-body-viewport');
    if (gridBodyViewport) {
      gridBodyViewport.scrollTop = scrollTop;
      console.log('[CameraGrid] Restored scroll position:', scrollTop);
    }
  } catch (error) {
    console.warn('[CameraGrid] Could not restore scroll position:', error);
  }
}

/**
 * Initiate cache restoration
 */
async function restoreFromCache() {
  const cachedState = cameraGridRowDataCache.getState(CAMERA_GRID_CACHE_KEY);

  if (!cachedState || cachedState.dataByRoute.size === 0) {
    console.log('[CameraGrid] No cache found, starting fresh');
    return;
  }

  console.log('[CameraGrid] Restoring from cache:', {
    routeCount: cachedState.dataByRoute.size,
    expandedGroups: cachedState.expandedGroups.size,
    scrollTop: cachedState.scrollTop
  });

  // Store for use in firstDataRendered event
  pendingCacheRestore.value = cachedState;

  // Apply cached data using AG Grid API
  await applyServerSideRowDataFromCache(cachedState);
}

/**
 * Handle first data rendered event
 */
function onFirstDataRendered() {
  if (!pendingCacheRestore.value) return;

  console.log('[CameraGrid] First data rendered, restoring UI state');

  // Restore expanded groups
  restoreExpandedGroups(pendingCacheRestore.value.expandedGroups);

  // Wait for expansion animations before scrolling
  setTimeout(() => {
    if (pendingCacheRestore.value) {
      restoreScrollPosition(pendingCacheRestore.value.scrollTop);
      pendingCacheRestore.value = null;  // Clear pending state
    }
  }, 300);
}

async function onGridReady(event: GridReadyEvent) {
  gridApi.value = event.api;
  console.log('[CameraGrid] Grid ready');
  await restoreFromCache();
}

// Save state before unmount
onBeforeUnmount(() => {
  console.log('[CameraGrid] Capturing grid state before unmount...');
  const state = captureGridState();
  cameraGridRowDataCache.saveState(CAMERA_GRID_CACHE_KEY, state);
  console.log('[CameraGrid] Cached state:', {
    routeCount: state.dataByRoute.size,
    expandedCount: state.expandedGroups.size,
    scrollTop: state.scrollTop
  });
});

/**
 * Purge cache and refresh grid from scratch
 */
function purgeCache() {
  console.log('[CameraGrid] Purging cache...');
  cameraGridRowDataCache.clearState(CAMERA_GRID_CACHE_KEY);

  // Also clear token cache
  cameraGridTokenCache.clearAll();

  // Refresh grid from scratch
  if (gridApi.value) {
    gridApi.value.refreshServerSide({ purge: true });
  }
}

// Expose methods to parent
defineExpose({
  refreshVisibleRows,
  purgeCache
});
</script>

<template>
  <div class="camera-grid-container">
    <AgGridVue
        style="width: 100%; height: 100%;"
        class="ag-theme-quartz"
        :gridOptions="gridOptions"
        @grid-ready="onGridReady"
    />
  </div>
</template>

<style scoped>
.camera-grid-container {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
