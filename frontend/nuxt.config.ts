// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: '.',
  ssr: false, // SPA mode for easier audio recording / cognito logic
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2026-03-26',
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {},
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_URL,
      wsBase: process.env.NUXT_PUBLIC_WS_URL,
    }
  }
})
