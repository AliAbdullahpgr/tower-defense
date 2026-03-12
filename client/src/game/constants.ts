// ============================================================
// Fantasy Tower Defense — Game Constants & Definitions (Mega Expansion)
// ============================================================

import type { TowerDefinition, EnemyDefinition, WaveConfig, MapConfig, ActiveAbility } from './types';

export const CELL_SIZE = 60;
export const GRID_COLS = 18;
export const GRID_ROWS = 12;
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE; // 1080
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE; // 720

export const STARTING_GOLD = 200;
export const STARTING_LIVES = 20;

// ============================================================
// MAP CONFIGURATIONS
// ============================================================

export const MAP_CONFIGS: Record<string, MapConfig> = {
  serpentine: {
    id: 'serpentine',
    name: 'Serpentine Valley',
    description: 'A winding path through the green valley. Great for beginners.',
    difficulty: 1,
    waypoints: [
      [0, 5], [3, 5], [3, 2], [7, 2], [7, 9],
      [11, 9], [11, 3], [15, 3], [15, 8], [17, 8],
    ],
    powerSpots: [[5, 4], [9, 6], [13, 5]],
  },
  crossroads: {
    id: 'crossroads',
    name: 'Crossroads Keep',
    description: 'Enemies split at the crossroads. Defend multiple fronts!',
    difficulty: 2,
    waypoints: [
      [0, 3], [4, 3], [4, 6], [8, 6], [8, 2],
      [12, 2], [12, 9], [15, 9], [15, 5], [17, 5],
    ],
    powerSpots: [[6, 4], [10, 5], [14, 7]],
  },
  spiral: {
    id: 'spiral',
    name: 'Spiral Fortress',
    description: 'A tight spiral path — towers cover multiple segments!',
    difficulty: 3,
    waypoints: [
      [0, 6], [2, 6], [2, 1], [16, 1], [16, 10],
      [4, 10], [4, 8], [14, 8], [14, 3], [6, 3],
      [6, 6], [10, 6], [10, 5], [17, 5],
    ],
    powerSpots: [[9, 2], [5, 9], [12, 6]],
  },
  maze: {
    id: 'maze',
    name: 'Labyrinth of Doom',
    description: 'A complex maze path. Maximum tower coverage required.',
    difficulty: 4,
    waypoints: [
      [0, 2], [5, 2], [5, 5], [2, 5], [2, 9],
      [8, 9], [8, 4], [13, 4], [13, 10], [16, 10],
      [16, 6], [11, 6], [11, 1], [17, 1],
    ],
    powerSpots: [[3, 3], [6, 7], [14, 8]],
  },
  gauntlet: {
    id: 'gauntlet',
    name: 'The Gauntlet',
    description: 'A straight run with bottlenecks. Enemies move fast here!',
    difficulty: 5,
    waypoints: [
      [0, 6], [3, 6], [3, 2], [6, 2], [6, 9],
      [9, 9], [9, 3], [12, 3], [12, 8], [15, 8],
      [15, 4], [17, 4],
    ],
    powerSpots: [[4, 5], [10, 6], [13, 6]],
  },
};

export function getPathCells(waypoints: Array<[number, number]>): Set<string> {
  const cells = new Set<string>();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [c1, r1] = waypoints[i];
    const [c2, r2] = waypoints[i + 1];
    if (c1 === c2) {
      const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
      for (let r = minR; r <= maxR; r++) cells.add(`${c1},${r}`);
    } else {
      const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
      for (let c = minC; c <= maxC; c++) cells.add(`${c},${r1}`);
    }
  }
  return cells;
}

// ============================================================
// TOWER DEFINITIONS
// ============================================================

export const TOWER_DEFINITIONS: Record<string, TowerDefinition> = {
  archer: {
    type: 'archer',
    name: 'Archer Tower',
    cost: 50,
    damage: 20,
    range: 3.5,
    fireRate: 1.5,
    projectileType: 'arrow',
    color: '#8B6914',
    emoji: '🏹',
    description: 'Swift arrows pierce through enemies. Reliable and affordable.',
    upgradeCost: 60,
  },
  mage: {
    type: 'mage',
    name: 'Mage Tower',
    cost: 100,
    damage: 45,
    range: 3.0,
    fireRate: 0.8,
    projectileType: 'fireball',
    color: '#7B2FBE',
    emoji: '🔮',
    description: 'Arcane fireballs deal heavy damage with splash. Effective vs armored.',
    upgradeCost: 120,
    specialEffect: 'splash',
    splashRadius: 1.2,
    isAirCapable: true,
  },
  cannon: {
    type: 'cannon',
    name: 'Cannon Tower',
    cost: 120,
    damage: 80,
    range: 2.5,
    fireRate: 0.5,
    projectileType: 'cannonball',
    color: '#555555',
    emoji: '💣',
    description: 'Massive cannonballs devastate groups with huge splash damage.',
    upgradeCost: 150,
    specialEffect: 'splash',
    splashRadius: 1.8,
  },
  frost: {
    type: 'frost',
    name: 'Frost Tower',
    cost: 90,
    damage: 15,
    range: 3.0,
    fireRate: 1.0,
    projectileType: 'frost',
    color: '#4FC3F7',
    emoji: '❄️',
    description: 'Freezing bolts slow enemies, making them easy targets.',
    upgradeCost: 100,
    specialEffect: 'slow',
    isAirCapable: true,
  },
  lightning: {
    type: 'lightning',
    name: 'Storm Tower',
    cost: 150,
    damage: 35,
    range: 4.0,
    fireRate: 2.0,
    projectileType: 'lightning',
    color: '#FFD700',
    emoji: '⚡',
    description: 'Chain lightning jumps between enemies, hitting multiple foes.',
    upgradeCost: 180,
    specialEffect: 'chain',
    isAirCapable: true,
  },
  poison: {
    type: 'poison',
    name: 'Poison Tower',
    cost: 110,
    damage: 12,
    range: 3.2,
    fireRate: 1.2,
    projectileType: 'poison',
    color: '#7CB342',
    emoji: '☠️',
    description: 'Toxic clouds deal damage over time and weaken enemies.',
    upgradeCost: 130,
    specialEffect: 'poison',
    splashRadius: 1.0,
  },
  ballista: {
    type: 'ballista',
    name: 'Ballista',
    cost: 175,
    damage: 120,
    range: 5.0,
    fireRate: 0.4,
    projectileType: 'bolt',
    color: '#8D6E63',
    emoji: '🎯',
    description: 'Massive bolts pierce through entire lines of enemies.',
    upgradeCost: 200,
    specialEffect: 'pierce',
  },
  // === NEW UNIT-SPAWNING TOWERS ===
  infantry: {
    type: 'infantry',
    name: 'Infantry Barracks',
    cost: 130,
    damage: 0,
    range: 2.5,
    fireRate: 0,
    projectileType: 'arrow',
    color: '#B8860B',
    emoji: '⚔️',
    description: 'Trains sword soldiers who block and fight enemies on the path.',
    upgradeCost: 160,
    spawnsUnits: true,
    unitType: 'soldier',
    spawnCooldown: 8000,
    maxUnits: 3,
  },
  hero: {
    type: 'hero',
    name: 'Hero Altar',
    cost: 250,
    damage: 0,
    range: 4.0,
    fireRate: 0,
    projectileType: 'arrow',
    color: '#FFD700',
    emoji: '🦸',
    description: 'Summons a powerful hero who patrols and decimates enemies.',
    upgradeCost: 300,
    spawnsUnits: true,
    unitType: 'hero',
    spawnCooldown: 15000,
    maxUnits: 1,
    isAirCapable: true,
  },
  beastmaster: {
    type: 'beastmaster',
    name: 'Beast Den',
    cost: 180,
    damage: 0,
    range: 3.0,
    fireRate: 0,
    projectileType: 'arrow',
    color: '#6D4C41',
    emoji: '🐺',
    description: 'Releases savage wolves that hunt down enemies relentlessly.',
    upgradeCost: 220,
    spawnsUnits: true,
    unitType: 'wolf',
    spawnCooldown: 10000,
    maxUnits: 2,
  },
  necromancer: {
    type: 'necromancer',
    name: 'Necromancer Crypt',
    cost: 200,
    damage: 25,
    range: 3.5,
    fireRate: 0.6,
    projectileType: 'poison',
    color: '#4A0E8F',
    emoji: '💀',
    description: 'Raises fallen enemies as skeleton allies. Also fires dark bolts.',
    upgradeCost: 240,
    specialEffect: 'poison',
    spawnsUnits: true,
    unitType: 'skeleton',
    spawnCooldown: 5000,
    maxUnits: 4,
  },
  catapult: {
    type: 'catapult',
    name: 'Catapult',
    cost: 220,
    damage: 200,
    range: 4.5,
    fireRate: 0.25,
    projectileType: 'boulder',
    color: '#795548',
    emoji: '🪨',
    description: 'Hurls massive boulders with enormous AoE. Very slow fire rate.',
    upgradeCost: 260,
    specialEffect: 'splash',
    splashRadius: 2.5,
  },
  tesla: {
    type: 'tesla',
    name: 'Tesla Coil',
    cost: 240,
    damage: 60,
    range: 3.5,
    fireRate: 3.0,
    projectileType: 'tesla',
    color: '#00BCD4',
    emoji: '🔌',
    description: 'Rapid electric arcs chain between all nearby enemies simultaneously.',
    upgradeCost: 280,
    specialEffect: 'chain',
    isAirCapable: true,
  },
};

// ============================================================
// ENEMY DEFINITIONS
// ============================================================

export const ENEMY_DEFINITIONS: Record<string, EnemyDefinition> = {
  goblin: {
    type: 'goblin', name: 'Goblin Scout',
    hp: 60, speed: 1.8, reward: 10, damage: 1, size: 16,
    color: '#66BB6A', emoji: '👺',
    description: 'Fast but fragile. Comes in large numbers.',
  },
  imp: {
    type: 'imp', name: 'Fire Imp',
    hp: 45, speed: 2.4, reward: 12, damage: 1, size: 14,
    color: '#FF7043', emoji: '😈',
    description: 'Blazing fast demonic creature. Hard to hit.',
  },
  skeleton: {
    type: 'skeleton', name: 'Skeleton Warrior',
    hp: 90, speed: 1.3, reward: 14, damage: 1, size: 18,
    color: '#ECEFF1', emoji: '💀',
    description: 'Undead soldier. Steady and relentless.',
  },
  werewolf: {
    type: 'werewolf', name: 'Werewolf',
    hp: 160, speed: 2.0, reward: 22, damage: 2, size: 22,
    color: '#8D6E63', emoji: '🐺',
    description: 'Ferocious beast that moves with terrifying speed.',
  },
  orc: {
    type: 'orc', name: 'Orc Warrior',
    hp: 220, speed: 1.0, reward: 20, damage: 2, size: 24,
    color: '#8BC34A', emoji: '👹',
    description: 'Heavily armored brute. Slow but very tough.',
  },
  golem: {
    type: 'golem', name: 'Stone Golem',
    hp: 350, speed: 0.6, reward: 30, damage: 3, size: 30,
    color: '#90A4AE', emoji: '🗿',
    description: 'Ancient stone construct. Nearly impervious to arrows.',
  },
  troll: {
    type: 'troll', name: 'Cave Troll',
    hp: 450, speed: 0.7, reward: 38, damage: 3, size: 30,
    color: '#795548', emoji: '🧌',
    description: 'Massive regenerating troll. Deals enormous damage.',
  },
  banshee: {
    type: 'banshee', name: 'Banshee',
    hp: 200, speed: 1.6, reward: 35, damage: 3, size: 20,
    color: '#CE93D8', emoji: '👻',
    description: 'Spectral spirit. Immune to frost and poison effects.',
  },
  darkKnight: {
    type: 'darkKnight', name: 'Dark Knight',
    hp: 650, speed: 1.2, reward: 55, damage: 4, size: 26,
    color: '#37474F', emoji: '⚔️',
    description: 'Elite warrior clad in cursed armor. Formidable in every way.',
  },
  dragon: {
    type: 'dragon', name: 'Ancient Dragon',
    hp: 1800, speed: 0.9, reward: 200, damage: 10, size: 38,
    color: '#EF5350', emoji: '🐉',
    description: 'The ultimate boss. Breathes fire and shrugs off most attacks.',
    isBoss: true, isFlying: true,
  },
  // NEW ENEMY TYPES
  armored: {
    type: 'armored', name: 'Iron Juggernaut',
    hp: 500, speed: 0.8, reward: 45, damage: 4, size: 28,
    color: '#607D8B', emoji: '🛡️',
    description: 'Fully armored — immune to physical damage. Use magic towers!',
    isArmored: true,
  },
  healer: {
    type: 'healer', name: 'Shaman Healer',
    hp: 180, speed: 1.1, reward: 40, damage: 2, size: 20,
    color: '#A5D6A7', emoji: '💚',
    description: 'Heals nearby allies. Eliminate first to prevent regeneration!',
    isHealer: true,
  },
  tunneler: {
    type: 'tunneler', name: 'Cave Burrower',
    hp: 280, speed: 1.4, reward: 35, damage: 3, size: 22,
    color: '#8D6E63', emoji: '🦔',
    description: 'Burrows underground periodically, becoming untargetable.',
  },
  flyer: {
    type: 'flyer', name: 'Wyvern',
    hp: 320, speed: 1.7, reward: 50, damage: 4, size: 24,
    color: '#AB47BC', emoji: '🦅',
    description: 'Flies over the path! Only magic, frost, storm, and tesla towers can hit it.',
    isFlying: true,
  },
  splitterBoss: {
    type: 'splitterBoss', name: 'Chaos Hydra',
    hp: 2500, speed: 0.7, reward: 300, damage: 8, size: 42,
    color: '#F44336', emoji: '🐲',
    description: 'BOSS: Splits into two Hydra Heads on death. Destroy them all!',
    isBoss: true,
    splitCount: 2,
  },
};

// ============================================================
// WAVE CONFIGURATIONS (20 waves + endless)
// ============================================================

export const WAVE_CONFIGS: WaveConfig[] = [
  { waveNumber: 1,  enemies: [{ type: 'goblin', count: 8, delay: 800 }], reward: 30 },
  { waveNumber: 2,  enemies: [{ type: 'goblin', count: 6, delay: 700 }, { type: 'imp', count: 5, delay: 600 }], reward: 40 },
  { waveNumber: 3,  enemies: [{ type: 'skeleton', count: 8, delay: 900 }, { type: 'goblin', count: 6, delay: 600 }], reward: 50 },
  { waveNumber: 4,  enemies: [{ type: 'werewolf', count: 4, delay: 1000 }, { type: 'imp', count: 6, delay: 500 }], reward: 60, isBoss: false },
  { waveNumber: 5,  enemies: [{ type: 'orc', count: 5, delay: 1200 }, { type: 'skeleton', count: 8, delay: 700 }], reward: 75 },
  { waveNumber: 6,  enemies: [{ type: 'flyer', count: 4, delay: 900 }, { type: 'goblin', count: 10, delay: 500 }], reward: 85 },
  { waveNumber: 7,  enemies: [{ type: 'armored', count: 3, delay: 1500 }, { type: 'orc', count: 5, delay: 900 }], reward: 95 },
  { waveNumber: 8,  enemies: [{ type: 'healer', count: 2, delay: 2000 }, { type: 'orc', count: 6, delay: 800 }, { type: 'goblin', count: 8, delay: 500 }], reward: 110, isBoss: true, bossType: 'splitterBoss' },
  { waveNumber: 9,  enemies: [{ type: 'tunneler', count: 5, delay: 1100 }, { type: 'werewolf', count: 5, delay: 800 }], reward: 120 },
  { waveNumber: 10, enemies: [{ type: 'golem', count: 3, delay: 2000 }, { type: 'flyer', count: 5, delay: 700 }, { type: 'healer', count: 2, delay: 1500 }], reward: 140 },
  { waveNumber: 11, enemies: [{ type: 'troll', count: 3, delay: 1800 }, { type: 'armored', count: 4, delay: 1200 }, { type: 'imp', count: 10, delay: 400 }], reward: 160 },
  { waveNumber: 12, enemies: [{ type: 'banshee', count: 4, delay: 1000 }, { type: 'darkKnight', count: 3, delay: 1400 }, { type: 'flyer', count: 6, delay: 600 }], reward: 180, isBoss: true, bossType: 'splitterBoss' },
  { waveNumber: 13, enemies: [{ type: 'darkKnight', count: 5, delay: 1200 }, { type: 'tunneler', count: 4, delay: 1000 }, { type: 'healer', count: 3, delay: 1500 }], reward: 200 },
  { waveNumber: 14, enemies: [{ type: 'golem', count: 4, delay: 1800 }, { type: 'banshee', count: 5, delay: 900 }, { type: 'armored', count: 4, delay: 1300 }], reward: 220 },
  { waveNumber: 15, enemies: [{ type: 'dragon', count: 1, delay: 3000 }, { type: 'darkKnight', count: 6, delay: 1000 }, { type: 'troll', count: 3, delay: 1600 }], reward: 250, isBoss: true, bossType: 'dragon' },
  { waveNumber: 16, enemies: [{ type: 'dragon', count: 2, delay: 4000 }, { type: 'armored', count: 5, delay: 1200 }, { type: 'flyer', count: 8, delay: 600 }], reward: 280 },
  { waveNumber: 17, enemies: [{ type: 'splitterBoss', count: 1, delay: 5000 }, { type: 'darkKnight', count: 8, delay: 900 }, { type: 'healer', count: 4, delay: 1200 }], reward: 320, isBoss: true, bossType: 'splitterBoss' },
  { waveNumber: 18, enemies: [{ type: 'dragon', count: 2, delay: 3500 }, { type: 'golem', count: 5, delay: 1800 }, { type: 'banshee', count: 6, delay: 800 }, { type: 'tunneler', count: 6, delay: 900 }], reward: 360 },
  { waveNumber: 19, enemies: [{ type: 'splitterBoss', count: 2, delay: 6000 }, { type: 'dragon', count: 2, delay: 4000 }, { type: 'armored', count: 6, delay: 1100 }], reward: 400, isBoss: true },
  { waveNumber: 20, enemies: [{ type: 'dragon', count: 4, delay: 3000 }, { type: 'splitterBoss', count: 2, delay: 5000 }, { type: 'darkKnight', count: 10, delay: 800 }, { type: 'flyer', count: 10, delay: 500 }], reward: 500, isBoss: true, bossType: 'dragon' },
];

// ============================================================
// ACTIVE ABILITIES
// ============================================================

export const ABILITY_DEFINITIONS: Record<string, Omit<ActiveAbility, 'currentCooldown' | 'active' | 'activeTimer'>> = {
  lightningStorm: {
    type: 'lightningStorm',
    name: 'Lightning Storm',
    description: 'Strikes all enemies on screen for 80 damage',
    cooldown: 45000,
    duration: 0,
    cost: 0,
  },
  freezeWave: {
    type: 'freezeWave',
    name: 'Freeze Wave',
    description: 'Freezes all enemies for 4 seconds',
    cooldown: 60000,
    duration: 4000,
    cost: 0,
  },
  goldRush: {
    type: 'goldRush',
    name: 'Gold Rush',
    description: 'Doubles gold earned for 15 seconds',
    cooldown: 90000,
    duration: 15000,
    cost: 0,
  },
};

// ============================================================
// DIFFICULTY MULTIPLIERS
// ============================================================

export const DIFFICULTY_MULTIPLIERS: Record<string, { hp: number; speed: number; gold: number; lives: number }> = {
  easy:      { hp: 0.7,  speed: 0.85, gold: 1.3,  lives: 30 },
  normal:    { hp: 1.0,  speed: 1.0,  gold: 1.0,  lives: 20 },
  hard:      { hp: 1.4,  speed: 1.15, gold: 0.85, lives: 15 },
  nightmare: { hp: 2.0,  speed: 1.3,  gold: 0.7,  lives: 10 },
};
