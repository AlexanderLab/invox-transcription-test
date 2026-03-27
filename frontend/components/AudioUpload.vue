<template>
  <div class="bg-white p-6 rounded shadow border-l-4 border-brand-primary">
    <h2 class="text-xl font-bold mb-4 text-text-main">Upload Audio File</h2>
    <p class="text-sm text-gray-500 mb-4">Maximum size: 20MB. Formats: mp3, wav, m4a.</p>
    
    <div class="flex flex-col space-y-4">
      <div class="flex items-center space-x-4">
        <input type="file" @change="handleFile" accept="audio/*" class="w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-surface-tint file:text-brand-primary hover:file:bg-gray-200" />
      </div>
      
      <button @click="upload" :disabled="!file || uploading" class="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {{ uploading ? 'Uploading...' : 'Upload & Transcribe' }}
      </button>
    </div>
    
    <p v-if="message" :class="{'text-brand-success': !error, 'text-red-600': error}" class="mt-4 text-sm font-medium">{{ message }}</p>
  </div>
</template>

<script setup>
const file = ref(null);
const uploading = ref(false);
const message = ref('');
const error = ref(false);

const { fetchWithAuth } = useApi();
const userId = useCookie('userId');
const emit = defineEmits(['refresh']);

const handleFile = (e) => {
  file.value = e.target.files[0];
};

const upload = async () => {
  if (!file.value) return;
  if (file.value.size > 20 * 1024 * 1024) {
    message.value = 'File exceeds 20MB limit';
    error.value = true;
    return;
  }

  uploading.value = true;
  message.value = '';
  error.value = false;

  try {
    const ext = file.value.name.split('.').pop() || 'mp3';
    console.log('[Upload 1] Requesting presigned URL, userId=', userId.value, 'ext=', ext);
    // 1. Get presigned URL
    const { uploadUrl, key, fileId } = await fetchWithAuth('/transcriptions/presigned-url', {
      method: 'POST',
      body: {
        userId: userId.value,
        contentType: file.value.type || 'audio/mpeg',
        extension: ext
      }
    });
    console.log('[Upload 2] Presigned URL received, key=', key, 'fileId=', fileId);

    // 2. Upload to S3
    console.log('[Upload 3] Uploading to S3...', uploadUrl.substring(0, 80));
    const s3Res = await $fetch(uploadUrl, {
      method: 'PUT',
      body: file.value,
      headers: {
        'Content-Type': file.value.type || 'audio/mpeg'
      }
    });
    console.log('[Upload 4] S3 PUT result:', s3Res);

    message.value = 'Upload successful! Transcription is processing in the background...';
    file.value = null;
    
    // Emit refresh to trigger latest history logic
    emit('refresh');

  } catch (err) {
    console.error(err);
    message.value = 'Error uploading file.';
    error.value = true;
  } finally {
    uploading.value = false;
  }
};
</script>
