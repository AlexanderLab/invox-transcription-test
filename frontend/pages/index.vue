<template>
  <div class="min-h-screen bg-surface-base flex flex-col">
    <!-- Navbar -->
    <nav class="bg-brand-primary text-white shadow p-4 flex justify-between items-center">
      <h1 class="text-xl font-bold">Vócali Transcription</h1>
      <div class="flex items-center space-x-4">
        <span>{{ userEmail }}</span>
        <button @click="logout" class="bg-brand-secondary hover:bg-black font-bold py-1 px-3 rounded text-sm text-white transition-colors">
          Logout
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-grow container mx-auto p-4 sm:p-8 space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Components -->
        <AudioUpload @refresh="fetchHistory" />
        <RealTimeRecorder @refresh="fetchHistory" />
      </div>

      <!-- History Section -->
      <TranscriptionHistory ref="historyRef" />
    </main>
  </div>
</template>

<script setup>
const router = useRouter();
const authToken = useCookie('authToken');
const userEmail = useCookie('userEmail');
const historyRef = ref(null);

definePageMeta({
  middleware: [
    (to, from) => {
      const token = useCookie('authToken');
      if (!token.value) {
        return navigateTo('/login');
      }
    }
  ]
})

const logout = () => {
  authToken.value = null;
  userEmail.value = null;
  router.push('/login');
};

const fetchHistory = () => {
  if (historyRef.value) {
    historyRef.value.loadHistory();
  }
};
</script>
