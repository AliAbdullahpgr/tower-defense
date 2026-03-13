// ============================================================
// Fantasy Tower Defense — Sprite Loading & Animation System
// Handles all sprite assets: ruins, tiles, enemies, towers,
// trees, rocks, projectiles, powers, map objects, animations
// ============================================================

import type { MapId, EnemyType, TowerType, ProjectileType } from './types';

// ============================================================
// GLOBAL SPRITE CACHE
// ============================================================

const spriteCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

const isBrowser = typeof window !== 'undefined';

/** Load a single image by path, with caching. Returns image if loaded, null if still loading. */
export function loadImage(path: string): HTMLImageElement | null {
  if (!isBrowser) return null;
  
  const cached = spriteCache.get(path);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }

  if (!loadingPromises.has(path)) {
    const img = new Image();
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => {
        spriteCache.set(path, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Failed to load sprite: ${path}`);
        reject(new Error(`Failed to load sprite: ${path}`));
      };
    });
    img.src = path;
    loadingPromises.set(path, promise);
    spriteCache.set(path, img);
  }

  const img = spriteCache.get(path);
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

/** Preload an array of paths */
function preloadPaths(paths: string[]): void {
  for (const p of paths) loadImage(p);
}

// ============================================================
// RUIN SPRITES (existing system, preserved)
// ============================================================

export type RuinTheme = 'Brown' | 'Blue-gray' | 'Brown-gray' | 'Sand' | 'Snow' | 'Water' | 'White' | 'Yellow';

export const MAP_RUIN_THEMES: Record<MapId, RuinTheme> = {
  serpentine: 'Brown',
  crossroads: 'Brown-gray',
  spiral: 'Blue-gray',
  maze: 'Sand',
  gauntlet: 'Snow',
};

const RUIN_SIZES: Record<number, { w: number; h: number }> = {
  1: { w: 112, h: 112 },
  2: { w: 80, h: 80 },
  3: { w: 64, h: 64 },
  4: { w: 48, h: 48 },
  5: { w: 32, h: 32 },
};

export function getRuinSprite(mapId: MapId, variant: number): HTMLImageElement | null {
  const theme = MAP_RUIN_THEMES[mapId];
  return loadImage(`/sprites/ruins/${theme}_ruins${variant}.png`);
}

export function getRuinDrawSize(variant: number, cellSize: number): { w: number; h: number } {
  const scales: Record<number, number> = { 1: 1.6, 2: 1.2, 3: 1.0, 4: 0.75, 5: 0.55 };
  const scale = scales[variant] || 1;
  const info = RUIN_SIZES[variant] || RUIN_SIZES[3];
  const aspect = info.h / info.w;
  const w = cellSize * scale;
  const h = w * aspect;
  return { w, h };
}

// ============================================================
// TILE SPRITES
// ============================================================

// Tile indices: FieldsTile_01 through FieldsTile_64
// Use the actual terrain tile sheet for the whole map.
const GRASS_TILE_INDICES = [1, 2, 3, 5, 6, 9, 10, 13, 14];
const PATH_TILE_INDICES = [33, 34, 35, 36, 37, 38];

export function getTileSprite(index: number): HTMLImageElement | null {
  const num = index.toString().padStart(2, '0');
  return loadImage(`/sprites/tiles/FieldsTile_${num}.png`);
}

/** Get a grass tile based on grid position from the field tile sheet. */
export function getGrassTile(col: number, row: number): HTMLImageElement | null {
  const idx = GRASS_TILE_INDICES[(col * 7 + row * 13) % GRASS_TILE_INDICES.length];
  return getTileSprite(idx);
}

/** Get a path tile based on grid position (deterministic) */
export function getPathTile(col: number, row: number): HTMLImageElement | null {
  const idx = PATH_TILE_INDICES[(col * 3 + row * 5) % PATH_TILE_INDICES.length];
  return getTileSprite(idx);
}

// ============================================================
// SPRITE SHEET ANIMATION SYSTEM
// ============================================================

export interface SpriteSheetConfig {
  path: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}

/**
 * Draw a single frame from a sprite sheet (horizontal strip).
 * Returns true if drawn, false if sprite not yet loaded (caller should use fallback).
 */
export function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  config: SpriteSheetConfig,
  frameIndex: number,
  dx: number, dy: number,
  dw: number, dh: number
): boolean {
  const img = loadImage(config.path);
  if (!img) return false;

  const frame = Math.floor(frameIndex) % config.frameCount;
  const sx = frame * config.frameWidth;
  const sy = 0;

  ctx.drawImage(
    img,
    sx, sy, config.frameWidth, config.frameHeight,
    dx, dy, dw, dh
  );
  return true;
}

// ============================================================
// ENEMY SPRITE MAPPING
// ============================================================

// Map game enemy types to sprite folders and configs
// Small mobs (48x48 frames, 6 frames): mob/1 through mob/4
// Large mobs (96x96 frames, 6 frames): largeMob/1 through largeMob/3

type EnemySpriteAction = 'Walk' | 'Death' | 'Attack' | 'Special' | 'Walk2' | 'Death2' | 'Run' | 'Fly';
type EnemySpriteDir = 'S' | 'D' | 'U'; // Side, Down, Up
export type Direction = 'south' | 'south-west' | 'west' | 'north-west' | 'north' | 'north-east' | 'east' | 'south-east';

interface EnemySpriteMapping {
  folder: string;      // e.g., 'enemies/mob1' or 'enemies/largeMob1'
  frameSize: number;   // 48 for small, 96 for large
  frameCount: number;  // 6
  walkAction: string;  // 'Walk' or 'Run' or 'Fly'
  hasAttack: boolean;
  hasSpecial: boolean;
  hasWalk2: boolean;
  hasDeath2: boolean;
  hasDirections?: boolean; // true = has 4 direction sprites (south, east, north, west)
}

const ENEMY_SPRITE_MAP: Partial<Record<EnemyType, EnemySpriteMapping>> = {
  // Mob type 1: Goblin (small, green creature — walk, walk2, death, death2, special)
  goblin:    { folder: 'enemies/mob1', frameSize: 48, frameCount: 6, walkAction: 'Walk', hasAttack: false, hasSpecial: true, hasWalk2: true, hasDeath2: true },
  imp:       { folder: 'enemies/mob1', frameSize: 48, frameCount: 6, walkAction: 'Walk2', hasAttack: false, hasSpecial: true, hasWalk2: true, hasDeath2: true },

  // Mob type 2: Skeleton (walk, death, attack)
  skeleton:  { folder: 'enemies/mob2', frameSize: 48, frameCount: 6, walkAction: 'Walk', hasAttack: true, hasSpecial: false, hasWalk2: false, hasDeath2: false },

  // Mob type 3: Orc/Warrior (walk, death, attack)
  orc:       { folder: 'enemies/mob3', frameSize: 48, frameCount: 6, walkAction: 'Walk', hasAttack: true, hasSpecial: false, hasWalk2: false, hasDeath2: false },
  werewolf:  { folder: 'enemies/mob3', frameSize: 48, frameCount: 6, walkAction: 'Walk', hasAttack: true, hasSpecial: false, hasWalk2: false, hasDeath2: false },

  // Mob type 4: Basic (walk, death only)
  healer:    { folder: 'enemies/mob4', frameSize: 48, frameCount: 6, walkAction: 'Walk', hasAttack: false, hasSpecial: false, hasWalk2: false, hasDeath2: false },
  tunneler:  { folder: 'enemies/mob4', frameSize: 48, frameCount: 6, walkAction: 'Walk', hasAttack: false, hasSpecial: false, hasWalk2: false, hasDeath2: false },
  banshee:   { folder: 'enemies/mob4', frameSize: 48, frameCount: 6, walkAction: 'Walk', hasAttack: false, hasSpecial: false, hasWalk2: false, hasDeath2: false },

  // Large Mob 1: Troll/Golem (run, death, attack, special)
  troll:     { folder: 'enemies/largeMob1', frameSize: 96, frameCount: 6, walkAction: 'Run', hasAttack: true, hasSpecial: true, hasWalk2: false, hasDeath2: false },
  golem:     { folder: 'enemies/largeMob1', frameSize: 96, frameCount: 6, walkAction: 'Run', hasAttack: true, hasSpecial: true, hasWalk2: false, hasDeath2: false },

  // Large Mob 2: Dark Knight / Armored (run, death, attack, special)
  darkKnight: { folder: 'enemies/largeMob2', frameSize: 96, frameCount: 6, walkAction: 'Run', hasAttack: true, hasSpecial: true, hasWalk2: false, hasDeath2: false },
  armored:    { folder: 'enemies/largeMob2', frameSize: 96, frameCount: 6, walkAction: 'Run', hasAttack: true, hasSpecial: true, hasWalk2: false, hasDeath2: false },

  // Large Mob 3: Dragon / Flyer (fly, death, attack, special — flying boss)
  dragon:        { folder: 'enemies/largeMob3', frameSize: 96, frameCount: 6, walkAction: 'Fly', hasAttack: true, hasSpecial: true, hasWalk2: false, hasDeath2: false },
  flyer:         { folder: 'enemies/largeMob3', frameSize: 96, frameCount: 6, walkAction: 'Fly', hasAttack: true, hasSpecial: true, hasWalk2: false, hasDeath2: false },
  splitterBoss:  { folder: 'enemies/largeMob3', frameSize: 96, frameCount: 6, walkAction: 'Fly', hasAttack: true, hasSpecial: true, hasWalk2: false, hasDeath2: false },

// Boss Dragon: AI-generated pixel art dragon boss with walk animation
  bossDragon:    { folder: 'enemies/bossDragon', frameSize: 96, frameCount: 6, walkAction: 'Walk', hasAttack: false, hasSpecial: false, hasWalk2: false, hasDeath2: false },
  
  // Quadruped Bosses (AI-generated) - 4 direction sprites
  bossQuadrupedBear:     { folder: 'enemies/bossQuadrupeds/demonic_bear', frameSize: 48, frameCount: 1, walkAction: 'Walk', hasAttack: false, hasSpecial: false, hasWalk2: false, hasDeath2: false, hasDirections: true },
  bossQuadrupedHorse:    { folder: 'enemies/bossQuadrupeds/undead_horse', frameSize: 48, frameCount: 1, walkAction: 'Walk', hasAttack: false, hasSpecial: false, hasWalk2: false, hasDeath2: false, hasDirections: true },
  bossQuadrupedLion:     { folder: 'enemies/bossQuadrupeds/crystal_lion', frameSize: 48, frameCount: 1, walkAction: 'Walk', hasAttack: false, hasSpecial: false, hasWalk2: false, hasDeath2: false, hasDirections: true },
  bossQuadrupedWolf:     { folder: 'enemies/bossQuadrupeds/war_wolf', frameSize: 48, frameCount: 1, walkAction: 'Walk', hasAttack: false, hasSpecial: false, hasWalk2: false, hasDeath2: false, hasDirections: true },
  bossQuadrupedStoneBear: { folder: 'enemies/bossQuadrupeds/stone_bear', frameSize: 48, frameCount: 1, walkAction: 'Walk', hasAttack: false, hasSpecial: false, hasWalk2: false, hasDeath2: false, hasDirections: true },
  
  // Epic Bosses (AI-generated) - 4 direction sprites
  bossTitan:    { folder: 'enemies/bossTitan', frameSize: 48, frameCount: 1, walkAction: 'Walk', hasAttack: false, hasSpecial: false, hasWalk2: false, hasDeath2: false, hasDirections: true },
  bossSerpent:  { folder: 'enemies/bossSerpent', frameSize: 56, frameCount: 1, walkAction: 'Walk', hasAttack: false, hasSpecial: false, hasWalk2: false, hasDeath2: false, hasDirections: true },
};

interface EnemyRotationConfig {
  folder: string;
  directions: 4 | 8;
}

const ENEMY_ROTATION_MAP: Partial<Record<EnemyType, EnemyRotationConfig>> = {
  bossDragon: { folder: 'enemies/bossDragon', directions: 4 },
  bossQuadrupedBear: { folder: 'enemies/bossQuadrupeds/demonic_bear', directions: 4 },
  bossQuadrupedHorse: { folder: 'enemies/bossQuadrupeds/undead_horse', directions: 4 },
  bossQuadrupedLion: { folder: 'enemies/bossQuadrupeds/crystal_lion', directions: 4 },
  bossQuadrupedWolf: { folder: 'enemies/bossQuadrupeds/war_wolf', directions: 4 },
  bossQuadrupedStoneBear: { folder: 'enemies/bossQuadrupeds/stone_bear', directions: 4 },
  bossTitan: { folder: 'enemies/bossTitan', directions: 8 },
  bossSerpent: { folder: 'enemies/bossSerpent', directions: 8 },
};

// ============================================================
// FOOZLE ENEMY SPRITE SYSTEM (grid spritesheets)
// ============================================================
// Foozle Spire Enemy Pack 2: 64x64 frames in a grid layout
// Row 0 (y=0):   Walk animation
// Row 1 (y=64):  Attack animation
// Row 2 (y=128): Death animation
// Rows 3-8: additional animations (unused)

interface FoozleEnemyConfig {
  path: string;
  frameSize: number;      // 64
  walkFrames: number;     // frames in walk row
  attackFrames: number;   // frames in attack row
  deathFrames: number;    // frames in death row
}

const FOOZLE_ENEMY_CONFIGS: Partial<Record<EnemyType, FoozleEnemyConfig>> = {
  firebug:   { path: '/sprites/enemies/foozle/firebug.png',   frameSize: 64, walkFrames: 8, attackFrames: 8, deathFrames: 6 },
  leafbug:   { path: '/sprites/enemies/foozle/leafbug.png',   frameSize: 64, walkFrames: 8, attackFrames: 8, deathFrames: 6 },
  magmaCrab: { path: '/sprites/enemies/foozle/magmacrab.png', frameSize: 64, walkFrames: 8, attackFrames: 8, deathFrames: 6 },
  scorpion:  { path: '/sprites/enemies/foozle/scorpion.png',  frameSize: 64, walkFrames: 8, attackFrames: 8, deathFrames: 6 },
};

/**
 * Draw a Foozle-style enemy sprite from a grid spritesheet.
 * Returns true if drawn, false if sprite not yet loaded.
 */
export function drawFoozleEnemySprite(
  ctx: CanvasRenderingContext2D,
  enemyType: EnemyType,
  x: number, y: number,
  size: number,
  walkCycle: number,
  dying: boolean,
  facingLeft: boolean
): boolean {
  const config = FOOZLE_ENEMY_CONFIGS[enemyType];
  if (!config) return false;

  const img = loadImage(config.path);
  if (!img) return false;

  const { frameSize } = config;
  let row: number;
  let frameCount: number;
  if (dying) {
    row = 2;
    frameCount = config.deathFrames;
  } else {
    row = 0;
    frameCount = config.walkFrames;
  }

  const frameIndex = dying
    ? Math.min(Math.floor(walkCycle * frameCount), frameCount - 1)
    : Math.floor(walkCycle * frameCount) % frameCount;

  const sx = frameIndex * frameSize;
  const sy = row * frameSize;

  // Scale to match game enemy size
  const scale = (size * 2.4) / frameSize;
  const dw = frameSize * scale;
  const dh = frameSize * scale;

  ctx.save();
  if (!facingLeft) {
    ctx.scale(-1, 1);
    ctx.translate(-x * 2, 0);
  }
  ctx.drawImage(img, sx, sy, frameSize, frameSize, x - dw / 2, y - dh / 2, dw, dh);
  ctx.restore();

  return true;
}

function getEnemySpriteSheet(
  enemyType: EnemyType,
  action: string,
  direction: EnemySpriteDir = 'S'
): SpriteSheetConfig | null {
  const mapping = ENEMY_SPRITE_MAP[enemyType];
  if (!mapping) return null;

  return {
    path: `/sprites/${mapping.folder}/${direction}_${action}.png`,
    frameWidth: mapping.frameSize,
    frameHeight: mapping.frameSize,
    frameCount: mapping.frameCount,
  };
}

/**
 * Draw an enemy sprite. Returns true if sprite was drawn, false for fallback.
 * walkCycle: 0-1 continuous walk cycle value
 * dying: whether enemy is in death animation
 * direction: 'D' (down/south), 'U' (up/north), 'S' (side/west/east)
 */
export function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  enemyType: EnemyType,
  x: number, y: number,
  size: number,
  walkCycle: number,
  dying: boolean,
  facingLeft: boolean,
  direction: EnemySpriteDir = 'S',
  moveAngleRadians?: number
): boolean {
  const rotationConfig = ENEMY_ROTATION_MAP[enemyType];
  if (rotationConfig && !dying) {
    const directionLabel = rotationConfig.directions === 4
      ? angleToDirection4(((moveAngleRadians ?? 0) * 180) / Math.PI)
      : angleToDirection(((moveAngleRadians ?? 0) * 180) / Math.PI);
    const img = loadImage(`/sprites/${rotationConfig.folder}/rotations/${directionLabel}.png`);
    if (img && img.complete && img.naturalWidth > 0) {
      const dw = size * 2.5;
      const dh = size * 2.5;
      ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
      return true;
    }
  }

  const mapping = ENEMY_SPRITE_MAP[enemyType];
  if (!mapping) return false;

  const action = dying ? 'Death' : mapping.walkAction;
  
  // Use direction-based sprites for enemies with hasDirections
  const useDirection = mapping.hasDirections;
  const spriteDirection = useDirection ? direction : 'S';
  
  const config = getEnemySpriteSheet(enemyType, action, spriteDirection);
  if (!config) return false;

  // Calculate frame index from walk cycle (0-1 maps to 0-5)
  const frameIndex = dying
    ? Math.min(Math.floor(walkCycle * config.frameCount), config.frameCount - 1)
    : Math.floor(walkCycle * config.frameCount) % config.frameCount;

  // Calculate draw dimensions — scale sprite to match the game's enemy size
  const scale = (size * 2.8) / mapping.frameSize;
  const dw = mapping.frameSize * scale;
  const dh = mapping.frameSize * scale;

  ctx.save();

  // For enemies with direction sprites, don't flip
  // For others, flip based on facingLeft
  if (!useDirection && !facingLeft) {
    ctx.scale(-1, 1);
    ctx.translate(-x * 2, 0);
  }

  const drawn = drawSpriteFrame(ctx, config, frameIndex, x - dw / 2, y - dh / 2, dw, dh);
  ctx.restore();

  return drawn;
}

// ============================================================
// TOWER SPRITES (Archer Tower)
// ============================================================

// Archer tower idle: 7 files (1.png = level 1 single frame, 2-3.png = 4 frames, 4-7.png = 6 frames)
// Frame width: 70px, height: 130px
// Upgrade animation: 7 files, 280x130 each (4 frames at 70px)

interface TowerSpriteConfig {
  idlePath: string;
  frameWidth: number;
  frameHeight: number;
  idleFrameCount: number;
}

const TOWER_IDLE_CONFIGS: Record<number, TowerSpriteConfig> = {
  1: { idlePath: '/sprites/towers/archer/idle/1.png', frameWidth: 70, frameHeight: 130, idleFrameCount: 1 },
  2: { idlePath: '/sprites/towers/archer/idle/2.png', frameWidth: 70, frameHeight: 130, idleFrameCount: 4 },
  3: { idlePath: '/sprites/towers/archer/idle/3.png', frameWidth: 70, frameHeight: 130, idleFrameCount: 4 },
  4: { idlePath: '/sprites/towers/archer/idle/4.png', frameWidth: 70, frameHeight: 130, idleFrameCount: 6 },
  5: { idlePath: '/sprites/towers/archer/idle/5.png', frameWidth: 70, frameHeight: 130, idleFrameCount: 6 },
  6: { idlePath: '/sprites/towers/archer/idle/6.png', frameWidth: 70, frameHeight: 130, idleFrameCount: 6 },
  7: { idlePath: '/sprites/towers/archer/idle/7.png', frameWidth: 70, frameHeight: 130, idleFrameCount: 6 },
};

/**
 * Draw archer tower sprite. Maps game level (1-3) to sprite variant.
 * Returns true if drawn.
 */
export function drawArcherTowerSprite(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  level: number,
  animTimer: number,
  cellSize: number,
  spriteVariantOverride?: number
): boolean {
  // Map game levels (1-3) to sprite variants (1-7):
  // Each level uses a more elaborate tower sprite
  // Level 1 = variant 1 (basic), Level 2 = variant 3 (upgraded), Level 3 = variant 5 (max)
  const variantMap: Record<number, number> = { 1: 1, 2: 3, 3: 5 };
  const variant = spriteVariantOverride ?? variantMap[level] ?? 1;
  const config = TOWER_IDLE_CONFIGS[variant];
  if (!config) return false;

  const sheet: SpriteSheetConfig = {
    path: config.idlePath,
    frameWidth: config.frameWidth,
    frameHeight: config.frameHeight,
    frameCount: config.idleFrameCount,
  };

  // Animate through idle frames
  const fps = 6;
  const frameIndex = config.idleFrameCount > 1
    ? Math.floor((animTimer * fps) % config.idleFrameCount)
    : 0;

  // Scale: tower should fit nicely in a cell
  const scale = (cellSize * 1.1) / config.frameWidth;
  const dw = config.frameWidth * scale;
  const dh = config.frameHeight * scale;

  // Anchor tower bottom to cell center
  return drawSpriteFrame(ctx, sheet, frameIndex, x - dw / 2, y - dh + cellSize * 0.4, dw, dh);
}

/**
 * Draw archer tower preview for shop UI. Returns true if drawn.
 */
export function drawArcherTowerPreview(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number
): boolean {
  const config = TOWER_IDLE_CONFIGS[2]; // Show level 1 variant
  if (!config) return false;

  const sheet: SpriteSheetConfig = {
    path: config.idlePath,
    frameWidth: config.frameWidth,
    frameHeight: config.frameHeight,
    frameCount: config.idleFrameCount,
  };

  const scale = size / config.frameHeight;
  const dw = config.frameWidth * scale;
  const dh = config.frameHeight * scale;

  return drawSpriteFrame(ctx, sheet, 0, x - dw / 2, y - dh / 2, dw, dh);
}

/**
 * Draw a specific archer tower variant preview (1-7) for structure selection UI.
 * Draws centered in a square of given size.
 */
export function drawArcherVariantPreview(
  ctx: CanvasRenderingContext2D,
  variant: number,
  canvasSize: number
): boolean {
  const config = TOWER_IDLE_CONFIGS[variant];
  if (!config) return false;

  const sheet: SpriteSheetConfig = {
    path: config.idlePath,
    frameWidth: config.frameWidth,
    frameHeight: config.frameHeight,
    frameCount: config.idleFrameCount,
  };

  const scale = (canvasSize * 0.9) / config.frameHeight;
  const dw = config.frameWidth * scale;
  const dh = config.frameHeight * scale;
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;

  return drawSpriteFrame(ctx, sheet, 0, cx - dw / 2, cy - dh / 2, dw, dh);
}

/** Get the count of available archer tower variants */
export const ARCHER_VARIANT_COUNT = Object.keys(TOWER_IDLE_CONFIGS).length;

// ============================================================
// FOOZLE TOWER SPRITES (Tower 03 & Tower 04)
// ============================================================
// Tower 03: base 192x128 (static), weapon 768x96 (8 frames of 96x96), projectile 60x10 (static)
// Tower 04: base 192x128 (static), weapon 2176x128 (17 frames of 128x128), projectile varies

interface FoozleTowerConfig {
  basePath: string;
  weaponPath: string;
  projectilePath: string;
  impactPath: string;
  weaponFrameWidth: number;
  weaponFrameHeight: number;
  weaponFrameCount: number;
}

const FOOZLE_TOWER_CONFIGS: Record<'tower03' | 'tower04', Record<1 | 2 | 3, FoozleTowerConfig>> = {
  tower03: {
    1: { basePath: '/sprites/towers/tower03/base.png', weaponPath: '/sprites/towers/tower03/weapon1.png', projectilePath: '/sprites/towers/tower03/projectile1.png', impactPath: '/sprites/towers/tower03/impact1.png', weaponFrameWidth: 96, weaponFrameHeight: 96, weaponFrameCount: 8 },
    2: { basePath: '/sprites/towers/tower03/base.png', weaponPath: '/sprites/towers/tower03/weapon2.png', projectilePath: '/sprites/towers/tower03/projectile2.png', impactPath: '/sprites/towers/tower03/impact2.png', weaponFrameWidth: 96, weaponFrameHeight: 96, weaponFrameCount: 8 },
    3: { basePath: '/sprites/towers/tower03/base.png', weaponPath: '/sprites/towers/tower03/weapon3.png', projectilePath: '/sprites/towers/tower03/projectile3.png', impactPath: '/sprites/towers/tower03/impact3.png', weaponFrameWidth: 96, weaponFrameHeight: 96, weaponFrameCount: 8 },
  },
  tower04: {
    1: { basePath: '/sprites/towers/tower04/base.png', weaponPath: '/sprites/towers/tower04/weapon1.png', projectilePath: '/sprites/towers/tower04/projectile1.png', impactPath: '/sprites/towers/tower04/impact1.png', weaponFrameWidth: 128, weaponFrameHeight: 128, weaponFrameCount: 17 },
    2: { basePath: '/sprites/towers/tower04/base.png', weaponPath: '/sprites/towers/tower04/weapon2.png', projectilePath: '/sprites/towers/tower04/projectile2.png', impactPath: '/sprites/towers/tower04/impact2.png', weaponFrameWidth: 128, weaponFrameHeight: 128, weaponFrameCount: 17 },
    3: { basePath: '/sprites/towers/tower04/base.png', weaponPath: '/sprites/towers/tower04/weapon3.png', projectilePath: '/sprites/towers/tower04/projectile3.png', impactPath: '/sprites/towers/tower04/impact3.png', weaponFrameWidth: 128, weaponFrameHeight: 128, weaponFrameCount: 17 },
  },
};

export function drawFoozleTowerSprite(
  ctx: CanvasRenderingContext2D,
  towerKey: 'tower03' | 'tower04',
  level: number,
  x: number, y: number,
  cellSize: number,
  animTimer: number
): boolean {
  const lvl = (Math.max(1, Math.min(3, level))) as 1 | 2 | 3;
  const config = FOOZLE_TOWER_CONFIGS[towerKey][lvl];
  if (!config) return false;

  const baseImg = loadImage(config.basePath);
  if (!baseImg) return false;

  // Draw base (192x128 -> scale to fit cell)
  const baseScale = (cellSize * 1.1) / 128;
  const baseDw = 192 * baseScale;
  const baseDh = 128 * baseScale;
  ctx.drawImage(baseImg, x - baseDw / 2, y - baseDh + cellSize * 0.5, baseDw, baseDh);

  // Draw animated weapon on top
  const weaponImg = loadImage(config.weaponPath);
  if (weaponImg) {
    const fps = 8;
    const frameIndex = Math.floor((animTimer * fps) % config.weaponFrameCount);
    const sx = frameIndex * config.weaponFrameWidth;
    const wScale = (cellSize * 0.9) / config.weaponFrameHeight;
    const wDw = config.weaponFrameWidth * wScale;
    const wDh = config.weaponFrameHeight * wScale;
    ctx.drawImage(weaponImg, sx, 0, config.weaponFrameWidth, config.weaponFrameHeight,
      x - wDw / 2, y - wDh - baseDh * 0.3 + cellSize * 0.5, wDw, wDh);
  }

  return true;
}

export function getFoozleTowerProjectileSprite(towerKey: 'tower03' | 'tower04', level: number): HTMLImageElement | null {
  const lvl = (Math.max(1, Math.min(3, level))) as 1 | 2 | 3;
  const config = FOOZLE_TOWER_CONFIGS[towerKey]?.[lvl];
  if (!config) return null;
  return loadImage(config.projectilePath);
}

export function drawFoozleTowerImpact(
  ctx: CanvasRenderingContext2D,
  towerKey: 'tower03' | 'tower04',
  level: number,
  x: number, y: number,
  animTimer: number,
  size: number
): boolean {
  const lvl = (Math.max(1, Math.min(3, level))) as 1 | 2 | 3;
  const config = FOOZLE_TOWER_CONFIGS[towerKey]?.[lvl];
  if (!config) return false;

  const img = loadImage(config.impactPath);
  if (!img) return false;

  // Impact sheets: Tower03 = 384x64 (6 frames of 64x64), Tower04 = 576x64 (9 frames of 64x64)
  const frameH = 64;
  const frameW = towerKey === 'tower03' ? 64 : 64;
  const frameCount = towerKey === 'tower03' ? 6 : 9;
  const frameIndex = Math.min(Math.floor(animTimer * 12) % frameCount, frameCount - 1);
  const sx = frameIndex * frameW;
  const scale = size / frameH;
  const dw = frameW * scale;
  const dh = frameH * scale;
  ctx.drawImage(img, sx, 0, frameW, frameH, x - dw / 2, y - dh / 2, dw, dh);
  return true;
}

// ============================================================
// CHARACTER SPRITES (Heroes & Orcs — static images)
// ============================================================

export function getCharacterSprite(name: 'knight_hero' | 'mage_hero' | 'orc_brute' | 'orc_raider'): HTMLImageElement | null {
  return loadImage(`/sprites/characters/${name}.png`);
}

// ============================================================
// DIRECTIONAL CHARACTER SPRITES (PixelLab generated)
// ============================================================

export type PixelLabCharacterName = 'hero_sword' | 'wizard' | 'spear_hero' | 'dragon' | 'infantry' | 'wolf' | 'skeleton' | 'archer' | 'pikeman' | 'paladin';

interface PixelLabCharacterConfig {
  folder: string;
  size: number;
  directions: number;
  animations: string[];
}

const PIXELLAB_CHARACTERS: Record<PixelLabCharacterName, PixelLabCharacterConfig> = {
  hero_sword: { folder: 'hero_sword', size: 48, directions: 8, animations: ['fireball'] },
  wizard: { folder: 'wizard', size: 48, directions: 8, animations: [] },
  spear_hero: { folder: 'spear_hero', size: 48, directions: 8, animations: [] },
  dragon: { folder: 'dragon', size: 48, directions: 8, animations: ['fast-walk'] },
  infantry: { folder: 'infantry', size: 48, directions: 4, animations: [] },
  wolf: { folder: 'wolf', size: 48, directions: 4, animations: [] },
  skeleton: { folder: 'skeleton', size: 48, directions: 4, animations: [] },
  archer: { folder: 'archer', size: 48, directions: 4, animations: [] },
  pikeman: { folder: 'pikeman', size: 48, directions: 4, animations: [] },
  paladin: { folder: 'paladin', size: 48, directions: 4, animations: [] },
};

function getDirectionLabel(dir: Direction): string {
  return dir;
}

export function getPixelLabCharacterRotation(
  name: PixelLabCharacterName,
  direction: Direction
): HTMLImageElement | null {
  const config = PIXELLAB_CHARACTERS[name];
  if (!config) return null;
  return loadImage(`/sprites/characters/${config.folder}/rotations/${direction}.png`);
}

export function getPixelLabCharacterAnimationFrame(
  name: PixelLabCharacterName,
  animation: string,
  direction: Direction,
  frameIndex: number
): HTMLImageElement | null {
  const config = PIXELLAB_CHARACTERS[name];
  if (!config || !config.animations.includes(animation)) return null;
  const frame = `frame_${String(frameIndex).padStart(3, '0')}.png`;
  return loadImage(`/sprites/characters/${config.folder}/animations/${animation}/${direction}/${frame}`);
}

interface PixelLabAnimationConfig {
  path: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}

function getPixelLabAnimationConfig(
  name: PixelLabCharacterName,
  animation: string
): PixelLabAnimationConfig | null {
  const config = PIXELLAB_CHARACTERS[name];
  if (!config || !config.animations.includes(animation)) return null;
  const frameCounts: Record<string, number> = {
    'fireball': 6,
    'fast-walk': 8,
    'walking-6-frames': 6,
  };
  return {
    path: `/sprites/characters/${config.folder}/animations/${animation}`,
    frameWidth: config.size,
    frameHeight: config.size,
    frameCount: frameCounts[animation] || 6,
  };
}

export function drawPixelLabCharacter(
  ctx: CanvasRenderingContext2D,
  name: PixelLabCharacterName,
  x: number,
  y: number,
  direction: Direction,
  size: number,
  animation: string | null = null,
  animFrame: number = 0
): boolean {
  if (animation) {
    const frameIndex = Math.floor(animFrame) % 8;
    const img = getPixelLabCharacterAnimationFrame(name, animation, direction, frameIndex);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
      return true;
    }
  }
  const img = getPixelLabCharacterRotation(name, direction);
  if (!img) return false;
  if (!img.complete || img.naturalWidth === 0) return false;
  ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  return true;
}

function angleToDirection(angle: number): Direction {
  const normalized = ((angle % 360) + 360) % 360;
  if (normalized < 22.5 || normalized >= 337.5) return 'east';
  if (normalized < 67.5) return 'south-east';
  if (normalized < 112.5) return 'south';
  if (normalized < 157.5) return 'south-west';
  if (normalized < 202.5) return 'west';
  if (normalized < 247.5) return 'north-west';
  if (normalized < 292.5) return 'north';
  return 'north-east';
}

function angleToDirection4(angle: number): 'south' | 'west' | 'north' | 'east' {
  const normalized = ((angle % 360) + 360) % 360;
  if (normalized < 45 || normalized >= 315) return 'east';
  if (normalized < 135) return 'south';
  if (normalized < 225) return 'west';
  return 'north';
}

export function drawPixelLabCharacterByAngle(
  ctx: CanvasRenderingContext2D,
  name: PixelLabCharacterName,
  x: number,
  y: number,
  angle: number,
  size: number,
  animation: string | null = null,
  animFrame: number = 0
): boolean {
  const config = PIXELLAB_CHARACTERS[name];
  const direction = config?.directions === 4 
    ? angleToDirection4(angle) 
    : angleToDirection(angle);
  return drawPixelLabCharacter(ctx, name, x, y, direction, size, animation, animFrame);
}

// ============================================================
// MAGIC CRYSTAL TOWER SPRITE
// ============================================================

export function getMagicCrystalTowerSprite(): HTMLImageElement | null {
  return loadImage('/sprites/towers/magic_crystal_tower.png');
}

export function drawMagicCrystalTowerSprite(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  cellSize: number
): boolean {
  const img = getMagicCrystalTowerSprite();
  if (!img) return false;
  // 232x265 — scale to fit cell height
  const scale = (cellSize * 1.3) / 265;
  const dw = 232 * scale;
  const dh = 265 * scale;
  ctx.drawImage(img, x - dw / 2, y - dh + cellSize * 0.4, dw, dh);
  return true;
}

// ============================================================
// UI SPRITES (icons, buttons, banners)
// ============================================================

export type UIIconName = 'icon_arrow_up' | 'icon_coin' | 'icon_heart' | 'icon_plus' | 'icon_settings' | 'icon_skull' | 'icon_undo' | 'gold_pile' | 'button_pause' | 'button_play' | 'banner_wave';

export function getUISprite(name: UIIconName): HTMLImageElement | null {
  return loadImage(`/sprites/ui/${name}.png`);
}

// ============================================================
// PROP SPRITES (from Fantasy TD Starter Pack)
// ============================================================

export type PropName = 'pine_tree' | 'bush_round' | 'rock_cluster' | 'rock_bush_cluster' | 'wood_bridge' | 'fence_segment' | 'wooden_signpost' | 'grass_tile_a' | 'grass_tile_b';

export function getPropSprite(name: PropName): HTMLImageElement | null {
  return loadImage(`/sprites/props/${name}.png`);
}

// ============================================================
// TREE SPRITES
// ============================================================

// Trees: Tree1.png, Tree2.png, Tree3.png (individual images, not strips)
const TREE_COUNT = 3;

export function getTreeSprite(variant: number): HTMLImageElement | null {
  const v = ((variant - 1) % TREE_COUNT) + 1;
  return loadImage(`/sprites/trees/Tree${v}.png`);
}

/** Also have special tree types for variety */
export function getSpecialTreeSprite(type: string): HTMLImageElement | null {
  return loadImage(`/sprites/trees/${type}.png`);
}

// ============================================================
// ROCK SPRITES
// ============================================================

// Rocks: Rock{type}_grass_shadow_dark{size}.png
// Types: 1,2,4,5,6 (Rock3 doesn't exist in grass_shadow_dark)
// Sizes: 1 (largest) to 5 (smallest)
const ROCK_TYPES = [1, 2, 4, 5, 6];

export function getRockSprite(rockType: number, sizeVariant: number): HTMLImageElement | null {
  const type = ROCK_TYPES[(rockType - 1) % ROCK_TYPES.length];
  const size = Math.max(1, Math.min(5, sizeVariant));
  return loadImage(`/sprites/rocks/Rock${type}_grass_shadow_dark${size}.png`);
}

// ============================================================
// PROJECTILE SPRITES (Arrow)
// ============================================================

// Arrow sprites: individual rotation frames in /sprites/towers/archer/arrow/
// They are tiny individual sprites, not animation strips
// We'll use the first one as a generic arrow

export function getArrowSprite(): HTMLImageElement | null {
  return loadImage('/sprites/towers/archer/arrow/1.png');
}

// ============================================================
// POWER / ABILITY SPRITES
// ============================================================

// Lightning: 4 variants, each 640x160 (160x160 frames, 4 frames)
export function getLightningSpriteConfig(variant: number): SpriteSheetConfig {
  const v = Math.max(1, Math.min(4, variant));
  return {
    path: `/sprites/powers/lightning/${v}.png`,
    frameWidth: 160,
    frameHeight: 160,
    frameCount: 4,
  };
}

// Spikes: 4 variants, each 192x32 (32x32 frames, 6 frames)
export function getSpikeSpriteConfig(variant: number): SpriteSheetConfig {
  const v = Math.max(1, Math.min(4, variant));
  return {
    path: `/sprites/powers/spikes/${v}.png`,
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 6,
  };
}

// Barrel: 3 barrel variants (192x48, 48x48 frames, 4 frames)
// Boom: 3 explosion variants (384x48, 48x48 frames, 8 frames)
export function getBarrelSpriteConfig(variant: number): SpriteSheetConfig {
  const v = Math.max(1, Math.min(3, variant));
  return {
    path: `/sprites/powers/barrel/${v}.png`,
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 4,
  };
}

export function getBoomSpriteConfig(variant: number): SpriteSheetConfig {
  const v = Math.max(1, Math.min(3, variant));
  return {
    path: `/sprites/powers/barrel/Boom${v}.png`,
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 8,
  };
}

// ============================================================
// MAP OBJECTS (Decorations)
// ============================================================

export function getPlacementSprite(variant: 1 | 2): HTMLImageElement | null {
  return loadImage(`/sprites/objects/placement/PlaceForTower${variant}.png`);
}

export function getGrassDecorSprite(variant: number): HTMLImageElement | null {
  const v = Math.max(1, Math.min(6, variant));
  return loadImage(`/sprites/objects/grass/${v}.png`);
}

export function getFlowerSprite(variant: number): HTMLImageElement | null {
  const v = Math.max(1, Math.min(12, variant));
  return loadImage(`/sprites/objects/flower/${v}.png`);
}

export function getBushSprite(variant: number): HTMLImageElement | null {
  const v = Math.max(1, Math.min(6, variant));
  return loadImage(`/sprites/objects/bush/${v}.png`);
}

export function getFenceSprite(variant: number): HTMLImageElement | null {
  return loadImage(`/sprites/objects/fence/${variant}.png`);
}

export function getStoneSprite(variant: number): HTMLImageElement | null {
  return loadImage(`/sprites/objects/stone/${variant}.png`);
}

export function getCampSprite(variant: number): HTMLImageElement | null {
  return loadImage(`/sprites/objects/camp/${variant}.png`);
}

export function getDecorSprite(variant: number): HTMLImageElement | null {
  return loadImage(`/sprites/objects/decor/${variant}.png`);
}

// ============================================================
// ANIMATED OBJECTS (Flags, Campfires)
// ============================================================

// Flags: 5 variants, 192x64 (64x64 frames, 3 frames)
export function getFlagSpriteConfig(variant: number): SpriteSheetConfig {
  const v = Math.max(1, Math.min(5, variant));
  return {
    path: `/sprites/animated/flag/${v}.png`,
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 3,
  };
}

// Campfire: 2 variants
// Variant 1: 192x64 (64x64, 3 frames)
// Variant 2: 192x32 (32x32, 6 frames)
export function getCampfireSpriteConfig(variant: number): SpriteSheetConfig {
  if (variant === 2) {
    return {
      path: '/sprites/animated/campfire/2.png',
      frameWidth: 32,
      frameHeight: 32,
      frameCount: 6,
    };
  }
  return {
    path: '/sprites/animated/campfire/1.png',
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 3,
  };
}

// ============================================================
// PRELOADING
// ============================================================

let _preloaded = false;

/** Preload core sprites that should be ready before gameplay */
export function preloadMapSprites(mapId: MapId): void {
  // Ruin sprites for this map
  const theme = MAP_RUIN_THEMES[mapId];
  for (let v = 1; v <= 5; v++) {
    loadImage(`/sprites/ruins/${theme}_ruins${v}.png`);
  }

  if (_preloaded) return;
  _preloaded = true;

  // Terrain tiles
  for (const idx of [...new Set([...GRASS_TILE_INDICES, ...PATH_TILE_INDICES])]) {
    const num = idx.toString().padStart(2, '0');
    loadImage(`/sprites/tiles/FieldsTile_${num}.png`);
  }

  // Tree sprites
  for (let i = 1; i <= TREE_COUNT; i++) {
    loadImage(`/sprites/trees/Tree${i}.png`);
  }

  // Rock sprites (most common sizes)
  for (const type of ROCK_TYPES) {
    for (let size = 1; size <= 3; size++) {
      loadImage(`/sprites/rocks/Rock${type}_grass_shadow_dark${size}.png`);
    }
  }

  // Enemy sprites — preload walk sprites for all mapped types
  for (const [, mapping] of Object.entries(ENEMY_SPRITE_MAP)) {
    if (!mapping) continue;
    loadImage(`/sprites/${mapping.folder}/S_${mapping.walkAction}.png`);
    loadImage(`/sprites/${mapping.folder}/S_Death.png`);
  }

  // Tower sprites
  for (const [, config] of Object.entries(TOWER_IDLE_CONFIGS)) {
    loadImage(config.idlePath);
  }

  // Placement indicators
  loadImage('/sprites/objects/placement/PlaceForTower1.png');
  loadImage('/sprites/objects/placement/PlaceForTower2.png');

  // Animated objects
  for (let i = 1; i <= 5; i++) loadImage(`/sprites/animated/flag/${i}.png`);
  loadImage('/sprites/animated/campfire/1.png');
  loadImage('/sprites/animated/campfire/2.png');

  // Grass/flower decorations
  for (let i = 1; i <= 6; i++) loadImage(`/sprites/objects/grass/${i}.png`);
  for (let i = 1; i <= 6; i++) loadImage(`/sprites/objects/bush/${i}.png`);
  for (let i = 1; i <= 6; i++) loadImage(`/sprites/objects/flower/${i}.png`);

  // Power sprites
  for (let i = 1; i <= 4; i++) loadImage(`/sprites/powers/lightning/${i}.png`);
  for (let i = 1; i <= 3; i++) {
    loadImage(`/sprites/powers/barrel/${i}.png`);
    loadImage(`/sprites/powers/barrel/Boom${i}.png`);
  }

  // Foozle enemy sprites
  loadImage('/sprites/enemies/foozle/firebug.png');
  loadImage('/sprites/enemies/foozle/leafbug.png');
  loadImage('/sprites/enemies/foozle/magmacrab.png');
  loadImage('/sprites/enemies/foozle/scorpion.png');

  // Foozle tower sprites
  for (const tower of ['tower03', 'tower04'] as const) {
    loadImage(`/sprites/towers/${tower}/base.png`);
    for (let lvl = 1; lvl <= 3; lvl++) {
      loadImage(`/sprites/towers/${tower}/weapon${lvl}.png`);
      loadImage(`/sprites/towers/${tower}/projectile${lvl}.png`);
      loadImage(`/sprites/towers/${tower}/impact${lvl}.png`);
    }
  }

  // Character sprites
  loadImage('/sprites/characters/knight_hero.png');
  loadImage('/sprites/characters/mage_hero.png');
  loadImage('/sprites/characters/orc_brute.png');
  loadImage('/sprites/characters/orc_raider.png');

  // PixelLab directional character sprites
  const directions8: Direction[] = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'];
  const directions4: Direction[] = ['south', 'west', 'north', 'east'];
  const pixellabNames8: PixelLabCharacterName[] = ['hero_sword', 'wizard', 'spear_hero', 'dragon'];
  const pixellabNames4: PixelLabCharacterName[] = ['infantry', 'wolf', 'skeleton'];
  for (const name of pixellabNames8) {
    for (const dir of directions8) {
      loadImage(`/sprites/characters/${name}/rotations/${dir}.png`);
    }
  }
  for (const name of pixellabNames4) {
    for (const dir of directions4) {
      loadImage(`/sprites/characters/${name}/rotations/${dir}.png`);
    }
  }
  // Preload archer, pikeman, paladin (new 4-dir characters)
  const newChars4: PixelLabCharacterName[] = ['archer', 'pikeman', 'paladin'];
  for (const name of newChars4) {
    for (const dir of directions4) {
      loadImage(`/sprites/characters/${name}/rotations/${dir}.png`);
    }
  }
  // Preload animation frames for hero_sword fireball
  for (let i = 0; i < 6; i++) {
    loadImage(`/sprites/characters/hero_sword/animations/fireball/south/frame_${String(i).padStart(3, '0')}.png`);
  }
  // Preload animation frames for dragon fast-walk
  for (let i = 0; i < 8; i++) {
    loadImage(`/sprites/characters/dragon/animations/fast-walk/south/frame_${String(i).padStart(3, '0')}.png`);
  }

  // Magic crystal tower
  loadImage('/sprites/towers/magic_crystal_tower.png');

  // UI sprites
  for (const name of ['icon_arrow_up', 'icon_coin', 'icon_heart', 'icon_plus', 'icon_settings', 'icon_skull', 'icon_undo', 'gold_pile', 'button_pause', 'button_play', 'banner_wave']) {
    loadImage(`/sprites/ui/${name}.png`);
  }

  // Prop sprites
  for (const name of ['pine_tree', 'bush_round', 'rock_cluster', 'rock_bush_cluster', 'wood_bridge', 'fence_segment', 'wooden_signpost', 'grass_tile_a', 'grass_tile_b']) {
    loadImage(`/sprites/props/${name}.png`);
  }
}

// ============================================================
// GLOBAL ANIMATION TIMER (for sprite sheet animations)
// ============================================================

let _globalAnimTime = 0;

/** Update global animation time. Call once per frame with dt in seconds. */
export function updateSpriteAnimations(dt: number): void {
  _globalAnimTime += dt;
}

/** Get global animation time in seconds */
export function getAnimTime(): number {
  return _globalAnimTime;
}
