<template>
  <div class="game-status" aria-label="Game Status">
    <div>Level: {{ level }}</div>
    <div>HP: {{ hitpoints }}</div>
    <div>Ammo: {{ ammo }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ level: number; hitpoints: number; ammo: number }>();
</script>

<style scoped>
.game-status {
  display: flex;
  gap: 20px;
  font-size: 20px;
}
</style>