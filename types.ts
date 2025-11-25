

export interface Upgrade {
  id: string;
  name: string;
  type: 'attack' | 'defense' | 'utility';
  baseCost: number;
  costMultiplier: number;
  baseValue: number;
  valuePerLevel: number;
  level: number;
  unit: string;
  description: string;
}

export interface PlayerStats {
  damage: number;
  attackSpeed: number; // Attacks per second
  range: number;
  critChance: number; // Percentage 0-100
  critFactor: number; // Multiplier (e.g., 2.0x)
  damagePerMeter: number; // % bonus per meter
  projectileCount: number; // Number of simultaneous projectiles
  health: number;
  maxHealth: number;
  regen: number; // HP per second
  armor: number; // Flat reduction
  dodge: number; // % chance
  moveSpeed: number; // Visual rotation speed
  shield: number; // Current Shield
  maxShield: number; // Max Shield capacity
  empDamage: number; // Damage caused by EMP
  empCooldown: number; // Max cooldown in seconds
}

export interface Skin {
  id: string;
  name: string;
  type: 'hexagon' | 'triangle' | 'square' | 'star' | 'circle';
  color: string;
  price: number;
}

export interface GameState {
  cash: number;
  gems: number;
  wave: number;
  waveProgress: number;
  gameSpeed: number;
  isGameOver: boolean;
  isPaused: boolean;
  score: number;
  isGameStarted: boolean;
  selectedSkinId: string;
  ownedSkinIds: string[];
  lastLoginDate?: string; // Data do último login salva na nuvem (YYYY-MM-DD)
  loginStreak?: number; // Sequência atual salva na nuvem
}

export type EnemyType = 'standard' | 'speedster' | 'tank' | 'boss';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  isDead: boolean;
  stunTimer: number; // Time remaining in stun (seconds)
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  targetId: number;
  speed: number;
  damage: number;
  isCrit: boolean;
  color: string;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // frames
  vy: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}