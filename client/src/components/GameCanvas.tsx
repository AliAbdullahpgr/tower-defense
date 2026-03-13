// ============================================================
// Fantasy Tower Defense — Game Canvas Component
// Design: Painterly Storybook Fantasy
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import type { GameEngine } from '../game/engine';
import type { GameEngineState } from '../game/engine';
import { renderGame } from '../game/renderer';
import { CELL_SIZE, GRID_COLS, GRID_ROWS, TOWER_DEFINITIONS, ENEMY_DEFINITIONS } from '../game/constants';
import { SFX } from '../game/audio';
import type { Enemy } from '../game/types';

interface GameCanvasProps {
  engine: GameEngine;
  state: GameEngineState;
}

export default function GameCanvas({ engine, state }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCellRef = useRef<{ col: number; row: number } | null>(null);
  const hoverPosRef = useRef<{ x: number; y: number } | null>(null);

  const canvasWidth = GRID_COLS * CELL_SIZE;
  const canvasHeight = GRID_ROWS * CELL_SIZE;

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.setRenderCallback((engineState, dt) => {
      if (!canvas || !ctx) return;
      if (engineState.gameState === 'menu') return;

      // Clear canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Render game world
      renderGame(ctx, engineState, dt);

      // Draw placement preview on top
      if (engineState.selectedTowerType && hoverCellRef.current) {
        const { col, row } = hoverCellRef.current;
        const canPlace = engineState.gameState === 'playing' && engine.canPlaceTower(col, row);
        const def = TOWER_DEFINITIONS[engineState.selectedTowerType];
        drawPlacementPreview(ctx, col, row, canPlace, def?.range ?? 0);
      }

      // Draw enemy hover tooltip
      if (hoverPosRef.current && !engineState.selectedTowerType) {
        const hovered = findHoveredEnemy(engineState.enemies, hoverPosRef.current.x, hoverPosRef.current.y);
        if (hovered) {
          drawEnemyTooltip(ctx, hovered, canvasWidth, canvasHeight);
        }
      }
    });
  }, [engine, canvasWidth, canvasHeight]);

  const getCellFromEvent = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
    return { col, row, x, y };
  }, [canvasWidth, canvasHeight]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.gameState !== 'playing') return;
    const cell = getCellFromEvent(e);
    if (!cell) return;

    if (state.selectedTowerType) {
      const placed = engine.placeTower(cell.col, cell.row, state.selectedTowerType);
      if (placed) SFX.towerPlace();
    } else {
      const tower = state.towers.find(t => t.col === cell.col && t.row === cell.row);
      if (tower) {
        engine.selectTower(tower.id === state.selectedTowerId ? null : tower.id);
      } else {
        engine.selectTower(null);
      }
    }
  }, [engine, state.gameState, state.selectedTowerType, state.selectedTowerId, state.towers, getCellFromEvent]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(e);
    hoverCellRef.current = cell ? { col: cell.col, row: cell.row } : null;
    hoverPosRef.current = cell ? { x: cell.x, y: cell.y } : null;
  }, [getCellFromEvent]);

  const handleMouseLeave = useCallback(() => {
    hoverCellRef.current = null;
    hoverPosRef.current = null;
  }, []);

  const cursor = state.selectedTowerType ? 'crosshair' : 'pointer';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor,
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
        }}
      />
    </div>
  );
}

// ── Enemy hover tooltip ──────────────────────────────

function findHoveredEnemy(enemies: Enemy[], mx: number, my: number): Enemy | null {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e.alive || e.dying) continue;
    const dx = e.x - mx;
    const dy = e.y - my;
    if (Math.sqrt(dx * dx + dy * dy) < e.size + 8) {
      return e;
    }
  }
  return null;
}

function drawEnemyTooltip(ctx: CanvasRenderingContext2D, enemy: Enemy, canvasW: number, _canvasH: number) {
  const def = ENEMY_DEFINITIONS[enemy.type];
  if (!def) return;

  const tooltipW = 170;
  const tooltipH = 70;
  let tx = enemy.x + enemy.size + 12;
  let ty = enemy.y - tooltipH / 2;

  // Keep tooltip on screen
  if (tx + tooltipW > canvasW) tx = enemy.x - enemy.size - tooltipW - 12;
  if (ty < 4) ty = 4;

  ctx.save();

  // Background
  ctx.fillStyle = 'rgba(13,7,2,0.92)';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(tx, ty, tooltipW, tooltipH, 6);
  ctx.fill();
  ctx.stroke();

  // Name
  ctx.fillStyle = def.color;
  ctx.font = "bold 11px 'Philosopher', serif";
  ctx.textAlign = 'left';
  ctx.fillText(`${def.emoji} ${def.name}`, tx + 8, ty + 15);

  // HP bar
  const barX = tx + 8;
  const barY = ty + 22;
  const barW = tooltipW - 16;
  const barH = 6;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);
  const pct = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = pct > 0.5 ? '#4CAF50' : pct > 0.25 ? '#FF9800' : '#F44336';
  ctx.fillRect(barX, barY, barW * pct, barH);
  ctx.fillStyle = '#fde68a';
  ctx.font = '9px serif';
  ctx.fillText(`${Math.round(enemy.hp)} / ${enemy.maxHp} HP`, barX, barY + 14);

  // Type tags
  const tags: string[] = [];
  if (enemy.isFlying) tags.push('Flying');
  if (enemy.isArmored) tags.push('Armored');
  if (enemy.isHealer) tags.push('Healer');
  if (enemy.isBoss) tags.push('BOSS');
  if (enemy.frozen) tags.push('Frozen');
  if (enemy.poisonTimer > 0) tags.push('Poisoned');

  if (tags.length > 0) {
    ctx.fillStyle = '#a78bfa';
    ctx.font = '8px serif';
    ctx.fillText(tags.join(' · '), barX, barY + 26);
  }

  // Speed info
  ctx.fillStyle = '#92400e';
  ctx.font = '8px serif';
  ctx.fillText(`SPD: ${enemy.speed.toFixed(1)}  DMG: ${def.damage}`, barX, barY + 38);

  ctx.restore();
}

// ── Placement preview overlay ──────────────────────────────

function drawPlacementPreview(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  canPlace: boolean,
  range: number
) {
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;
  const cx = x + CELL_SIZE / 2;
  const cy = y + CELL_SIZE / 2;

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = canPlace ? 'rgba(76,175,80,0.4)' : 'rgba(244,67,54,0.4)';
  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
  ctx.strokeStyle = canPlace ? '#4CAF50' : '#F44336';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

  if (canPlace && range > 0) {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(cx, cy, range * CELL_SIZE, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, range * CELL_SIZE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}
