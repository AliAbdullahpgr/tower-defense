// ============================================================
// Fantasy Tower Defense — Game Overlay Screens
// Clean in-game UI revamp
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
        background: "rgba(7, 23, 25, 0.5)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
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
        ["Final Score", stats.score.toLocaleString(), gameUiTheme.textStrong],
        ["Gold Remaining", `${stats.gold}g`, gameUiTheme.warning],
        ["Enemies Slain", stats.enemiesKilled.toString(), gameUiTheme.success],
        ["Towers Built", stats.towersPlaced.toString(), gameUiTheme.info],
        ["Damage Dealt", stats.damageDealt.toLocaleString(), gameUiTheme.danger],
        ["Waves Survived", stats.wavesSurvived.toString(), gameUiTheme.violet],
      ]
    : [
        ["Wave Reached", `${stats.wave} / ${stats.totalWaves}`, gameUiTheme.danger],
        ["Score", stats.score.toLocaleString(), gameUiTheme.textStrong],
        ["Enemies Slain", stats.enemiesKilled.toString(), gameUiTheme.warning],
        ["Towers Built", stats.towersPlaced.toString(), gameUiTheme.info],
        ["Damage Dealt", stats.damageDealt.toLocaleString(), gameUiTheme.danger],
        ["Gold Earned", `${stats.goldEarned}g`, gameUiTheme.warning],
      ];

  return (
    <OverlayShell>
      <motion.div
        initial={{ y: 16, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        style={{
          ...panelStyle({ padding: "22px" }),
          width: "min(560px, 100%)",
          background: win ? gameUiTheme.surface : "rgba(250, 243, 244, 0.94)",
          border: `1px solid ${win ? gameUiTheme.border : "rgba(214,109,120,0.22)"}`,
          boxShadow: gameUiTheme.shadow,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              ...sectionTitleStyle(),
              fontSize: 30,
              color: win ? gameUiTheme.accentStrong : gameUiTheme.danger,
            }}
          >
            {win ? "Victory" : "Defeat"}
          </div>
          <div
            style={{
              color: gameUiTheme.muted,
              fontFamily: gameUiFonts.body,
              fontSize: 13,
              lineHeight: 1.5,
              marginTop: 8,
              marginBottom: 18,
            }}
          >
            {win
              ? `The realm is safe. You cleared all ${stats.totalWaves} waves.`
              : "The defense line broke. Rebuild and try a better strategy."}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {statItems.map(([label, value, color]) => (
            <StatCard key={label} label={label} value={String(value)} color={String(color)} />
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          {!saved ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                maxLength={20}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSave();
                }}
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: "11px 12px",
                  borderRadius: 12,
                  border: `1px solid ${gameUiTheme.borderStrong}`,
                  background: gameUiTheme.surfaceStrong,
                  color: gameUiTheme.textStrong,
                  outline: "none",
                  fontFamily: gameUiFonts.body,
                  fontSize: 13,
                }}
              />
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!name.trim()}
                style={{
                  ...buttonStyle("accent"),
                  opacity: name.trim() ? 1 : 0.55,
                  cursor: name.trim() ? "pointer" : "not-allowed",
                }}
              >
                Save Score
              </motion.button>
            </div>
          ) : (
            <div
              style={{
                ...panelStyle({ padding: "12px" }),
                background: gameUiTheme.successSoft,
                color: gameUiTheme.success,
                fontFamily: gameUiFonts.body,
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Score saved to Hall of Fame.
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={onRestart} style={buttonStyle(win ? "success" : "accent")}>
            {win ? "Play Again" : "Try Again"}
          </motion.button>
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={onReturnToMenu} style={buttonStyle("ghost")}>
            Return to Menu
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
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        style={{
          ...panelStyle({ padding: "24px" }),
          width: 320,
          textAlign: "center",
          boxShadow: gameUiTheme.shadow,
        }}
      >
        <div style={{ ...sectionTitleStyle(), fontSize: 28 }}>Paused</div>
        <div
          style={{
            color: gameUiTheme.muted,
            fontFamily: gameUiFonts.body,
            fontSize: 12,
            marginTop: 8,
            marginBottom: 18,
          }}
        >
          Take a breath, then get back to the defense.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={onResume} style={buttonStyle("success")}>
            Resume
          </motion.button>
          {onOpenSettings ? (
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={onOpenSettings} style={buttonStyle("soft")}>
              Settings
            </motion.button>
          ) : null}
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={onReturnToMenu} style={buttonStyle("danger")}>
            Quit to Menu
          </motion.button>
        </div>

        <div style={{ color: gameUiTheme.mutedSoft, fontFamily: gameUiFonts.body, fontSize: 11, marginTop: 16 }}>
          Press P or Space to resume.
        </div>
      </motion.div>
    </OverlayShell>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        ...panelStyle({ padding: "12px" }),
        background: gameUiTheme.surfaceSoft,
        textAlign: "left",
      }}
    >
      <div style={{ color: gameUiTheme.mutedSoft, fontFamily: gameUiFonts.body, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ ...metricValueStyle(color), fontSize: 18, marginTop: 6 }}>{value}</div>
    </div>
  );
}
