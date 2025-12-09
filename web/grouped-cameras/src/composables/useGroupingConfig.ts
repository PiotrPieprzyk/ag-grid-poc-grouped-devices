import {ref, computed} from 'vue';
import type {ColDef} from 'ag-grid-community';

export type GroupingMode = 'location-bridge-camera' | 'location-camera' | 'bridge-camera';

export function useGroupingConfig() {
    const currentMode = ref<GroupingMode>('location-bridge-camera');

    const groupingColumns = computed<ColDef[]>(() => {
        switch (currentMode.value) {
            case 'location-bridge-camera':
                return [
                    {
                        field: 'locationId',
                        hide: true,
                        rowGroup: true,
                        showRowGroup: false,
                    },
                    {
                        field: 'bridgeId',
                        hide: true,
                        showRowGroup: false,
                        rowGroup: true
                    }
                ];
            case 'location-camera':
                return [{
                    field: 'locationId',
                    hide: true,
                    showRowGroup: false,
                    rowGroup: true
                }];
            case 'bridge-camera':
                return [{
                    field: 'bridgeId',
                    hide: true,
                    showRowGroup: false,
                    rowGroup: true
                }];
        }
    })

    // Column definitions that adapt to grouping mode
    const columnDefs = computed<ColDef[]>(() => {
        const baseColumns: ColDef[] = [
            ...(groupingColumns.value),
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
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: ['online', 'offline', 'error'],
                    buttons: ['apply', 'reset']
                },
                sortable: true,
                comparator: (a: string, b: string) => {
                    // Sort order: online < offline < error
                    const order: Record<string, number> = {online: 0, offline: 1, error: 2};
                    return order[a] - order[b];
                },
                cellStyle: (params) => {
                    if (params.value === 'online') return {color: 'green', fontWeight: '500'};
                    if (params.value === 'offline') return {color: 'orange', fontWeight: '500'};
                    return {color: 'red', fontWeight: '500'};
                }
            }
        ];

        return baseColumns;
    });



    function setGroupingMode(mode: GroupingMode) {
        console.log(`[GroupingConfig] Changing mode: ${currentMode.value} → ${mode}`);
        currentMode.value = mode;
    }

    return {
        currentMode,
        columnDefs,
        setGroupingMode
    };
}
