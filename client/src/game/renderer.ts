// ============================================================
// Fantasy Tower Defense — Canvas Renderer (Mega Expansion)
// Design: Painterly Storybook Fantasy
// All towers, monsters, and allied units drawn procedurally
// ============================================================

import type { GameEngineState } from './engine';
import type { Enemy, Tower, Projectile, AlliedUnit } from './types';
import type { MapId } from './types';
import { CELL_SIZE, GRID_COLS, GRID_ROWS } from './constants';
import {
  getRuinSprite, getRuinDrawSize, preloadMapSprites,
  getGrassTile, getPathTile,
  drawEnemySprite, drawFoozleEnemySprite,
  drawArcherTowerSprite, drawArcherTowerPreview,
  drawFoozleTowerSprite, drawMagicCrystalTowerSprite,
  getCharacterSprite,
  getTreeSprite, getSpecialTreeSprite, getRockSprite,
  getGrassDecorSprite, getFlowerSprite, getBushSprite,
  getPlacementSprite,
  drawPixelLabCharacterByAngle,
  Direction,
  PixelLabCharacterName,
  drawSpriteFrame, getFlagSpriteConfig, getCampfireSpriteConfig,
  getLightningSpriteConfig, getFenceSprite, getStoneSprite, getCampSprite, getDecorSprite,
  updateSpriteAnimations, getAnimTime,
  loadImage,
} from './sprites';

// ============================================================
// MAIN RENDER ENTRY
// ============================================================

// Track whether sprites have been preloaded for current map
let lastPreloadedMap: string | null = null;

type MapDecorationType =
  | 'ruin'
  | 'tree'
  | 'special_tree'
  | 'rock'
  | 'bush'
  | 'flower'
  | 'grass_decor'
  | 'flag'
  | 'campfire'
  | 'stone'
  | 'camp'
  | 'decor';

type DecorationPlacement = [number, number, MapDecorationType, number];

interface MapPalette {
  backdropTop: string;
  backdropBottom: string;
  meadowTint: string;
  meadowShade: string;
  meadowBlade: string;
  meadowBloom: string;
  pathTint: string;
  pathShade: string;
  pathDust: string;
  powerGlow: string;
  powerCore: string;
}

const SPECIAL_TREE_NAMES = [
  'Autumn_tree1.png',
  'Moss_tree1.png',
  'Broken_tree3.png',
  'Burned_tree2.png',
  'Flower_tree1.png',
  'Fruit_tree2.png',
];

const MAP_PALETTES: Record<MapId, MapPalette> = {
  serpentine: {
    backdropTop: '#24371f',
    backdropBottom: '#162312',
    meadowTint: '#5f8d44',
    meadowShade: '#2b4f1f',
    meadowBlade: '#9fcd6b',
    meadowBloom: '#f4e285',
    pathTint: '#b09a72',
    pathShade: '#665338',
    pathDust: '#eadbb2',
    powerGlow: '#6ce5d8',
    powerCore: '#fff1a6',
  },
  crossroads: {
    backdropTop: '#31402b',
    backdropBottom: '#1b2518',
    meadowTint: '#738654',
    meadowShade: '#40552e',
    meadowBlade: '#bdd17a',
    meadowBloom: '#ffe59a',
    pathTint: '#bca37e',
    pathShade: '#70593c',
    pathDust: '#f1ddba',
    powerGlow: '#5fd8e3',
    powerCore: '#fff0aa',
  },
  spiral: {
    backdropTop: '#22333c',
    backdropBottom: '#131d23',
    meadowTint: '#5f7b67',
    meadowShade: '#29453a',
    meadowBlade: '#9ecf9e',
    meadowBloom: '#c9e8ff',
    pathTint: '#9f9684',
    pathShade: '#5c574a',
    pathDust: '#d7d6ce',
    powerGlow: '#83d3ff',
    powerCore: '#f9f0b2',
  },
  maze: {
    backdropTop: '#453526',
    backdropBottom: '#24190f',
    meadowTint: '#8e7e4f',
    meadowShade: '#5c4c27',
    meadowBlade: '#c8bd73',
    meadowBloom: '#ffcf84',
    pathTint: '#bea17a',
    pathShade: '#6e4f31',
    pathDust: '#f2d7ae',
    powerGlow: '#7bd4c0',
    powerCore: '#fff0aa',
  },
  gauntlet: {
    backdropTop: '#27333b',
    backdropBottom: '#121c22',
    meadowTint: '#6e8d92',
    meadowShade: '#39555f',
    meadowBlade: '#d8f0f2',
    meadowBloom: '#edf9ff',
    pathTint: '#c5c8cb',
    pathShade: '#6c7277',
    pathDust: '#f4f7fa',
    powerGlow: '#8ae6ff',
    powerCore: '#ffffff',
  },
};

const decorationCache = new Map<MapId, DecorationPlacement[]>();

function getMapPalette(mapId: MapId): MapPalette {
  return MAP_PALETTES[mapId] ?? MAP_PALETTES.serpentine;
}

function stringSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed: number, x: number, y: number, salt = 0): number {
  const raw = Math.sin(seed * 0.001 + x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453123;
  return raw - Math.floor(raw);
}

function parseCellKey(key: string): [number, number] {
  const [col, row] = key.split(',').map(Number);
  return [col, row];
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameEngineState, _dt: number) {
  const { screenShake } = state;

  // Update sprite animation timer
  updateSpriteAnimations(_dt / 1000);

  // Preload sprites for current map (once per map)
  if (state.mapId && state.mapId !== lastPreloadedMap) {
    preloadMapSprites(state.mapId);
    lastPreloadedMap = state.mapId;
  }

  ctx.save();
  if (screenShake && screenShake.intensity > 0) {
    ctx.translate(
      (Math.random() - 0.5) * screenShake.intensity * 2,
      (Math.random() - 0.5) * screenShake.intensity * 2
    );
  }

  drawMap(ctx, state);
  drawAlliedUnits(ctx, state.alliedUnits || []);
  drawEnemies(ctx, state.enemies);
  drawTowers(ctx, state.towers, state.selectedTowerId);
  drawProjectiles(ctx, state.projectiles);
  drawParticles(ctx, state.particles);
  drawAbilityEffects(ctx, state);
  drawFloatingTexts(ctx, state.floatingTexts);
  drawBossBar(ctx, state);
  drawRangeCircle(ctx, state);
  drawWaveAnnouncement(ctx, state);

  ctx.restore();
}

// ============================================================
// MAP DRAWING
// ============================================================

function drawMap(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  const { pathCells, powerSpots, waypoints } = state;
  const mapId = (state.mapId as MapId) || 'serpentine';
  const palette = getMapPalette(mapId);
  const worldWidth = GRID_COLS * CELL_SIZE;
  const worldHeight = GRID_ROWS * CELL_SIZE;

  const backdrop = ctx.createLinearGradient(0, 0, 0, worldHeight);
  backdrop.addColorStop(0, palette.backdropTop);
  backdrop.addColorStop(1, palette.backdropBottom);
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, worldWidth, worldHeight);

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;
      const key = `${col},${row}`;
      const isPath = pathCells.has(key);
      const isPowerSpot = powerSpots?.has(key) ?? false;

      if (isPath) {
        const pathTile = getPathTile(col, row);
        if (pathTile) {
          ctx.drawImage(pathTile, x, y, CELL_SIZE, CELL_SIZE);
        } else {
          const grad = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
          grad.addColorStop(0, palette.pathTint);
          grad.addColorStop(0.55, '#9b8665');
          grad.addColorStop(1, palette.pathShade);
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }
      } else {
        const grassTile = getGrassTile(col, row);
        if (grassTile) {
          ctx.drawImage(grassTile, x, y, CELL_SIZE, CELL_SIZE);
        } else {
          const grad = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
          grad.addColorStop(0, palette.meadowTint);
          grad.addColorStop(1, palette.meadowShade);
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }
        if (isPowerSpot) drawPowerSpotPad(ctx, x, y, palette);
      }
    }
  }

  drawPathBoundaries(ctx, pathCells);
  drawMapDecorations(ctx, pathCells, powerSpots || new Set(), mapId);
  if (waypoints && waypoints.length > 1) {
    drawPathArrows(ctx, waypoints);
    const [startCol, startRow] = waypoints[0];
    const [endCol, endRow] = waypoints[waypoints.length - 1];
    drawEntryMarker(ctx, startCol * CELL_SIZE, startRow * CELL_SIZE);
    drawExitMarker(ctx, endCol * CELL_SIZE, endRow * CELL_SIZE);
  }
}

function generateDecorations(pathCells: Set<string>, powerSpots: Set<string>, mapId: MapId): DecorationPlacement[] {
  const cached = decorationCache.get(mapId);
  if (cached) return cached;

  const seed = stringSeed(mapId);
  const pathEntries = [...pathCells].map(parseCellKey);
  const candidates: Array<{ col: number; row: number; edgeDist: number; pathDist: number }> = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const key = `${col},${row}`;
      if (pathCells.has(key) || powerSpots.has(key)) continue;
      const edgeDist = Math.min(col, row, GRID_COLS - 1 - col, GRID_ROWS - 1 - row);
      let pathDist = 99;
      for (const [pc, pr] of pathEntries) {
        pathDist = Math.min(pathDist, Math.abs(pc - col) + Math.abs(pr - row));
      }
      candidates.push({ col, row, edgeDist, pathDist });
    }
  }

  const placements: DecorationPlacement[] = [];
  const reserved: Array<{ col: number; row: number; radius: number }> = [];

  const hasSpace = (col: number, row: number, radius: number) => {
    for (const slot of reserved) {
      const dist = Math.abs(slot.col - col) + Math.abs(slot.row - row);
      if (dist <= slot.radius + radius) return false;
    }
    return true;
  };

  const orderedCandidates = (salt: number) =>
    [...candidates].sort(
      (a, b) => seededUnit(seed, a.col, a.row, salt) - seededUnit(seed, b.col, b.row, salt)
    );

  const placeBatch = (
    count: number,
    radius: number,
    salt: number,
    filter: (cell: { col: number; row: number; edgeDist: number; pathDist: number }) => boolean,
    makePlacement: (cell: { col: number; row: number; edgeDist: number; pathDist: number }) => DecorationPlacement
  ) => {
    let added = 0;
    for (const cell of orderedCandidates(salt)) {
      if (added >= count) break;
      if (!filter(cell) || !hasSpace(cell.col, cell.row, radius)) continue;
      placements.push(makePlacement(cell));
      reserved.push({ col: cell.col, row: cell.row, radius });
      added++;
    }
  };

  const placePreferredBatch = (
    count: number,
    radius: number,
    salt: number,
    filter: (cell: { col: number; row: number; edgeDist: number; pathDist: number }) => boolean,
    score: (cell: { col: number; row: number; edgeDist: number; pathDist: number }) => number,
    makePlacement: (cell: { col: number; row: number; edgeDist: number; pathDist: number }) => DecorationPlacement
  ) => {
    const ranked = [...candidates]
      .filter(filter)
      .sort((a, b) => {
        const diff = score(b) - score(a);
        if (Math.abs(diff) > 0.0001) return diff;
        return seededUnit(seed, a.col, a.row, salt) - seededUnit(seed, b.col, b.row, salt);
      });

    let added = 0;
    for (const cell of ranked) {
      if (added >= count) break;
      if (!hasSpace(cell.col, cell.row, radius)) continue;
      placements.push(makePlacement(cell));
      reserved.push({ col: cell.col, row: cell.row, radius });
      added++;
    }
  };

  placeBatch(
    4,
    2,
    11,
    cell => cell.pathDist >= 2 && cell.edgeDist >= 1,
    cell => [cell.col, cell.row, 'ruin', 1 + Math.floor(seededUnit(seed, cell.col, cell.row, 13) * 5)]
  );

  placePreferredBatch(
    8,
    3,
    21,
    cell => cell.edgeDist <= 1 && cell.pathDist >= 3,
    cell => {
      const cornerBias = Math.max(
        0,
        6 - Math.min(
          cell.col + cell.row,
          (GRID_COLS - 1 - cell.col) + cell.row,
          cell.col + (GRID_ROWS - 1 - cell.row),
          (GRID_COLS - 1 - cell.col) + (GRID_ROWS - 1 - cell.row)
        )
      );
      return cornerBias * 3 + cell.pathDist * 0.4 - cell.edgeDist;
    },
    cell => [
      cell.col,
      cell.row,
      seededUnit(seed, cell.col, cell.row, 22) > 0.4 ? 'special_tree' : 'tree',
      1 + Math.floor(seededUnit(seed, cell.col, cell.row, 23) * SPECIAL_TREE_NAMES.length),
    ]
  );

  placePreferredBatch(
    8,
    2,
    26,
    cell => cell.edgeDist <= 2 && cell.pathDist >= 2,
    cell => cell.pathDist * 0.6 + (2 - Math.min(cell.edgeDist, 2)) * 1.8,
    cell => [
      cell.col,
      cell.row,
      'tree',
      1 + Math.floor(seededUnit(seed, cell.col, cell.row, 27) * 3),
    ]
  );

  placePreferredBatch(
    4,
    2,
    29,
    cell => cell.edgeDist >= 1 && cell.edgeDist <= 3 && cell.pathDist >= 4,
    cell => cell.pathDist - cell.edgeDist * 0.4,
    cell => [
      cell.col,
      cell.row,
      'special_tree',
      1 + Math.floor(seededUnit(seed, cell.col, cell.row, 30) * SPECIAL_TREE_NAMES.length),
    ]
  );

  placeBatch(
    12,
    1,
    31,
    cell => cell.pathDist >= 1,
    cell => [cell.col, cell.row, 'rock', 1 + Math.floor(seededUnit(seed, cell.col, cell.row, 33) * 15)]
  );

  placeBatch(
    8,
    1,
    41,
    cell => cell.pathDist >= 2 && cell.edgeDist >= 1,
    cell => [cell.col, cell.row, seededUnit(seed, cell.col, cell.row, 42) > 0.52 ? 'campfire' : 'flag', 1 + Math.floor(seededUnit(seed, cell.col, cell.row, 43) * 2)]
  );

  placeBatch(
    8,
    0,
    51,
    cell => cell.pathDist >= 1,
    cell => [cell.col, cell.row, 'bush', 1 + Math.floor(seededUnit(seed, cell.col, cell.row, 52) * 6)]
  );

  placeBatch(
    8,
    0,
    61,
    cell => cell.pathDist >= 1,
    cell => [cell.col, cell.row, 'flower', 1 + Math.floor(seededUnit(seed, cell.col, cell.row, 62) * 12)]
  );

  placeBatch(
    7,
    0,
    71,
    cell => cell.pathDist >= 1,
    cell => [cell.col, cell.row, 'grass_decor', 1 + Math.floor(seededUnit(seed, cell.col, cell.row, 72) * 6)]
  );

  placeBatch(
    4,
    1,
    81,
    cell => cell.pathDist >= 2,
    cell => [cell.col, cell.row, 'stone', 1 + Math.floor(seededUnit(seed, cell.col, cell.row, 82) * 5)]
  );

  placeBatch(
    3,
    1,
    91,
    cell => cell.pathDist >= 2 && cell.edgeDist >= 1,
    cell => [cell.col, cell.row, 'camp', 1 + Math.floor(seededUnit(seed, cell.col, cell.row, 92) * 4)]
  );

  placeBatch(
    4,
    1,
    101,
    cell => cell.pathDist >= 2,
    cell => [cell.col, cell.row, 'decor', 1 + Math.floor(seededUnit(seed, cell.col, cell.row, 102) * 7)]
  );

  const sorted = placements.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  decorationCache.set(mapId, sorted);
  return sorted;
}

function drawMapDecorations(ctx: CanvasRenderingContext2D, pathCells: Set<string>, powerSpots: Set<string>, mapId: MapId) {
  const animTime = getAnimTime();
  const decorations = generateDecorations(pathCells, powerSpots, mapId);

  for (const [col, row, type, variant] of decorations) {
    const key = `${col},${row}`;
    if (pathCells.has(key) || powerSpots.has(key)) continue;
    const x = col * CELL_SIZE + CELL_SIZE / 2;
    const y = row * CELL_SIZE + CELL_SIZE / 2;
    const cellX = col * CELL_SIZE;
    const cellY = row * CELL_SIZE;

    if (type === 'ruin') {
      const sprite = getRuinSprite(mapId, variant);
      if (sprite) {
        const drawSize = getRuinDrawSize(variant, CELL_SIZE);
        ctx.save();
        const dx = x - drawSize.w / 2;
        const dy = y + CELL_SIZE / 2 - drawSize.h;
        ctx.drawImage(sprite, dx, dy, drawSize.w, drawSize.h);
        ctx.restore();
      } else {
        if (variant <= 2) drawRockProcedural(ctx, x, y);
        else if (variant <= 4) drawMushroom(ctx, x, y);
        else drawRockProcedural(ctx, x, y);
      }
    } else if (type === 'tree') {
      const treeSprite = getTreeSprite(variant);
      if (treeSprite) {
        // Trees are taller than a cell — scale to ~1.5 cells wide, maintain aspect
        const tw = CELL_SIZE * 1.4;
        const aspect = treeSprite.naturalHeight / treeSprite.naturalWidth;
        const th = tw * aspect;
        ctx.drawImage(treeSprite, x - tw / 2, cellY + CELL_SIZE - th, tw, th);
      } else {
        drawTreeProcedural(ctx, x, y);
      }
    } else if (type === 'special_tree') {
      const treeName = SPECIAL_TREE_NAMES[(variant - 1) % SPECIAL_TREE_NAMES.length];
      const treeSprite = getSpecialTreeSprite(treeName);
      if (treeSprite) {
        const tw = CELL_SIZE * 1.28;
        const aspect = treeSprite.naturalHeight / treeSprite.naturalWidth;
        const th = tw * aspect;
        ctx.drawImage(treeSprite, x - tw / 2, cellY + CELL_SIZE - th, tw, th);
      } else {
        drawTreeProcedural(ctx, x, y);
      }
    } else if (type === 'rock') {
      const rockType = ((variant - 1) % 5) + 1;
      const rockSize = (variant % 5) + 1;
      const rockSprite = getRockSprite(rockType, rockSize);
      if (rockSprite) {
        const rw = CELL_SIZE * (rockSize <= 2 ? 0.92 : rockSize === 3 ? 0.78 : 0.62);
        const aspect = rockSprite.naturalHeight / rockSprite.naturalWidth;
        const rh = rw * aspect;
        ctx.drawImage(rockSprite, x - rw / 2, cellY + CELL_SIZE - rh, rw, rh);
      } else {
        drawRockProcedural(ctx, x, y);
      }
    } else if (type === 'bush') {
      const bushSprite = getBushSprite(variant);
      if (bushSprite) {
        const bw = CELL_SIZE * 0.72;
        const aspect = bushSprite.naturalHeight / bushSprite.naturalWidth;
        const bh = bw * aspect;
        ctx.drawImage(bushSprite, x - bw / 2, cellY + CELL_SIZE - bh, bw, bh);
      }
    } else if (type === 'flower') {
      const flowerSprite = getFlowerSprite(variant);
      if (flowerSprite) {
        const fw = CELL_SIZE * 0.48;
        const aspect = flowerSprite.naturalHeight / flowerSprite.naturalWidth;
        const fh = fw * aspect;
        ctx.drawImage(flowerSprite, x - fw / 2, cellY + CELL_SIZE - fh, fw, fh);
      }
    } else if (type === 'grass_decor') {
      const grassSprite = getGrassDecorSprite(variant);
      if (grassSprite) {
        const gw = CELL_SIZE * 0.6;
        const aspect = grassSprite.naturalHeight / grassSprite.naturalWidth;
        const gh = gw * aspect;
        ctx.drawImage(grassSprite, x - gw / 2, cellY + CELL_SIZE - gh, gw, gh);
      }
    } else if (type === 'flag') {
      const config = getFlagSpriteConfig(variant);
      const frameIndex = Math.floor(animTime * 4) % config.frameCount;
      const fw = CELL_SIZE * 0.9;
      const fh = CELL_SIZE * 0.9;
      drawSpriteFrame(ctx, config, frameIndex, x - fw / 2, cellY + CELL_SIZE - fh, fw, fh);
    } else if (type === 'campfire') {
      const config = getCampfireSpriteConfig(variant);
      const frameIndex = Math.floor(animTime * 6) % config.frameCount;
      const cw = CELL_SIZE * 0.7;
      const ch = CELL_SIZE * 0.7;
      drawSpriteFrame(ctx, config, frameIndex, x - cw / 2, cellY + CELL_SIZE - ch, cw, ch);
    } else if (type === 'stone') {
      const sprite = getStoneSprite(variant);
      if (sprite) {
        const sw = CELL_SIZE * 0.55;
        const aspect = sprite.naturalHeight / sprite.naturalWidth;
        const sh = sw * aspect;
        ctx.drawImage(sprite, x - sw / 2, cellY + CELL_SIZE - sh, sw, sh);
      }
    } else if (type === 'camp') {
      const sprite = getCampSprite(variant);
      if (sprite) {
        const cw = CELL_SIZE * 0.92;
        const aspect = sprite.naturalHeight / sprite.naturalWidth;
        const ch = cw * aspect;
        ctx.drawImage(sprite, x - cw / 2, cellY + CELL_SIZE - ch, cw, ch);
      }
    } else if (type === 'decor') {
      const sprite = getDecorSprite(variant);
      if (sprite) {
        const dw = CELL_SIZE * 0.7;
        const aspect = sprite.naturalHeight / sprite.naturalWidth;
        const dh = dw * aspect;
        ctx.drawImage(sprite, x - dw / 2, cellY + CELL_SIZE - dh, dw, dh);
      }
    }
  }
}

function drawTreeProcedural(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - 4, y + 4, 8, 14);
  ctx.fillStyle = '#2E7D32';
  ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x - 14, y + 6); ctx.lineTo(x + 14, y + 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#388E3C';
  ctx.beginPath(); ctx.moveTo(x, y - 26); ctx.lineTo(x - 11, y - 4); ctx.lineTo(x + 11, y - 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#43A047';
  ctx.beginPath(); ctx.moveTo(x, y - 32); ctx.lineTo(x - 8, y - 14); ctx.lineTo(x + 8, y - 14); ctx.closePath(); ctx.fill();
}

function drawRockProcedural(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#78909C';
  ctx.beginPath(); ctx.ellipse(x, y + 4, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#90A4AE';
  ctx.beginPath(); ctx.ellipse(x - 2, y, 10, 8, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#B0BEC5';
  ctx.beginPath(); ctx.ellipse(x - 3, y - 2, 5, 4, -0.5, 0, Math.PI * 2); ctx.fill();
}

function drawMushroom(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(x - 4, y + 2, 8, 10);
  ctx.fillStyle = '#E53935';
  ctx.beginPath(); ctx.arc(x, y, 12, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.arc(x - 5, y - 4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 3, y - 6, 2, 0, Math.PI * 2); ctx.fill();
}

function drawPathArrows(ctx: CanvasRenderingContext2D, waypoints: Array<[number, number]>) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#f5e7bb';
  ctx.strokeStyle = '#735a38';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [c1, r1] = waypoints[i];
    const [c2, r2] = waypoints[i + 1];
    const ax = ((c1 + c2) / 2) * CELL_SIZE + CELL_SIZE / 2;
    const ay = ((r1 + r2) / 2) * CELL_SIZE + CELL_SIZE / 2;
    const angle = Math.atan2(r2 - r1, c2 - c1);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.roundRect(-14, -10, 28, 20, 7);
    ctx.fillStyle = 'rgba(55, 40, 18, 0.24)';
    ctx.fill();
    ctx.fillStyle = '#f5e7bb';
    ctx.beginPath();
    ctx.moveTo(14, 0); ctx.lineTo(-10, -9); ctx.lineTo(-4, 0); ctx.lineTo(-10, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawEntryMarker(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const cx = x + CELL_SIZE / 2;
  const cy = y + CELL_SIZE / 2;
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
  glow.addColorStop(0, 'rgba(129, 199, 132, 0.6)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4CAF50';
  ctx.strokeStyle = '#245c28';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 12, cy);
  ctx.lineTo(cx - 12, cy - 14);
  ctx.lineTo(cx - 12, cy + 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('IN', cx - 3, cy);
  ctx.restore();
}

function drawExitMarker(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const cx = x + CELL_SIZE / 2;
  const cy = y + CELL_SIZE / 2;
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
  glow.addColorStop(0, 'rgba(229, 115, 115, 0.52)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b93131';
  ctx.strokeStyle = '#621818';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 8, CELL_SIZE - 16, CELL_SIZE - 16, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', cx, cy);
  ctx.restore();
}

// ============================================================
// TOWER DRAWING
// ============================================================
// TOWER DRAWING
// ============================================================

function drawTowers(ctx: CanvasRenderingContext2D, towers: Tower[], selectedId: string | null) {
  for (const tower of towers) {
    drawTower(ctx, tower, tower.id === selectedId);
  }
}

function drawTower(ctx: CanvasRenderingContext2D, tower: Tower, selected: boolean) {
  const x = tower.x;
  const y = tower.y;
  const anim = tower.attackAnim || 0;

  ctx.save();
  if (selected) {
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 18;
  }

  if ((tower.powerBonus || 0) > 0) {
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 400) * 0.1;
    const g = ctx.createRadialGradient(x, y, 5, x, y, 36);
    g.addColorStop(0, '#FFD700');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 36, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  const animTime = getAnimTime();
  switch (tower.type) {
    case 'archer': {
      // Try sprite first, fallback to procedural
      // Use spriteVariant if player picked a structure, otherwise use level default
      if (!drawArcherTowerSprite(ctx, x, y, tower.level, animTime, CELL_SIZE, tower.spriteVariant)) {
        drawArcherTower(ctx, x, y, tower.level, anim);
      }
      break;
    }
    case 'mage':
      // Use magic crystal tower sprite, fall back to procedural
      if (!drawMagicCrystalTowerSprite(ctx, x, y, CELL_SIZE)) {
        drawMageTower(ctx, x, y, tower.level, anim);
      }
      break;
    case 'cannon':
      // Use Foozle Tower 03 sprite (cannon-style), fall back to procedural
      if (!drawFoozleTowerSprite(ctx, 'tower03', tower.level, x, y, CELL_SIZE, animTime)) {
        drawCannonTower(ctx, x, y, tower.level, anim);
      }
      break;
    case 'ballista':
      // Use Foozle Tower 04 sprite (long-range weapon), fall back to procedural
      if (!drawFoozleTowerSprite(ctx, 'tower04', tower.level, x, y, CELL_SIZE, animTime)) {
        drawBallistaTower(ctx, x, y, tower.level, anim);
      }
      break;
    case 'frost':       drawFrostTower(ctx, x, y, tower.level, anim); break;
    case 'lightning':   drawStormTower(ctx, x, y, tower.level, anim); break;
    case 'poison':      drawPoisonTower(ctx, x, y, tower.level, anim); break;
    case 'infantry':    drawInfantryBarracks(ctx, x, y, tower.level); break;
    case 'archer_barracks': drawArcherBarracks(ctx, x, y, tower.level); break;
    case 'pikeman_barracks': drawPikemanHall(ctx, x, y, tower.level); break;
    case 'hero':        drawHeroAltarWithSprite(ctx, x, y, tower.level, animTime); break;
    case 'paladin_shrine': drawPaladinShrine(ctx, x, y, tower.level, animTime); break;
    case 'beastmaster': drawBeastDen(ctx, x, y, tower.level); break;
    case 'necromancer': drawNecromancerCrypt(ctx, x, y, tower.level, anim); break;
    case 'catapult':    drawCatapult(ctx, x, y, tower.level, anim); break;
    case 'tesla':       drawTeslaCoil(ctx, x, y, tower.level, anim); break;
    default:
      ctx.fillStyle = '#888';
      ctx.fillRect(x - 14, y - 14, 28, 28);
  }

  if (tower.level > 1) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 9px serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv${tower.level}`, x, y + 30);
  }

  ctx.restore();
}

function drawArcherTower(ctx: CanvasRenderingContext2D, x: number, y: number, level: number, anim: number) {
  const h = 32 + level * 4;
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(x - 12, y + 10, 24, 12);
  const grad = ctx.createLinearGradient(x - 10, y - h, x + 10, y + 10);
  grad.addColorStop(0, '#A1887F');
  grad.addColorStop(1, '#6D4C41');
  ctx.fillStyle = grad;
  ctx.fillRect(x - 10, y - h + 10, 20, h);
  ctx.fillStyle = '#795548';
  for (let i = 0; i < 3; i++) ctx.fillRect(x - 10 + i * 8, y - h + 4, 6, 8);
  ctx.fillStyle = '#1A0A00';
  ctx.fillRect(x - 2, y - h + 14, 4, 10);
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x, y - h + 4); ctx.lineTo(x, y - h - 8); ctx.stroke();
  ctx.fillStyle = anim > 0.5 ? '#FF6B35' : '#4CAF50';
  ctx.beginPath(); ctx.moveTo(x, y - h - 8); ctx.lineTo(x + 12, y - h - 2); ctx.lineTo(x, y - h + 2); ctx.closePath(); ctx.fill();
}

function drawMageTower(ctx: CanvasRenderingContext2D, x: number, y: number, level: number, anim: number) {
  const h = 34 + level * 4;
  ctx.fillStyle = '#4A148C';
  ctx.beginPath(); ctx.arc(x, y + 12, 13, 0, Math.PI * 2); ctx.fill();
  const grad = ctx.createLinearGradient(x - 10, y - h, x + 10, y + 10);
  grad.addColorStop(0, '#9C27B0');
  grad.addColorStop(1, '#4A148C');
  ctx.fillStyle = grad;
  ctx.fillRect(x - 10, y - h + 10, 20, h);
  ctx.fillStyle = '#6A1B9A';
  ctx.beginPath(); ctx.moveTo(x, y - h - 6); ctx.lineTo(x - 13, y - h + 10); ctx.lineTo(x + 13, y - h + 10); ctx.closePath(); ctx.fill();
  const pulse = 0.7 + Math.sin(Date.now() / 400) * 0.3;
  ctx.save();
  ctx.globalAlpha = pulse;
  const orbGrad = ctx.createRadialGradient(x, y - h + 2, 0, x, y - h + 2, 8);
  orbGrad.addColorStop(0, '#E040FB');
  orbGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = orbGrad;
  ctx.beginPath(); ctx.arc(x, y - h + 2, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = anim > 0.3 ? '#E040FB' : '#CE93D8';
  ctx.beginPath(); ctx.arc(x, y - h + 18, 4, 0, Math.PI * 2); ctx.fill();
}

function drawCannonTower(ctx: CanvasRenderingContext2D, x: number, y: number, level: number, anim: number) {
  const h = 28 + level * 3;
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(x - 14, y + 8, 28, 14);
  const grad = ctx.createLinearGradient(x - 11, y - h, x + 11, y + 8);
  grad.addColorStop(0, '#78909C');
  grad.addColorStop(1, '#455A64');
  ctx.fillStyle = grad;
  ctx.fillRect(x - 11, y - h + 8, 22, h);
  ctx.fillStyle = '#546E7A';
  for (let i = 0; i < 4; i++) ctx.fillRect(x - 11 + i * 7, y - h + 2, 5, 7);
  const recoil = anim * 6;
  ctx.fillStyle = '#263238';
  ctx.save();
  ctx.translate(x, y - h + 14);
  ctx.fillRect(-4 + recoil, -4, 20 - recoil, 8);
  ctx.restore();
  if (anim > 0.5) {
    ctx.save();
    ctx.globalAlpha = anim - 0.5;
    ctx.fillStyle = '#B0BEC5';
    ctx.beginPath(); ctx.arc(x + 18, y - h + 14, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawFrostTower(ctx: CanvasRenderingContext2D, x: number, y: number, level: number, anim: number) {
  const h = 30 + level * 4;
  ctx.fillStyle = '#0288D1';
  ctx.beginPath(); ctx.arc(x, y + 12, 12, 0, Math.PI * 2); ctx.fill();
  const grad = ctx.createLinearGradient(x - 9, y - h, x + 9, y + 12);
  grad.addColorStop(0, '#B3E5FC');
  grad.addColorStop(0.5, '#4FC3F7');
  grad.addColorStop(1, '#0288D1');
  ctx.fillStyle = grad;
  ctx.fillRect(x - 9, y - h + 12, 18, h);
  ctx.fillStyle = '#E1F5FE';
  ctx.beginPath(); ctx.moveTo(x, y - h - 8); ctx.lineTo(x - 9, y - h + 12); ctx.lineTo(x + 9, y - h + 12); ctx.closePath(); ctx.fill();
  const alpha = 0.6 + Math.sin(Date.now() / 500) * 0.4;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.translate(x, y - h + 20);
    ctx.rotate((Math.PI / 3) * i + (anim * Math.PI));
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -8); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawStormTower(ctx: CanvasRenderingContext2D, x: number, y: number, level: number, anim: number) {
  const h = 36 + level * 4;
  ctx.fillStyle = '#1A237E';
  ctx.fillRect(x - 13, y + 8, 26, 14);
  const grad = ctx.createLinearGradient(x - 11, y - h, x + 11, y + 8);
  grad.addColorStop(0, '#3949AB');
  grad.addColorStop(1, '#1A237E');
  ctx.fillStyle = grad;
  ctx.fillRect(x - 11, y - h + 8, 22, h);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x, y - h + 8); ctx.lineTo(x, y - h - 12); ctx.stroke();
  if (anim > 0.2) {
    ctx.save();
    ctx.globalAlpha = anim;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y - h - 12);
      ctx.lineTo(x + (Math.random() - 0.5) * 20, y - h - 4 + Math.random() * 8);
      ctx.stroke();
    }
    ctx.restore();
  }
  const glow = 0.5 + Math.sin(Date.now() / 200) * 0.5;
  ctx.save();
  ctx.globalAlpha = glow;
  ctx.fillStyle = '#FFD700';
  ctx.beginPath(); ctx.arc(x, y - h - 12, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPoisonTower(ctx: CanvasRenderingContext2D, x: number, y: number, level: number, anim: number) {
  const h = 28 + level * 3;
  ctx.fillStyle = '#33691E';
  ctx.beginPath(); ctx.arc(x, y + 12, 12, 0, Math.PI * 2); ctx.fill();
  const grad = ctx.createLinearGradient(x - 9, y - h, x + 9, y + 12);
  grad.addColorStop(0, '#8BC34A');
  grad.addColorStop(1, '#33691E');
  ctx.fillStyle = grad;
  ctx.fillRect(x - 9, y - h + 12, 18, h);
  ctx.fillStyle = '#F5F5F5';
  ctx.beginPath(); ctx.arc(x, y - h + 8, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#212121';
  ctx.beginPath(); ctx.arc(x - 3, y - h + 6, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 3, y - h + 6, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 4, y - h + 11, 3, 4);
  ctx.fillRect(x + 1, y - h + 11, 3, 4);
  if (anim > 0.3) {
    ctx.save();
    ctx.globalAlpha = anim * 0.8;
    ctx.fillStyle = '#76FF03';
    ctx.beginPath(); ctx.arc(x - 6, y - h - 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 5, y - h - 8, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawBallistaTower(ctx: CanvasRenderingContext2D, x: number, y: number, level: number, anim: number) {
  const h = 22 + level * 3;
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - 16, y + 6, 32, 16);
  ctx.fillStyle = '#4E342E';
  ctx.fillRect(x - 14, y + 8, 28, 12);
  ctx.strokeStyle = '#6D4C41';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x - 16, y - h + 8); ctx.lineTo(x + 16, y - h + 8); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, y - h + 8); ctx.stroke();
  const recoil = anim * 8;
  ctx.strokeStyle = '#D4A017';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 16, y - h + 8);
  ctx.lineTo(x, y - h + 8 + recoil);
  ctx.lineTo(x + 16, y - h + 8);
  ctx.stroke();
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(x - 12, y - h + 5, 24, 5);
  ctx.fillStyle = '#CFD8DC';
  ctx.beginPath(); ctx.moveTo(x + 12, y - h + 7); ctx.lineTo(x + 18, y - h + 7); ctx.lineTo(x + 12, y - h + 5); ctx.closePath(); ctx.fill();
}

function drawInfantryBarracks(ctx: CanvasRenderingContext2D, x: number, y: number, level: number) {
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - 18, y - 14, 36, 26);
  ctx.fillStyle = '#4E342E';
  ctx.fillRect(x - 16, y - 12, 32, 22);
  ctx.fillStyle = '#8D6E63';
  ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x - 20, y - 14); ctx.lineTo(x + 20, y - 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(x - 5, y + 2, 10, 12);
  ctx.fillStyle = '#FFF9C4';
  ctx.fillRect(x - 14, y - 6, 8, 6);
  ctx.fillRect(x + 6, y - 6, 8, 6);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x, y - 30); ctx.stroke();
  ctx.fillStyle = '#FFD700';
  ctx.font = '10px serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚔', x, y - 22);
  if (level > 1) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 8, y - 32, 16, 4);
  }
}

function drawPathBoundaries(ctx: CanvasRenderingContext2D, pathCells: Set<string>) {
  const horizontalFence = getFenceSprite(1) || getFenceSprite(3) || getFenceSprite(4);
  const verticalFence = getFenceSprite(7) || getFenceSprite(8) || getFenceSprite(10);
  const cornerPost = getFenceSprite(9) || getFenceSprite(6) || getFenceSprite(5);

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const key = `${col},${row}`;
      if (!pathCells.has(key)) continue;

      const isEntryOrExit =
        row === 0 || col === 0 || row === GRID_ROWS - 1 || col === GRID_COLS - 1;
      if (isEntryOrExit) continue;

      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;
      const top = pathCells.has(`${col},${row - 1}`);
      const right = pathCells.has(`${col + 1},${row}`);
      const bottom = pathCells.has(`${col},${row + 1}`);
      const left = pathCells.has(`${col - 1},${row}`);

      ctx.save();
      ctx.globalAlpha = 0.95;

      if (horizontalFence) {
        if (!top) drawBoundarySegment(ctx, horizontalFence, x + CELL_SIZE / 2, y + 7, 0, CELL_SIZE * 0.86, CELL_SIZE * 0.22);
        if (!bottom) drawBoundarySegment(ctx, horizontalFence, x + CELL_SIZE / 2, y + CELL_SIZE - 7, 0, CELL_SIZE * 0.86, CELL_SIZE * 0.22);
      }

      if (verticalFence) {
        if (!left) drawBoundarySegment(ctx, verticalFence, x + 7, y + CELL_SIZE / 2, 0, CELL_SIZE * 0.2, CELL_SIZE * 0.86);
        if (!right) drawBoundarySegment(ctx, verticalFence, x + CELL_SIZE - 7, y + CELL_SIZE / 2, 0, CELL_SIZE * 0.2, CELL_SIZE * 0.86);
      }

      if (cornerPost) {
        if (!top && !left) drawBoundaryCorner(ctx, cornerPost, x + 8, y + 8, 0);
        if (!top && !right) drawBoundaryCorner(ctx, cornerPost, x + CELL_SIZE - 8, y + 8, 0);
        if (!bottom && !right) drawBoundaryCorner(ctx, cornerPost, x + CELL_SIZE - 8, y + CELL_SIZE - 8, 0);
        if (!bottom && !left) drawBoundaryCorner(ctx, cornerPost, x + 8, y + CELL_SIZE - 8, 0);
      }

      ctx.restore();
    }
  }
}

function drawBoundarySegment(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  rotation: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawBoundaryCorner(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  rotation: number
) {
  const size = CELL_SIZE * 0.18;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawGrassCellDetail(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  x: number,
  y: number,
  palette: MapPalette,
  mapSeed: number,
  isPowerSpot: boolean
) {
  const lightMix = seededUnit(mapSeed, col, row, 1);
  const patchMix = seededUnit(mapSeed, col, row, 2);

  ctx.save();
  ctx.globalAlpha = 0.16;
  const tint = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
  tint.addColorStop(0, lightMix > 0.5 ? palette.meadowTint : palette.meadowBlade);
  tint.addColorStop(1, palette.meadowShade);
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

  ctx.globalAlpha = isPowerSpot ? 0.26 : 0.2;
  ctx.fillStyle = palette.meadowBlade;
  for (let i = 0; i < 4; i++) {
    const px = x + 10 + i * 11 + seededUnit(mapSeed, col, row, 10 + i) * 4;
    const py = y + 20 + seededUnit(mapSeed, col, row, 20 + i) * 24;
    ctx.beginPath();
    ctx.moveTo(px, py + 8);
    ctx.quadraticCurveTo(px + 1, py + 2, px + (i % 2 === 0 ? 3 : -2), py - 3);
    ctx.strokeStyle = palette.meadowBlade;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }

  if (patchMix > 0.68 && !isPowerSpot) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = palette.meadowBloom;
    for (let i = 0; i < 3; i++) {
      const px = x + 16 + i * 6 + seededUnit(mapSeed, col, row, 31 + i) * 4;
      const py = y + 18 + seededUnit(mapSeed, col, row, 41 + i) * 20;
      ctx.beginPath();
      ctx.arc(px, py, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawPathCellDetail(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  x: number,
  y: number,
  palette: MapPalette,
  mapSeed: number
) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  const wash = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
  wash.addColorStop(0, palette.pathDust);
  wash.addColorStop(1, palette.pathShade);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

  ctx.globalAlpha = 0.14;
  ctx.fillStyle = palette.pathDust;
  ctx.beginPath();
  ctx.ellipse(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE * 0.28, CELL_SIZE * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = palette.pathShade;
  for (let i = 0; i < 4; i++) {
    const px = x + 9 + i * 12 + seededUnit(mapSeed, col, row, 51 + i) * 3;
    const py = y + 10 + seededUnit(mapSeed, col, row, 61 + i) * 36;
    ctx.beginPath();
    ctx.arc(px, py, 1.8 + seededUnit(mapSeed, col, row, 71 + i), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPowerSpotPad(ctx: CanvasRenderingContext2D, x: number, y: number, palette: MapPalette) {
  const cx = x + CELL_SIZE / 2;
  const cy = y + CELL_SIZE / 2;
  const pulse = 0.32 + Math.sin(Date.now() / 450) * 0.08;

  ctx.save();
  ctx.globalAlpha = pulse;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL_SIZE * 0.65);
  glow.addColorStop(0, palette.powerGlow);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, CELL_SIZE * 0.6, 0, Math.PI * 2);
  ctx.fill();

  const placementSprite = getPlacementSprite(2) || getPlacementSprite(1);
  if (placementSprite) {
    ctx.globalAlpha = 0.72;
    ctx.drawImage(placementSprite, x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10);
  }

  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = palette.powerCore;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, CELL_SIZE * 0.28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = palette.powerCore;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 6);
  ctx.lineTo(cx + 6, cy);
  ctx.lineTo(cx, cy + 6);
  ctx.lineTo(cx - 6, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPathEdges(ctx: CanvasRenderingContext2D, pathCells: Set<string>, palette: MapPalette) {
  const shoulder = 10;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const key = `${col},${row}`;
      if (!pathCells.has(key)) continue;
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;

      const drawShoulder = (dx: number, dy: number) => {
        const neighbor = `${col + dx},${row + dy}`;
        if (pathCells.has(neighbor)) return;

        let grad: CanvasGradient;
        if (dx === -1) {
          grad = ctx.createLinearGradient(x, 0, x + shoulder, 0);
          grad.addColorStop(0, palette.pathShade);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, shoulder, CELL_SIZE);
        } else if (dx === 1) {
          grad = ctx.createLinearGradient(x + CELL_SIZE, 0, x + CELL_SIZE - shoulder, 0);
          grad.addColorStop(0, palette.pathShade);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(x + CELL_SIZE - shoulder, y, shoulder, CELL_SIZE);
        } else if (dy === -1) {
          grad = ctx.createLinearGradient(0, y, 0, y + shoulder);
          grad.addColorStop(0, palette.pathShade);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, CELL_SIZE, shoulder);
        } else {
          grad = ctx.createLinearGradient(0, y + CELL_SIZE, 0, y + CELL_SIZE - shoulder);
          grad.addColorStop(0, palette.pathShade);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y + CELL_SIZE - shoulder, CELL_SIZE, shoulder);
        }
      };

      ctx.save();
      ctx.globalAlpha = 0.18;
      drawShoulder(-1, 0);
      drawShoulder(1, 0);
      drawShoulder(0, -1);
      drawShoulder(0, 1);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
      ctx.restore();
    }
  }
}

function drawArcherBarracks(ctx: CanvasRenderingContext2D, x: number, y: number, level: number) {
  drawInfantryBarracks(ctx, x, y, level);
  ctx.fillStyle = '#2E7D32';
  ctx.fillRect(x - 18, y - 14, 36, 5);
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y - 4, 6, Math.PI * 0.65, Math.PI * 1.35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 7);
  ctx.lineTo(x + 9, y - 12);
  ctx.stroke();
}

function drawPikemanHall(ctx: CanvasRenderingContext2D, x: number, y: number, level: number) {
  drawInfantryBarracks(ctx, x, y, level);
  ctx.fillStyle = '#90A4AE';
  ctx.beginPath();
  ctx.moveTo(x, y - 24);
  ctx.lineTo(x - 18, y - 14);
  ctx.lineTo(x + 18, y - 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#CFD8DC';
  ctx.fillRect(x - 2, y - 28, 4, 22);
  ctx.fillStyle = '#FFD54F';
  ctx.beginPath();
  ctx.moveTo(x, y - 32);
  ctx.lineTo(x - 4, y - 24);
  ctx.lineTo(x + 4, y - 24);
  ctx.closePath();
  ctx.fill();
}

function drawHeroAltarWithSprite(ctx: CanvasRenderingContext2D, x: number, y: number, level: number, animTime: number) {
  // Try to draw knight_hero sprite as the hero altar visual
  const heroImg = getCharacterSprite('knight_hero');
  if (heroImg) {
    // 188x205 — scale to fit cell
    const scale = (CELL_SIZE * 1.2) / 205;
    const dw = 188 * scale;
    const dh = 205 * scale;
    // Draw glowing altar base
    const grad = ctx.createLinearGradient(x - 16, y + 8, x + 16, y + 20);
    grad.addColorStop(0, '#F9A825');
    grad.addColorStop(1, '#E65100');
    ctx.fillStyle = grad;
    ctx.fillRect(x - 18, y + 8, 36, 14);
    // Draw hero sprite
    ctx.drawImage(heroImg, x - dw / 2, y - dh + CELL_SIZE * 0.5, dw, dh);
    // Glow effect when active
    const pulse = 0.3 + Math.sin(animTime * Math.PI * 2) * 0.15;
    ctx.save();
    ctx.globalAlpha = pulse;
    const g = ctx.createRadialGradient(x, y, 5, x, y, 30);
    g.addColorStop(0, '#FFD700');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else {
    drawHeroAltar(ctx, x, y, level);
  }
}

function drawHeroAltar(ctx: CanvasRenderingContext2D, x: number, y: number, _level: number) {
  const grad = ctx.createLinearGradient(x - 16, y - 8, x + 16, y + 16);
  grad.addColorStop(0, '#F9A825');
  grad.addColorStop(1, '#E65100');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - 16, y + 16);
  ctx.lineTo(x - 20, y);
  ctx.lineTo(x - 12, y - 8);
  ctx.lineTo(x + 12, y - 8);
  ctx.lineTo(x + 20, y);
  ctx.lineTo(x + 16, y + 16);
  ctx.closePath(); ctx.fill();
  const pulse = 0.7 + Math.sin(Date.now() / 300) * 0.3;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x - 8, y - 4);
  ctx.lineTo(x, y + 2);
  ctx.lineTo(x + 8, y - 4);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.3;
  const g = ctx.createRadialGradient(x, y - 10, 0, x, y - 10, 22);
  g.addColorStop(0, '#FFD700');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y - 10, 22, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,215,0,0.8)';
  ctx.font = '8px serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦ ✦ ✦', x, y + 10);
}

function drawPaladinShrine(ctx: CanvasRenderingContext2D, x: number, y: number, _level: number, animTime: number) {
  const grad = ctx.createLinearGradient(x - 16, y - 8, x + 16, y + 18);
  grad.addColorStop(0, '#FFF8E1');
  grad.addColorStop(1, '#D4AF37');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - 16, y + 16);
  ctx.lineTo(x - 18, y - 2);
  ctx.lineTo(x - 10, y - 10);
  ctx.lineTo(x + 10, y - 10);
  ctx.lineTo(x + 18, y - 2);
  ctx.lineTo(x + 16, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#B71C1C';
  ctx.fillRect(x - 3, y - 20, 6, 24);
  ctx.fillRect(x - 10, y - 10, 20, 6);
  const glow = 0.25 + Math.sin(animTime * Math.PI * 2) * 0.1;
  ctx.save();
  ctx.globalAlpha = glow;
  const g = ctx.createRadialGradient(x, y - 8, 0, x, y - 8, 26);
  g.addColorStop(0, '#FFF59D');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y - 8, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBeastDen(ctx: CanvasRenderingContext2D, x: number, y: number, _level: number) {
  ctx.fillStyle = '#4E342E';
  ctx.beginPath();
  ctx.arc(x, y + 4, 20, Math.PI, 0);
  ctx.lineTo(x + 20, y + 16);
  ctx.lineTo(x - 20, y + 16);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1A0A00';
  ctx.beginPath();
  ctx.arc(x, y + 4, 14, Math.PI, 0);
  ctx.lineTo(x + 14, y + 12);
  ctx.lineTo(x - 14, y + 12);
  ctx.closePath(); ctx.fill();
  const blink = Math.sin(Date.now() / 800) > 0.7;
  if (!blink) {
    ctx.fillStyle = '#FF6F00';
    ctx.beginPath(); ctx.arc(x - 5, y + 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 5, y + 2, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#ECEFF1';
  ctx.fillRect(x - 10, y - 14, 20, 4);
  ctx.fillRect(x - 8, y - 18, 4, 8);
  ctx.fillRect(x + 4, y - 18, 4, 8);
  ctx.fillStyle = '#6D4C41';
  ctx.font = '12px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐾', x, y - 20);
}

function drawNecromancerCrypt(ctx: CanvasRenderingContext2D, x: number, y: number, _level: number, anim: number) {
  ctx.fillStyle = '#1A0030';
  ctx.fillRect(x - 14, y - 20, 28, 32);
  ctx.fillStyle = '#2D0050';
  ctx.beginPath(); ctx.moveTo(x, y - 32); ctx.lineTo(x - 16, y - 20); ctx.lineTo(x + 16, y - 20); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0D001A';
  ctx.beginPath();
  ctx.arc(x, y + 4, 8, Math.PI, 0);
  ctx.lineTo(x + 8, y + 12);
  ctx.lineTo(x - 8, y + 12);
  ctx.closePath(); ctx.fill();
  const glow = 0.4 + Math.sin(Date.now() / 400) * 0.3;
  ctx.save();
  ctx.globalAlpha = glow;
  const g = ctx.createRadialGradient(x, y - 8, 0, x, y - 8, 20);
  g.addColorStop(0, '#7B1FA2');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y - 8, 20, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#E0E0E0';
  ctx.beginPath(); ctx.arc(x, y - 30, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1A0030';
  ctx.beginPath(); ctx.arc(x - 2.5, y - 32, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 2.5, y - 32, 2, 0, Math.PI * 2); ctx.fill();
  if (anim > 0.3) {
    ctx.save();
    ctx.globalAlpha = anim;
    ctx.strokeStyle = '#CE93D8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 30);
    ctx.lineTo(x + (Math.random() - 0.5) * 30, y - 50);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCatapult(ctx: CanvasRenderingContext2D, x: number, y: number, _level: number, anim: number) {
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - 18, y + 8, 36, 10);
  ctx.fillStyle = '#4E342E';
  ctx.beginPath(); ctx.arc(x - 14, y + 18, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 14, y + 18, 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x - 14, y + 18, 7, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 14, y + 18, 7, 0, Math.PI * 2); ctx.stroke();
  const armAngle = -0.8 + anim * 1.5;
  ctx.save();
  ctx.translate(x, y + 8);
  ctx.rotate(armAngle);
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(-3, -28, 6, 28);
  ctx.fillStyle = '#8D6E63';
  ctx.beginPath(); ctx.arc(0, -28, 8, 0, Math.PI * 2); ctx.fill();
  if (anim < 0.5) {
    ctx.fillStyle = '#607D8B';
    ctx.beginPath(); ctx.arc(0, -28, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawTeslaCoil(ctx: CanvasRenderingContext2D, x: number, y: number, _level: number, anim: number) {
  ctx.fillStyle = '#37474F';
  ctx.fillRect(x - 10, y + 4, 20, 14);
  ctx.strokeStyle = '#546E7A';
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(x, y - 4 - i * 7, 8 - i * 0.8, 0, Math.PI * 2);
    ctx.stroke();
  }
  const sphereGrad = ctx.createRadialGradient(x - 3, y - 42, 2, x, y - 40, 10);
  sphereGrad.addColorStop(0, '#80DEEA');
  sphereGrad.addColorStop(1, '#00BCD4');
  ctx.fillStyle = sphereGrad;
  ctx.beginPath(); ctx.arc(x, y - 40, 10, 0, Math.PI * 2); ctx.fill();
  if (anim > 0.1) {
    ctx.save();
    ctx.globalAlpha = anim;
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i / 4) + Date.now() / 200;
      ctx.beginPath();
      ctx.moveTo(x, y - 40);
      ctx.lineTo(x + Math.cos(angle) * 20, y - 40 + Math.sin(angle) * 20);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ============================================================
// ENEMY DRAWING
// ============================================================

function drawEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]) {
  for (const enemy of enemies) {
    if (!enemy.alive && !enemy.dying) continue;
    drawEnemy(ctx, enemy);
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const { x, y, size, walkCycle, facingLeft, dying, dyingTimer, isTunneling, frozen } = enemy;
  const alpha = dying ? Math.max(0, (dyingTimer || 0) / 300) : (isTunneling ? 0.3 : 1);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (frozen) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#B3E5FC';
    ctx.beginPath(); ctx.arc(x, y, size + 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Try sprite-based drawing first
  const deathProgress = dying ? Math.max(0, 1 - (dyingTimer || 0) / 300) : 0;
  const animCycle = dying ? deathProgress : (walkCycle || 0);

  // Try Foozle sprites first for new enemy types
  const foozleDrawn = drawFoozleEnemySprite(ctx, enemy.type, x, y, size, animCycle, dying, facingLeft);

  const spriteDrawn = foozleDrawn || drawEnemySprite(
    ctx, enemy.type, x, y, size,
    animCycle,
    dying, facingLeft
  );

  if (!spriteDrawn) {
    // Fallback to procedural drawing — same flip logic as sprites
    if (!facingLeft) {
      ctx.scale(-1, 1);
      ctx.translate(-x * 2, 0);
    }

    switch (enemy.type) {
      case 'goblin':       drawGoblin(ctx, x, y, size, walkCycle || 0); break;
      case 'imp':          drawImp(ctx, x, y, size, walkCycle || 0); break;
      case 'skeleton':     drawSkeleton(ctx, x, y, size, walkCycle || 0); break;
      case 'werewolf':     drawWerewolf(ctx, x, y, size, walkCycle || 0); break;
      case 'orc':          drawOrc(ctx, x, y, size, walkCycle || 0); break;
      case 'golem':        drawGolemEnemy(ctx, x, y, size, walkCycle || 0); break;
      case 'troll':        drawTroll(ctx, x, y, size, walkCycle || 0); break;
      case 'banshee':      drawBanshee(ctx, x, y, size, walkCycle || 0); break;
      case 'darkKnight':   drawDarkKnight(ctx, x, y, size, walkCycle || 0); break;
      case 'dragon':       drawDragon(ctx, x, y, size, walkCycle || 0); break;
      case 'armored':      drawArmored(ctx, x, y, size, walkCycle || 0); break;
      case 'healer':       drawHealer(ctx, x, y, size, walkCycle || 0); break;
      case 'tunneler':     drawTunneler(ctx, x, y, size, walkCycle || 0); break;
      case 'flyer':        drawFlyer(ctx, x, y, size, walkCycle || 0); break;
      case 'splitterBoss': drawSplitterBoss(ctx, x, y, size, walkCycle || 0); break;
      // Foozle enemies — procedural fallback
      case 'firebug':      drawFirebugFallback(ctx, x, y, size, walkCycle || 0); break;
      case 'leafbug':      drawLeafbugFallback(ctx, x, y, size, walkCycle || 0); break;
      case 'magmaCrab':    drawMagmaCrabFallback(ctx, x, y, size, walkCycle || 0); break;
      case 'scorpion':     drawScorpionFallback(ctx, x, y, size, walkCycle || 0); break;
      default:             drawGenericEnemy(ctx, x, y, size, enemy.color); break;
    }
  }

  ctx.restore();

  if (!dying && enemy.hp < enemy.maxHp) {
    const barW = size * 2.2;
    const barH = 5;
    const bx = x - barW / 2;
    const by = y - size - 12;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, barW, barH);
    const pct = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillStyle = pct > 0.5 ? '#4CAF50' : pct > 0.25 ? '#FF9800' : '#F44336';
    ctx.fillRect(bx, by, barW * pct, barH);
  }

  if (enemy.isBoss) {
    ctx.fillStyle = '#FFD700';
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑', x, y - size - 16);
  }

  if (enemy.poisonTimer && enemy.poisonTimer > 0) {
    ctx.fillStyle = '#76FF03';
    ctx.font = '10px serif';
    ctx.textAlign = 'center';
    ctx.fillText('☠', x + size, y - size);
  }

  if (enemy.isHealer) {
    ctx.save();
    ctx.globalAlpha = 0.2 + Math.sin(Date.now() / 400) * 0.1;
    ctx.strokeStyle = '#66BB6A';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 120, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  if (enemy.isFlying) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x, y + size + 8, size * 0.8, size * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function legOffset(wc: number, leg: 'left' | 'right') {
  const phase = leg === 'left' ? 0 : Math.PI;
  return Math.sin(wc * Math.PI * 2 + phase) * 5;
}
function bodyBob(wc: number) {
  return Math.abs(Math.sin(wc * Math.PI * 2)) * 2;
}

function drawGoblin(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = '#388E3C';
  ctx.fillRect(x - 6, y + size - 4 + legOffset(wc, 'left'), 5, 10);
  ctx.fillRect(x + 1, y + size - 4 + legOffset(wc, 'right'), 5, 10);
  ctx.fillStyle = '#66BB6A';
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 0.75, size, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#81C784';
  ctx.beginPath(); ctx.arc(x, y - size * 0.8 - bob, size * 0.65, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FF0000';
  ctx.beginPath(); ctx.arc(x - 4, y - size * 0.9 - bob, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 4, y - size * 0.9 - bob, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#66BB6A';
  ctx.beginPath(); ctx.moveTo(x - size * 0.6, y - size - bob); ctx.lineTo(x - size * 0.9, y - size * 1.4 - bob); ctx.lineTo(x - size * 0.3, y - size * 1.1 - bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + size * 0.6, y - size - bob); ctx.lineTo(x + size * 0.9, y - size * 1.4 - bob); ctx.lineTo(x + size * 0.3, y - size * 1.1 - bob); ctx.fill();
}

function drawImp(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = 'rgba(183,28,28,0.7)';
  ctx.beginPath(); ctx.moveTo(x, y - bob); ctx.lineTo(x - size * 1.5, y - size - bob); ctx.lineTo(x - size * 0.5, y - bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y - bob); ctx.lineTo(x + size * 1.5, y - size - bob); ctx.lineTo(x + size * 0.5, y - bob); ctx.fill();
  ctx.fillStyle = '#FF7043';
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 0.65, size * 0.85, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FF8A65';
  ctx.beginPath(); ctx.arc(x, y - size * 0.8 - bob, size * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#B71C1C';
  ctx.beginPath(); ctx.moveTo(x - 5, y - size * 1.2 - bob); ctx.lineTo(x - 8, y - size * 1.7 - bob); ctx.lineTo(x - 2, y - size * 1.2 - bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 5, y - size * 1.2 - bob); ctx.lineTo(x + 8, y - size * 1.7 - bob); ctx.lineTo(x + 2, y - size * 1.2 - bob); ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath(); ctx.arc(x - 3, y - size * 0.9 - bob, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 3, y - size * 0.9 - bob, 2.5, 0, Math.PI * 2); ctx.fill();
}

function drawSkeleton(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.strokeStyle = '#ECEFF1';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - 5, y + size * 0.3); ctx.lineTo(x - 5, y + size + legOffset(wc, 'left')); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 5, y + size * 0.3); ctx.lineTo(x + 5, y + size + legOffset(wc, 'right')); ctx.stroke();
  ctx.strokeStyle = '#CFD8DC';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.arc(x, y - i * 5 - bob, 8 - i, 0.3, Math.PI - 0.3); ctx.stroke();
  }
  ctx.strokeStyle = '#ECEFF1';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x - 8, y - size * 0.3 - bob); ctx.lineTo(x - 14, y + size * 0.1 - bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 8, y - size * 0.3 - bob); ctx.lineTo(x + 14, y + size * 0.1 - bob); ctx.stroke();
  ctx.fillStyle = '#F5F5F5';
  ctx.beginPath(); ctx.arc(x, y - size * 0.8 - bob, size * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#212121';
  ctx.beginPath(); ctx.arc(x - 3.5, y - size * 0.9 - bob, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 3.5, y - size * 0.9 - bob, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 5, y - size * 0.65 - bob, 3, 4);
  ctx.fillRect(x + 2, y - size * 0.65 - bob, 3, 4);
}

function drawWerewolf(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(x - 8, y + size * 0.4 + legOffset(wc, 'left'), 7, 14);
  ctx.fillRect(x + 1, y + size * 0.4 + legOffset(wc, 'right'), 7, 14);
  ctx.fillStyle = '#8D6E63';
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 0.8, size, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#795548';
  ctx.beginPath(); ctx.arc(x, y - size * 0.85 - bob, size * 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6D4C41';
  ctx.beginPath(); ctx.ellipse(x + 6, y - size * 0.75 - bob, 8, 6, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#795548';
  ctx.beginPath(); ctx.moveTo(x - 8, y - size * 1.2 - bob); ctx.lineTo(x - 14, y - size * 1.6 - bob); ctx.lineTo(x - 3, y - size * 1.1 - bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 8, y - size * 1.2 - bob); ctx.lineTo(x + 14, y - size * 1.6 - bob); ctx.lineTo(x + 3, y - size * 1.1 - bob); ctx.fill();
  ctx.fillStyle = '#FF6F00';
  ctx.beginPath(); ctx.arc(x - 4, y - size * 0.95 - bob, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 4, y - size * 0.95 - bob, 3, 0, Math.PI * 2); ctx.fill();
}

function drawOrc(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = '#558B2F';
  ctx.fillRect(x - 10, y + size * 0.3 + legOffset(wc, 'left'), 9, 16);
  ctx.fillRect(x + 1, y + size * 0.3 + legOffset(wc, 'right'), 9, 16);
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(x - size * 0.85, y - size * 0.4 - bob, size * 1.7, size * 0.8);
  ctx.fillStyle = '#8BC34A';
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 0.9, size, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#9CCC65';
  ctx.beginPath(); ctx.arc(x, y - size * 0.85 - bob, size * 0.75, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFDE7';
  ctx.beginPath(); ctx.moveTo(x - 6, y - size * 0.6 - bob); ctx.lineTo(x - 8, y - size * 0.3 - bob); ctx.lineTo(x - 4, y - size * 0.6 - bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 6, y - size * 0.6 - bob); ctx.lineTo(x + 8, y - size * 0.3 - bob); ctx.lineTo(x + 4, y - size * 0.6 - bob); ctx.fill();
  ctx.fillStyle = '#F44336';
  ctx.beginPath(); ctx.arc(x - 5, y - size * 0.95 - bob, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5, y - size * 0.95 - bob, 3, 0, Math.PI * 2); ctx.fill();
}

function drawGolemEnemy(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc) * 0.5;
  ctx.fillStyle = '#78909C';
  ctx.fillRect(x - 12, y + size * 0.2 + legOffset(wc, 'left') * 0.5, 11, 18);
  ctx.fillRect(x + 1, y + size * 0.2 + legOffset(wc, 'right') * 0.5, 11, 18);
  const grad = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
  grad.addColorStop(0, '#B0BEC5');
  grad.addColorStop(1, '#546E7A');
  ctx.fillStyle = grad;
  ctx.fillRect(x - size * 0.9, y - size * 0.6 - bob, size * 1.8, size * 1.2);
  ctx.fillStyle = '#90A4AE';
  ctx.fillRect(x - size * 0.7, y - size * 1.5 - bob, size * 1.4, size * 1.0);
  const glow = 0.6 + Math.sin(Date.now() / 300) * 0.4;
  ctx.save();
  ctx.globalAlpha = glow;
  ctx.fillStyle = '#00E5FF';
  ctx.beginPath(); ctx.arc(x - 6, y - size * 1.1 - bob, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 6, y - size * 1.1 - bob, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#455A64';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x - 5, y - size * 0.4 - bob); ctx.lineTo(x + 2, y + size * 0.2 - bob); ctx.stroke();
}

function drawTroll(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc) * 0.5;
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - 12, y + size * 0.3 + legOffset(wc, 'left') * 0.5, 11, 18);
  ctx.fillRect(x + 1, y + size * 0.3 + legOffset(wc, 'right') * 0.5, 11, 18);
  ctx.fillStyle = '#795548';
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 1.0, size * 1.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8D6E63';
  ctx.beginPath(); ctx.arc(x, y - size * 0.9 - bob, size * 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4E342E';
  ctx.save();
  ctx.translate(x + size * 0.9, y - bob);
  ctx.rotate(-0.3 + Math.sin(wc * Math.PI * 2) * 0.4);
  ctx.fillRect(-4, -24, 8, 24);
  ctx.fillStyle = '#6D4C41';
  ctx.beginPath(); ctx.arc(0, -24, 10, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#FF6F00';
  ctx.beginPath(); ctx.arc(x - 6, y - size - bob, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 6, y - size - bob, 4, 0, Math.PI * 2); ctx.fill();
}

function drawBanshee(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, _wc: number) {
  const float = Math.sin(Date.now() / 600) * 4;
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#CE93D8';
  ctx.beginPath(); ctx.ellipse(x, y + size + float, size * 0.5, size * 0.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#E1BEE7';
  ctx.beginPath(); ctx.ellipse(x, y - float, size * 0.7, size * 1.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#F3E5F5';
  ctx.beginPath(); ctx.arc(x, y - size * 0.9 - float, size * 0.65, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4A148C';
  ctx.beginPath(); ctx.arc(x - 4, y - size * 1.0 - float, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 4, y - size * 1.0 - float, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4A148C';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y - size * 0.75 - float, 6, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.restore();
}

function drawDarkKnight(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = '#263238';
  ctx.fillRect(x - 9, y + size * 0.2 + legOffset(wc, 'left'), 8, 16);
  ctx.fillRect(x + 1, y + size * 0.2 + legOffset(wc, 'right'), 8, 16);
  const grad = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
  grad.addColorStop(0, '#546E7A');
  grad.addColorStop(1, '#1C313A');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 0.85, size * 0.95, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#37474F';
  ctx.beginPath(); ctx.arc(x, y - size * 0.85 - bob, size * 0.75, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#263238';
  ctx.fillRect(x - 8, y - size * 0.9 - bob, 16, 8);
  ctx.fillStyle = '#FF1744';
  ctx.fillRect(x - 7, y - size * 0.85 - bob, 14, 3);
  ctx.save();
  ctx.translate(x + size * 0.9, y - bob);
  ctx.rotate(Math.sin(wc * Math.PI * 2) * 0.3);
  ctx.fillStyle = '#90A4AE';
  ctx.fillRect(-2, -28, 4, 28);
  ctx.fillStyle = '#B0BEC5';
  ctx.fillRect(-8, -4, 16, 4);
  ctx.restore();
  ctx.fillStyle = 'rgba(183,28,28,0.7)';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.7, y - size * 0.5 - bob);
  ctx.lineTo(x - size * 1.2, y + size * 0.8 - bob);
  ctx.lineTo(x + size * 0.2, y + size * 0.5 - bob);
  ctx.closePath(); ctx.fill();
}

function drawDragon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc) * 0.5;
  const wingFlap = Math.sin(wc * Math.PI * 4) * 0.3;
  ctx.fillStyle = 'rgba(183,28,28,0.8)';
  ctx.save();
  ctx.translate(x - size * 0.5, y - bob);
  ctx.rotate(-0.5 + wingFlap);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size * 1.8, -size * 1.4); ctx.lineTo(-size * 0.5, -size * 0.3); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(x + size * 0.5, y - bob);
  ctx.rotate(0.5 - wingFlap);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size * 1.8, -size * 1.4); ctx.lineTo(size * 0.5, -size * 0.3); ctx.closePath(); ctx.fill();
  ctx.restore();
  const grad = ctx.createRadialGradient(x, y - bob, 4, x, y - bob, size);
  grad.addColorStop(0, '#EF9A9A');
  grad.addColorStop(1, '#B71C1C');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 0.9, size * 1.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#C62828';
  ctx.beginPath(); ctx.ellipse(x + size * 0.7, y - size * 0.6 - bob, size * 0.7, size * 0.55, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4E342E';
  ctx.beginPath(); ctx.moveTo(x + size * 0.5, y - size - bob); ctx.lineTo(x + size * 0.3, y - size * 1.6 - bob); ctx.lineTo(x + size * 0.7, y - size - bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + size * 0.9, y - size * 0.9 - bob); ctx.lineTo(x + size * 0.7, y - size * 1.5 - bob); ctx.lineTo(x + size * 1.1, y - size * 0.9 - bob); ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath(); ctx.arc(x + size * 0.95, y - size * 0.7 - bob, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(x + size * 0.97, y - size * 0.7 - bob, 2.5, 0, Math.PI * 2); ctx.fill();
  if (Math.sin(wc * Math.PI * 2) > 0.6) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    const fireGrad = ctx.createLinearGradient(x + size, y - size * 0.6 - bob, x + size * 2.5, y - size * 0.6 - bob);
    fireGrad.addColorStop(0, '#FF6F00');
    fireGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = fireGrad;
    ctx.beginPath(); ctx.ellipse(x + size * 1.8, y - size * 0.6 - bob, size * 0.8, size * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawArmored(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = '#455A64';
  ctx.fillRect(x - 10, y + size * 0.2 + legOffset(wc, 'left'), 9, 16);
  ctx.fillRect(x + 1, y + size * 0.2 + legOffset(wc, 'right'), 9, 16);
  const grad = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
  grad.addColorStop(0, '#90A4AE');
  grad.addColorStop(0.5, '#607D8B');
  grad.addColorStop(1, '#37474F');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 0.95, size * 1.05, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#546E7A';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.5, y - size * 0.8 - bob);
  ctx.lineTo(x - size * 1.2, y - bob);
  ctx.lineTo(x - size * 0.8, y + size * 0.5 - bob);
  ctx.lineTo(x - size * 0.3, y + size * 0.3 - bob);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#B0BEC5'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#78909C';
  ctx.beginPath(); ctx.arc(x, y - size * 0.9 - bob, size * 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(x - 8, y - size - bob, 16, 6);
  ctx.fillStyle = '#00E5FF';
  ctx.fillRect(x - 6, y - size * 0.95 - bob, 12, 2.5);
}

function drawHealer(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = '#2E7D32';
  ctx.fillRect(x - 6, y + size * 0.3 + legOffset(wc, 'left'), 5, 12);
  ctx.fillRect(x + 1, y + size * 0.3 + legOffset(wc, 'right'), 5, 12);
  ctx.fillStyle = '#A5D6A7';
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 0.75, size * 0.95, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#C8E6C9';
  ctx.beginPath(); ctx.arc(x, y - size * 0.85 - bob, size * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + size * 0.8, y + size * 0.5 - bob); ctx.lineTo(x + size * 0.8, y - size * 1.2 - bob); ctx.stroke();
  const pulse = 0.6 + Math.sin(Date.now() / 300) * 0.4;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#66BB6A';
  ctx.beginPath(); ctx.arc(x + size * 0.8, y - size * 1.2 - bob, 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x - 2, y - size * 0.95 - bob, 4, 10);
  ctx.fillRect(x - 5, y - size * 0.9 - bob, 10, 4);
}

function drawTunneler(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = '#8D6E63';
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 0.85, size * 0.9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6D4C41';
  ctx.beginPath(); ctx.moveTo(x - size * 0.8, y - bob); ctx.lineTo(x - size * 1.2, y - size * 0.3 - bob); ctx.lineTo(x - size * 0.9, y + size * 0.1 - bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + size * 0.8, y - bob); ctx.lineTo(x + size * 1.2, y - size * 0.3 - bob); ctx.lineTo(x + size * 0.9, y + size * 0.1 - bob); ctx.fill();
  ctx.fillStyle = '#A1887F';
  ctx.beginPath(); ctx.arc(x, y - size * 0.8 - bob, size * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#795548';
  ctx.beginPath(); ctx.ellipse(x, y - size * 0.65 - bob, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FF6F00';
  ctx.beginPath(); ctx.arc(x - 4, y - size * 0.9 - bob, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 4, y - size * 0.9 - bob, 3, 0, Math.PI * 2); ctx.fill();
}

function drawFlyer(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const float = Math.sin(Date.now() / 400) * 5;
  const wingFlap = Math.sin(wc * Math.PI * 4) * 0.5;
  ctx.fillStyle = 'rgba(123,31,162,0.8)';
  ctx.save();
  ctx.translate(x - size * 0.4, y - float);
  ctx.rotate(-0.4 + wingFlap);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size * 1.4, -size * 0.8); ctx.lineTo(-size * 0.3, size * 0.2); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(x + size * 0.4, y - float);
  ctx.rotate(0.4 - wingFlap);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size * 1.4, -size * 0.8); ctx.lineTo(size * 0.3, size * 0.2); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#AB47BC';
  ctx.beginPath(); ctx.ellipse(x, y - float, size * 0.65, size * 0.85, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#CE93D8';
  ctx.beginPath(); ctx.arc(x, y - size * 0.75 - float, size * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FF1744';
  ctx.beginPath(); ctx.arc(x - 3, y - size * 0.85 - float, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 3, y - size * 0.85 - float, 3, 0, Math.PI * 2); ctx.fill();
}

function drawSplitterBoss(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc) * 0.3;
  const pulse = 0.7 + Math.sin(Date.now() / 300) * 0.3;
  for (let h = 0; h < 3; h++) {
    const hx = x + (h - 1) * size * 0.7;
    const hy = y - size * 0.8 - bob + Math.sin(Date.now() / 400 + h * 1.2) * 4;
    ctx.fillStyle = ['#D32F2F', '#B71C1C', '#C62828'][h];
    ctx.beginPath(); ctx.arc(hx, hy, size * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(hx - 4, hy - 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + 4, hy - 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#4E342E';
    ctx.beginPath(); ctx.moveTo(hx - 5, hy - size * 0.35); ctx.lineTo(hx - 8, hy - size * 0.7); ctx.lineTo(hx - 2, hy - size * 0.35); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx + 5, hy - size * 0.35); ctx.lineTo(hx + 8, hy - size * 0.7); ctx.lineTo(hx + 2, hy - size * 0.35); ctx.fill();
  }
  const grad = ctx.createRadialGradient(x, y - bob, 5, x, y - bob, size);
  grad.addColorStop(0, '#EF9A9A');
  grad.addColorStop(1, '#B71C1C');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 1.1, size * 1.0, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.globalAlpha = 0.2;
  const aura = ctx.createRadialGradient(x, y - bob, size, x, y - bob, size * 2);
  aura.addColorStop(0, '#F44336');
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.beginPath(); ctx.arc(x, y - bob, size * 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawGenericEnemy(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
}

// ============================================================
// FOOZLE ENEMY PROCEDURAL FALLBACKS
// ============================================================

function drawFirebugFallback(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc);
  // Fire-colored insect body
  const grad = ctx.createRadialGradient(x, y - bob, size * 0.2, x, y - bob, size);
  grad.addColorStop(0, '#FFCA28');
  grad.addColorStop(0.5, '#FF7043');
  grad.addColorStop(1, '#BF360C');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 0.7, size * 0.9, 0, 0, Math.PI * 2); ctx.fill();
  // Wings
  const wingAlpha = 0.6 + Math.sin(wc * Math.PI * 8) * 0.3;
  ctx.save();
  ctx.globalAlpha = wingAlpha;
  ctx.fillStyle = 'rgba(255,120,0,0.5)';
  ctx.beginPath(); ctx.ellipse(x - size * 0.9, y - size * 0.4 - bob, size * 0.7, size * 0.3, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + size * 0.9, y - size * 0.4 - bob, size * 0.7, size * 0.3, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Antennae
  ctx.strokeStyle = '#FF6D00'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x - 4, y - size - bob); ctx.lineTo(x - 8, y - size * 1.5 - bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 4, y - size - bob); ctx.lineTo(x + 8, y - size * 1.5 - bob); ctx.stroke();
  // Eyes
  ctx.fillStyle = '#FF1744';
  ctx.beginPath(); ctx.arc(x - 4, y - size * 0.8 - bob, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 4, y - size * 0.8 - bob, 3, 0, Math.PI * 2); ctx.fill();
}

function drawLeafbugFallback(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc);
  // Green leaf-like body
  ctx.fillStyle = '#558B2F';
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 0.65, size * 0.85, 0, 0, Math.PI * 2); ctx.fill();
  // Leaf wings
  const wingPhase = Math.sin(wc * Math.PI * 6) * 0.25;
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#7CB342';
  ctx.save();
  ctx.translate(x - size * 0.3, y - bob);
  ctx.rotate(-0.5 + wingPhase);
  ctx.beginPath(); ctx.ellipse(-size * 0.5, -size * 0.3, size * 0.8, size * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(x + size * 0.3, y - bob);
  ctx.rotate(0.5 - wingPhase);
  ctx.beginPath(); ctx.ellipse(size * 0.5, -size * 0.3, size * 0.8, size * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore();
  // Head
  ctx.fillStyle = '#33691E';
  ctx.beginPath(); ctx.arc(x, y - size * 0.85 - bob, size * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFE57F';
  ctx.beginPath(); ctx.arc(x - 3, y - size * 0.9 - bob, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 3, y - size * 0.9 - bob, 2, 0, Math.PI * 2); ctx.fill();
}

function drawMagmaCrabFallback(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc) * 0.4;
  // Legs
  ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    const legX = x + i * size * 0.35;
    const legY = y + size * 0.4 + legOffset(wc, i < 0 ? 'left' : 'right') * 0.5;
    ctx.beginPath(); ctx.moveTo(legX, legY); ctx.lineTo(legX + i * size * 0.4, legY + size * 0.5); ctx.stroke();
  }
  // Carapace (rock-like)
  const grad = ctx.createRadialGradient(x - size * 0.2, y - size * 0.2 - bob, size * 0.1, x, y - bob, size);
  grad.addColorStop(0, '#FF5722');
  grad.addColorStop(0.6, '#BF360C');
  grad.addColorStop(1, '#4E2020');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 1.1, size * 0.75, 0, 0, Math.PI * 2); ctx.fill();
  // Cracks (lava pattern)
  ctx.strokeStyle = '#FF6D00'; ctx.lineWidth = 1.5;
  ctx.save();
  ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 200) * 0.3;
  ctx.beginPath(); ctx.moveTo(x - size * 0.5, y - size * 0.2 - bob); ctx.lineTo(x - size * 0.1, y - bob); ctx.lineTo(x + size * 0.4, y - size * 0.3 - bob); ctx.stroke();
  ctx.restore();
  // Claws
  ctx.fillStyle = '#795548';
  ctx.beginPath(); ctx.ellipse(x - size * 1.1, y - bob, size * 0.45, size * 0.3, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + size * 1.1, y - bob, size * 0.45, size * 0.3, 0.3, 0, Math.PI * 2); ctx.fill();
  // Eyes (glowing)
  ctx.save();
  ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 150) * 0.2;
  ctx.fillStyle = '#FFD740';
  ctx.beginPath(); ctx.arc(x - size * 0.3, y - size * 0.4 - bob, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + size * 0.3, y - size * 0.4 - bob, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawScorpionFallback(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wc: number) {
  const bob = bodyBob(wc) * 0.5;
  // Tail stinger
  const tailSwing = Math.sin(wc * Math.PI * 2) * 0.2;
  ctx.strokeStyle = '#F9A825'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - bob);
  ctx.quadraticCurveTo(x + size * 1.2, y - size * 1.2 - bob + tailSwing * 10, x + size * 0.6, y - size * 1.8 - bob);
  ctx.stroke();
  // Stinger tip
  ctx.fillStyle = '#F57F17';
  ctx.beginPath(); ctx.arc(x + size * 0.6, y - size * 1.8 - bob, 4, 0, Math.PI * 2); ctx.fill();
  // Legs
  ctx.strokeStyle = '#6D4C41'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const lx = x - size * 0.6 + i * size * 0.4;
    const lo = legOffset(wc, i % 2 === 0 ? 'left' : 'right');
    ctx.beginPath(); ctx.moveTo(lx, y + size * 0.3 - bob); ctx.lineTo(lx - size * 0.3, y + size * 0.8 + lo - bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx, y + size * 0.3 - bob); ctx.lineTo(lx + size * 0.3, y + size * 0.8 - lo - bob); ctx.stroke();
  }
  // Body segments
  const bodyGrad = ctx.createLinearGradient(x - size, y - bob, x + size, y - bob);
  bodyGrad.addColorStop(0, '#F9A825');
  bodyGrad.addColorStop(1, '#E65100');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.ellipse(x, y - bob, size * 0.85, size * 0.65, 0, 0, Math.PI * 2); ctx.fill();
  // Head with pincers
  ctx.fillStyle = '#F57F17';
  ctx.beginPath(); ctx.arc(x, y - size * 0.75 - bob, size * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#BF360C';
  // Pincers
  ctx.beginPath(); ctx.ellipse(x - size * 0.75, y - size * 0.6 - bob, size * 0.35, size * 0.2, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + size * 0.75, y - size * 0.6 - bob, size * 0.35, size * 0.2, 0.4, 0, Math.PI * 2); ctx.fill();
  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(x - 3, y - size * 0.85 - bob, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 3, y - size * 0.85 - bob, 2, 0, Math.PI * 2); ctx.fill();
}

// ============================================================
// ALLIED UNITS DRAWING
// ============================================================

function drawAlliedUnits(ctx: CanvasRenderingContext2D, units: AlliedUnit[]) {
  for (const unit of units) {
    if (!unit.alive) continue;
    drawAlliedUnit(ctx, unit);
  }
}

function drawAlliedUnit(ctx: CanvasRenderingContext2D, unit: AlliedUnit) {
  const { x, y, type, walkCycle, facingLeft, hp, maxHp, moveAngle } = unit;
  const animTime = (walkCycle || 0) * 6;

  switch (type) {
    case 'hero': {
      const drawn = drawPixelLabCharacterByAngle(ctx, 'hero_sword', x, y, moveAngle || 0, 48, null, animTime);
      if (!drawn) {
        ctx.save();
        if (facingLeft) { ctx.scale(-1, 1); ctx.translate(-x * 2, 0); }
        drawHeroUnit(ctx, x, y, walkCycle || 0);
        ctx.restore();
      }
      break;
    }
    case 'soldier': {
      const drawn = drawPixelLabCharacterByAngle(ctx, 'infantry', x, y, moveAngle || 0, 48, null, animTime);
      if (!drawn) {
        ctx.save();
        if (facingLeft) { ctx.scale(-1, 1); ctx.translate(-x * 2, 0); }
        drawSoldierUnit(ctx, x, y, walkCycle || 0);
        ctx.restore();
      }
      break;
    }
    case 'wolf': {
      const drawn = drawPixelLabCharacterByAngle(ctx, 'wolf', x, y, moveAngle || 0, 48, null, animTime);
      if (!drawn) {
        ctx.save();
        if (facingLeft) { ctx.scale(-1, 1); ctx.translate(-x * 2, 0); }
        drawWolfUnit(ctx, x, y, walkCycle || 0);
        ctx.restore();
      }
      break;
    }
    case 'skeleton': {
      const drawn = drawPixelLabCharacterByAngle(ctx, 'skeleton', x, y, moveAngle || 0, 48, null, animTime);
      if (!drawn) {
        ctx.save();
        if (facingLeft) { ctx.scale(-1, 1); ctx.translate(-x * 2, 0); }
        drawSkeletonUnit(ctx, x, y, walkCycle || 0);
        ctx.restore();
      }
      break;
    }
    case 'golem':
      ctx.save();
      if (facingLeft) { ctx.scale(-1, 1); ctx.translate(-x * 2, 0); }
      drawGolemUnit(ctx, x, y, walkCycle || 0);
      ctx.restore();
      break;
    case 'archer': {
      const drawn = drawPixelLabCharacterByAngle(ctx, 'archer', x, y, moveAngle || 0, 48, null, animTime);
      if (!drawn) {
        ctx.save();
        if (facingLeft) { ctx.scale(-1, 1); ctx.translate(-x * 2, 0); }
        drawArcherUnit(ctx, x, y, walkCycle || 0);
        ctx.restore();
      }
      break;
    }
    case 'pikeman': {
      const drawn = drawPixelLabCharacterByAngle(ctx, 'pikeman', x, y, moveAngle || 0, 48, null, animTime);
      if (!drawn) {
        ctx.save();
        if (facingLeft) { ctx.scale(-1, 1); ctx.translate(-x * 2, 0); }
        drawPikemanUnit(ctx, x, y, walkCycle || 0);
        ctx.restore();
      }
      break;
    }
    case 'paladin': {
      const drawn = drawPixelLabCharacterByAngle(ctx, 'paladin', x, y, moveAngle || 0, 48, null, animTime);
      if (!drawn) {
        ctx.save();
        if (facingLeft) { ctx.scale(-1, 1); ctx.translate(-x * 2, 0); }
        drawPaladinUnit(ctx, x, y, walkCycle || 0);
        ctx.restore();
      }
      break;
    }
  }

  if (hp < maxHp) {
    const barW = 24;
    ctx.fillStyle = '#333';
    ctx.fillRect(x - barW/2, y - 22, barW, 4);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(x - barW/2, y - 22, barW * (hp / maxHp), 4);
  }

  ctx.fillStyle = '#2196F3';
  ctx.beginPath(); ctx.arc(x, y - 26, 3, 0, Math.PI * 2); ctx.fill();
}

function drawSoldierUnit(ctx: CanvasRenderingContext2D, x: number, y: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = '#1565C0';
  ctx.fillRect(x - 5, y + 6 + legOffset(wc, 'left'), 4, 10);
  ctx.fillRect(x + 1, y + 6 + legOffset(wc, 'right'), 4, 10);
  ctx.fillStyle = '#1976D2';
  ctx.beginPath(); ctx.ellipse(x, y - bob, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0D47A1';
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 8 - bob); ctx.lineTo(x - 14, y - bob);
  ctx.lineTo(x - 10, y + 6 - bob); ctx.lineTo(x - 6, y + 4 - bob);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#90CAF9'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 8, y + 6 - bob); ctx.lineTo(x + 8, y - 14 - bob); ctx.stroke();
  ctx.strokeStyle = '#B0BEC5';
  ctx.beginPath(); ctx.moveTo(x + 4, y - 8 - bob); ctx.lineTo(x + 12, y - 8 - bob); ctx.stroke();
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath(); ctx.arc(x, y - 12 - bob, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1565C0';
  ctx.beginPath(); ctx.arc(x, y - 14 - bob, 7, Math.PI, 0); ctx.fill();
}

function drawHeroUnitWithSprite(ctx: CanvasRenderingContext2D, x: number, y: number, wc: number) {
  const bob = bodyBob(wc);
  const heroImg = getCharacterSprite('knight_hero');
  if (heroImg) {
    // 188x205 — scale to unit size (~28px tall)
    const scale = 48 / 205;
    const dw = 188 * scale;
    const dh = 205 * scale;
    ctx.drawImage(heroImg, x - dw / 2, y - dh / 2 - bob, dw, dh);
  } else {
    drawHeroUnit(ctx, x, y, wc);
  }
}

function drawHeroUnit(ctx: CanvasRenderingContext2D, x: number, y: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = 'rgba(183,28,28,0.8)';
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 8 - bob); ctx.lineTo(x - 14, y + 10 - bob);
  ctx.lineTo(x + 2, y + 6 - bob); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4A148C';
  ctx.fillRect(x - 6, y + 6 + legOffset(wc, 'left'), 5, 12);
  ctx.fillRect(x + 1, y + 6 + legOffset(wc, 'right'), 5, 12);
  const grad = ctx.createLinearGradient(x - 9, y - 12, x + 9, y + 8);
  grad.addColorStop(0, '#FFD700');
  grad.addColorStop(1, '#F57F17');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(x, y - bob, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 8;
  ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x + 10, y + 8 - bob); ctx.lineTo(x + 10, y - 20 - bob); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath(); ctx.arc(x, y - 14 - bob, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 20 - bob); ctx.lineTo(x - 6, y - 26 - bob);
  ctx.lineTo(x - 2, y - 22 - bob); ctx.lineTo(x, y - 28 - bob);
  ctx.lineTo(x + 2, y - 22 - bob); ctx.lineTo(x + 6, y - 26 - bob);
  ctx.lineTo(x + 8, y - 20 - bob);
  ctx.closePath(); ctx.fill();
}

function drawWolfUnit(ctx: CanvasRenderingContext2D, x: number, y: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = '#757575';
  ctx.beginPath(); ctx.ellipse(x, y - bob, 10, 8, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#616161';
  ctx.fillRect(x - 8, y + 4 + legOffset(wc, 'left'), 4, 8);
  ctx.fillRect(x - 2, y + 4 + legOffset(wc, 'right'), 4, 8);
  ctx.fillRect(x + 4, y + 4 + legOffset(wc, 'left'), 4, 8);
  ctx.fillStyle = '#9E9E9E';
  ctx.beginPath(); ctx.ellipse(x + 10, y - 4 - bob, 8, 6, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#757575';
  ctx.beginPath(); ctx.moveTo(x + 6, y - 8 - bob); ctx.lineTo(x + 4, y - 14 - bob); ctx.lineTo(x + 10, y - 8 - bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 12, y - 8 - bob); ctx.lineTo(x + 14, y - 14 - bob); ctx.lineTo(x + 16, y - 8 - bob); ctx.fill();
  ctx.fillStyle = '#FF6F00';
  ctx.beginPath(); ctx.arc(x + 14, y - 5 - bob, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#757575'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - bob);
  ctx.quadraticCurveTo(x - 18, y - 10 - bob, x - 14, y - 16 - bob);
  ctx.stroke();
}

function drawGolemUnit(ctx: CanvasRenderingContext2D, x: number, y: number, wc: number) {
  const bob = bodyBob(wc) * 0.3;
  ctx.fillStyle = '#78909C';
  ctx.fillRect(x - 8, y + 4 + legOffset(wc, 'left') * 0.3, 7, 12);
  ctx.fillRect(x + 1, y + 4 + legOffset(wc, 'right') * 0.3, 7, 12);
  ctx.fillStyle = '#90A4AE';
  ctx.fillRect(x - 10, y - 12 - bob, 20, 18);
  ctx.fillRect(x - 9, y - 22 - bob, 18, 12);
  ctx.fillStyle = '#00E5FF';
  ctx.beginPath(); ctx.arc(x - 4, y - 18 - bob, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 4, y - 18 - bob, 3.5, 0, Math.PI * 2); ctx.fill();
}

function drawSkeletonUnit(ctx: CanvasRenderingContext2D, x: number, y: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.strokeStyle = '#ECEFF1'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 4, y + 4); ctx.lineTo(x - 4, y + 14 + legOffset(wc, 'left')); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + 4, y + 14 + legOffset(wc, 'right')); ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(x, y - i * 4 - bob, 6 - i * 0.5, 0.4, Math.PI - 0.4); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(x - 6, y - 4 - bob); ctx.lineTo(x - 11, y + 4 - bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 6, y - 4 - bob); ctx.lineTo(x + 11, y + 4 - bob); ctx.stroke();
  ctx.fillStyle = '#F5F5F5';
  ctx.beginPath(); ctx.arc(x, y - 12 - bob, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#212121';
  ctx.beginPath(); ctx.arc(x - 2.5, y - 13 - bob, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 2.5, y - 13 - bob, 2, 0, Math.PI * 2); ctx.fill();
}

function drawArcherUnit(ctx: CanvasRenderingContext2D, x: number, y: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = '#228B22';
  ctx.fillRect(x - 4, y + 6 + legOffset(wc, 'left'), 3, 10);
  ctx.fillRect(x + 1, y + 6 + legOffset(wc, 'right'), 3, 10);
  ctx.fillStyle = '#32CD32';
  ctx.beginPath(); ctx.ellipse(x, y - bob, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 6 - bob); ctx.lineTo(x + 14, y - 18 - bob);
  ctx.stroke();
  ctx.fillStyle = '#FFE4B5';
  ctx.beginPath(); ctx.arc(x, y - 11 - bob, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#228B22';
  ctx.beginPath(); ctx.arc(x, y - 13 - bob, 6, Math.PI, 0); ctx.fill();
}

function drawPikemanUnit(ctx: CanvasRenderingContext2D, x: number, y: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = '#708090';
  ctx.fillRect(x - 5, y + 6 + legOffset(wc, 'left'), 4, 11);
  ctx.fillRect(x + 1, y + 6 + legOffset(wc, 'right'), 4, 11);
  ctx.fillStyle = '#A9A9A9';
  ctx.beginPath(); ctx.ellipse(x, y - bob, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(x - 2, y - 24 - bob, 3, 24);
  ctx.fillStyle = '#FFD700';
  ctx.beginPath(); ctx.arc(x - 0.5, y - 24 - bob, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFE4B5';
  ctx.beginPath(); ctx.arc(x, y - 12 - bob, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#708090';
  ctx.beginPath(); ctx.arc(x, y - 14 - bob, 7, Math.PI, 0); ctx.fill();
}

function drawPaladinUnit(ctx: CanvasRenderingContext2D, x: number, y: number, wc: number) {
  const bob = bodyBob(wc);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(x - 5, y + 6 + legOffset(wc, 'left'), 4, 11);
  ctx.fillRect(x + 1, y + 6 + legOffset(wc, 'right'), 4, 11);
  ctx.fillStyle = '#FFA500';
  ctx.beginPath(); ctx.ellipse(x, y - bob, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath(); ctx.moveTo(x - 10, y - 6 - bob); ctx.lineTo(x - 14, y + 8 - bob); ctx.lineTo(x - 6, y + 6 - bob); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(x + 4, y - 8 - bob, 3, 20);
  ctx.fillStyle = '#FFE4B5';
  ctx.beginPath(); ctx.arc(x, y - 12 - bob, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath(); ctx.arc(x, y - 14 - bob, 7, Math.PI, 0); ctx.fill();
}

// ============================================================
// PROJECTILE DRAWING
// ============================================================

function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
  for (const proj of projectiles) {
    if (!proj.alive) continue;
    const dx = proj.targetX - proj.x;
    const dy = proj.targetY - proj.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(proj.x, proj.y);
    ctx.rotate(angle);

    switch (proj.type) {
      case 'arrow': {
        const arrowImg = loadImage('/sprites/towers/archer/arrow/1.png');
        if (arrowImg) {
          ctx.drawImage(arrowImg, -8, -4, 16, 8);
        } else {
          ctx.strokeStyle = '#8D6E63'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
          ctx.fillStyle = '#CFD8DC';
          ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(4, -3); ctx.lineTo(4, 3); ctx.closePath(); ctx.fill();
        }
        break;
      }
      case 'fireball': {
        const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, proj.size);
        fg.addColorStop(0, '#FFEB3B');
        fg.addColorStop(0.5, '#FF5722');
        fg.addColorStop(1, 'transparent');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(0, 0, proj.size, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'cannonball':
        ctx.fillStyle = '#263238';
        ctx.beginPath(); ctx.arc(0, 0, proj.size, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#546E7A';
        ctx.beginPath(); ctx.arc(-2, -2, proj.size * 0.4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'frost': {
        const ff = ctx.createRadialGradient(0, 0, 0, 0, 0, proj.size);
        ff.addColorStop(0, '#FFFFFF');
        ff.addColorStop(1, '#4FC3F7');
        ctx.fillStyle = ff;
        ctx.beginPath(); ctx.arc(0, 0, proj.size, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'lightning':
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(-8, 0); ctx.lineTo(-2, -4); ctx.lineTo(2, 4); ctx.lineTo(8, 0);
        ctx.stroke();
        break;
      case 'poison': {
        const pf = ctx.createRadialGradient(0, 0, 0, 0, 0, proj.size);
        pf.addColorStop(0, '#CCFF90');
        pf.addColorStop(1, '#33691E');
        ctx.fillStyle = pf;
        ctx.beginPath(); ctx.arc(0, 0, proj.size, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'bolt':
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(-14, -3, 28, 6);
        ctx.fillStyle = '#CFD8DC';
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(8, -4); ctx.lineTo(8, 4); ctx.closePath(); ctx.fill();
        break;
      case 'boulder':
        ctx.fillStyle = '#607D8B';
        ctx.beginPath(); ctx.arc(0, 0, proj.size, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#78909C';
        ctx.beginPath(); ctx.arc(-3, -3, proj.size * 0.4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'tesla':
        ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = 2;
        ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(-10 + i * 5 + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 8);
        }
        ctx.lineTo(10, 0);
        ctx.stroke();
        break;
      default:
        ctx.fillStyle = proj.color;
        ctx.beginPath(); ctx.arc(0, 0, proj.size || 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

// ============================================================
// PARTICLES & FLOATING TEXTS
// ============================================================

function drawParticles(ctx: CanvasRenderingContext2D, particles: Array<{ x: number; y: number; color: string; size: number; opacity: number }>) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: Array<{ x: number; y: number; text: string; color: string; opacity: number; scale?: number }>) {
  for (const ft of texts) {
    ctx.save();
    ctx.globalAlpha = ft.opacity;
    const scale = ft.scale || 1;
    ctx.font = `bold ${Math.round(13 * scale)}px 'Philosopher', serif`;
    ctx.fillStyle = ft.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

// ============================================================
// ABILITY EFFECTS (sprite-based overlays)
// ============================================================

function drawAbilityEffects(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  const abilities = state.abilities;
  if (!abilities) return;

  const animTime = getAnimTime();

  // Lightning Storm: draw lightning strike sprites on random positions
  const lightningAbility = abilities.find((a: { type: string; active: boolean }) => a.type === 'lightningStorm' && a.active);
  if (lightningAbility) {
    const config = getLightningSpriteConfig(1 + (Math.floor(animTime * 3) % 4));
    const frameIndex = Math.floor(animTime * 8) % config.frameCount;
    // Draw multiple lightning strikes across the battlefield
    for (let i = 0; i < 5; i++) {
      // Use time-based pseudo-random positions (deterministic per frame for consistent look)
      const seed = Math.sin(animTime * 7 + i * 123.456) * 0.5 + 0.5;
      const seed2 = Math.sin(animTime * 11 + i * 789.012) * 0.5 + 0.5;
      const lx = seed * GRID_COLS * CELL_SIZE;
      const ly = seed2 * GRID_ROWS * CELL_SIZE;
      const lSize = CELL_SIZE * 2.5;
      ctx.save();
      ctx.globalAlpha = 0.7 + Math.sin(animTime * 20 + i) * 0.3;
      drawSpriteFrame(ctx, config, frameIndex, lx - lSize / 2, ly - lSize, lSize, lSize);
      ctx.restore();
    }
  }
}

// ============================================================
// BOSS HP BAR
// ============================================================

const BOSS_NAMES: Record<string, string> = {
  dragon: 'Ancient Dragon',
  splitterBoss: 'Chaos Hydra',
  darkKnight: 'Dark Knight Commander',
  golem: 'Stone Colossus',
  troll: 'Mountain Troll King',
};

function drawBossBar(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  if (!state.bossActive || state.bossMaxHp === 0) return;
  const bossEnemy = state.enemies.find((e: Enemy) => e.isBoss && e.alive && !e.dying);
  if (!bossEnemy) return;

  const barW = 400;
  const barH = 20;
  const bx = (GRID_COLS * CELL_SIZE - barW) / 2;
  const by = 8;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(bx - 4, by - 4, barW + 8, barH + 24);
  ctx.strokeStyle = '#B71C1C';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx - 4, by - 4, barW + 8, barH + 24);

  ctx.fillStyle = '#333';
  ctx.fillRect(bx, by, barW, barH);
  const pct = Math.max(0, bossEnemy.hp / bossEnemy.maxHp);
  const barGrad = ctx.createLinearGradient(bx, by, bx + barW, by);
  barGrad.addColorStop(0, '#F44336');
  barGrad.addColorStop(0.5, '#FF5722');
  barGrad.addColorStop(1, '#FF9800');
  ctx.fillStyle = barGrad;
  ctx.fillRect(bx, by, barW * pct, barH);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 11px serif';
  ctx.textAlign = 'center';
  ctx.fillText(`👑 ${BOSS_NAMES[bossEnemy.type] || 'BOSS'} — ${Math.round(pct * 100)}%`, bx + barW / 2, by + barH + 14);
}

// ============================================================
// RANGE CIRCLE
// ============================================================

function drawRangeCircle(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  if (!state.selectedTowerId) return;
  const tower = state.towers.find((t: Tower) => t.id === state.selectedTowerId);
  if (!tower) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(tower.x, tower.y, tower.range * CELL_SIZE, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ============================================================
// WAVE ANNOUNCEMENT BANNER
// ============================================================

function drawWaveAnnouncement(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  const ann = state.waveAnnouncement;
  if (!ann || ann.timer <= 0) return;

  const progress = ann.timer / ann.maxTimer; // 1.0 → 0.0
  const canvasW = GRID_COLS * CELL_SIZE;
  const canvasH = GRID_ROWS * CELL_SIZE;

  // Slide in from top, hold, then fade out
  let alpha = 1;
  let yOffset = 0;
  if (progress > 0.85) {
    // Slide in phase (first 15%)
    const t = (1 - progress) / 0.15;
    yOffset = -40 * (1 - t);
    alpha = t;
  } else if (progress < 0.2) {
    // Fade out phase (last 20%)
    alpha = progress / 0.2;
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  // Dark banner background
  const bannerY = canvasH * 0.35 + yOffset;
  const bannerH = 60;
  const grad = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerH);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.2, 'rgba(0,0,0,0.7)');
  grad.addColorStop(0.8, 'rgba(0,0,0,0.7)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, bannerY, canvasW, bannerH);

  // Gold accent lines
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = alpha * 0.6;
  ctx.beginPath();
  ctx.moveTo(canvasW * 0.15, bannerY + 8);
  ctx.lineTo(canvasW * 0.85, bannerY + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(canvasW * 0.15, bannerY + bannerH - 8);
  ctx.lineTo(canvasW * 0.85, bannerY + bannerH - 8);
  ctx.stroke();

  // Main text
  ctx.globalAlpha = alpha;
  const isBoss = ann.text.includes('BOSS');
  const scale = 1 + Math.sin(Date.now() / 200) * (isBoss ? 0.05 : 0.02);

  ctx.save();
  ctx.translate(canvasW / 2, bannerY + bannerH / 2);
  ctx.scale(scale, scale);

  ctx.font = `bold ${isBoss ? 28 : 24}px 'Uncial Antiqua', serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Text shadow
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillText(ann.text, 2, 2);

  // Main text color
  ctx.fillStyle = isBoss ? '#FF6B6B' : '#FFD700';
  ctx.fillText(ann.text, 0, 0);

  if (isBoss) {
    // Red glow for boss
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 20;
    ctx.fillText(ann.text, 0, 0);
  }

  ctx.restore();
  ctx.restore();
}

// ============================================================
// TOWER PREVIEW (for sidebar mini-canvas)
// ============================================================

export function renderTowerPreview(ctx: CanvasRenderingContext2D, type: string, size: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.scale(size / 80, size / 80);
  const sx = 40, sy = 44;
  switch (type) {
    case 'archer': {
      if (!drawArcherTowerPreview(ctx, sx, sy, 70)) {
        drawArcherTower(ctx, sx, sy, 1, 0);
      }
      break;
    }
    case 'mage':        drawMageTower(ctx, sx, sy, 1, 0); break;
    case 'cannon':      drawCannonTower(ctx, sx, sy, 1, 0); break;
    case 'frost':       drawFrostTower(ctx, sx, sy, 1, 0); break;
    case 'lightning':   drawStormTower(ctx, sx, sy, 1, 0); break;
    case 'poison':      drawPoisonTower(ctx, sx, sy, 1, 0); break;
    case 'ballista':    drawBallistaTower(ctx, sx, sy, 1, 0); break;
    case 'infantry':    drawInfantryBarracks(ctx, sx, sy, 1); break;
    case 'archer_barracks': drawArcherBarracks(ctx, sx, sy, 1); break;
    case 'pikeman_barracks': drawPikemanHall(ctx, sx, sy, 1); break;
    case 'hero':        drawHeroAltar(ctx, sx, sy, 1); break;
    case 'paladin_shrine': drawPaladinShrine(ctx, sx, sy, 1, 0); break;
    case 'beastmaster': drawBeastDen(ctx, sx, sy, 1); break;
    case 'necromancer': drawNecromancerCrypt(ctx, sx, sy, 1, 0); break;
    case 'catapult':    drawCatapult(ctx, sx, sy, 1, 0); break;
    case 'tesla':       drawTeslaCoil(ctx, sx, sy, 1, 0); break;
    default:
      ctx.fillStyle = '#888';
      ctx.fillRect(sx - 14, sy - 14, 28, 28);
  }
  ctx.restore();
}
