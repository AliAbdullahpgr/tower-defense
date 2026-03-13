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
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '12px',
        background: 'radial-gradient(circle at top, rgba(90,140,110,0.18), transparent 48%), linear-gradient(180deg, rgba(9,20,14,0.92), rgba(7,14,11,0.98))',
      }}
    >
      <div
        style={{
          position: 'relative',
          padding: '10px',
          borderRadius: '24px',
          background: 'linear-gradient(145deg, rgba(37,57,42,0.95), rgba(18,27,21,0.98))',
          border: '1px solid rgba(166, 218, 173, 0.22)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '6px',
            borderRadius: '18px',
            border: '1px solid rgba(244, 230, 184, 0.12)',
            pointerEvents: 'none',
          }}
        />
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
            borderRadius: '16px',
            background: '#182416',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 12px 24px rgba(255,255,255,0.04)',
          }}
        />
      </div>
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
  const pulse = 0.78 + Math.sin(Date.now() / 180) * 0.08;
  const accent = canPlace ? '#c4f08c' : '#ff8a80';
  const fill = canPlace ? 'rgba(135, 197, 94, 0.18)' : 'rgba(190, 60, 60, 0.18)';

  ctx.save();
  ctx.globalAlpha = 1;
  const cellGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL_SIZE * 0.75);
  cellGlow.addColorStop(0, fill);
  cellGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = cellGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, CELL_SIZE * 0.68, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10, 12);
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 6, y + 6, CELL_SIZE - 12, CELL_SIZE - 12);

  ctx.globalAlpha = pulse;
  ctx.beginPath();
  ctx.moveTo(cx, y + 11);
  ctx.lineTo(x + CELL_SIZE - 11, cy);
  ctx.lineTo(cx, y + CELL_SIZE - 11);
  ctx.lineTo(x + 11, cy);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 6);
  ctx.lineTo(cx + 6, cy);
  ctx.lineTo(cx, cy + 6);
  ctx.lineTo(cx - 6, cy);
  ctx.closePath();
  ctx.fill();

  if (canPlace && range > 0) {
    ctx.globalAlpha = 0.14;
    const rangeGlow = ctx.createRadialGradient(cx, cy, range * CELL_SIZE * 0.35, cx, cy, range * CELL_SIZE);
    rangeGlow.addColorStop(0, 'rgba(196, 240, 140, 0.2)');
    rangeGlow.addColorStop(1, 'rgba(196, 240, 140, 0.02)');
    ctx.fillStyle = rangeGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, range * CELL_SIZE, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, range * CELL_SIZE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}
