// ============================================================
// Fantasy Tower Defense — Menu Screen (Mega Expansion)
// Design: Painterly Storybook Fantasy
// Features: Map selection, difficulty, high score leaderboard
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { MapId, Difficulty } from '../game/types';
import { MAP_CONFIGS, CELL_SIZE, GRID_COLS, GRID_ROWS, getPathCells } from '../game/constants';

interface MenuScreenProps {
  onStart: (mapId: MapId, difficulty: Difficulty) => void;
}

interface HighScore {
  name: string;
  score: number;
  wave: number;
  map: string;
  difficulty: string;
  date: string;
}

function getHighScores(): HighScore[] {
  try {
    return JSON.parse(localStorage.getItem('ftd_highscores') || '[]');
  } catch {
    return [];
  }
}

// Background image
const BG_IMAGE = '/pixellab-a-homepage-image-for-a-tower-d-1773399701424.png';

function drawBgCanvas(canvas: HTMLCanvasElement, bgImage: HTMLImageElement | null) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;

  // Draw background image if loaded
  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    // Cover the canvas while maintaining aspect ratio
    const scale = Math.max(W / bgImage.naturalWidth, H / bgImage.naturalHeight);
    const imgW = bgImage.naturalWidth * scale;
    const imgH = bgImage.naturalHeight * scale;
    const imgX = (W - imgW) / 2;
    const imgY = (H - imgH) / 2;
    ctx.drawImage(bgImage, imgX, imgY, imgW, imgH);
    
    // Dark overlay for better text readability
    ctx.fillStyle = 'rgba(10,26,26,0.45)';
    ctx.fillRect(0, 0, W, H);
    return;
  }

  // Fallback: Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0d0520');
  sky.addColorStop(0.45, '#1a0a3d');
  sky.addColorStop(0.7, '#2d1a08');
  sky.addColorStop(1, '#1a0f04');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Stars
  const rng = (seed: number) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };
  for (let i = 0; i < 150; i++) {
    const sx = rng(i * 3.1) * W;
    const sy = rng(i * 5.7) * H * 0.55;
    const size = rng(i * 7.3) * 1.8 + 0.3;
    ctx.globalAlpha = rng(i * 11.1) * 0.7 + 0.3;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Moon glow
  const moonX = W * 0.82, moonY = H * 0.14;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 70);
  moonGlow.addColorStop(0, 'rgba(255,249,196,0.18)');
  moonGlow.addColorStop(1, 'rgba(255,249,196,0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath(); ctx.arc(moonX, moonY, 70, 0, Math.PI * 2); ctx.fill();
  const moonBody = ctx.createRadialGradient(moonX, moonY, 2, moonX, moonY, 28);
  moonBody.addColorStop(0, '#fffde7');
  moonBody.addColorStop(0.7, '#fff9c4');
  moonBody.addColorStop(1, '#f0e68c');
  ctx.fillStyle = moonBody;
  ctx.beginPath(); ctx.arc(moonX, moonY, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(13,5,32,0.65)';
  ctx.beginPath(); ctx.arc(moonX + 13, moonY - 4, 24, 0, Math.PI * 2); ctx.fill();

  // Far mountains
  ctx.fillStyle = '#160830';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.58);
  ctx.lineTo(W * 0.08, H * 0.38); ctx.lineTo(W * 0.16, H * 0.5);
  ctx.lineTo(W * 0.26, H * 0.3); ctx.lineTo(W * 0.36, H * 0.44);
  ctx.lineTo(W * 0.48, H * 0.24); ctx.lineTo(W * 0.58, H * 0.4);
  ctx.lineTo(W * 0.68, H * 0.28); ctx.lineTo(W * 0.78, H * 0.42);
  ctx.lineTo(W * 0.88, H * 0.32); ctx.lineTo(W, H * 0.46);
  ctx.lineTo(W, H * 0.58); ctx.closePath(); ctx.fill();

  // Mid mountains
  ctx.fillStyle = '#0d1520';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.7);
  ctx.lineTo(W * 0.05, H * 0.55); ctx.lineTo(W * 0.14, H * 0.65);
  ctx.lineTo(W * 0.22, H * 0.5); ctx.lineTo(W * 0.32, H * 0.62);
  ctx.lineTo(W * 0.42, H * 0.52); ctx.lineTo(W * 0.52, H * 0.64);
  ctx.lineTo(W * 0.62, H * 0.54); ctx.lineTo(W * 0.72, H * 0.66);
  ctx.lineTo(W * 0.82, H * 0.56); ctx.lineTo(W * 0.92, H * 0.68);
  ctx.lineTo(W, H * 0.6); ctx.lineTo(W, H * 0.7); ctx.closePath(); ctx.fill();

  // Foreground ground
  ctx.fillStyle = '#0d1a08';
  ctx.beginPath();
  ctx.moveTo(0, H); ctx.lineTo(0, H * 0.78);
  ctx.quadraticCurveTo(W * 0.12, H * 0.65, W * 0.25, H * 0.75);
  ctx.quadraticCurveTo(W * 0.38, H * 0.65, W * 0.5, H * 0.72);
  ctx.quadraticCurveTo(W * 0.65, H * 0.62, W * 0.78, H * 0.72);
  ctx.quadraticCurveTo(W * 0.9, H * 0.65, W, H * 0.75);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

  // Castle silhouettes
  const drawTower = (tx: number, ty: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(tx - w / 2, ty - h, w, h);
    const bw = w / 4;
    for (let i = 0; i < 4; i++) {
      if (i % 2 === 0) ctx.fillRect(tx - w / 2 + i * bw, ty - h - bw * 0.8, bw * 0.85, bw * 0.8);
    }
    ctx.fillStyle = 'rgba(255,200,50,0.25)';
    ctx.beginPath(); ctx.ellipse(tx, ty - h * 0.55, w * 0.2, w * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  };

  drawTower(W * 0.06, H * 0.68, 28, 60, '#0a0814');
  drawTower(W * 0.14, H * 0.65, 22, 48, '#0d0a1a');
  drawTower(W * 0.1, H * 0.65, 14, 36, '#0a0814');
  drawTower(W * 0.84, H * 0.66, 30, 64, '#0a0814');
  drawTower(W * 0.92, H * 0.64, 24, 52, '#0d0a1a');
  drawTower(W * 0.88, H * 0.64, 16, 38, '#0a0814');

  // Fog
  const fog = ctx.createLinearGradient(0, H * 0.65, 0, H * 0.82);
  fog.addColorStop(0, 'rgba(26,15,4,0)');
  fog.addColorStop(1, 'rgba(13,7,2,0.85)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, H * 0.65, W, H * 0.17);
}

// Mini map preview component
function MapPreview({ mapId, size = 80 }: { mapId: MapId; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mapConfig = MAP_CONFIGS[mapId];
    if (!mapConfig) return;

    const scaleX = size / (GRID_COLS * CELL_SIZE);
    const scaleY = size / (GRID_ROWS * CELL_SIZE);

    // Dark background
    ctx.fillStyle = '#0d1a08';
    ctx.fillRect(0, 0, size, size);

    // Draw grass grid
    const cellW = size / GRID_COLS;
    const cellH = size / GRID_ROWS;
    const pathCells = getPathCells(mapConfig.waypoints as Array<[number, number]>);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const key = `${col},${row}`;
        const x = col * cellW;
        const y = row * cellH;

        if (pathCells.has(key)) {
          ctx.fillStyle = '#8B7355';
          ctx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
        } else {
          const shade = (col + row) % 2 === 0 ? '#2A5A1A' : '#1A4A0A';
          ctx.fillStyle = shade;
          ctx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
        }
      }
    }

    // Draw power spots
    if (mapConfig.powerSpots) {
      ctx.fillStyle = 'rgba(255,215,0,0.6)';
      for (const [c, r] of mapConfig.powerSpots) {
        ctx.beginPath();
        ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw waypoint path as a line
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    const wp = mapConfig.waypoints as Array<[number, number]>;
    ctx.moveTo(wp[0][0] * cellW + cellW / 2, wp[0][1] * cellH + cellH / 2);
    for (let i = 1; i < wp.length; i++) {
      ctx.lineTo(wp[i][0] * cellW + cellW / 2, wp[i][1] * cellH + cellH / 2);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Entry/exit markers
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(wp[0][0] * cellW + cellW / 2, wp[0][1] * cellH + cellH / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#EF5350';
    const last = wp[wp.length - 1];
    ctx.beginPath();
    ctx.arc(last[0] * cellW + cellW / 2, last[1] * cellH + cellH / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [mapId, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        borderRadius: '6px',
        border: '1px solid rgba(139,105,20,0.4)',
        flexShrink: 0,
      }}
    />
  );
}

const MAP_LABELS: Record<MapId, { name: string; desc: string; color: string }> = {
  serpentine: { name: 'Serpentine Valley', desc: 'A winding path through ancient ruins', color: '#22c55e' },
  crossroads: { name: 'Crossroads', desc: 'Enemies split across two paths', color: '#f59e0b' },
  spiral: { name: 'Spiral Depths', desc: 'A tight spiral — no room for error', color: '#ef4444' },
  maze: { name: 'The Maze', desc: 'A complex maze with many turns', color: '#a78bfa' },
  gauntlet: { name: 'Gauntlet Run', desc: 'A long straight gauntlet', color: '#f87171' },
};

const DIFFICULTY_LABELS: Record<Difficulty, { name: string; desc: string; color: string }> = {
  easy: { name: 'Apprentice', desc: 'More gold, fewer enemies', color: '#22c55e' },
  normal: { name: 'Knight', desc: 'Balanced challenge', color: '#f59e0b' },
  hard: { name: 'Warlord', desc: 'Brutal — for veterans only', color: '#ef4444' },
  nightmare: { name: 'Nightmare', desc: 'Impossible — you will lose', color: '#dc2626' },
};

export default function MenuScreen({ onStart }: MenuScreenProps) {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [selectedMap, setSelectedMap] = useState<MapId>('serpentine');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const highScores = getHighScores();

  useEffect(() => {
    const canvas = bgRef.current;
    if (!canvas) return;
    
    // Load background image
    if (!bgImageRef.current) {
      const img = new Image();
      img.src = BG_IMAGE;
      img.onload = () => {
        bgImageRef.current = img;
        drawBgCanvas(canvas, img);
      };
      bgImageRef.current = img;
    }
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawBgCanvas(canvas, bgImageRef.current);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* Background canvas */}
      <canvas ref={bgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Overlay gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(10,26,26,0.3) 0%, rgba(5,15,15,0.7) 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '20px',
          gap: '16px',
        }}
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center' }}
        >
          <div
            style={{
              fontFamily: "'Uncial Antiqua', serif",
              fontSize: 'clamp(28px, 5vw, 52px)',
              color: '#4dd0e1',
              textShadow: '0 0 30px rgba(77,208,225,0.5), 0 2px 8px rgba(0,0,0,0.8)',
              letterSpacing: '3px',
              lineHeight: 1.1,
            }}
          >
            Fantasy Tower Defense
          </div>
          <div
            style={{
              fontFamily: "'Philosopher', serif",
              fontSize: 'clamp(11px, 1.5vw, 14px)',
              color: '#67e8f9',
              marginTop: '6px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
            }}
          >
            Defend the Realm · Summon Heroes · Crush the Horde
          </div>
        </motion.div>

        {/* Main panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: '900px',
            width: '100%',
          }}
        >
          {/* Map Selection */}
          <div
            style={{
              background: 'rgba(10,26,26,0.85)',
              border: '1px solid #2a6a6a',
              borderRadius: '12px',
              padding: '16px',
              minWidth: '240px',
              flex: '1 1 240px',
              maxWidth: '280px',
            }}
          >
            <div
              style={{
                fontFamily: "'Uncial Antiqua', serif",
                color: '#4dd0e1',
                fontSize: '13px',
                textAlign: 'center',
                marginBottom: '10px',
                letterSpacing: '1px',
              }}
            >
              Choose Your Battlefield
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(Object.keys(MAP_LABELS) as MapId[]).map(mapId => {
                const info = MAP_LABELS[mapId];
                const isSelected = selectedMap === mapId;
                return (
                  <button
                    key={mapId}
                    onClick={() => setSelectedMap(mapId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${info.color}` : '2px solid rgba(74,138,138,0.4)',
                      background: isSelected ? `${info.color}22` : 'rgba(10,40,40,0.6)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <MapPreview mapId={mapId} size={48} />
                    <div>
                      <div
                        style={{
                          fontFamily: "'Philosopher', serif",
                          fontWeight: 'bold',
                          fontSize: '12px',
                          color: isSelected ? info.color : '#a7f3d0',
                        }}
                      >
                        {info.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#4a8a8a', marginTop: '2px' }}>
                        {info.desc}
                      </div>
                      <div style={{ fontSize: '8px', color: '#2a8a8a', marginTop: '1px' }}>
                        {'* '.repeat(MAP_CONFIGS[mapId].difficulty).trim()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div
            style={{
              background: 'rgba(10,26,26,0.85)',
              border: '1px solid #2a6a6a',
              borderRadius: '12px',
              padding: '16px',
              minWidth: '200px',
              flex: '1 1 200px',
              maxWidth: '240px',
            }}
          >
            <div
              style={{
                fontFamily: "'Uncial Antiqua', serif",
                color: '#4dd0e1',
                fontSize: '13px',
                textAlign: 'center',
                marginBottom: '10px',
                letterSpacing: '1px',
              }}
            >
              Difficulty
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map(diff => {
                const info = DIFFICULTY_LABELS[diff];
                const isSelected = selectedDifficulty === diff;
                return (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${info.color}` : '2px solid rgba(74,138,138,0.4)',
                      background: isSelected ? `${info.color}22` : 'rgba(10,40,40,0.6)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Philosopher', serif",
                        fontWeight: 'bold',
                        fontSize: '12px',
                        color: isSelected ? info.color : '#a7f3d0',
                      }}
                    >
                      {info.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#4a8a8a', marginTop: '2px' }}>
                      {info.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* How to Play */}
          <div
            style={{
              background: 'rgba(10,26,26,0.85)',
              border: '1px solid #2a6a6a',
              borderRadius: '12px',
              padding: '16px',
              minWidth: '200px',
              flex: '1 1 200px',
              maxWidth: '260px',
            }}
          >
            <div
              style={{
                fontFamily: "'Uncial Antiqua', serif",
                color: '#4dd0e1',
                fontSize: '13px',
                textAlign: 'center',
                marginBottom: '10px',
                letterSpacing: '1px',
              }}
            >
              How to Play
            </div>
            <div style={{ fontSize: '10px', color: '#67e8f9', lineHeight: 1.8 }}>
              <div>Select a tower from the right panel</div>
              <div>Click grass tiles to place towers</div>
              <div>Earn gold by defeating enemies</div>
              <div>Upgrade towers for more power</div>
              <div>Use active abilities in battle</div>
              <div>Infantry/Hero towers spawn allies</div>
              <div>Toggle Endless Mode for infinite waves</div>
              <div>1x 2x 4x Speed control in the HUD</div>
            </div>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onStart(selectedMap, selectedDifficulty)}
          style={{
            padding: '14px 48px',
            background: 'linear-gradient(135deg, #0d5c5c, #0e7490, #0d5c5c)',
            border: '2px solid #4dd0e1',
            borderRadius: '10px',
            color: '#a7f3d0',
            fontFamily: "'Uncial Antiqua', serif",
            fontSize: '18px',
            letterSpacing: '2px',
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(77,208,225,0.3), 0 4px 16px rgba(0,0,0,0.5)',
            transition: 'all 0.2s',
          }}
        >
          Begin the Battle
        </motion.button>

        {/* Leaderboard toggle */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          style={{
            background: 'none',
            border: 'none',
            color: '#4a8a8a',
            fontFamily: "'Philosopher', serif",
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {showLeaderboard ? 'Hide' : 'View'} Hall of Fame
        </motion.button>

        {/* Leaderboard */}
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              background: 'rgba(10,26,26,0.9)',
              border: '1px solid #2a6a6a',
              borderRadius: '10px',
              padding: '14px',
              minWidth: '320px',
              maxWidth: '500px',
              width: '100%',
            }}
          >
            <div
              style={{
                fontFamily: "'Uncial Antiqua', serif",
                color: '#4dd0e1',
                fontSize: '14px',
                textAlign: 'center',
                marginBottom: '10px',
              }}
            >
              Hall of Fame
            </div>
            {highScores.length === 0 ? (
              <div style={{ color: '#2a6a6a', fontSize: '11px', textAlign: 'center' }}>
                No scores yet — be the first champion!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {highScores.slice(0, 10).map((score, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: i === 0 ? 'rgba(77,208,225,0.2)' : 'rgba(42,138,138,0.15)',
                      fontSize: '10px',
                    }}
                  >
                    <span style={{ color: i === 0 ? '#4dd0e1' : '#67e8f9', fontWeight: 'bold', width: '20px' }}>
                      #{i + 1}
                    </span>
                    <span style={{ color: '#a7f3d0', flex: 1, marginLeft: '6px' }}>{score.name}</span>
                    <span style={{ color: '#4dd0e1', fontWeight: 'bold' }}>{score.score.toLocaleString()}</span>
                    <span style={{ color: '#2a8a8a', marginLeft: '8px' }}>Wave {score.wave}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
