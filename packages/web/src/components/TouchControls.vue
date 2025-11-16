<template>
  <div class="touch-controls" aria-label="Touch Controls">
    <button class="ui-btn" @touchstart.prevent="moveLeft(true)" @touchend.prevent="moveLeft(false)" aria-label="Move Left">←</button>
    <button class="ui-btn" @touchstart.prevent="jump" aria-label="Jump">⤒</button>
    <button class="ui-btn" @touchstart.prevent="moveRight(true)" @touchend.prevent="moveRight(false)" aria-label="Move Right">→</button>
    <button class="ui-btn" @touchstart.prevent="attack" aria-label="Attack">⚡</button>
    <button class="ui-btn" @click="pauseToggle" aria-label="Pause/Resume">{{ paused ? 'Resume' : 'Pause' }}</button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ paused: boolean }>();
const emit = defineEmits<{
  (e: 'moveLeft', val: boolean): void;
  (e: 'moveRight', val: boolean): void;
  (e: 'jump'): void;
  (e: 'attack'): void;
  (e: 'pauseToggle'): void;
}>();
function moveLeft(val: boolean) { emit('moveLeft', val); }
function moveRight(val: boolean) { emit('moveRight', val); }
function jump() { emit('jump'); }
function attack() { emit('attack'); }
function pauseToggle() { emit('pauseToggle'); }
</script>

<style scoped>
.touch-controls {
  margin-top: 20px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ui-btn {
  font-size: 24px;
  margin: 4px;
  padding: 10px 18px;
  background: #222;
  color: #fff;
  border-radius: 10px;
  border: 2px solid #555;
  box-shadow: 0 2px 8px #333;
  transition: background 0.2s;
  touch-action: manipulation;
}
.ui-btn:active {
  background: #444;
}
</style>