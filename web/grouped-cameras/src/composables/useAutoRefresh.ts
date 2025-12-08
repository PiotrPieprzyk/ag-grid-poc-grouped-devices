import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import type { GridApi } from 'ag-grid-community';

/**
 * Auto-refresh composable for AG Grid
 * Refreshes visible/expanded rows at a specified interval
 */
export function useAutoRefresh(gridApiRef: Ref<GridApi | null>, intervalMs: number = 30000) {
  const isEnabled = ref(true);
  let intervalId: number | null = null;

  function refreshVisibleRows() {
    if (!gridApiRef.value || !isEnabled.value) return;

    console.log('[AutoRefresh] Refreshing visible rows...');

    // Option 1: Purge entire cache (simple approach)
    gridApiRef.value.refreshServerSide({ purge: true });

    // Option 2: Purge only expanded nodes (more efficient)
    // const expandedNodes: any[] = [];
    // gridApiRef.value.forEachNode((node) => {
    //   if (node.group && node.expanded) {
    //     expandedNodes.push(node);
    //   }
    // });
    // expandedNodes.forEach(node => {
    //   const route = [...node.groupKeys, node.key];
    //   gridApiRef.value!.purgeServerSideCache(route);
    // });
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
