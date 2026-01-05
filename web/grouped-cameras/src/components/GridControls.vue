<script setup lang="ts">
import { ref } from 'vue';
import { updateBridgeStatus, updateCameraStatus } from 'mock-server';
import type { GroupingMode } from '../composables/useGridDatasource.ts';

const emit = defineEmits<{
  refresh: []
  groupingChange: [mode: GroupingMode]
  reset: []
  purgeAndRefresh: []
}>();

const loading = ref(false);
const message = ref('');

async function setBridgeStatus(status: 'online' | 'offline') {
  loading.value = true;
  message.value = '';
  try {
    const result = await updateBridgeStatus('Bridge-1', status);
    message.value = result.message || `Bridge-1 set to ${status}`;
    emit('refresh');
  } catch (error) {
    message.value = `Error: ${error}`;
  } finally {
    loading.value = false;
    setTimeout(() => message.value = '', 3000);
  }
}

async function setCameraStatus(status: 'online' | 'offline') {
  loading.value = true;
  message.value = '';
  try {
    const result = await updateCameraStatus('Camera-1', status);
    message.value = result.message || `Camera-1 set to ${status}`;
    emit('refresh');
  } catch (error) {
    message.value = `Error: ${error}`;
  } finally {
    loading.value = false;
    setTimeout(() => message.value = '', 3000);
  }
}

function manualRefresh() {
  emit('refresh');
}

function resetGrid() {
  emit('reset');
}

function purgeAndRefresh() {
  emit('purgeAndRefresh');
}
</script>

<template>
  <div class="controls-panel">
    <div class="control-group">
      <h3>Debug Controls</h3>
      <div class="button-row">
        <button @click="setBridgeStatus('offline')" :disabled="loading">
          Set Bridge-1 Offline
        </button>
        <button @click="setBridgeStatus('online')" :disabled="loading">
          Set Bridge-1 Online
        </button>
        <button @click="setCameraStatus('offline')" :disabled="loading">
          Set Camera-1 Offline
        </button>
        <button @click="setCameraStatus('online')" :disabled="loading">
          Set Camera-1 Online
        </button>
        <button @click="manualRefresh" class="btn-refresh">
          🔄 Refresh Data
        </button>
        <button @click="purgeAndRefresh" class="btn-purge">
          🗑️ Purge & Refresh
        </button>
        <button @click="resetGrid" class="btn-reset">
          ⚡ Reset Grid
        </button>
      </div>
    </div>

    <div v-if="message" class="message">
      {{ message }}
    </div>
  </div>
</template>

<style scoped>
.controls-panel {
  background: white;
  border-bottom: 2px solid #e2e8f0;
  padding: 1.5rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.control-group {
  margin-bottom: 1rem;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-group h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.button-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

button {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button.btn-refresh {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  box-shadow: 0 2px 4px rgba(72, 187, 120, 0.3);
}

button.btn-refresh:hover:not(:disabled) {
  box-shadow: 0 4px 8px rgba(72, 187, 120, 0.4);
}

button.btn-purge {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  box-shadow: 0 2px 4px rgba(237, 137, 54, 0.3);
}

button.btn-purge:hover:not(:disabled) {
  box-shadow: 0 4px 8px rgba(237, 137, 54, 0.4);
}

button.btn-reset {
  background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
  box-shadow: 0 2px 4px rgba(245, 101, 101, 0.3);
}

button.btn-reset:hover:not(:disabled) {
  box-shadow: 0 4px 8px rgba(245, 101, 101, 0.4);
}

.message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #e6fffa;
  color: #234e52;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  border-left: 4px solid #38b2ac;
}
</style>
