// ============================================================
// Fantasy Tower Defense — Game Overlay Screens
// Ultra clean, less boxy design
// ============================================================

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameEngineState } from "../game/engine";
import {
  buttonStyle,
  gameUiFonts,
  gameUiTheme,
  metricValueStyle,
  panelStyle,
  sectionTitleStyle,
} from "../lib/game-ui-theme";

interface GameOverlayProps {
  state: GameEngineState;
  onStart: () => void;
  onRestart: () => void;
  onReturnToMenu: () => void;
  onResume: () => void;
  onOpenSettings?: () => void;
}

interface HighScore {
  name: string;
  score: number;
  wave: number;
  map: string;
  difficulty: string;
  date: string;
}

function saveHighScore(score: HighScore) {
  try {
    const scores: HighScore[] = JSON.parse(localStorage.getItem("ftd_highscores") || "[]");
    scores.push(score);
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem("ftd_highscores", JSON.stringify(scores.slice(0, 20)));
  } catch {}
}

export default function GameOverlay({
  state,
  onRestart,
  onReturnToMenu,
  onResume,
  onOpenSettings,
}: GameOverlayProps) {
  return (
    <AnimatePresence>
      {state.gameState === "victory" ? (
        <ResultScreen key="victory" state={state} mode="victory" onRestart={onRestart} onReturnToMenu={onReturnToMenu} />
      ) : null}
      {state.gameState === "defeat" ? (
        <ResultScreen key="defeat" state={state} mode="defeat" onRestart={onRestart} onReturnToMenu={onReturnToMenu} />
      ) : null}
      {state.gameState === "paused" ? (
        <PauseScreen key="paused" onResume={onResume} onReturnToMenu={onReturnToMenu} onOpenSettings={onOpenSettings} />
      ) : null}
    </AnimatePresence>
  );
}

function OverlayShell({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(4, 12, 12, 0.8)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {children}
    </motion.div>
  );
}

function ResultScreen({
  state,
  mode,
  onRestart,
  onReturnToMenu,
}: {
  state: GameEngineState;
  mode: "victory" | "defeat";
  onRestart: () => void;
  onReturnToMenu: () => void;
}) {
  const { stats, mapId, difficulty } = state;
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const win = mode === "victory";

  const handleSave = () => {
    if (!name.trim()) return;
    saveHighScore({
      name: name.trim(),
      score: stats.score,
      wave: stats.wave,
      map: mapId,
      difficulty,
      date: new Date().toLocaleDateString(),
    });
    setSaved(true);
  };

  const statItems = win
    ? [
        ["Final Score", stats.score.toLocaleString(), gameUiTheme.accent],
        ["Gold Left", `${stats.gold}`, gameUiTheme.gold],
        ["Enemies Slain", stats.enemiesKilled.toString(), gameUiTheme.success],
        ["Towers Built", stats.towersPlaced.toString(), gameUiTheme.info],
        ["Damage Dealt", stats.damageDealt.toLocaleString(), gameUiTheme.danger],
        ["Waves Cleared", stats.wavesSurvived.toString(), gameUiTheme.violet],
      ]
    : [
        ["Wave Reached", `${stats.wave} / ${stats.totalWaves}`, gameUiTheme.warning],
        ["Score", stats.score.toLocaleString(), gameUiTheme.accent],
        ["Enemies Slain", stats.enemiesKilled.toString(), gameUiTheme.success],
        ["Towers Built", stats.towersPlaced.toString(), gameUiTheme.info],
        ["Damage Dealt", stats.damageDealt.toLocaleString(), gameUiTheme.danger],
        ["Gold Earned", `${stats.goldEarned}`, gameUiTheme.gold],
      ];

  return (
    <OverlayShell>
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          ...panelStyle({ padding: "28px", glow: true }),
          width: "min(420px, 100%)",
          border: `1px solid ${win ? `${gameUiTheme.success}50` : `${gameUiTheme.danger}50`}`,
          background: win 
            ? `linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(10, 26, 26, 0.85))`
            : `linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(10, 26, 26, 0.85))`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{
            ...sectionTitleStyle(),
            fontSize: 28,
            color: win ? gameUiTheme.success : gameUiTheme.danger,
            textShadow: win 
              ? `0 0 15px ${gameUiTheme.success}30`
              : `0 0 15px ${gameUiTheme.danger}30`,
          }}>
            {win ? "Victory" : "Defeat"}
          </div>
          <div style={{
            color: gameUiTheme.muted,
            fontFamily: gameUiFonts.body,
            fontSize: 11,
            marginTop: 6,
            lineHeight: 1.4,
          }}>
            {win
              ? `All ${stats.totalWaves} waves cleared`
              : "The line was broken"}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
          {statItems.map(([label, value, color]) => (
            <StatCard key={label} label={label} value={String(value)} color={String(color)} />
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          {!saved ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Your name..."
                value={name}
                maxLength={20}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") handleSave(); }}
                style={{
                  flex: 1,
                  minWidth: 140,
                  padding: "8px 12px",
                  borderRadius: 14,
                  border: `1px solid ${gameUiTheme.border}`,
                  background: "rgba(20, 50, 50, 0.4)",
                  color: gameUiTheme.text,
                  outline: "none",
                  fontFamily: gameUiFonts.body,
                  fontSize: 11,
                }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!name.trim()}
                style={{
                  ...buttonStyle("accent"),
                  opacity: name.trim() ? 1 : 0.4,
                }}
              >
                Save
              </motion.button>
            </div>
          ) : (
            <div style={{
              padding: "10px",
              borderRadius: 14,
              background: `${gameUiTheme.success}10`,
              color: gameUiTheme.success,
              fontFamily: gameUiFonts.body,
              fontSize: 11,
              textAlign: "center",
            }}>
              Score saved
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            style={buttonStyle(win ? "success" : "accent")}
          >
            {win ? "Play Again" : "Try Again"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReturnToMenu}
            style={buttonStyle("ghost")}
          >
            Menu
          </motion.button>
        </div>
      </motion.div>
    </OverlayShell>
  );
}

function PauseScreen({
  onResume,
  onReturnToMenu,
  onOpenSettings,
}: {
  onResume: () => void;
  onReturnToMenu: () => void;
  onOpenSettings?: () => void;
}) {
  return (
    <OverlayShell>
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          ...panelStyle({ padding: "24px", glow: true }),
          width: 280,
          textAlign: "center",
          border: `1px solid ${gameUiTheme.borderStrong}`,
        }}
      >
        <div style={{ ...sectionTitleStyle(), fontSize: 22 }}>Paused</div>
        <div style={{
          color: gameUiTheme.muted,
          fontFamily: gameUiFonts.body,
          fontSize: 10,
          marginTop: 4,
          marginBottom: 16,
        }}>
          The battle awaits
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onResume}
            style={buttonStyle("success")}
          >
            Resume
          </motion.button>
          {onOpenSettings && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenSettings}
              style={buttonStyle("soft")}
            >
              Settings
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReturnToMenu}
            style={buttonStyle("danger")}
          >
            Quit
          </motion.button>
        </div>

        <div style={{ color: gameUiTheme.mutedSoft, fontFamily: gameUiFonts.body, fontSize: 9, marginTop: 14 }}>
          Press P to resume
        </div>
      </motion.div>
    </OverlayShell>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: "8px 10px",
      background: "rgba(20, 50, 50, 0.3)",
      borderRadius: 16,
      textAlign: "left",
      border: `1px solid ${gameUiTheme.border}`,
    }}>
      <div style={{ color: gameUiTheme.mutedSoft, fontFamily: gameUiFonts.body, fontSize: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ ...metricValueStyle(color), fontSize: 14, marginTop: 2 }}>{value}</div>
    </div>
  );
}