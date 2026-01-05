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
    }
  };
});

// Setup auto-refresh (30 seconds)
const {refreshVisibleRows} = useAutoRefresh(gridApi, currentMode, 30000);

async function onGridReady(event: GridReadyEvent) {
  gridApi.value = event.api;
  console.log('[CameraGrid] Grid ready');
}


// Expose methods to parent
defineExpose({
  refreshVisibleRows
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
