<template>
  <div class="bg-white p-6 rounded shadow border-l-4" :class="isRecording ? 'border-red-500' : 'border-brand-primary'">
    <h2 class="text-xl font-bold mb-4 text-text-main">Live Microphone Transcription</h2>
    <p class="text-sm text-gray-500 mb-4">Record your voice to generate text in real-time.</p>
    
    <div class="mb-4">
      <button v-if="!isRecording" @click="startRecording" :disabled="loading" class="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50">
        {{ loading ? 'Connecting...' : 'Start Recording' }}
      </button>
      <button v-else @click="stopRecording" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors drop-shadow-md animate-pulse">
        Stop Recording
      </button>
    </div>

    <div class="bg-surface-tint p-4 rounded min-h-[100px] border border-gray-200">
      <p v-if="!transcriptionText && !currentPartial && !isRecording" class="text-text-muted italic text-sm text-center mt-6">Transcription will appear here...</p>
      <p class="text-text-body">
        {{ transcriptionText }}<span class="text-text-muted">{{ currentPartial }}</span>
      </p>
    </div>
    
    <button v-if="(transcriptionText || currentPartial) && !isRecording && !saved" @click="saveTranscription" class="mt-4 w-full bg-brand-success hover:opacity-90 text-white font-bold py-2 px-4 rounded transition-colors">
      Save Transcription
    </button>
    <p v-if="saved" class="text-brand-success text-sm mt-4 text-center flex justify-center items-center">
      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
      Saved successfully!
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
const isRecording = ref(false);
const loading = ref(false);
const transcriptionText = ref('');
const currentPartial = ref('');
const saved = ref(false);

let socket = null;
let audioContext = null;
let mediaStream = null;
let processor = null;
let source = null;

const { fetchWithAuth } = useApi();
const userId = useCookie('userId');
const emit = defineEmits(['refresh']);

const startRecording = async () => {
  loading.value = true;
  transcriptionText.value = '';
  currentPartial.value = '';
  saved.value = false;

  try {
    const res = await fetchWithAuth('/auth/ai-token');
    const token = res.token;

    // AssemblyAI v3 streaming endpoint
    const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&speech_model=u3-rt-pro&token=${token}`;
    
    socket = new WebSocket(wsUrl);

    socket.onopen = async () => {
      isRecording.value = true;
      loading.value = false;

      // Get microphone access
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup AudioContext for raw PCM16
      audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      source = audioContext.createMediaStreamSource(mediaStream);
      processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const outputData = new Int16Array(inputData.length);
        
        // Convert Float32 to Int16 PCM
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          outputData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        socket.send(outputData.buffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    };

    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      console.log('WS Message:', data);
      
      if (data.transcript) {
        if (data.end_of_turn === true) {
          transcriptionText.value += data.transcript + ' ';
          currentPartial.value = '';
        } else {
          currentPartial.value = data.transcript;
        }
      }
    };

    socket.onerror = (e) => {
      console.error('Socket error:', e);
      stopRecording();
    };

    socket.onclose = (e) => {
      console.log('Socket closed:', e.code, e.reason);
      if (isRecording.value) stopRecording();
    };

  } catch (err) {
    console.error('Recording error', err);
    loading.value = false;
  }
};

const stopRecording = () => {
  if (processor) {
    processor.disconnect();
    processor = null;
  }
  if (source) {
    source.disconnect();
    source = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
    audioContext = null;
  }
  
  if (currentPartial.value) {
    transcriptionText.value += currentPartial.value + ' ';
    currentPartial.value = '';
  }
  
  if (socket) {
    socket.close();
    socket = null;
  }
  
  isRecording.value = false;
};

const saveTranscription = async () => {
  const finalText = transcriptionText.value || currentPartial.value;
  if (!finalText) return;
  try {
    await fetchWithAuth('/transcriptions/live', {
      method: 'POST',
      body: {
        userId: userId.value,
        text: finalText
      }
    });
    saved.value = true;
    emit('refresh');
  } catch (err) {
    console.error('Save live error', err);
    alert('Could not save live transcription.');
  }
};
</script>
