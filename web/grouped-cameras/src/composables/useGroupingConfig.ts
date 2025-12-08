import { ref, computed } from 'vue';
import type { ColDef } from 'ag-grid-community';

export type GroupingMode = 'location-bridge-camera' | 'location-camera' | 'bridge-camera';

export function useGroupingConfig() {
  const currentMode = ref<GroupingMode>('location-bridge-camera');

  // Column definitions that adapt to grouping mode
  const columnDefs = computed<ColDef[]>(() => {
    const baseColumns: ColDef[] = [
      {
        field: 'id',
        headerName: 'ID',
        minWidth: 150,
        filter: false
      },
      {
        field: 'status',
        headerName: 'Status',
        filter: 'agSetColumnFilter',
        filterParams: {
          values: ['online', 'offline', 'error'],
          buttons: ['apply', 'reset']
        },
        sortable: true,
        comparator: (a: string, b: string) => {
          // Sort order: online < offline < error
          const order: Record<string, number> = { online: 0, offline: 1, error: 2 };
          return order[a] - order[b];
        },
        cellStyle: (params) => {
          if (params.value === 'online') return { color: 'green', fontWeight: '500' };
          if (params.value === 'offline') return { color: 'orange', fontWeight: '500' };
          return { color: 'red', fontWeight: '500' };
        }
      }
    ];

    // Add LocationId column when not grouping by location or when grouping by bridge
    if (currentMode.value === 'bridge-camera') {
      baseColumns.push({
        field: 'locationId',
        headerName: 'Location ID',
        minWidth: 130
      });
    }

    // Add BridgeId column when skipping bridge grouping
    if (currentMode.value === 'location-camera') {
      baseColumns.push({
        field: 'bridgeId',
        headerName: 'Bridge ID',
        minWidth: 120
      });
    }

    return baseColumns;
  });

  // Row group columns based on mode
  const rowGroupCols = computed(() => {
    switch (currentMode.value) {
      case 'location-bridge-camera':
        return ['locationId', 'bridgeId'];
      case 'location-camera':
        return ['locationId'];
      case 'bridge-camera':
        return ['bridgeId'];
    }
  });

  function setGroupingMode(mode: GroupingMode) {
    console.log(`[GroupingConfig] Changing mode: ${currentMode.value} → ${mode}`);
    currentMode.value = mode;
  }

  return {
    currentMode,
    columnDefs,
    rowGroupCols,
    setGroupingMode
  };
}
