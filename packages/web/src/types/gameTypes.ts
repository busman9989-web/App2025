export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  texture?: string;
  sprite?: string;
}

export interface Player extends Entity {
  vx: number;
  vy: number;
  hitpoints: number;
  ammo: number;
  onGround: boolean;
  movingLeft: boolean;
  movingRight: boolean;
  state?: string;
  animFrame?: number;
  animTimer?: number;
}

export interface Mob extends Entity {
  type: string;
  hp: number;
  vx: number;
  vy: number;
  alive: boolean;
  attackTimer: number;
  sprite?: string;
  state?: string;
  animFrame?: number;
  animTimer?: number;
}

export interface Boss extends Entity {
  type: string;
  hp: number;
  vx: number;
  vy: number;
  alive: boolean;
  attackTimer: number;
  sprite?: string;
  state?: string;
  animFrame?: number;
  animTimer?: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: string;
  radius: number;
  sprite?: string;
}

export interface Pickup extends Entity {
  kind: 'ammo' | 'hp';
  value: number;
  sprite?: string;
}

export interface Platform extends Entity {}

export interface GameState {
  level: number;
  player: Player;
  mobs: Mob[];
  boss: Boss | null;
  projectiles: Projectile[];
  pickups: Pickup[];
  platforms: Platform[];
  gameOver: boolean;
  victory: boolean;
  paused: boolean;
  background?: string;
}