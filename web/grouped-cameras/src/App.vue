<script setup lang="ts">
import { ref } from 'vue';
import CameraGrid from './components/CameraGrid.vue';
import GridControls from './components/GridControls.vue';
import type { GroupingMode } from './composables/useGroupingConfig';

const gridRef = ref<InstanceType<typeof CameraGrid> | null>(null);

function handleRefresh() {
  gridRef.value?.refreshVisibleRows();
}

function handleGroupingChange(mode: GroupingMode) {
  gridRef.value?.setGroupingMode(mode);
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>AG Grid POC - Grouped Cameras</h1>
      <p>Hierarchical Server-Side Row Model: Location → Bridge → Camera</p>
    </header>

    <GridControls
      @refresh="handleRefresh"
      @grouping-change="handleGroupingChange"
    />

    <main class="app-main">
      <CameraGrid ref="gridRef" />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.app-header {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.app-header p {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.9;
}

.app-main {
  flex: 1;
  overflow: hidden;
  padding: 1rem;
  background: #f5f7fa;
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100vh;
}
</style>
