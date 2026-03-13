// ============================================================
// Fantasy Tower Defense — Menu Screen (Full Overhaul)
// Design: Painterly Storybook Fantasy
// Features: Tabbed layout, particles, shimmer title, settings,
//           improved map cards, leaderboard, how-to-play
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MapId, Difficulty } from "../game/types";
import {
  MAP_CONFIGS,
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  getPathCells,
} from "../game/constants";
import { SFX, Music } from "../game/audio";

// ── Types ──────────────────────────────────────────────────

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

type MenuTab = "play" | "leaderboard" | "settings" | "howtoplay";

// ── Helpers ────────────────────────────────────────────────

function getHighScores(): HighScore[] {
  try {
    return JSON.parse(localStorage.getItem("ftd_highscores") || "[]");
  } catch {
    return [];
  }
}

// ── Particle system for background ────────────────────────

interface MenuParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
  type: "ember" | "sparkle" | "dust";
}

function createParticle(W: number, H: number): MenuParticle {
  const type = Math.random() < 0.3 ? "sparkle" : Math.random() < 0.6 ? "ember" : "dust";
  const colors =
    type === "ember"
      ? ["#ff6b35", "#ff8c42", "#ffa755", "#e85d26"]
      : type === "sparkle"
        ? ["#4dd0e1", "#67e8f9", "#a7f3d0", "#86efac"]
        : ["#2a6a6a55", "#4a8a8a44", "#1a5a5a33"];
  return {
    x: Math.random() * W,
    y: H + Math.random() * 40,
    vx: (Math.random() - 0.5) * 0.6,
    vy: -(0.3 + Math.random() * 1.2),
    size: type === "sparkle" ? 1 + Math.random() * 2 : 1.5 + Math.random() * 3,
    opacity: 0.3 + Math.random() * 0.7,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 0,
    maxLife: 120 + Math.random() * 200,
    type,
  };
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: MenuParticle[],
  W: number,
  H: number
) {
  for (const p of particles) {
    const progress = p.life / p.maxLife;
    const fadeIn = Math.min(progress * 5, 1);
    const fadeOut = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
    const alpha = p.opacity * fadeIn * fadeOut;
    if (alpha <= 0) continue;

    ctx.globalAlpha = alpha;

    if (p.type === "sparkle") {
      // Diamond-shaped sparkle
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      const flicker = 0.7 + 0.3 * Math.sin(p.life * 0.15);
      ctx.scale(flicker, flicker);
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 1.5);
      ctx.lineTo(p.size * 0.6, 0);
      ctx.lineTo(0, p.size * 1.5);
      ctx.lineTo(-p.size * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (p.type === "ember") {
      // Glowing circle
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      glow.addColorStop(0, p.color);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Soft dust
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// ── Background canvas drawing ─────────────────────────────

const BG_IMAGE = "/pixellab-a-homepage-image-for-a-tower-d-1773399701424.png";

function drawBgCanvas(
  canvas: HTMLCanvasElement,
  bgImage: HTMLImageElement | null
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width,
    H = canvas.height;

  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    const scale = Math.max(W / bgImage.naturalWidth, H / bgImage.naturalHeight);
    const imgW = bgImage.naturalWidth * scale;
    const imgH = bgImage.naturalHeight * scale;
    const imgX = (W - imgW) / 2;
    const imgY = (H - imgH) / 2;
    ctx.drawImage(bgImage, imgX, imgY, imgW, imgH);
    ctx.fillStyle = "rgba(10,26,26,0.5)";
    ctx.fillRect(0, 0, W, H);
    return;
  }

  // Fallback sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#0d0520");
  sky.addColorStop(0.45, "#1a0a3d");
  sky.addColorStop(0.7, "#2d1a08");
  sky.addColorStop(1, "#1a0f04");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Stars
  const rng = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  for (let i = 0; i < 150; i++) {
    const sx = rng(i * 3.1) * W;
    const sy = rng(i * 5.7) * H * 0.55;
    const size = rng(i * 7.3) * 1.8 + 0.3;
    ctx.globalAlpha = rng(i * 11.1) * 0.7 + 0.3;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Moon
  const moonX = W * 0.82,
    moonY = H * 0.14;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 70);
  moonGlow.addColorStop(0, "rgba(255,249,196,0.18)");
  moonGlow.addColorStop(1, "rgba(255,249,196,0)");
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 70, 0, Math.PI * 2);
  ctx.fill();
  const moonBody = ctx.createRadialGradient(moonX, moonY, 2, moonX, moonY, 28);
  moonBody.addColorStop(0, "#fffde7");
  moonBody.addColorStop(0.7, "#fff9c4");
  moonBody.addColorStop(1, "#f0e68c");
  ctx.fillStyle = moonBody;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(13,5,32,0.65)";
  ctx.beginPath();
  ctx.arc(moonX + 13, moonY - 4, 24, 0, Math.PI * 2);
  ctx.fill();

  // Mountains
  ctx.fillStyle = "#160830";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.58);
  ctx.lineTo(W * 0.08, H * 0.38);
  ctx.lineTo(W * 0.16, H * 0.5);
  ctx.lineTo(W * 0.26, H * 0.3);
  ctx.lineTo(W * 0.36, H * 0.44);
  ctx.lineTo(W * 0.48, H * 0.24);
  ctx.lineTo(W * 0.58, H * 0.4);
  ctx.lineTo(W * 0.68, H * 0.28);
  ctx.lineTo(W * 0.78, H * 0.42);
  ctx.lineTo(W * 0.88, H * 0.32);
  ctx.lineTo(W, H * 0.46);
  ctx.lineTo(W, H * 0.58);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#0d1520";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.7);
  ctx.lineTo(W * 0.05, H * 0.55);
  ctx.lineTo(W * 0.14, H * 0.65);
  ctx.lineTo(W * 0.22, H * 0.5);
  ctx.lineTo(W * 0.32, H * 0.62);
  ctx.lineTo(W * 0.42, H * 0.52);
  ctx.lineTo(W * 0.52, H * 0.64);
  ctx.lineTo(W * 0.62, H * 0.54);
  ctx.lineTo(W * 0.72, H * 0.66);
  ctx.lineTo(W * 0.82, H * 0.56);
  ctx.lineTo(W * 0.92, H * 0.68);
  ctx.lineTo(W, H * 0.6);
  ctx.lineTo(W, H * 0.7);
  ctx.closePath();
  ctx.fill();

  // Foreground
  ctx.fillStyle = "#0d1a08";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H * 0.78);
  ctx.quadraticCurveTo(W * 0.12, H * 0.65, W * 0.25, H * 0.75);
  ctx.quadraticCurveTo(W * 0.38, H * 0.65, W * 0.5, H * 0.72);
  ctx.quadraticCurveTo(W * 0.65, H * 0.62, W * 0.78, H * 0.72);
  ctx.quadraticCurveTo(W * 0.9, H * 0.65, W, H * 0.75);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // Castle silhouettes
  const drawTower = (tx: number, ty: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(tx - w / 2, ty - h, w, h);
    const bw = w / 4;
    for (let i = 0; i < 4; i++) {
      if (i % 2 === 0)
        ctx.fillRect(tx - w / 2 + i * bw, ty - h - bw * 0.8, bw * 0.85, bw * 0.8);
    }
    ctx.fillStyle = "rgba(255,200,50,0.25)";
    ctx.beginPath();
    ctx.ellipse(tx, ty - h * 0.55, w * 0.2, w * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  drawTower(W * 0.06, H * 0.68, 28, 60, "#0a0814");
  drawTower(W * 0.14, H * 0.65, 22, 48, "#0d0a1a");
  drawTower(W * 0.1, H * 0.65, 14, 36, "#0a0814");
  drawTower(W * 0.84, H * 0.66, 30, 64, "#0a0814");
  drawTower(W * 0.92, H * 0.64, 24, 52, "#0d0a1a");
  drawTower(W * 0.88, H * 0.64, 16, 38, "#0a0814");

  // Fog
  const fog = ctx.createLinearGradient(0, H * 0.65, 0, H * 0.82);
  fog.addColorStop(0, "rgba(26,15,4,0)");
  fog.addColorStop(1, "rgba(13,7,2,0.85)");
  ctx.fillStyle = fog;
  ctx.fillRect(0, H * 0.65, W, H * 0.17);
}

// ── Mini Map Preview ──────────────────────────────────────

function MapPreview({ mapId, size = 96 }: { mapId: MapId; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mapConfig = MAP_CONFIGS[mapId];
    if (!mapConfig) return;

    ctx.fillStyle = "#0d1a08";
    ctx.fillRect(0, 0, size, size);

    const cellW = size / GRID_COLS;
    const cellH = size / GRID_ROWS;
    const pathCells = getPathCells(
      mapConfig.waypoints as Array<[number, number]>
    );

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const key = `${col},${row}`;
        const x = col * cellW;
        const y = row * cellH;
        if (pathCells.has(key)) {
          ctx.fillStyle = "#8B7355";
        } else {
          ctx.fillStyle = (col + row) % 2 === 0 ? "#2A5A1A" : "#1A4A0A";
        }
        ctx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
      }
    }

    // Power spots
    if (mapConfig.powerSpots) {
      ctx.fillStyle = "rgba(255,215,0,0.6)";
      for (const [c, r] of mapConfig.powerSpots) {
        ctx.beginPath();
        ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Waypoint line
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    const wp = mapConfig.waypoints as Array<[number, number]>;
    ctx.moveTo(wp[0][0] * cellW + cellW / 2, wp[0][1] * cellH + cellH / 2);
    for (let i = 1; i < wp.length; i++) {
      ctx.lineTo(wp[i][0] * cellW + cellW / 2, wp[i][1] * cellH + cellH / 2);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Entry / Exit
    ctx.fillStyle = "#4CAF50";
    ctx.beginPath();
    ctx.arc(wp[0][0] * cellW + cellW / 2, wp[0][1] * cellH + cellH / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#EF5350";
    const last = wp[wp.length - 1];
    ctx.beginPath();
    ctx.arc(last[0] * cellW + cellW / 2, last[1] * cellH + cellH / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }, [mapId, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        borderRadius: "8px",
        border: "1px solid rgba(139,105,20,0.4)",
        flexShrink: 0,
      }}
    />
  );
}

// ── Data ───────────────────────────────────────────────────

const MAP_LABELS: Record<MapId, { name: string; desc: string; color: string }> = {
  serpentine: { name: "Serpentine Valley", desc: "A winding path through ancient ruins", color: "#22c55e" },
  crossroads: { name: "Crossroads", desc: "Enemies split across two paths", color: "#f59e0b" },
  spiral: { name: "Spiral Depths", desc: "A tight spiral — no room for error", color: "#ef4444" },
  maze: { name: "The Maze", desc: "A complex maze with many turns", color: "#a78bfa" },
  gauntlet: { name: "Gauntlet Run", desc: "A long straight gauntlet", color: "#f87171" },
};

const DIFFICULTY_LABELS: Record<Difficulty, { name: string; desc: string; color: string; icon: string }> = {
  easy: { name: "Apprentice", desc: "More gold, fewer enemies", color: "#22c55e", icon: "I" },
  normal: { name: "Knight", desc: "Balanced challenge", color: "#f59e0b", icon: "II" },
  hard: { name: "Warlord", desc: "Brutal — for veterans only", color: "#ef4444", icon: "III" },
  nightmare: { name: "Nightmare", desc: "Impossible — you will lose", color: "#dc2626", icon: "IV" },
};

const TAB_CONFIG: { id: MenuTab; label: string; icon: string }[] = [
  { id: "play", label: "Play", icon: ">" },
  { id: "leaderboard", label: "Hall of Fame", icon: "#" },
  { id: "settings", label: "Settings", icon: "*" },
  { id: "howtoplay", label: "How to Play", icon: "?" },
];

// ── Main Component ────────────────────────────────────────

export default function MenuScreen({ onStart }: MenuScreenProps) {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const particleRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const particlesRef = useRef<MenuParticle[]>([]);
  const animFrameRef = useRef<number>(0);

  const [selectedMap, setSelectedMap] = useState<MapId>("serpentine");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("normal");
  const [activeTab, setActiveTab] = useState<MenuTab>("play");
  const [hoveredMap, setHoveredMap] = useState<MapId | null>(null);

  // Settings state
  const [sfxMuted, setSfxMuted] = useState(SFX.muted);
  const [musicVolume, setMusicVolume] = useState(Music.volume);

  const highScores = getHighScores();

  // ── Background + particle loop ──────────────────────────

  useEffect(() => {
    const bgCanvas = bgRef.current;
    const pCanvas = particleRef.current;
    if (!bgCanvas || !pCanvas) return;

    // Load background
    if (!bgImageRef.current) {
      const img = new Image();
      img.src = BG_IMAGE;
      img.onload = () => {
        bgImageRef.current = img;
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
        drawBgCanvas(bgCanvas, img);
      };
      bgImageRef.current = img;
    }

    const resize = () => {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
      pCanvas.width = window.innerWidth;
      pCanvas.height = window.innerHeight;
      drawBgCanvas(bgCanvas, bgImageRef.current);
    };
    resize();
    window.addEventListener("resize", resize);

    // Seed initial particles
    const W = window.innerWidth;
    const H = window.innerHeight;
    for (let i = 0; i < 30; i++) {
      const p = createParticle(W, H);
      p.y = Math.random() * H;
      p.life = Math.random() * p.maxLife;
      particlesRef.current.push(p);
    }

    // Animation loop
    let running = true;
    const loop = () => {
      if (!running) return;
      const ctx = pCanvas.getContext("2d");
      if (!ctx) return;
      const cW = pCanvas.width;
      const cH = pCanvas.height;

      ctx.clearRect(0, 0, cW, cH);

      // Update particles
      const parts = particlesRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        // Slight drift
        p.vx += (Math.random() - 0.5) * 0.02;
        if (p.life >= p.maxLife || p.y < -20 || p.x < -20 || p.x > cW + 20) {
          parts.splice(i, 1);
        }
      }

      // Spawn new
      if (parts.length < 50 && Math.random() < 0.15) {
        parts.push(createParticle(cW, cH));
      }

      drawParticles(ctx, parts, cW, cH);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── Settings handlers ───────────────────────────────────

  const handleToggleSfx = useCallback(() => {
    SFX.toggle();
    setSfxMuted(SFX.muted);
    if (SFX.muted) {
      Music.stop();
    } else {
      Music.start();
    }
  }, []);

  const handleMusicVolume = useCallback((value: number) => {
    Music.volume = value;
    setMusicVolume(value);
  }, []);

  // ── Render ──────────────────────────────────────────────

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      {/* Background canvas */}
      <canvas
        ref={bgRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />

      {/* Particle canvas */}
      <canvas
        ref={particleRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(10,26,26,0.15) 0%, rgba(5,15,15,0.65) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "100%",
          padding: "20px 20px 0",
          overflow: "hidden",
        }}
      >
        {/* ── Title ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ textAlign: "center", marginBottom: "8px", flexShrink: 0 }}
        >
          <motion.div
            animate={{
              textShadow: [
                "0 0 30px rgba(77,208,225,0.4), 0 2px 8px rgba(0,0,0,0.8)",
                "0 0 50px rgba(77,208,225,0.7), 0 0 80px rgba(77,208,225,0.3), 0 2px 8px rgba(0,0,0,0.8)",
                "0 0 30px rgba(77,208,225,0.4), 0 2px 8px rgba(0,0,0,0.8)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              fontFamily: "'Uncial Antiqua', serif",
              fontSize: "clamp(32px, 5vw, 56px)",
              color: "#4dd0e1",
              letterSpacing: "3px",
              lineHeight: 1.1,
              position: "relative",
            }}
          >
            {/* Shimmer overlay via CSS */}
            <span
              style={{
                position: "relative",
                display: "inline-block",
                background:
                  "linear-gradient(90deg, #4dd0e1 0%, #a7f3d0 25%, #67e8f9 50%, #a7f3d0 75%, #4dd0e1 100%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 4s linear infinite",
              }}
            >
              Fantasy Tower Defense
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            style={{
              fontFamily: "'Philosopher', serif",
              fontSize: "clamp(10px, 1.4vw, 14px)",
              color: "#67e8f9",
              marginTop: "4px",
              letterSpacing: "4px",
              textTransform: "uppercase",
              opacity: 0.8,
            }}
          >
            Defend the Realm · Summon Heroes · Crush the Horde
          </motion.div>
        </motion.div>

        {/* ── Tab Bar ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "12px",
            background: "rgba(10,26,26,0.6)",
            borderRadius: "10px",
            padding: "4px",
            border: "1px solid rgba(42,106,106,0.3)",
            flexShrink: 0,
          }}
        >
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(77,208,225,0.25), rgba(77,208,225,0.1))"
                    : "transparent",
                  color: isActive ? "#4dd0e1" : "#4a8a8a",
                  fontFamily: "'Philosopher', serif",
                  fontSize: "13px",
                  fontWeight: isActive ? "bold" : "normal",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  letterSpacing: "0.5px",
                  boxShadow: isActive
                    ? "0 0 12px rgba(77,208,225,0.15), inset 0 1px 0 rgba(77,208,225,0.2)"
                    : "none",
                  position: "relative",
                }}
              >
                <span style={{ marginRight: "6px", opacity: 0.7 }}>
                  {tab.icon}
                </span>
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: "20%",
                      right: "20%",
                      height: "2px",
                      background: "#4dd0e1",
                      borderRadius: "1px",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Tab Content ───────────────────────────── */}
        <div
          style={{
            flex: 1,
            width: "100%",
            maxWidth: "960px",
            minHeight: 0,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <AnimatePresence mode="wait">
            {activeTab === "play" && (
              <PlayTab
                key="play"
                selectedMap={selectedMap}
                setSelectedMap={setSelectedMap}
                selectedDifficulty={selectedDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
                hoveredMap={hoveredMap}
                setHoveredMap={setHoveredMap}
                onStart={() => onStart(selectedMap, selectedDifficulty)}
              />
            )}
            {activeTab === "leaderboard" && (
              <LeaderboardTab key="leaderboard" highScores={highScores} />
            )}
            {activeTab === "settings" && (
              <SettingsTab
                key="settings"
                sfxMuted={sfxMuted}
                musicVolume={musicVolume}
                onToggleSfx={handleToggleSfx}
                onMusicVolume={handleMusicVolume}
              />
            )}
            {activeTab === "howtoplay" && <HowToPlayTab key="howtoplay" />}
          </AnimatePresence>
        </div>

        {/* ── Footer ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            maxWidth: "960px",
            padding: "8px 4px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: "#2a5a5a",
              fontSize: "10px",
              fontFamily: "'Philosopher', serif",
            }}
          >
            v1.0.0 · Built with Canvas & React
          </span>
          <span
            style={{
              color: "#2a5a5a",
              fontSize: "10px",
              fontFamily: "'Philosopher', serif",
            }}
          >
            Fantasy Tower Defense
          </span>
        </motion.div>
      </div>

      {/* Global shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(77,208,225,0.2), 0 4px 16px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 40px rgba(77,208,225,0.4), 0 0 60px rgba(77,208,225,0.15), 0 4px 16px rgba(0,0,0,0.5); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

// ── Play Tab ──────────────────────────────────────────────

function PlayTab({
  selectedMap,
  setSelectedMap,
  selectedDifficulty,
  setSelectedDifficulty,
  hoveredMap,
  setHoveredMap,
  onStart,
}: {
  selectedMap: MapId;
  setSelectedMap: (m: MapId) => void;
  selectedDifficulty: Difficulty;
  setSelectedDifficulty: (d: Difficulty) => void;
  hoveredMap: MapId | null;
  setHoveredMap: (m: MapId | null) => void;
  onStart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        alignItems: "center",
      }}
    >
      {/* Map & Difficulty row */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          width: "100%",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {/* ── Map Selection ─────────────────────────── */}
        <div
          style={{
            background: "rgba(10,26,26,0.85)",
            border: "1px solid rgba(42,106,106,0.5)",
            borderRadius: "14px",
            padding: "18px",
            flex: "1 1 420px",
            maxWidth: "560px",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              fontFamily: "'Uncial Antiqua', serif",
              color: "#4dd0e1",
              fontSize: "15px",
              textAlign: "center",
              marginBottom: "14px",
              letterSpacing: "1.5px",
              textShadow: "0 0 10px rgba(77,208,225,0.3)",
            }}
          >
            Choose Your Battlefield
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(Object.keys(MAP_LABELS) as MapId[]).map((mapId) => {
              const info = MAP_LABELS[mapId];
              const isSelected = selectedMap === mapId;
              const isHovered = hoveredMap === mapId;
              const difficulty = MAP_CONFIGS[mapId].difficulty;

              return (
                <motion.button
                  key={mapId}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedMap(mapId)}
                  onMouseEnter={() => setHoveredMap(mapId)}
                  onMouseLeave={() => setHoveredMap(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: isSelected
                      ? `2px solid ${info.color}`
                      : "2px solid rgba(74,138,138,0.3)",
                    background: isSelected
                      ? `linear-gradient(135deg, ${info.color}18, ${info.color}08)`
                      : isHovered
                        ? "rgba(42,106,106,0.2)"
                        : "rgba(10,40,40,0.5)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected
                      ? `0 0 16px ${info.color}22, inset 0 1px 0 ${info.color}15`
                      : "none",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Selection glow */}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "3px",
                        background: info.color,
                        borderRadius: "0 2px 2px 0",
                        boxShadow: `0 0 8px ${info.color}`,
                      }}
                    />
                  )}

                  <MapPreview mapId={mapId} size={64} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Philosopher', serif",
                        fontWeight: "bold",
                        fontSize: "13px",
                        color: isSelected ? info.color : "#a7f3d0",
                        transition: "color 0.2s",
                      }}
                    >
                      {info.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#4a8a8a",
                        marginTop: "2px",
                      }}
                    >
                      {info.desc}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "3px",
                        marginTop: "4px",
                      }}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background:
                              i < difficulty
                                ? info.color
                                : "rgba(42,106,106,0.3)",
                            transition: "background 0.2s",
                            boxShadow:
                              i < difficulty
                                ? `0 0 4px ${info.color}60`
                                : "none",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Difficulty Selection ──────────────────── */}
        <div
          style={{
            background: "rgba(10,26,26,0.85)",
            border: "1px solid rgba(42,106,106,0.5)",
            borderRadius: "14px",
            padding: "18px",
            flex: "1 1 220px",
            maxWidth: "280px",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              fontFamily: "'Uncial Antiqua', serif",
              color: "#4dd0e1",
              fontSize: "15px",
              textAlign: "center",
              marginBottom: "14px",
              letterSpacing: "1.5px",
              textShadow: "0 0 10px rgba(77,208,225,0.3)",
            }}
          >
            Difficulty
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((diff) => {
              const info = DIFFICULTY_LABELS[diff];
              const isSelected = selectedDifficulty === diff;

              return (
                <motion.button
                  key={diff}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDifficulty(diff)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: isSelected
                      ? `2px solid ${info.color}`
                      : "2px solid rgba(74,138,138,0.3)",
                    background: isSelected
                      ? `linear-gradient(135deg, ${info.color}18, ${info.color}08)`
                      : "rgba(10,40,40,0.5)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected
                      ? `0 0 16px ${info.color}22`
                      : "none",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "3px",
                        background: info.color,
                        borderRadius: "0 2px 2px 0",
                        boxShadow: `0 0 8px ${info.color}`,
                      }}
                    />
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "11px",
                        color: isSelected ? info.color : "#4a8a8a",
                        fontWeight: "bold",
                        minWidth: "22px",
                      }}
                    >
                      {info.icon}
                    </span>
                    <div>
                      <div
                        style={{
                          fontFamily: "'Philosopher', serif",
                          fontWeight: "bold",
                          fontSize: "13px",
                          color: isSelected ? info.color : "#a7f3d0",
                          transition: "color 0.2s",
                        }}
                      >
                        {info.name}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#4a8a8a",
                          marginTop: "2px",
                        }}
                      >
                        {info.desc}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Start Button ────────────────────────────── */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        whileHover={{
          scale: 1.05,
          boxShadow:
            "0 0 40px rgba(77,208,225,0.5), 0 0 80px rgba(77,208,225,0.2), 0 4px 20px rgba(0,0,0,0.6)",
        }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        style={{
          padding: "16px 56px",
          background: "linear-gradient(135deg, #0d5c5c, #0e7490, #0d5c5c)",
          border: "2px solid #4dd0e1",
          borderRadius: "12px",
          color: "#a7f3d0",
          fontFamily: "'Uncial Antiqua', serif",
          fontSize: "20px",
          letterSpacing: "2px",
          cursor: "pointer",
          animation: "pulse-glow 2.5s ease-in-out infinite",
          transition: "all 0.2s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Shine sweep */}
        <span
          style={{
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "60%",
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            animation: "shimmer 3s linear infinite",
          }}
        />
        Begin the Battle
      </motion.button>

      {/* Selection summary */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          fontSize: "11px",
          color: "#4a8a8a",
          fontFamily: "'Philosopher', serif",
        }}
      >
        <span>
          Map:{" "}
          <span style={{ color: MAP_LABELS[selectedMap].color }}>
            {MAP_LABELS[selectedMap].name}
          </span>
        </span>
        <span style={{ color: "#2a5a5a" }}>|</span>
        <span>
          Difficulty:{" "}
          <span style={{ color: DIFFICULTY_LABELS[selectedDifficulty].color }}>
            {DIFFICULTY_LABELS[selectedDifficulty].name}
          </span>
        </span>
      </div>
    </motion.div>
  );
}

// ── Leaderboard Tab ───────────────────────────────────────

function LeaderboardTab({ highScores }: { highScores: HighScore[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      style={{ width: "100%", maxWidth: "600px" }}
    >
      <div
        style={{
          background: "rgba(10,26,26,0.85)",
          border: "1px solid rgba(42,106,106,0.5)",
          borderRadius: "14px",
          padding: "24px",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            fontFamily: "'Uncial Antiqua', serif",
            color: "#4dd0e1",
            fontSize: "20px",
            textAlign: "center",
            marginBottom: "20px",
            textShadow: "0 0 15px rgba(77,208,225,0.3)",
          }}
        >
          Hall of Fame
        </div>

        {highScores.length === 0 ? (
          <div
            style={{
              color: "#4a8a8a",
              fontSize: "14px",
              textAlign: "center",
              padding: "40px 20px",
              fontFamily: "'Philosopher', serif",
            }}
          >
            No heroes have been recorded yet.
            <br />
            <span style={{ color: "#2a6a6a", fontSize: "12px" }}>
              Be the first to defend the realm!
            </span>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr 100px 70px 80px",
                gap: "8px",
                padding: "6px 12px",
                marginBottom: "4px",
                fontSize: "10px",
                color: "#2a6a6a",
                fontFamily: "'Philosopher', serif",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              <span>Rank</span>
              <span>Champion</span>
              <span style={{ textAlign: "right" }}>Score</span>
              <span style={{ textAlign: "right" }}>Wave</span>
              <span style={{ textAlign: "right" }}>Date</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {highScores.slice(0, 10).map((score, i) => {
                const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                const isTop3 = i < 3;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "36px 1fr 100px 70px 80px",
                      gap: "8px",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: isTop3
                        ? `linear-gradient(135deg, ${rankColors[i]}10, transparent)`
                        : "rgba(42,106,106,0.1)",
                      border: isTop3
                        ? `1px solid ${rankColors[i]}30`
                        : "1px solid transparent",
                      fontSize: "12px",
                    }}
                  >
                    <span
                      style={{
                        color: isTop3 ? rankColors[i] : "#4a8a8a",
                        fontWeight: "bold",
                        fontFamily: "'Cinzel', serif",
                        fontSize: isTop3 ? "14px" : "11px",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        color: "#a7f3d0",
                        fontFamily: "'Philosopher', serif",
                        fontWeight: isTop3 ? "bold" : "normal",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {score.name}
                    </span>
                    <span
                      style={{
                        color: "#4dd0e1",
                        fontWeight: "bold",
                        textAlign: "right",
                        fontFamily: "'Cinzel', serif",
                      }}
                    >
                      {score.score.toLocaleString()}
                    </span>
                    <span
                      style={{
                        color: "#67e8f9",
                        textAlign: "right",
                        fontFamily: "'Cinzel', serif",
                      }}
                    >
                      {score.wave}
                    </span>
                    <span
                      style={{
                        color: "#2a6a6a",
                        textAlign: "right",
                        fontSize: "10px",
                      }}
                    >
                      {score.date}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Settings Tab ──────────────────────────────────────────

function SettingsTab({
  sfxMuted,
  musicVolume,
  onToggleSfx,
  onMusicVolume,
}: {
  sfxMuted: boolean;
  musicVolume: number;
  onToggleSfx: () => void;
  onMusicVolume: (v: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      style={{ width: "100%", maxWidth: "420px" }}
    >
      <div
        style={{
          background: "rgba(10,26,26,0.85)",
          border: "1px solid rgba(42,106,106,0.5)",
          borderRadius: "14px",
          padding: "28px 32px",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            fontFamily: "'Uncial Antiqua', serif",
            color: "#4dd0e1",
            fontSize: "20px",
            textAlign: "center",
            marginBottom: "24px",
            textShadow: "0 0 15px rgba(77,208,225,0.3)",
          }}
        >
          Settings
        </div>

        {/* Audio Section */}
        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontFamily: "'Philosopher', serif",
              color: "#67e8f9",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "16px",
              paddingBottom: "6px",
              borderBottom: "1px solid rgba(42,106,106,0.3)",
            }}
          >
            Audio
          </div>

          {/* SFX Toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                color: "#a7f3d0",
                fontSize: "14px",
                fontFamily: "'Philosopher', serif",
              }}
            >
              Sound Effects
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleSfx}
              style={{
                padding: "6px 18px",
                borderRadius: "8px",
                border: sfxMuted
                  ? "1px solid #991b1b"
                  : "1px solid #22c55e",
                background: sfxMuted
                  ? "rgba(127,29,29,0.3)"
                  : "rgba(22,101,52,0.3)",
                color: sfxMuted ? "#fca5a5" : "#86efac",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer",
                fontFamily: "'Philosopher', serif",
                transition: "all 0.2s",
              }}
            >
              {sfxMuted ? "MUTED" : "ON"}
            </motion.button>
          </div>

          {/* Music Volume */}
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  color: "#a7f3d0",
                  fontSize: "14px",
                  fontFamily: "'Philosopher', serif",
                }}
              >
                Music Volume
              </span>
              <span
                style={{
                  color: "#4dd0e1",
                  fontSize: "13px",
                  fontFamily: "'Cinzel', serif",
                  fontWeight: "bold",
                  minWidth: "36px",
                  textAlign: "right",
                }}
              >
                {Math.round(musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(musicVolume * 100)}
              onChange={(e) =>
                onMusicVolume(Number(e.target.value) / 100)
              }
              style={{
                width: "100%",
                accentColor: "#4dd0e1",
                cursor: "pointer",
                height: "6px",
              }}
            />
          </div>
        </div>

        {/* Gameplay Section */}
        <div>
          <div
            style={{
              fontFamily: "'Philosopher', serif",
              color: "#67e8f9",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "16px",
              paddingBottom: "6px",
              borderBottom: "1px solid rgba(42,106,106,0.3)",
            }}
          >
            Controls
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "12px",
              fontFamily: "'Philosopher', serif",
            }}
          >
            {[
              ["ESC", "Deselect tower"],
              ["Space / P", "Pause / Resume"],
              ["1 - 0", "Select tower (row 1)"],
              ["Q - Y", "Select tower (row 2)"],
              ["Click", "Place / select tower"],
            ].map(([key, desc]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#4dd0e1",
                    background: "rgba(77,208,225,0.1)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "'Cinzel', serif",
                    border: "1px solid rgba(77,208,225,0.2)",
                  }}
                >
                  {key}
                </span>
                <span style={{ color: "#4a8a8a" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── How to Play Tab ───────────────────────────────────────

function HowToPlayTab() {
  const sections = [
    {
      title: "Getting Started",
      items: [
        "Select a tower from the right panel or use hotkeys (1-0, Q-Y)",
        "Click on grass tiles to place towers along the enemy path",
        "Press the Start Wave button or wait for auto-start",
      ],
    },
    {
      title: "Tower Strategy",
      items: [
        "Upgrade towers for increased damage and range",
        "Mix tower types for synergy bonuses (Frost + Ballista, etc.)",
        "Place towers on Power Spots for stat bonuses",
        "Infantry, Hero, and Beast towers spawn allies that block enemies",
      ],
    },
    {
      title: "Economy",
      items: [
        "Earn gold by defeating enemies each wave",
        "Unspent gold earns interest between waves",
        "Sell towers for partial refund when repositioning",
        "Use Gold Rush ability for an emergency gold boost",
      ],
    },
    {
      title: "Advanced Tips",
      items: [
        "Use active abilities: Lightning Storm, Freeze Wave, Gold Rush",
        "Toggle Endless Mode after wave 12 for infinite challenge",
        "Speed controls: 1x, 2x, 4x during waves",
        "Rush the next wave early for bonus gold",
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      style={{ width: "100%", maxWidth: "640px" }}
    >
      <div
        style={{
          background: "rgba(10,26,26,0.85)",
          border: "1px solid rgba(42,106,106,0.5)",
          borderRadius: "14px",
          padding: "24px",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            fontFamily: "'Uncial Antiqua', serif",
            color: "#4dd0e1",
            fontSize: "20px",
            textAlign: "center",
            marginBottom: "24px",
            textShadow: "0 0 15px rgba(77,208,225,0.3)",
          }}
        >
          How to Play
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
          }}
        >
          {sections.map((section, si) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.1 }}
              style={{
                background: "rgba(10,40,40,0.5)",
                border: "1px solid rgba(42,106,106,0.3)",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontFamily: "'Philosopher', serif",
                  fontWeight: "bold",
                  color: "#67e8f9",
                  fontSize: "13px",
                  marginBottom: "10px",
                  paddingBottom: "6px",
                  borderBottom: "1px solid rgba(42,106,106,0.25)",
                }}
              >
                {section.title}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "8px",
                      fontSize: "11px",
                      color: "#a7f3d0",
                      lineHeight: 1.5,
                      fontFamily: "'Philosopher', serif",
                    }}
                  >
                    <span
                      style={{
                        color: "#4dd0e1",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      -
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
