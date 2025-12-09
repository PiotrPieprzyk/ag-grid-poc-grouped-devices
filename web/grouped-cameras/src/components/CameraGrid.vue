<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
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
  MenuModule
} from 'ag-grid-enterprise';
import { useGroupingConfig } from '../composables/useGroupingConfig';
import { createServerSideDatasource } from '../composables/useGridDatasource';
import { useAutoRefresh } from '../composables/useAutoRefresh';

// Register AG Grid modules
ModuleRegistry.registerModules([
  ServerSideRowModelModule,
  RowGroupingModule,
  SetFilterModule,
  MenuModule
]);

const gridApi = ref<GridApi | null>(null);
const { columnDefs, currentMode, setGroupingMode } = useGroupingConfig();

// Grid options
const gridOptions = computed<GridOptions>(() => ({
  columnDefs: columnDefs.value,
  rowModelType: 'serverSide',
  serverSideDatasource: createServerSideDatasource({
    groupingMode: currentMode.value,
    
  }),

  // Critical: Tell AG Grid which rows are groups
  isServerSideGroup: (dataItem: any) => {
    return dataItem.group === true;
  },

  // Critical: Tell AG Grid how to get the group key
  getServerSideGroupKey: (dataItem: any) => {
    return dataItem.id;
  },

  cacheBlockSize: 10,
  maxBlocksInCache: 1000,
  maxConcurrentDatasourceRequests: 1,
  blockLoadDebounceMillis: 0,
  animateRows: true,
  rowSelection: 'multiple',
  suppressAggFuncInHeader: true,
  groupDefaultExpanded: 0, // Collapse all by default
  defaultColDef: {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: false
  }
}));

// Setup auto-refresh (30 seconds)
const { refreshVisibleRows } = useAutoRefresh(gridApi, 30000);

function onGridReady(event: GridReadyEvent) {
  gridApi.value = event.api;
  console.log('[CameraGrid] Grid ready');
}

// Expose methods to parent
defineExpose({
  setGroupingMode,
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
