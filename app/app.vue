<script setup lang="ts">
import confetti from 'canvas-confetti';

// ─────────────────────────── QQ WebView detection ────────────────────────────
const isQQ = ref(false);
onMounted(() => {
  const ua = navigator.userAgent;
  if (/QQ\//i.test(ua) || /MQQBrowser/i.test(ua) || /QQJSSDK/i.test(ua)) {
    isQQ.value = true;
  }
});

// ─────────────────────────── Stage machine ───────────────────────────────────
// stages:
//   0 = splash (stars + card + "Click to reveal")
//   1 = province selection overlay (stars bg still visible, card tilts)
//   2 = transition (card spins + zoom + white flash)
//   3 = cosmic portal final scene
const stage = ref(0);

// ─────────────────────────── Province data ───────────────────────────────────
const provinces = [
  {
    name: '安徽',
    total: 750,
  },
  {
    name: '北京',
    total: 750,
  },
  {
    name: '重庆',
    total: 750,
  },
  {
    name: '福建',
    total: 750,
  },
  {
    name: '甘肃',
    total: 750,
  },
  {
    name: '广东',
    total: 750,
  },
  {
    name: '广西',
    total: 750,
  },
  {
    name: '贵州',
    total: 750,
  },
  {
    name: '海南',
    total: 900,
  },
  {
    name: '河北',
    total: 750,
  },
  {
    name: '河南',
    total: 750,
  },
  {
    name: '黑龙江',
    total: 750,
  },
  {
    name: '湖北',
    total: 750,
  },
  {
    name: '湖南',
    total: 750,
  },
  {
    name: '吉林',
    total: 750,
  },
  {
    name: '江苏',
    total: 750,
  },
  {
    name: '江西',
    total: 750,
  },
  {
    name: '辽宁',
    total: 750,
  },
  {
    name: '内蒙古',
    total: 750,
  },
  {
    name: '宁夏',
    total: 750,
  },
  {
    name: '青海',
    total: 750,
  },
  {
    name: '山东',
    total: 750,
  },
  {
    name: '山西',
    total: 750,
  },
  {
    name: '陕西',
    total: 750,
  },
  {
    name: '上海',
    total: 660,
  },
  {
    name: '四川',
    total: 750,
  },
  {
    name: '天津',
    total: 750,
  },
  {
    name: '西藏',
    total: 750,
  },
  {
    name: '新疆',
    total: 750,
  },
  {
    name: '云南',
    total: 750,
  },
  {
    name: '浙江',
    total: 750,
  },
];

const selectedProvince = ref<{ name: string, total: number } | null>(null);
const score = ref<number | null>(null);
const cosmicPortalRef = ref<any>(null);

// ─────────────────────────── localStorage persistence ────────────────────────
onMounted(() => {
  const saved = localStorage.getItem('gaokao-province');
  if (saved) {
    const p = provinces.find(p => p.name === saved);
    if (p)
      selectedProvince.value = p;
  }
  const savedScore = localStorage.getItem('gaokao-score');
  if (savedScore)
    score.value = Number(savedScore);
});

function selectProvince(p: typeof provinces[0]) {
  if (selectedProvince.value)
    return; // already set, immutable
  selectedProvince.value = p;
  localStorage.setItem('gaokao-province', p.name);
  // proceed to transition after a brief delay
  startTransition();
}

function generateScore() {
  if (!selectedProvince.value)
    return;
  const total = selectedProvince.value.total;
  // Normal distribution using Box-Muller
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const min = 0.6;
  const mean = 0.75;
  const stdDev = 0.08;
  const tail = 50;
  let raw = mean + z * stdDev;
  raw = Math.max(0, Math.min(1, raw));

  let finalRatio: number;
  if (raw <= mean) {
    // linear map [0, mean] → [0.60, mean]
    finalRatio = min + (raw / mean) * (mean - min);
  } else {
    finalRatio = raw;
  }
  let s = Math.round(finalRatio * (total + tail));
  if (s === total + tail) {
    confetti();
    s = total;
  } else if (s > total) {
    s = total - 1;
  }
  localStorage.setItem('gaokao-score', String(s));
  score.value = s;
}

// ─────────────────────────── Transition state ────────────────────────────────
const transitioning = ref(false);
const cardScale = ref(1);
const cardRotateY = ref(0);
const cardOpacity = ref(1);
const whiteFlash = ref(0); // 0 → 1
const bgBlack = ref(false); // stage 0→1: bg fades to black

function startTransition() {
  // Step 1: bg fades to black over 1s
  bgBlack.value = true;
  stage.value = 1; // show province selection still, card tilts

  // We wait for province selection above; the real "go" is called from selectProvince
  // which calls this. At this point province is already locked.
  // Give 200ms for the province modal to close visually:
  setTimeout(() => {
    stage.value = 2;
    transitioning.value = true;
    doCardTransition();
  }, 300);
}

function doCardTransition() {
  // 2s transition: scale up (ease-in) + rotate ~160deg (ease-in) + white flash
  const startTime = performance.now();
  const duration = 2000;

  function tick(now: number) {
    const t = Math.min((now - startTime) / duration, 1);
    // ease-in cubic
    const eased = t * t * t;

    cardScale.value = 1 + eased * 12;
    cardRotateY.value = eased * 160;
    cardOpacity.value = 1 - eased * 0.8;
    whiteFlash.value = t; // linear

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // Enter stage 3
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
        // If province was already saved, generate score immediately
        if (!score.value)
          generateScore();
      }, 100);
    }
  }
  requestAnimationFrame(tick);
}

// ─────────────────────────── Click handlers ──────────────────────────────────
const showProvinceModal = ref(false);

function handleSplashClick() {
  if (stage.value !== 0)
    return;
  if (selectedProvince.value) {
    // Province already chosen – skip to transition directly
    bgBlack.value = true;
    setTimeout(() => {
      stage.value = 2;
      transitioning.value = true;
      doCardTransition();
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
  <div style="position:fixed;inset:0;overflow:hidden">
    <!-- ── QQ WebView banner ─────────────────────────────────────────────── -->
    <div
      v-if="isQQ"
      style="
        position:fixed;top:0;left:0;right:0;z-index:9999;
        background:rgba(0,0,0,0.92);border-bottom:1px solid rgba(255,255,255,0.15);
        padding:14px 20px;display:flex;align-items:center;gap:12px;
        font-family:Saira,sans-serif;
      "
    >
      <span style="font-size:18px">⚠️</span>
      <div>
        <div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:2px">
          检测到 QQ 内置浏览器
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6)">
          为获得最佳体验，请点击右上角 ··· 并选择"在浏览器打开"
        </div>
      </div>
    </div>

    <!-- ── Stage 0 & 1: Stars + Card ────────────────────────────────────── -->
    <div
      v-show="stage <= 1"
      style="position:absolute;inset:0;transition:opacity 1s ease;z-index:1"
      :style="{ opacity: bgBlack ? 0 : 1 }"
    >
      <InspiraStarsBackground style="position:absolute;inset:0" />
    </div>

    <!-- Pure black bg shown when bg fades -->
    <div
      style="position:absolute;inset:0;background:#000;z-index:0"
    />

    <!-- Card (stages 0, 1, 2) -->
    <div
      v-show="stage <= 2"
      style="
        position:absolute;inset:0;z-index:10;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        pointer-events:none;
      "
    >
      <div
        :style="{
          transform: transitioning
            ? `perspective(800px) rotateY(${cardRotateY}deg) scale(${cardScale})`
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
          style="
            width: min(260px, 55vw);
            border-radius:14px;
            box-shadow: 0 0 60px rgba(160,120,255,0.5), 0 0 120px rgba(80,60,180,0.3);
            display:block;
          "
        >
      </div>

      <!-- "Click to reveal" text -->
      <div
        v-show="!showProvinceModal && stage === 0"
        style="
          margin-top:28px;
          font-family:Saira,sans-serif;font-size:15px;font-weight:300;
          letter-spacing:0.25em;color:rgba(255,255,255,0.7);
          animation: pulse-glow 2.5s ease-in-out infinite;
          text-transform:uppercase;
        "
        @click.stop="handleSplashClick"
      >
        Click to reveal
      </div>
    </div>

    <!-- Clickable overlay for stage 0 -->
    <div
      v-if="stage === 0 && !showProvinceModal"
      style="position:absolute;inset:0;z-index:9;cursor:pointer"
      @click="handleSplashClick"
    />

    <!-- ── Province selection modal ──────────────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="showProvinceModal && stage === 0"
        style="
          position:absolute;inset:0;z-index:50;
          display:flex;align-items:center;justify-content:center;
          background:rgba(0,0,0,0.75);
          backdrop-filter:blur(6px);
          -webkit-backdrop-filter:blur(6px);
        "
        @click.self="showProvinceModal = false"
      >
        <div
          style="
            background:rgba(15,10,30,0.95);
            border:1px solid rgba(160,120,255,0.3);
            border-radius:18px;
            padding:28px 24px;
            max-width:min(480px, 92vw);
            width:100%;
            max-height:80vh;
            overflow-y:auto;
          "
          @click.stop
        >
          <div style="font-family:Saira,sans-serif;text-align:center;margin-bottom:20px">
            <div style="font-size:18px;font-weight:600;color:#fff;letter-spacing:0.05em;margin-bottom:6px">
              选择你的省份
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.45);letter-spacing:0.1em">
              SELECT YOUR PROVINCE
            </div>
          </div>
          <div
            style="
              display:grid;
              grid-template-columns:repeat(auto-fill, 4em);
              gap:8px;
            "
          >
            <button
              v-for="p in provinces"
              :key="p.name"
              style="
                background:rgba(100,70,200,0.2);
                border:1px solid rgba(160,120,255,0.25);
                border-radius:8px;
                padding:8px 4px;
                font-family:Saira,sans-serif;
                font-size:13px;
                font-weight:500;
                color:rgba(255,255,255,0.85);
                cursor:pointer;
                transition:all 0.2s;
              "
              @mouseover="($event.target as HTMLElement).style.background = 'rgba(120,80,240,0.5)'"
              @mouseleave="($event.target as HTMLElement).style.background = 'rgba(100,70,200,0.2)'"
              @click="() => { showProvinceModal = false; selectProvince(p) }"
            >
              {{ p.name }}
            </button>
            <p style="grid-column:span 2;margin-top:12px;font-size:11px;color:rgba(255,255,255,0.5);text-align:center">
              （无高考的地区已省略）
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── White flash overlay ───────────────────────────────────────────── -->
    <div
      v-show="whiteFlash > 0"
      style="position:absolute;inset:0;z-index:100;background:#fff;pointer-events:none"
      :style="{ opacity: whiteFlash }"
    />

    <!-- ── Stage 3: Cosmic Portal ────────────────────────────────────────── -->
    <div
      v-show="stage === 3"
      style="position:absolute;inset:0;z-index:20;cursor:pointer"
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
        style="position:absolute;inset:0"
      />

      <!-- Prompt text above the portal core -->
      <div
        style="
          position:absolute;inset:0;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          pointer-events:none;
          font-family:Saira,sans-serif;
        "
      >
        <!-- Text above: click prompt -->
        <div
          style="
            margin-bottom: max(120px, 20vh);
            font-size:22px;
            font-weight:500;letter-spacing:0.2em;text-transform:uppercase;
            color:rgba(255,255,255,0.8);
            animation:pulse-glow 2.5s ease-in-out infinite;
            text-align:center;padding:0 24px;
          "
        >
          Prefill your Gaokao score
          <div
            style="
              font-size:16px;color:rgba(255,255,255,0.5);
              margin-top:10px;letter-spacing:0.1em;
            "
          >
            Click to resample
          </div>
        </div>

        <!-- Score display below -->
        <div
          v-if="score !== null"
          :key="score"
          style="
            margin-top: max(120px, 20vh);
            text-align:center;
          "
        >
          <div
            style="
              font-size:clamp(52px, 12vw, 96px);
              font-weight:800;
              letter-spacing:-0.02em;
              color:#fff;
              text-shadow:0 0 30px rgba(180,140,255,0.8), 0 0 80px rgba(100,60,255,0.5);
              animation:score-in 0.7s cubic-bezier(0.34,1.56,0.64,1) both;
            "
          >
            {{ score }}
          </div>
          <div
            style="
              font-size:clamp(12px, 2vw, 14px);
              font-weight:300;letter-spacing:0.3em;text-transform:uppercase;
              color:rgba(255,255,255,0.4);
              margin-top:6px;
            "
          >
            / {{ selectedProvince?.total }} · {{ selectedProvince?.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Scrollbar styling for province modal */
div::-webkit-scrollbar { width: 4px; }
div::-webkit-scrollbar-track { background: transparent; }
div::-webkit-scrollbar-thumb { background: rgba(160,120,255,0.3); border-radius: 2px; }
</style>
