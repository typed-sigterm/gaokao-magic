export default defineNuxtConfig({
  app: {
    head: {
      title: 'Gaokao Magic',
    },
  },
  compatibilityDate: '2026-06-06',
  ssr: false,
  css: ['~/app.css'],
  modules: ['@nuxt/fonts', '@nuxt/icon'],
  vite: {
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
    clientBundle: {
      scan: true,
    },
  },
});
