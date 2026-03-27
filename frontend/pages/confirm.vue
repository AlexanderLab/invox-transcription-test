<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="bg-white p-8 rounded shadow-md w-full max-w-sm">
      <h1 class="text-2xl font-bold mb-4 text-center text-brand-primary">Confirm Account</h1>
      <p class="text-sm text-gray-600 mb-6 text-center">Enter the confirmation code sent to your email.</p>
      <form @submit.prevent="confirm">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input v-model="form.email" type="email" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100" readonly>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2">Code</label>
          <input v-model="form.code" type="text" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3" required>
        </div>
        <div class="flex items-center justify-between">
          <button class="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded w-full transition-colors" type="submit">
            Confirm
          </button>
        </div>
        <p v-if="error" class="text-red-500 text-xs italic mt-4">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

const form = ref({ email: route.query.email || '', code: '' });
const error = ref('');

const confirm = async () => {
  error.value = '';
  try {
    const res = await $fetch(`${config.public.apiBase}/auth/confirm`, {
      method: 'POST',
      body: form.value
    });
    router.push('/login');
  } catch (err) {
    error.value = err.data?.message || err.message;
  }
};
</script>
