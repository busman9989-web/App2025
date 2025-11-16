<template>
  <div class="rocket-game">
    <div
      class="exit-button-container"
      :style="{ 
          bottom: 'calc(1rem + env(safe-area-inset-bottom))', 
          right: '1rem',
          position: 'fixed',
          zIndex: 100 // Ensure it's on top of everything
      }"
    >
      <button
        class="bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 
               text-white rounded-full shadow-lg flex items-center justify-center 
               transition-all transform hover:scale-110 active:scale-95 
               focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 
               w-14 h-14"
        @click="exitGame"
        aria-label="Exit Game"
        title="Exit Game"
      >
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="w-8 h-8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
    <div class="top">
      <p class="instructions">Use arrow keys to move the rocket</p>
      <p class="score">SCORE: {{ score }} | LEVEL: {{ level }}</p>
      <p class="highest-score">HIGHEST SCORE: {{ highestScore }}</p>
    </div>

    <div
      class="rocket-area"
      :style="{ 'animation-play-state': isGameOver ? 'paused' : 'running' }"
      ref="rocketArea"
    >
      <img
        ref="rocket"
        class="rocket"
        :src="rocketAsset"
        alt="Rocket ship"
        :style="{ bottom: `${rocketBottom}px`, left: `${rocketLeft}px` }"
        draggable="false"
      />

      <img
        v-for="(asteroid, index) in asteroids"
        :key="index"
        :src="asteroidAsset"
        alt="Asteroid"
        class="asteroid"
        :style="{
          top: `${asteroid.top}%`,
          left: `${asteroid.left}%`,
          width: `${asteroid.size}px`,
          height: `${asteroid.size}px`
        }"
        draggable="false"
      />
    </div>

    <div class="game-over" v-if="isGameOver">
      <h1>GAME OVER</h1>
      <button @click="restartGame">START NEW GAME</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, defineEmits } from 'vue'
import { useRouter } from 'vue-router'

const emit = defineEmits(['exit-game'])
const router = useRouter()

const rocketAsset = "/rocket-game-assets/rocket.svg"
const asteroidAsset = "/rocket-game-assets/asteroid.svg"

const rocket = ref<HTMLImageElement | null>(null)
const rocketArea = ref<HTMLDivElement | null>(null)

const rocketBottom = ref(50)
const rocketLeft = ref(350)
const asteroids = ref<any[]>([])
const isGameOver = ref(false)
const score = ref(0)
const level = ref(1)
const keys = reactive<{ [k: string]: boolean }>({})
const velY = ref(0)
const velX = ref(0)
const speed = 2
const friction = 0.68
let animFrameId: number | null = null

const highestScore = ref(Number(localStorage.getItem("highestRocketScore") || 0))

function move() {
  animFrameId = requestAnimationFrame(move)
  moveRocket()
  moveAsteroids()
}

function moveRocket() {
  if (keys["ArrowLeft"]) {
    if (velX.value > -speed) velX.value--
  }
  if (keys["ArrowDown"]) {
    if (velY.value > -speed) velY.value--
  }
  if (keys["ArrowRight"]) {
    if (velX.value < speed) velX.value++
  }
  if (keys["ArrowUp"]) {
    if (velY.value < speed) velY.value++
  }

  velX.value *= friction
  rocketLeft.value += velX.value

  velY.value *= friction
  rocketBottom.value += velY.value

  if (rocketLeft.value <= 0) rocketLeft.value = 0
  if (rocketLeft.value >= 750) rocketLeft.value = 750
  if (rocketBottom.value <= 0) rocketBottom.value = 0
}

function moveAsteroids() {
  const currentRocket = rocket.value
  if (!currentRocket) return

  for (let i = 0; i < asteroids.value.length; i++) {
    asteroids.value[i].top += 0.75 * asteroids.value[i].speed

    const asteroidEl = rocketArea.value?.querySelectorAll('.asteroid')[i] as HTMLImageElement | undefined

    if (asteroidEl && isCollide(currentRocket, asteroidEl)) {
      gameOver()
    } else if (asteroids.value[i].top >= 100) {
      asteroidFinished(i)
    }
  }
}

function asteroidFinished(i: number) {
  score.value++
  if (score.value >= level.value * 20) level.value++
  asteroids.value[i] = createAsteroid(i)
}

function createAsteroid(i: number) {
  return {
    top: getRndNumber(10, 500) * -1,
    left: getRndNumber(i * 10 + 1, (i + 1) * 10),
    size: getRndNumber(30, 100),
    speed: getRndNumber(1, 1.5 + level.value * 0.5)
  }
}

function createAsteroids() {
  const arr = []
  const numOfAsteroids = 10
  for (let i = 0; i < numOfAsteroids; i++) {
    arr.push(createAsteroid(i))
  }
  asteroids.value = arr
}

function gameOver() {
  isGameOver.value = true
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (score.value > highestScore.value) {
    highestScore.value = score.value
    localStorage.setItem("highestRocketScore", String(highestScore.value))
  }
}

function restartGame() {
  rocketBottom.value = 50
  rocketLeft.value = 350
  asteroids.value = []
  isGameOver.value = false
  score.value = 0
  level.value = 1
  velY.value = 0
  velX.value = 0
  Object.keys(keys).forEach(k => keys[k] = false)
  nextTick(() => {
    createAsteroids()
    nextTick(() => {
      animFrameId = requestAnimationFrame(move)
    })
  })
}

// Function to handle exiting the game
function exitGame() {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  // Navigate back to the previous route or home
  router.back()
  // Emit event to update isInGame state in App.vue
  emit('exit-game')
}

function isCollide(a: HTMLElement, b: HTMLElement) {
  const aRect = a.getBoundingClientRect()
  const bRect = b.getBoundingClientRect()
  // Added a small padding/buffer for less harsh collision detection
  const buffer = 15; 
  return !(
    aRect.top + aRect.height - buffer < bRect.top ||
    aRect.top + buffer > bRect.top + bRect.height ||
    aRect.left + aRect.width - buffer < bRect.left ||
    aRect.left + buffer > bRect.left + bRect.width
  )
}

function getRndNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min
}

onMounted(() => {
  createAsteroids()
  animFrameId = requestAnimationFrame(move)

  window.addEventListener("keyup", e => keys[e.key] = false)
  window.addEventListener("keydown", e => keys[e.key] = true)
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  window.removeEventListener("keyup", e => keys[e.key] = false)
  window.removeEventListener("keydown", e => keys[e.key] = true)
})
</script>

<style scoped>
.rocket-game {
  display: grid;
  grid-template-rows: auto 1fr;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #16161d;
  font-family: 'Roboto', sans-serif;
  letter-spacing: 2px;
  /* Ensure position context for floating button */
  position: relative; 
}

/* Removed fixed positioning from CSS class and added inline */
/* .exit-button-container {
    position: fixed;
    z-index: 100;
} */

.rocket-area {
  width: 800px;
  max-width: 95vw;
  background: #222;
  background-image: radial-gradient(
      2px 2px at 20px 30px,
      #eee,
      rgba(0, 0, 0, 0)
    ),
    radial-gradient(2px 2px at 40px 70px, #fff, rgba(0, 0, 0, 0)),
    radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0, 0, 0, 0)),
    radial-gradient(2px 2px at 90px 40px, #fff, rgba(0, 0, 0, 0)),
    radial-gradient(2px 2px at 130px 80px, #fff, rgba(0, 0, 0, 0)),
    radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0, 0, 0, 0));
  background-repeat: repeat;
  background-size: 200px 200px;
  border: 5px solid #ddd;
  box-shadow: inset 0 0 12px black;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  height: 480px;
  margin: 0 auto;
  animation: move-sky 200s infinite;
}

@keyframes move-sky {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 0 10000px;
  }
}

.rocket {
  position: absolute;
  height: 100px;
  z-index: 10;
  pointer-events: none;
  user-drag: none;
}

.asteroid {
  position: absolute;
  pointer-events: none;
  user-drag: none;
}

.top {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  color: #fff; /* Ensure text is visible against dark background */
}

.instructions {
  font-size: 0.8rem;
}

.score {
  width: 400px;
  margin: 0 auto;
  font-size: 1.5rem;
}

.highest-score {
  font-size: 1rem;
}

.game-over {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(24, 24, 35, 0.93);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  z-index: 99;
}

.game-over button {
  padding: 0.5rem 2rem;
  letter-spacing: 2px;
  cursor: pointer;
  box-shadow: 0 0 5px rgba(255,255,255,0.14);
  border-radius: 16px;
  border: none;
  font-size: 1rem;
  margin-top: 24px;
}

.game-over button:hover {
  opacity: 0.95;
}
</style>