// ============================================================
// Fantasy Tower Defense — Game Canvas Component
// Design: Painterly Storybook Fantasy
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import type { GameEngine } from '../game/engine';
import type { GameEngineState } from '../game/engine';
import { renderGame } from '../game/renderer';
import { CELL_SIZE, GRID_COLS, GRID_ROWS, TOWER_DEFINITIONS } from '../game/constants';
import { SFX } from '../game/audio';

interface GameCanvasProps {
  engine: GameEngine;
  state: GameEngineState;
}

export default function GameCanvas({ engine, state }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCellRef = useRef<{ col: number; row: number } | null>(null);

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
  }, [getCellFromEvent]);

  const handleMouseLeave = useCallback(() => {
    hoverCellRef.current = null;
  }, []);

  const cursor = state.selectedTowerType ? 'crosshair' : 'pointer';

  return (
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
        width: '100%',
        height: 'auto',
      }}
    />
  );
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
