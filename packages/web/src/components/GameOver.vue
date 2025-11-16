<template>
  <div class="game-over" aria-label="Game Over">
    <div>Game Over!</div>
    <button class="ui-btn" @click="$emit('restart')">Restart</button>
  </div>
</template>
<script setup lang="ts"></script>
<style scoped>
.game-over {
  color: #f33;
  font-size: 32px;
  font-weight: bold;
  margin-top: 20px;
}
.ui-btn {
  font-size: 24px;
  margin: 12px;
  padding: 10px 18px;
  background: #222;
  color: #fff;
  border-radius: 10px;
  border: 2px solid #555;
  box-shadow: 0 2px 8px #333;
  transition: background 0.2s;
}
.ui-btn:active {
  background: #444;
}
</style>