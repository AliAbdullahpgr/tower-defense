// ============================================================
// Fantasy Tower Defense — Core Game Types (Mega Expansion)
// ============================================================

export type TowerType =
  | 'archer' | 'mage' | 'cannon' | 'frost' | 'lightning' | 'poison' | 'ballista'
  | 'infantry' | 'hero' | 'beastmaster' | 'necromancer' | 'catapult' | 'tesla'
  | 'archer_barracks' | 'pikeman_barracks' | 'paladin_shrine';

export type EnemyType =
  | 'goblin' | 'imp' | 'skeleton' | 'werewolf' | 'orc' | 'golem'
  | 'troll' | 'banshee' | 'darkKnight' | 'dragon'
  | 'armored' | 'healer' | 'tunneler' | 'flyer' | 'splitterBoss' | 'bossDragon'
  | 'bossQuadrupedBear' | 'bossQuadrupedHorse' | 'bossQuadrupedLion' | 'bossQuadrupedWolf' | 'bossQuadrupedStoneBear'
  | 'bossTitan' | 'bossSerpent'
  | 'firebug' | 'leafbug' | 'magmaCrab' | 'scorpion';

export type GameState = 'menu' | 'playing' | 'paused' | 'victory' | 'defeat';
export type ProjectileType = 'arrow' | 'fireball' | 'cannonball' | 'frost' | 'lightning' | 'poison' | 'bolt' | 'boulder' | 'tesla';
export type TargetingMode = 'first' | 'last' | 'strongest' | 'weakest' | 'fastest';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';
export type MapId = 'serpentine' | 'crossroads' | 'spiral' | 'maze' | 'gauntlet';
export type AbilityType = 'lightningStorm' | 'freezeWave' | 'goldRush';

export interface Point {
  x: number;
  y: number;
}

export interface Cell {
  col: number;
  row: number;
  isPath: boolean;
  hasTower: boolean;
  isPowerSpot?: boolean;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  reward: number;
  damage: number;
  pathIndex: number;
  progress: number;
  frozen: boolean;
  frozenTimer: number;
  slowFactor: number;
  slowTimer: number;
  poisonTimer: number;
  poisonDamage: number;
  alive: boolean;
  reached: boolean;
  size: number;
  color: string;
  emoji: string;
  // Animation
  animFrame: number;
  animTimer: number;
  facingLeft: boolean;
  walkCycle: number;
  moveAngle: number; // Direction of movement in radians (0 = right, PI/2 = down, PI = left, -PI/2 = up)
  // Special flags
  isFlying: boolean;
  isArmored: boolean;   // immune to physical (archer/cannon/ballista)
  isTunneling: boolean; // briefly untargetable
  tunnelTimer: number;
  isHealer: boolean;
  isBoss: boolean;
  // Death animation
  dying: boolean;
  dyingTimer: number;
  // Splitter
  splitCount?: number;
}

export interface AlliedUnit {
  id: string;
  towerId: string;
  type: 'soldier' | 'hero' | 'wolf' | 'golem' | 'skeleton' | 'archer' | 'pikeman' | 'paladin';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  range: number;
  attackCooldown: number;
  attackTimer: number;
  targetId: string | null;
  alive: boolean;
  walkCycle: number;
  facingLeft: boolean;
  moveAngle: number;
  patrolX: number;
  patrolY: number;
  patrolRadius: number;
  returning: boolean;
}

export interface Tower {
  id: string;
  type: TowerType;
  col: number;
  row: number;
  x: number;
  y: number;
  level: number;
  damage: number;
  range: number;
  fireRate: number;
  fireCooldown: number;
  target: string | null;
  projectileType: ProjectileType;
  color: string;
  emoji: string;
  name: string;
  upgradeCost: number;
  sellValue: number;
  specialEffect?: 'slow' | 'freeze' | 'splash' | 'chain' | 'poison' | 'pierce';
  splashRadius?: number;
  targetingMode: TargetingMode;
  // For unit-spawning towers
  spawnsUnits?: boolean;
  unitType?: 'soldier' | 'hero' | 'wolf' | 'golem' | 'skeleton' | 'archer' | 'pikeman' | 'paladin';
  spawnCooldown?: number;
  spawnTimer?: number;
  maxUnits?: number;
  // Attack animation
  attackAnim: number; // 0-1
  attackAnimTimer: number;
  // Power spot bonus
  powerBonus: number;
  // Visual structure variant (for archer tower: 1-7)
  spriteVariant?: number;
}

export interface Projectile {
  id: string;
  type: ProjectileType;
  x: number;
  y: number;
  targetId: string;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  color: string;
  size: number;
  towerId: string;
  splashRadius?: number;
  chainCount?: number;
  slowFactor?: number;
  slowDuration?: number;
  piercing?: boolean;
  alive: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
  vy: number;
  life: number;
  scale?: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  opacity: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  timer: number;
}

export interface ActiveAbility {
  type: AbilityType;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  duration: number;
  active: boolean;
  activeTimer: number;
  cost: number;
}

export interface WaveConfig {
  waveNumber: number;
  enemies: Array<{ type: EnemyType; count: number; delay: number }>;
  reward: number;
  isBoss?: boolean;
  bossType?: EnemyType;
}

export interface GameStats {
  wave: number;
  gold: number;
  lives: number;
  score: number;
  towersPlaced: number;
  enemiesKilled: number;
  totalWaves: number;
  // Post-game stats
  damageDealt: number;
  goldEarned: number;
  wavesSurvived: number;
  towerKills: Record<string, number>;
}

export interface TowerDefinition {
  type: TowerType;
  name: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number;
  projectileType: ProjectileType;
  color: string;
  emoji: string;
  description: string;
  upgradeCost: number;
  specialEffect?: 'slow' | 'freeze' | 'splash' | 'chain' | 'poison' | 'pierce';
  splashRadius?: number;
  spawnsUnits?: boolean;
  unitType?: 'soldier' | 'hero' | 'wolf' | 'golem' | 'skeleton' | 'archer' | 'pikeman' | 'paladin';
  spawnCooldown?: number;
  maxUnits?: number;
  isAirCapable?: boolean;
}

export interface EnemyDefinition {
  type: EnemyType;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  damage: number;
  size: number;
  color: string;
  emoji: string;
  description: string;
  isFlying?: boolean;
  isArmored?: boolean;
  isHealer?: boolean;
  isBoss?: boolean;
  splitCount?: number;
}

export interface MapConfig {
  id: MapId;
  name: string;
  description: string;
  difficulty: number; // 1-5
  waypoints: Array<[number, number]>;
  powerSpots?: Array<[number, number]>;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  wave: number;
  map: MapId;
  difficulty: Difficulty;
  date: string;
}
