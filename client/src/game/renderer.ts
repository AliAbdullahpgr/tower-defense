// ============================================================
// Fantasy Tower Defense — Canvas Renderer (Mega Expansion)
// Design: Painterly Storybook Fantasy
// All towers, monsters, and allied units drawn procedurally
// ============================================================

import type { GameEngineState } from './engine';
import type { Enemy, Tower, Projectile, AlliedUnit } from './types';
import { CELL_SIZE, GRID_COLS, GRID_ROWS } from './constants';

// ============================================================
// MAIN RENDER ENTRY
// ============================================================

export function renderGame(ctx: CanvasRenderingContext2D, state: GameEngineState, _dt: number) {
  const { screenShake } = state;

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
  drawFloatingTexts(ctx, state.floatingTexts);
  drawBossBar(ctx, state);
  drawRangeCircle(ctx, state);

  ctx.restore();
}

// ============================================================
// MAP DRAWING
// ============================================================

function drawMap(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  const { pathCells, powerSpots, waypoints } = state;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;
      const key = `${col},${row}`;

      if (pathCells.has(key)) {
        const grad = ctx.createLinearGradient(x, y, x, y + CELL_SIZE);
        grad.addColorStop(0, '#C8A96E');
        grad.addColorStop(1, '#B8935A');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * 16, y);
          ctx.lineTo(x + i * 16, y + CELL_SIZE);
          ctx.stroke();
        }
      } else if (powerSpots && powerSpots.has(key)) {
        const grad = ctx.createRadialGradient(x + CELL_SIZE/2, y + CELL_SIZE/2, 5, x + CELL_SIZE/2, y + CELL_SIZE/2, CELL_SIZE * 0.7);
        grad.addColorStop(0, '#5A7A3A');
        grad.addColorStop(0.5, '#4A6A2A');
        grad.addColorStop(1, '#3A5A1A');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(Date.now() / 600) * 0.15;
        const starGrad = ctx.createRadialGradient(x + CELL_SIZE/2, y + CELL_SIZE/2, 0, x + CELL_SIZE/2, y + CELL_SIZE/2, CELL_SIZE * 0.5);
        starGrad.addColorStop(0, '#FFD700');
        starGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = starGrad;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.restore();
        ctx.fillStyle = 'rgba(255,215,0,0.6)';
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', x + CELL_SIZE/2, y + CELL_SIZE/2 + 6);
      } else {
        const shade = ((col + row) % 2 === 0) ? '#4A7A2A' : '#3A6A1A';
        ctx.fillStyle = shade;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#5A8A3A';
        ctx.fillRect(x + 2, y + 2, 8, 3);
        ctx.fillRect(x + 20, y + 35, 6, 3);
        ctx.fillRect(x + 45, y + 15, 7, 3);
        ctx.globalAlpha = 1;
      }

      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }

  drawMapDecorations(ctx, pathCells, powerSpots || new Set());
  if (waypoints && waypoints.length > 1) {
    drawPathArrows(ctx, waypoints);
    const [startCol, startRow] = waypoints[0];
    const [endCol, endRow] = waypoints[waypoints.length - 1];
    drawEntryMarker(ctx, startCol * CELL_SIZE, startRow * CELL_SIZE);
    drawExitMarker(ctx, endCol * CELL_SIZE, endRow * CELL_SIZE);
  }
}

function drawMapDecorations(ctx: CanvasRenderingContext2D, pathCells: Set<string>, powerSpots: Set<string>) {
  const decorations: Array<[number, number, string]> = [
    [1, 1, 'tree'], [2, 8, 'tree'], [5, 1, 'tree'], [8, 3, 'rock'],
    [10, 1, 'tree'], [13, 2, 'mushroom'], [16, 1, 'tree'], [0, 10, 'rock'],
    [4, 10, 'tree'], [7, 10, 'mushroom'], [12, 11, 'tree'], [16, 10, 'rock'],
    [1, 4, 'mushroom'], [6, 7, 'rock'], [14, 6, 'tree'], [17, 3, 'mushroom'],
    [2, 11, 'tree'], [9, 0, 'rock'], [15, 11, 'tree'], [3, 0, 'mushroom'],
  ];
  for (const [col, row, type] of decorations) {
    const key = `${col},${row}`;
    if (pathCells.has(key) || powerSpots.has(key)) continue;
    const x = col * CELL_SIZE + CELL_SIZE / 2;
    const y = row * CELL_SIZE + CELL_SIZE / 2;
    if (type === 'tree') drawTree(ctx, x, y);
    else if (type === 'rock') drawRock(ctx, x, y);
    else drawMushroom(ctx, x, y);
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - 4, y + 4, 8, 14);
  ctx.fillStyle = '#2E7D32';
  ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x - 14, y + 6); ctx.lineTo(x + 14, y + 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#388E3C';
  ctx.beginPath(); ctx.moveTo(x, y - 26); ctx.lineTo(x - 11, y - 4); ctx.lineTo(x + 11, y - 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#43A047';
  ctx.beginPath(); ctx.moveTo(x, y - 32); ctx.lineTo(x - 8, y - 14); ctx.lineTo(x + 8, y - 14); ctx.closePath(); ctx.fill();
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number) {
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
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#8B6914';
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
    ctx.moveTo(10, 0); ctx.lineTo(-8, -7); ctx.lineTo(-8, 7);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawEntryMarker(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.moveTo(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
  ctx.lineTo(x + CELL_SIZE / 2 - 16, y + CELL_SIZE / 2 - 12);
  ctx.lineTo(x + CELL_SIZE / 2 - 16, y + CELL_SIZE / 2 + 12);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawExitMarker(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = '#EF5350';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 8, y + 8, CELL_SIZE - 16, CELL_SIZE - 16);
  ctx.fillStyle = '#EF5350';
  ctx.font = 'bold 14px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏰', x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 6);
  ctx.restore();
}

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

  switch (tower.type) {
    case 'archer':      drawArcherTower(ctx, x, y, tower.level, anim); break;
    case 'mage':        drawMageTower(ctx, x, y, tower.level, anim); break;
    case 'cannon':      drawCannonTower(ctx, x, y, tower.level, anim); break;
    case 'frost':       drawFrostTower(ctx, x, y, tower.level, anim); break;
    case 'lightning':   drawStormTower(ctx, x, y, tower.level, anim); break;
    case 'poison':      drawPoisonTower(ctx, x, y, tower.level, anim); break;
    case 'ballista':    drawBallistaTower(ctx, x, y, tower.level, anim); break;
    case 'infantry':    drawInfantryBarracks(ctx, x, y, tower.level); break;
    case 'hero':        drawHeroAltar(ctx, x, y, tower.level); break;
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
    ctx.fillText('★'.repeat(tower.level), x, y + 30);
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

  if (facingLeft) {
    ctx.scale(-1, 1);
    ctx.translate(-x * 2, 0);
  }

  if (frozen) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#B3E5FC';
    ctx.beginPath(); ctx.arc(x, y, size + 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
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
    default:             drawGenericEnemy(ctx, x, y, size, enemy.color); break;
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
// ALLIED UNITS DRAWING
// ============================================================

function drawAlliedUnits(ctx: CanvasRenderingContext2D, units: AlliedUnit[]) {
  for (const unit of units) {
    if (!unit.alive) continue;
    drawAlliedUnit(ctx, unit);
  }
}

function drawAlliedUnit(ctx: CanvasRenderingContext2D, unit: AlliedUnit) {
  const { x, y, type, walkCycle, facingLeft, hp, maxHp } = unit;

  ctx.save();
  if (facingLeft) {
    ctx.scale(-1, 1);
    ctx.translate(-x * 2, 0);
  }

  switch (type) {
    case 'soldier':  drawSoldierUnit(ctx, x, y, walkCycle || 0); break;
    case 'hero':     drawHeroUnit(ctx, x, y, walkCycle || 0); break;
    case 'wolf':     drawWolfUnit(ctx, x, y, walkCycle || 0); break;
    case 'golem':    drawGolemUnit(ctx, x, y, walkCycle || 0); break;
    case 'skeleton': drawSkeletonUnit(ctx, x, y, walkCycle || 0); break;
  }

  ctx.restore();

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
      case 'arrow':
        ctx.strokeStyle = '#8D6E63'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
        ctx.fillStyle = '#CFD8DC';
        ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(4, -3); ctx.lineTo(4, 3); ctx.closePath(); ctx.fill();
        break;
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
// TOWER PREVIEW (for sidebar mini-canvas)
// ============================================================

export function renderTowerPreview(ctx: CanvasRenderingContext2D, type: string, size: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.scale(size / 80, size / 80);
  const sx = 40, sy = 44;
  switch (type) {
    case 'archer':      drawArcherTower(ctx, sx, sy, 1, 0); break;
    case 'mage':        drawMageTower(ctx, sx, sy, 1, 0); break;
    case 'cannon':      drawCannonTower(ctx, sx, sy, 1, 0); break;
    case 'frost':       drawFrostTower(ctx, sx, sy, 1, 0); break;
    case 'lightning':   drawStormTower(ctx, sx, sy, 1, 0); break;
    case 'poison':      drawPoisonTower(ctx, sx, sy, 1, 0); break;
    case 'ballista':    drawBallistaTower(ctx, sx, sy, 1, 0); break;
    case 'infantry':    drawInfantryBarracks(ctx, sx, sy, 1); break;
    case 'hero':        drawHeroAltar(ctx, sx, sy, 1); break;
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
