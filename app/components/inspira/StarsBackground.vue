<script setup lang="ts">
import { Motion, useMotionValue, useSpring } from 'motion-v';
import { computed, onMounted, ref, watch } from 'vue';

interface Props {
  factor?: number
  speed?: number
  starColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  factor: 0.05,
  speed: 50,
  starColor: '#fff',
});

defineSlots();

function generateStars(count: number, color: string) {
  const shadows: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 4000) - 2000;
    const y = Math.floor(Math.random() * 4000) - 2000;
    shadows.push(`${x}px ${y}px ${color}`);
  }
  return shadows.join(', ');
}

const offsetX = useMotionValue(1);
const offsetY = useMotionValue(1);
const springX = useSpring(offsetX, { stiffness: 50, damping: 20 });
const springY = useSpring(offsetY, { stiffness: 50, damping: 20 });

function handleMouseMove(e: MouseEvent) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  offsetX.set(-(e.clientX - cx) * props.factor);
  offsetY.set(-(e.clientY - cy) * props.factor);
}

const bs1 = ref('');
const bs2 = ref('');
const bs3 = ref('');

onMounted(() => {
  bs1.value = generateStars(1000, props.starColor);
  bs2.value = generateStars(400, props.starColor);
  bs3.value = generateStars(200, props.starColor);
});

watch(() => props.starColor, (c) => {
  bs1.value = generateStars(1000, c);
  bs2.value = generateStars(400, c);
  bs3.value = generateStars(200, c);
});

const t1 = computed(() => ({ repeat: Infinity, duration: props.speed, ease: 'linear' }));
const t2 = computed(() => ({ repeat: Infinity, duration: props.speed * 2, ease: 'linear' }));
const t3 = computed(() => ({ repeat: Infinity, duration: props.speed * 3, ease: 'linear' }));
</script>

<template>
  <div
    style="position:relative;width:100%;height:100%;overflow:hidden;background:radial-gradient(ellipse at bottom, #262626 0%, #000 100%)"
    @mousemove="handleMouseMove"
  >
    <Motion :style="{ x: springX, y: springY }">
      <Motion
        style="position:absolute;top:0;left:0;height:2000px;width:100%"
        :animate="{ y: [0, -2000] }"
        :transition="t1"
      >
        <div style="position:absolute;border-radius:50%;background:transparent;width:1px;height:1px" :style="{ boxShadow: bs1 }" />
        <div style="position:absolute;top:2000px;border-radius:50%;background:transparent;width:1px;height:1px" :style="{ boxShadow: bs1 }" />
      </Motion>
      <Motion
        style="position:absolute;top:0;left:0;height:2000px;width:100%"
        :animate="{ y: [0, -2000] }"
        :transition="t2"
      >
        <div style="position:absolute;border-radius:50%;background:transparent;width:2px;height:2px" :style="{ boxShadow: bs2 }" />
        <div style="position:absolute;top:2000px;border-radius:50%;background:transparent;width:2px;height:2px" :style="{ boxShadow: bs2 }" />
      </Motion>
      <Motion
        style="position:absolute;top:0;left:0;height:2000px;width:100%"
        :animate="{ y: [0, -2000] }"
        :transition="t3"
      >
        <div style="position:absolute;border-radius:50%;background:transparent;width:3px;height:3px" :style="{ boxShadow: bs3 }" />
        <div style="position:absolute;top:2000px;border-radius:50%;background:transparent;width:3px;height:3px" :style="{ boxShadow: bs3 }" />
      </Motion>
    </Motion>
    <slot />
  </div>
</template>
