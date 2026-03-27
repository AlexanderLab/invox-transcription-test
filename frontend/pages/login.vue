<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="bg-white p-8 rounded shadow-md w-full max-w-sm">
      <h1 class="text-2xl font-bold mb-6 text-center text-brand-primary">Invox Login</h1>
      <form @submit.prevent="login">
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
            Login
          </button>
          <NuxtLink to="/register" class="inline-block align-baseline font-bold text-sm text-brand-primary hover:text-brand-secondary transition-colors">
            Register
          </NuxtLink>
        </div>
        <p v-if="error" class="text-red-500 text-xs italic mt-4">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
const router = useRouter();
const config = useRuntimeConfig();

const form = ref({ email: '', password: '' });
const error = ref('');

const login = async () => {
  error.value = '';
  try {
    const rawRes = await $fetch(`${config.public.apiBase}/auth/login`, {
      method: 'POST',
      body: form.value
    });
    const res = typeof rawRes === 'string' ? JSON.parse(rawRes) : rawRes;
    
    // Store token and userId
    const authToken = useCookie('authToken');
    authToken.value = res.tokens?.idToken || res.idToken;
    const userId = useCookie('userId');
    userId.value = res.userId;

    router.push('/');
  } catch (err) {
    error.value = err.data?.message || err.message;
  }
};
</script>
