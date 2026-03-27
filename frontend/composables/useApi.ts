export const useAuthToken = () => {
  return useState<string | null>('authToken', () => null);
};

export const useApi = () => {
  const config = useRuntimeConfig();
  const token = useAuthToken();

  const fetchWithAuth = async (path: string, options: any = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`;
    }

    const res = await $fetch(`${config.public.apiBase}${path}`, {
      ...options,
      headers,
    });
    if (typeof res === 'string') {
      try {
        return JSON.parse(res);
      } catch (e) {
        return res;
      }
    }
    return res;
  };

  return { fetchWithAuth };
};
