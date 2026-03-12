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

/** Load a single image by path, with caching. Returns image if loaded, null if still loading. */
export function loadImage(path: string): HTMLImageElement | null {
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
// We use specific tiles for grass and path:
// Grass tiles: various green field tiles
// Path tiles: various dirt/stone tiles

// Grass tile indices (chosen from the 64-tile set for variety)
const GRASS_TILE_INDICES = [1, 2, 3, 5, 6, 9, 10, 13, 14];
// Path tile indices
const PATH_TILE_INDICES = [33, 34, 35, 36, 37, 38];

export function getTileSprite(index: number): HTMLImageElement | null {
  const num = index.toString().padStart(2, '0');
  return loadImage(`/sprites/tiles/FieldsTile_${num}.png`);
}

/** Get a grass tile based on grid position (deterministic) */
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

interface EnemySpriteMapping {
  folder: string;      // e.g., 'enemies/mob1' or 'enemies/largeMob1'
  frameSize: number;   // 48 for small, 96 for large
  frameCount: number;  // 6
  walkAction: string;  // 'Walk' or 'Run' or 'Fly'
  hasAttack: boolean;
  hasSpecial: boolean;
  hasWalk2: boolean;
  hasDeath2: boolean;
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
};

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
 */
export function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  enemyType: EnemyType,
  x: number, y: number,
  size: number,
  walkCycle: number,
  dying: boolean,
  facingLeft: boolean
): boolean {
  const mapping = ENEMY_SPRITE_MAP[enemyType];
  if (!mapping) return false;

  const action = dying ? 'Death' : mapping.walkAction;
  const config = getEnemySpriteSheet(enemyType, action, 'S');
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

  // Handle facing direction — sprite sheets face right by default
  if (facingLeft) {
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
  cellSize: number
): boolean {
  // Map game levels (1-3) to sprite variants (1-7):
  // Level 1 = variant 1-2, Level 2 = variant 3-4, Level 3 = variant 5-7
  const variantMap: Record<number, number> = { 1: 2, 2: 4, 3: 6 };
  const variant = variantMap[level] || 2;
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

  // Tile sprites (most commonly used)
  const allTileIndices = [...new Set([...GRASS_TILE_INDICES, ...PATH_TILE_INDICES])];
  for (const idx of allTileIndices) {
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
