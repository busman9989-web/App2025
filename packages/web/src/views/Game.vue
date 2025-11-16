<template>
  <div class="santa-game-fixed-wrapper">
    <div :id="containerId" class="santa-game-container"></div>
    <div class="top-controls">
      <a class="exit-btn" href="/" aria-label="Exit Santa Game">×</a>
      <div class="volume-control">
        <span class="volume-label" aria-label="Volume">🔉</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model="volume"
          @input="updateVolume"
          aria-label="Game Volume"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

const containerId = `santa-game-${Math.random().toString(36).slice(2)}`
let gameInstance: any = null
let phaserScript: HTMLScriptElement | null = null
const volume = ref(1)
let loadedSounds: any[] = []

function updateVolume() {
  window.__SantaCurrentVolume = volume.value
  loadedSounds.forEach(s => {
    if (s) s.volume = volume.value
  })
}
watch(volume, updateVolume)

onMounted(() => {
  document.body.style.overflow = 'hidden'
  document.body.style.height = '100vh'
  document.documentElement.style.height = '100vh'

  function setupSantaGame() {
    const Phaser = window.Phaser
    const width = window.innerWidth
    const height = window.innerHeight
    let gameScore = 0
    let highScore = 0
    loadedSounds = []

    if (gameInstance && gameInstance.destroy) gameInstance.destroy()
    gameInstance = new Phaser.Game(width, height, Phaser.CANVAS, containerId, null, false, false)

    const SantaGame: any = {
      init: function () {
        this.game = gameInstance
        this.game.state.add('load', this.load)
        this.game.state.add('play', this.play)
        this.game.state.add('title', this.title)
        this.game.state.add('gameOver', this.gameOver)
        this.game.state.add('instructions', this.instructions)
        this.game.state.start('load')
      },
      load: {
        preload: function (this: any) {
          this.game.load.audio('drivin-home', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/drivin-home-low.mp3')
          this.game.load.audio('ho-ho-ho', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/ho-ho-ho.mp3')
          this.game.load.audio('hop', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/jump-sound.mp3')
          this.game.load.image('platform', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/ground.png')
          this.game.load.spritesheet('santa-running', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/santa-running.png', 37, 52)
          this.game.load.image('snow-bg', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/snow-bg.png')
          this.game.load.image('snowflake', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/snowflake.png')
          this.game.load.image('logo', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/game-logo.png')
          this.game.load.image('instructions', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/instructions.png')
          this.game.load.image('game-over', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/game-over.png')
          this.game.load.image('startbtn', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/start-btn.png')
          this.game.load.image('playbtn', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/play-btn.png')
          this.game.load.image('restartBtn', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/restart-btn.png')
        },
        create: function (this: any) {
          this.game.state.start('title')
        }
      },
      title: {
        create: function (this: any) {
          this.bg = this.game.add.tileSprite(0, 0, width, height, 'snow-bg')
          this.logo = this.game.add.sprite(this.game.world.width / 2 - 158, 20, 'logo')
          this.logo.alpha = 0
          this.game.add.tween(this.logo).to({ alpha: 1 }, 1000, Phaser.Easing.Linear.None, true, 0)
          this.startBtn = this.game.add.button(
            this.game.world.width / 2 - 159,
            this.game.world.height - 120,
            'startbtn',
            this.startClicked
          )
          this.startBtn.alpha = 0
          this.game.add.tween(this.startBtn).to({ alpha: 1 }, 1000, Phaser.Easing.Linear.None, true, 1000)
        },
        startClicked: function (this: any) {
          this.game.state.start('instructions')
        }
      },
      instructions: {
        create: function (this: any) {
          this.bg = this.game.add.tileSprite(0, 0, width, height, 'snow-bg')
          this.instructions = this.game.add.sprite(this.game.world.width / 2 - 292, 30, 'instructions')
          this.instructions.alpha = 0
          this.game.add.tween(this.instructions).to({ alpha: 1 }, 800, Phaser.Easing.Linear.None, true, 0)
          this.playBtn = this.game.add.button(
            this.game.world.width / 2 - 159,
            this.game.world.height - 120,
            'playbtn',
            this.playClicked
          )
          this.playBtn.alpha = 0
          this.game.add.tween(this.playBtn).to({ alpha: 1 }, 800, Phaser.Easing.Linear.None, true, 800)
        },
        playClicked: function (this: any) {
          this.game.state.start('play')
        }
      },
      play: {
        create: function (this: any) {
          highScore = gameScore > highScore ? Math.floor(gameScore) : highScore
          gameScore = 0
          this.currentFrame = 0
          this.particleInterval = 2 * 60
          this.gameSpeed = 580
          this.isGameOver = false
          this.game.physics.startSystem(Phaser.Physics.ARCADE)

          this.music = this.game.add.audio('drivin-home')
          this.music.loop = true
          this.music.play()
          this.music.volume = window.__SantaCurrentVolume ?? 1
          loadedSounds.push(this.music)

          this.bg = this.game.add.tileSprite(0, 0, width, height, 'snow-bg')
          this.bg.fixedToCamera = true
          this.bg.autoScroll(-this.gameSpeed / 6, 0)

          this.emitter = this.game.add.emitter(this.game.world.centerX, -32, 50)

          this.platforms = this.game.add.group()
          this.platforms.enableBody = true
          this.platforms.createMultiple(5, 'platform', 0, false)
          this.platforms.setAll('anchor.x', 0.5)
          this.platforms.setAll('anchor.y', 0.5)

          let plat: any

          for (let i = 0; i < 5; i++) {
            plat = this.platforms.getFirstExists(false)
            plat.reset(i * 192, this.game.world.height - 24)
            plat.width = 192
            plat.height = 24
            this.game.physics.arcade.enable(plat)
            plat.body.immovable = true
            plat.body.bounce.set(0)
          }

          this.lastPlatform = plat

          this.santa = this.game.add.sprite(100, this.game.world.height - 200, 'santa-running')
          this.santa.animations.add('run')
          this.santa.animations.play('run', 20, true)

          this.game.physics.arcade.enable(this.santa)

          this.santa.body.gravity.y = 1500
          this.santa.body.collideWorldBounds = true

          this.emitter.makeParticles('snowflake')
          this.emitter.maxParticleScale = 0.02
          this.emitter.minParticleScale = 0.001
          this.emitter.setYSpeed(100, 200)
          this.emitter.gravity = 0
          this.emitter.width = this.game.world.width * 1.5
          this.emitter.minRotation = 0
          this.emitter.maxRotation = 40

          this.game.camera.follow(this.santa)
          this.cursors = this.game.input.keyboard.createCursorKeys()
          this.spacebar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
          this.emitter.start(false, 0, 0)
          this.score = this.game.add.text(20, 20, '', {
            font: '24px Arial',
            fill: 'white',
            fontWeight: 'bold'
          })

          if (highScore > 0) {
            this.highScore = this.game.add.text(20, 45, 'Best: ' + highScore, {
              font: '18px Arial',
              fill: 'white'
            })
          }
        },
        update: function (this: any) {
          const that = this
          if (!this.isGameOver) {
            gameScore += 0.5
            this.gameSpeed += 0.03
            this.score.text = 'Score: ' + Math.floor(gameScore)

            this.currentFrame++
            const moveAmount = this.gameSpeed / 100
            this.game.physics.arcade.collide(this.santa, this.platforms)

            if (this.santa.body.bottom >= this.game.world.bounds.bottom) {
              this.isGameOver = true
              this.endGame()
            }

            if (
              (this.cursors.up.isDown && this.santa.body.touching.down) ||
              (this.spacebar.isDown && this.santa.body.touching.down) ||
              (this.game.input.mousePointer.isDown && this.santa.body.touching.down) ||
              (this.game.input.pointer1.isDown && this.santa.body.touching.down)
            ) {
              this.jumpSound = this.game.add.audio('hop')
              this.jumpSound.volume = window.__SantaCurrentVolume ?? 1
              loadedSounds.push(this.jumpSound)
              this.jumpSound.play()
              this.santa.body.velocity.y = -500
            }

            if (this.particleInterval === this.currentFrame) {
              this.emitter.makeParticles('snowflake')
              this.currentFrame = 0
            }

            this.platforms.children.forEach(function (platform: any) {
              platform.body.position.x -= moveAmount
              if (platform.body.right <= 0) {
                platform.kill()
                const plat = that.platforms.getFirstExists(false)
                plat.reset(
                  that.lastPlatform.body.right + 192,
                  that.game.world.height - Math.floor(Math.random() * 50) - 24
                )
                plat.body.immovable = true
                that.lastPlatform = plat
              }
            })
          }
        },
        endGame: function (this: any) {
          this.music.stop()
          this.music = this.game.add.audio('ho-ho-ho')
          this.music.volume = window.__SantaCurrentVolume ?? 1
          loadedSounds.push(this.music)
          this.music.play()
          this.game.state.start('gameOver')
        }
      },
      gameOver: {
        create: function (this: any) {
          this.bg = this.game.add.tileSprite(0, 0, width, height, 'snow-bg')
          this.msg = this.game.add.sprite(this.game.world.width / 2 - 280.5, 50, 'game-over')
          this.msg.alpha = 0
          this.game.add.tween(this.msg).to({ alpha: 1 }, 600, Phaser.Easing.Linear.None, true, 0)

          this.score = this.game.add.text(
            this.game.world.width / 2 - 100,
            200,
            'Score: ' + Math.floor(gameScore),
            { font: '42px Arial', fill: 'white' }
          )
          this.score.alpha = 0
          this.game.add.tween(this.score).to({ alpha: 1 }, 600, Phaser.Easing.Linear.None, true, 600)

          this.restartBtn = this.game.add.button(
            this.game.world.width / 2 - 183.5,
            280,
            'restartBtn',
            this.restartClicked
          )
          this.restartBtn.alpha = 0
          this.game.add.tween(this.restartBtn).to({ alpha: 1 }, 600, Phaser.Easing.Linear.None, true, 1000)
        },
        restartClicked: function (this: any) {
          this.game.state.start('play')
        }
      }
    }

    window.__SantaCurrentVolume = volume.value
    SantaGame.init()
  }

  if (!window.Phaser) {
    phaserScript = document.createElement('script')
    phaserScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/phaser/2.6.2/phaser.min.js'
    phaserScript.async = true
    phaserScript.onload = setupSantaGame
    document.body.appendChild(phaserScript)
  } else {
    setupSantaGame()
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.height = ''
  document.documentElement.style.height = ''
  if (phaserScript && document.body.contains(phaserScript)) document.body.removeChild(phaserScript)
  try {
    if (gameInstance && gameInstance.destroy) gameInstance.destroy()
  } catch (e) {}
})
</script>

<style scoped>
.santa-game-fixed-wrapper {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  max-width: 100vw !important;
  max-height: 100vh !important;
  z-index: 120;
  background: #000;
  overflow: hidden;
}

.santa-game-container {
  width: 100vw;
  height: 100vh;
  min-width: 100vw !important;
  min-height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
  background: black;
  overflow: hidden;
}
.top-controls {
  position: absolute;
  top: 20px;
  right: 28px;
  display: flex;
  flex-direction: row;
  gap: 18px;
  z-index: 9999;
  align-items: center;
}
.exit-btn {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 50%;
  background: rgba(32,32,32,0.7);
  color: #fff;
  font-size: 30px;
  font-weight: bold;
  line-height: 44px;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
.exit-btn:hover {
  background: rgba(255,32,32,.89);
}
.volume-control {
  background: rgba(32,32,32,0.45);
  border-radius: 16px;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  min-width: 88px;
}
.volume-control input[type="range"] {
  width: 70px;
  margin-left: 8px;
}
.volume-label {
  font-size: 20px;
  color: #fff;
}
</style>