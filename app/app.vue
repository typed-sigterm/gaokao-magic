<script setup lang="ts">
import confetti from 'canvas-confetti';
import provinces from '~/assets/provinces.json';

// ─────────────────────────── QQ WebView detection ────────────────────────────
const isInApp = ref(false);
onMounted(() => {
  const ua = navigator.userAgent;
  if (/QQ\//i.test(ua) || /MQQBrowser/i.test(ua) || /QQJSSDK/i.test(ua) || /Wechat\//i.test(ua)) {
    isInApp.value = true;
  }
});

// ─────────────────────────── Stage machine ───────────────────────────────────
// stages:
//   0 = splash (stars + card + "Click to reveal")
//   1 = province selection overlay (stars bg still visible, card tilts)
//   2 = transition (card spins + zoom + white flash)
//   3 = cosmic portal final scene
const stage = ref(0);
const showProvinceModal = ref(false);
const showAboutModal = ref(false);

// ─────────────────────────── Province data ───────────────────────────────────
const cosmicPortalRef = ref<any>(null);

const province = useLocalStorage<string | null>('gaokao-province', null);
const provinceInfo = computed(() =>
  province.value ? provinces.find(p => p.name === province.value) ?? null : null,
);
const score = useLocalStorage<number | null>('gaokao-score', null);

function selectProvince(p: typeof provinces[0]) {
  showProvinceModal.value = false;
  province.value = p.name;
  startTransition();
}

function generateScore() {
  if (!provinceInfo.value)
    return;
  const total = provinceInfo.value.total;
  // Normal distribution using Box-Muller
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const min = 0.6;
  const mean = 0.8;
  const stdDev = 0.08;
  let raw = mean + z * stdDev;
  raw = Math.max(min, Math.min(1, raw));
  let s = Math.round(raw * total);
  if (s === total) {
    if (Math.random() > 0.99)
      confetti();
    else
      s = total - 1;
  }
  score.value = s;
}

// ─────────────────────────── Transition state ────────────────────────────────
const transitioning = ref(false);
const cardScale = ref(1);
const cardRotateDiag = ref(0);
const cardOpacity = ref(1);
const whiteFlash = ref(0); // 0 → 1
const bgBlack = ref(false); // stage 0→1: bg fades to black

const transitionDuration = 2000;
let transitionStart = 0;
const { resume: runCardTransition, pause: pauseCardTransition } = useRafFn(() => {
  const t = Math.min((performance.now() - transitionStart) / transitionDuration, 1);
  const eased = t ** 3; // ease-in cubic

  cardScale.value = 1 + eased * 12;
  cardRotateDiag.value = eased * 180;
  cardOpacity.value = 1 - eased * 0.8;
  whiteFlash.value = t;

  if (t >= 1) {
    pauseCardTransition();
    whiteFlash.value = 1;
    setTimeout(() => {
      stage.value = 3;
      transitioning.value = false;
      // fade out white
      const fadeStart = performance.now();
      function fadeOut(now: number) {
        const ft = Math.min((now - fadeStart) / 800, 1);
        whiteFlash.value = 1 - ft;
        if (ft < 1)
          requestAnimationFrame(fadeOut);
      }
      requestAnimationFrame(fadeOut);
      if (!score.value)
        generateScore();
    }, 100);
  }
}, { immediate: false });

function startTransition() {
  bgBlack.value = true;
  stage.value = 1;
  setTimeout(() => {
    stage.value = 2;
    transitioning.value = true;
    transitionStart = performance.now();
    runCardTransition();
  }, 300);
}

// ─────────────────────────── Click handlers ──────────────────────────────────
function handleSplashClick() {
  if (stage.value !== 0)
    return;
  if (provinceInfo.value) {
    bgBlack.value = true;
    setTimeout(() => {
      stage.value = 2;
      transitioning.value = true;
      transitionStart = performance.now();
      runCardTransition();
    }, 800);
    return;
  }
  showProvinceModal.value = true;
}

function handlePortalClick() {
  if (stage.value !== 3)
    return;
  generateScore();
  cosmicPortalRef.value?.zoomIn();
}

// Card tilt in stage 1 (province selected, bg turning black, card tilts on diagonal)
const cardTilted = computed(() => stage.value >= 1);
</script>

<template>
  <div class="fixed inset-0 overflow-hidden">
    <!-- ── In-app WebView banner ─────────────────────────────────────────────── -->
    <div
      v-if="isInApp"
      class="fixed inset-x-0 top-0 z-9999 flex items-center gap-3 border-b border-white/15 bg-black/92 px-5 py-3.5 font-saira"
    >
      <span class="text-lg">⚠️</span>
      <div>
        <div class="mb-0.5 text-[13px] font-semibold text-white">
          检测到微信 / QQ 内置浏览器
        </div>
        <div class="text-[11px] text-white/60">
          为获得最佳体验，请点击右上角 ··· 并选择"在浏览器打开"
        </div>
      </div>
    </div>

    <!-- ── Stage 0 & 1: Stars + Card ────────────────────────────────────── -->
    <div
      v-show="stage <= 1"
      class="absolute inset-0 z-1 transition-opacity duration-1000 ease-in-out"
      :class="bgBlack ? 'opacity-0' : 'opacity-100'"
    >
      <InspiraStarsBackground class="absolute inset-0" />
    </div>

    <!-- Pure black bg shown when bg fades -->
    <div class="absolute inset-0 z-0 bg-black" />

    <!-- Card (stages 0, 1, 2) -->
    <div
      v-show="stage <= 2"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
    >
      <div
        :style="{
          transform: transitioning
            ? `perspective(800px) rotate3d(1, -1, 0, ${cardRotateDiag}deg) scale(${cardScale})`
            : cardTilted
              ? 'perspective(800px) rotateX(6deg) rotateY(-6deg) scale(1)'
              : 'none',
          transition: transitioning ? 'none' : 'transform 1s cubic-bezier(0.4,0,0.2,1)',
          opacity: transitioning ? cardOpacity : 1,
          animation: (!transitioning && !cardTilted) ? 'breathe 3s ease-in-out infinite' : 'none',
          willChange: 'transform, opacity',
        }"
      >
        <img
          src="/cover.png"
          class="block w-[min(260px,55vw)] rounded-[14px] shadow-[0_0_60px_var(--color-glow),0_0_120px_rgba(80,60,180,0.3)]"
        >
      </div>

      <!-- "Click to reveal" text -->
      <div
        v-show="!showProvinceModal && stage === 0"
        class="mt-7 font-saira text-sm font-light uppercase tracking-[0.25em] text-white animate-pulse-glow"
        @click.stop="handleSplashClick"
      >
        Click to reveal
      </div>
    </div>

    <!-- Clickable overlay for stage 0 -->
    <div
      v-if="stage === 0 && !showProvinceModal"
      class="absolute inset-0 z-9 cursor-pointer"
      @click="handleSplashClick"
    />

    <!-- ── Province selection modal ──────────────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="showProvinceModal && stage === 0"
        class="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md"
        @click.self="showProvinceModal = false"
      >
        <div
          class="w-full max-w-[min(480px,92vw)] max-h-[80vh] overflow-y-auto scrollbar-glow rounded-2xl border border-border-glow bg-surface-overlay p-7 px-6"
          @click.stop
        >
          <div class="mb-5 text-center font-saira">
            <div class="mb-1.5 text-lg font-semibold tracking-wide text-white">
              选择你的省份
            </div>
            <div class="text-xs tracking-widest text-white/45">
              SELECT YOUR PROVINCE
            </div>
          </div>
          <div class="grid grid-cols-[repeat(auto-fill,4em)] gap-2">
            <button
              v-for="p in provinces"
              :key="p.name"
              class="cursor-pointer rounded-lg border border-border-glow-strong bg-btn-bg px-1 py-2 font-saira text-[13px] font-medium text-white/85 transition-all duration-200 hover:bg-btn-bg-hover"
              @click="selectProvince(p)"
            >
              {{ p.name }}
            </button>
            <p class="col-span-2 mt-3 text-center text-[11px] text-white/50">
              不参加高考的地区已省略
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── White flash overlay ───────────────────────────────────────────── -->
    <div
      v-show="whiteFlash > 0"
      class="absolute inset-0 z-100 bg-white pointer-events-none"
      :style="{ opacity: whiteFlash }"
    />

    <!-- ── About floating button (bottom-right) ─────────────────────────────── -->
    <button
      class="fixed bottom-5 right-5 z-200 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border-glow bg-btn-bg-active text-white/70 backdrop-blur-lg transition-all duration-250 hover:bg-btn-bg-hover"
      @click="showAboutModal = true"
    >
      <Icon name="lucide:info" size="20" />
    </button>

    <!-- ── About modal ────────────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="showAboutModal"
        class="fixed inset-0 z-300 flex items-center justify-center bg-black/75 backdrop-blur-md"
        @click.self="showAboutModal = false"
      >
        <div
          class="w-full max-w-[min(380px,88vw)] rounded-2xl border border-border-glow bg-surface-overlay p-8 px-7 text-center font-saira"
          @click.stop
        >
          <div class="mb-1.5 text-xl font-bold tracking-wide text-white">
            Gaokao Magic
          </div>

          <div class="mb-5 text-sm leading-[1.8] text-white/75">
            Presented by
            <a href="https://typed-sigterm.me/?utm_source=gaokao-magic.by-ts.top&utm_medium=copyright" target="_blank" class="font-semibold text-primary">Typed SIGTERM</a>
            <br>
            from
            <a href="https://www.paperchemis.com/?utm_source=gaokao-magic.by-ts.top&utm_medium=copyright" target="_blank" class="font-semibold text-primary">Paper Chemis</a>
            <br>
            Animation by
            <a href="https://inspira-ui.com" target="_blank" class="font-semibold text-primary">Inspira UI</a>
          </div>

          <a
            href="https://github.com/typed-sigterm/gaokao-magic"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 rounded-[10px] border border-border-glow bg-btn-bg-active px-5 py-2.5 text-[13px] font-medium text-white/85 no-underline transition-all duration-200 hover:bg-btn-bg-hover"
          >
            <Icon name="lucide:github" size="18" />
            GitHub
          </a>
        </div>
      </div>
    </Transition>

    <!-- ── Stage 3: Cosmic Portal ────────────────────────────────────────── -->
    <div
      v-show="stage === 3"
      class="absolute inset-0 z-20 cursor-pointer"
      @click="handlePortalClick"
    >
      <InspiraCosmicPortal
        ref="cosmicPortalRef"
        primary-color="#7c3aed"
        secondary-color="#2563eb"
        accent-color="#db2777"
        vortex-color="#059669"
        :bloom-strength="1.4"
        :rotation-speed="0.25"
        class="absolute inset-0"
      />

      <!-- Prompt text above the portal core -->
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-saira">
        <!-- Text above: click prompt -->
        <div
          class="mb-[max(120px,20vh)] px-6 text-center text-[22px] font-medium uppercase tracking-[0.2em] text-white/80 animate-pulse-glow"
        >
          Prefill your Gaokao score
          <div class="mt-2.5 text-base tracking-widest text-white/50">
            Click to resample
          </div>
        </div>

        <!-- Score display below -->
        <div
          v-if="score !== null"
          :key="score"
          class="mt-[max(120px,20vh)] text-center"
        >
          <div
            class="text-[clamp(52px,12vw,96px)] font-extrabold tracking-[-0.02em] text-white animate-score-in"
            style="text-shadow: 0 0 30px var(--color-score-glow), 0 0 80px var(--color-score-glow-deep)"
          >
            {{ score }}
          </div>
          <div class="mt-1.5 text-[clamp(12px,2vw,14px)] font-light uppercase tracking-[0.3em] text-white/40">
            / {{ provinceInfo?.total }} · {{ provinceInfo?.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-glow::-webkit-scrollbar { width: 4px; }
.scrollbar-glow::-webkit-scrollbar-track { background: transparent; }
.scrollbar-glow::-webkit-scrollbar-thumb { background: var(--color-glow-subtle); border-radius: 2px; }

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

<style>
@keyframes breathe {
  0%, 100% { transform: perspective(800px) rotateX(0deg) rotateY(0deg) scale(1); }
  50% { transform: perspective(800px) rotateX(0deg) rotateY(0deg) scale(1.04); }
}

@keyframes pulse-glow {
  0%, 100% { text-shadow: 0 0 8px rgba(255,255,255,0.3); }
  50% { text-shadow: 0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(180,160,255,0.4); }
}

@keyframes score-in {
  0% { opacity: 0; transform: translateY(20px) scale(0.8); }
  60% { transform: translateY(-4px) scale(1.05); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
