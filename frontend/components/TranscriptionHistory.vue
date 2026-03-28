<template>
  <div class="bg-white p-6 rounded shadow">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold text-text-main">Transcription History</h2>
      <button @click="loadHistory(null)" class="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded flex items-center transition-colors">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        Refresh
      </button>
    </div>

    <div v-if="loading && items.length === 0" class="text-center py-8 text-gray-500">
      Loading...
    </div>

    <div v-else-if="items.length === 0" class="text-center py-8 text-gray-500">
      No transcriptions found. Upload a file or record audio to get started.
    </div>

    <ul v-else class="divide-y divide-gray-200">
      <li v-for="item in items" :key="item.id" class="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-start group">
        <div class="mb-2 sm:mb-0 max-w-2xl">
          <div class="flex items-center space-x-2 text-xs text-text-muted mb-1">
            <span class="bg-surface-tint text-brand-primary px-2 py-0.5 rounded font-medium">{{ item.type === 'live' ? 'Microphone' : 'File Upload' }}</span>
            <span>{{ new Date(item.createdAt).toLocaleString() }}</span>
          </div>
          <p class="text-text-body line-clamp-3 leading-relaxed">{{ item.text }}</p>
        </div>
        <div class="flex-shrink-0 mt-2 sm:mt-0 sm:ml-4">
          <button @click="downloadFile(item)" class="text-brand-primary hover:text-brand-secondary bg-surface-tint hover:bg-gray-200 px-3 py-1 rounded text-sm font-medium transition-colors focus:ring-2 focus:ring-brand-primary focus:outline-none">
            Download .txt
          </button>
        </div>
      </li>
    </ul>

    <div class="mt-6 flex justify-center" v-if="lastKey">
      <button @click="loadHistory(lastKey)" :disabled="loading" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-6 rounded transition-colors disabled:opacity-50">
        {{ loading ? 'Loading...' : 'Load More' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const config = useRuntimeConfig();
const { fetchWithAuth } = useApi();
const userId = useCookie('userId');
const items = ref([]);
const lastKey = ref('');
const loading = ref(false);

const loadHistory = async (key = null) => {
  if (!userId.value) return; 
  if (!key) {
    items.value = [];
    lastKey.value = '';
  }

  loading.value = true;
  try {
    const res = await fetchWithAuth(`/transcriptions?userId=${encodeURIComponent(userId.value)}&limit=10${key ? `&lastEvaluatedKey=${key}` : ''}`);
    items.value = key ? [...items.value, ...res.items] : res.items;
    lastKey.value = res.lastEvaluatedKey || '';
  } catch (err) {
    console.error('Fetch history error', err);
  } finally {
    loading.value = false;
  }
};

const downloadFile = async (item) => {
  try {
    const url = `/transcriptions/${item.id}/download?userId=${encodeURIComponent(userId.value)}`;
    const textData = await fetchWithAuth(url);
    
    // Create a Blob from the text response
    const blob = new Blob([textData], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `transcription-${item.id}.txt`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Failed to download transcription', err);
    alert('Failed to download file.');
  }
};

onMounted(() => {
  loadHistory(null);
});

// Expose internal function to parent
defineExpose({ loadHistory });
</script>
