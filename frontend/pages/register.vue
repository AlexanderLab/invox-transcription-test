<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="bg-white p-8 rounded shadow-md w-full max-w-sm">
      <h1 class="text-2xl font-bold mb-6 text-center text-brand-primary">Invox Register</h1>
      <form @submit.prevent="register">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Name</label>
          <input v-model="form.name" type="text" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input v-model="form.email" type="email" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input v-model="form.password" type="password" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3" required>
        </div>
        <div class="flex items-center justify-between">
          <button class="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded transition-colors" type="submit">
            Register
          </button>
          <NuxtLink to="/login" class="inline-block align-baseline font-bold text-sm text-brand-primary hover:text-brand-secondary transition-colors">
            Login
          </NuxtLink>
        </div>
        <p v-if="error" class="text-red-500 text-xs italic mt-4">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
const form = ref({ name: '', email: '', password: '' });
const error = ref('');
const config = useRuntimeConfig();
const router = useRouter();

const register = async () => {
  error.value = '';
  try {
    const res = await $fetch(`${config.public.apiBase}/auth/register`, {
      method: 'POST',
      body: form.value
    });
    // Redirect to confirm with email as query param
    router.push({ path: '/confirm', query: { email: form.value.email } });
  } catch (err) {
    error.value = err.data?.message || err.message;
  }
};
</script>
