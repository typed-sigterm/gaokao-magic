import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-06-06',

  app: {
    head: {
      title: 'Magic',
      meta: [
        { name: 'description', content: 'Prefill your Gaokao/Zhongkao score!' },
      ],
    },
  },

  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@vueuse/nuxt',
  ],

  ssr: false,

  css: ['~/app.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'canvas-confetti',
        'motion-v',
        'three',
        'three/addons/controls/OrbitControls.js',
        'three/addons/postprocessing/EffectComposer.js',
        'three/addons/postprocessing/RenderPass.js',
        'three/addons/postprocessing/ShaderPass.js',
        'three/addons/postprocessing/UnrealBloomPass.js',
        'three/addons/shaders/FXAAShader.js',
      ],
    },
  },

  nitro: {
    preset: 'cloudflare-module',
  },

  fonts: {
    provider: 'bunny',
    providers: {
      google: false,
      googleicons: false,
    },
    families: [
      { name: 'Saira', provider: 'bunny', weights: [300, 400, 500, 600, 700, 800] },
    ],
  },

  icon: {
    mode: 'svg',
    clientBundle: {
      scan: true,
    },
  },
});
