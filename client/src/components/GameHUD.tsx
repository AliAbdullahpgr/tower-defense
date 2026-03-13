// ============================================================
// Fantasy Tower Defense — Game HUD
// Ultra clean, less boxy design
// ============================================================

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { GameEngineState } from "../game/engine";
import type { GameEngine } from "../game/engine";
import { ENEMY_DEFINITIONS, WAVE_CONFIGS } from "../game/constants";
import {
  buttonStyle,
  chipStyle,
  gameUiFonts,
  gameUiTheme,
  metricValueStyle,
  panelStyle,
  sectionTitleStyle,
} from "../lib/game-ui-theme";

interface GameHUDProps {
  state: GameEngineState;
  engine: GameEngine;
  onPause: () => void;
  onNextWave: () => void;
  onSendNextWave: () => void;
  onReturnToMenu: () => void;
}

function IconImg({ src, size = 14 }: { src: string; size?: number }) {
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.onerror = () => {
        if (imgRef.current) imgRef.current.style.display = "none";
      };
    }
  }, [src]);
  return (
    <img
      ref={imgRef}
      src={src}
      width={size}
      height={size}
      style={{
        objectFit: "contain",
        imageRendering: "pixelated",
        filter: `drop-shadow(0 0 2px ${gameUiTheme.accent}30)`,
      }}
      alt=""
    />
  );
}

export default function GameHUD({
  state,
  engine,
  onPause,
  onNextWave,
  onSendNextWave,
  onReturnToMenu,
}: GameHUDProps) {
  const { stats, waveInProgress, waveCountdown, gameState, endlessMode, speedMultiplier } = state;
  const countdownSec = Math.ceil((waveCountdown || 0) / 1000);
  const isLastWave = !endlessMode && stats.wave >= WAVE_CONFIGS.length;
  const interestGold = Math.floor(stats.gold * 0.01);
  const nextWaveHasBoss =
    !waveInProgress &&
    state.nextWavePreview.some((group) => ENEMY_DEFINITIONS[group.type]?.isBoss);

  return (
    <div style={{
      display: "flex",
      alignItems: "stretch",
      gap: 6,
      padding: "6px 8px",
      background: "linear-gradient(180deg, rgba(20, 32, 40, 0.98), rgba(12, 22, 28, 1))",
      borderBottom: `2px solid ${gameUiTheme.borderStrong}`,
      boxShadow: "0 6px 16px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.05)",
      flexShrink: 0,
      position: "relative",
      zIndex: 20,
    }}>
      <div style={{ display: "flex", gap: 5 }}>
        <HudMetric
          label="Gold"
          value={stats.gold.toLocaleString()}
          color={gameUiTheme.gold}
          iconSrc="/sprites/ui/icon_coin.png"
          sub={interestGold > 0 ? `+${interestGold}` : undefined}
        />
        <HudMetric
          label="Lives"
          value={stats.lives.toLocaleString()}
          color={stats.lives <= 5 ? gameUiTheme.danger : gameUiTheme.success}
          iconSrc="/sprites/ui/icon_heart.png"
          pulse={stats.lives <= 3}
        />
        <HudMetric
          label="Score"
          value={stats.score.toLocaleString()}
          color={gameUiTheme.accentStrong}
          iconSrc="/sprites/ui/banner_wave.png"
        />
        <HudMetric
          label="Kills"
          value={stats.enemiesKilled.toLocaleString()}
          color={gameUiTheme.info}
          iconSrc="/sprites/ui/icon_skull.png"
        />
      </div>

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minWidth: 0,
        padding: "4px 10px",
        background: "rgba(12, 22, 28, 0.6)",
        borderRadius: 4,
        border: `2px solid ${gameUiTheme.border}`,
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...sectionTitleStyle(), fontSize: 13 }}>
              {stats.wave === 0
                ? "Prepare Your Defenses"
                : waveInProgress
                  ? `Wave ${stats.wave}${endlessMode ? "" : ` / ${stats.totalWaves}`}`
                  : isLastWave
                    ? "Victory — All Waves Defeated"
                    : `Wave ${stats.wave} — Complete`}
            </div>
            <div style={{
              color: nextWaveHasBoss ? gameUiTheme.danger : gameUiTheme.muted,
              fontFamily: gameUiFonts.body,
              fontSize: 8,
              marginTop: 1,
              fontWeight: nextWaveHasBoss ? 500 : 400,
            }}>
              {!waveInProgress && !isLastWave
                ? countdownSec > 0
                  ? `${nextWaveHasBoss ? "⚡ Boss in" : "Next wave in"} ${countdownSec}s`
                  : "Ready to begin"
                : endlessMode
                  ? "Endless mode — Survive as long as possible"
                  : waveInProgress
                    ? "Defend the path and prepare"
                    : "The realm is safe... for now"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {endlessMode && (
              <span style={{
                ...chipStyle({ active: true, color: gameUiTheme.violet, size: "sm" }),
                background: `${gameUiTheme.violet}08`,
              }}>
                ENDLESS
              </span>
            )}
            {nextWaveHasBoss && (
              <span style={{
                ...chipStyle({ active: true, color: gameUiTheme.danger, size: "sm" }),
                background: `${gameUiTheme.danger}08`,
              }}>
                ⚡ BOSS
              </span>
            )}
          </div>
        </div>

        {!endlessMode && (
          <div style={{ display: "flex", gap: 2, marginTop: 5, flexWrap: "wrap" }}>
            {Array.from({ length: Math.min(stats.totalWaves, 20) }).map((_, index) => (
              <div
                key={index}
                style={{
                  height: 2,
                  width: 12,
                  borderRadius: 1,
                  background: index < stats.wave - 1
                    ? gameUiTheme.success
                    : index === stats.wave - 1 && waveInProgress
                      ? gameUiTheme.warning
                      : "rgba(92,137,148,0.2)",
                  boxShadow: index < stats.wave - 1
                    ? `0 0 3px ${gameUiTheme.success}25`
                    : index === stats.wave - 1 && waveInProgress
                      ? `0 0 3px ${gameUiTheme.warning}25`
                      : "none",
                }}
              />
            ))}
          </div>
        )}

        {state.nextWavePreview.length > 0 && !waveInProgress && !isLastWave && (
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 5 }}>
            <span style={{
              ...chipStyle({ size: "sm" }),
              color: gameUiTheme.muted,
              background: "transparent",
            }}>Next:</span>
            {state.nextWavePreview.map((group, index) => {
              const enemyDef = ENEMY_DEFINITIONS[group.type];
              const isBossPreview = enemyDef?.isBoss;
              return (
                <span
                  key={`${group.type}-${index}`}
                  title={enemyDef?.name || group.type}
                  style={{
                    ...chipStyle({
                      active: true,
                      color: isBossPreview ? gameUiTheme.danger : enemyDef?.color || gameUiTheme.accent,
                      size: "sm",
                    }),
                    background: isBossPreview ? `${gameUiTheme.danger}08` : "transparent",
                  }}
                >
                  {isBossPreview ? "⚡" : ""}{enemyDef?.name || group.type} ×{group.count}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div style={{
        display: "flex",
        gap: 4,
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "flex-end",
      }}>
        <div style={{ display: "flex", gap: 2 }}>
          {[1, 2, 4].map((speed) => {
            const active = (speedMultiplier || 1) === speed;
            return (
              <motion.button
                key={speed}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => engine.setSpeed(speed)}
                style={{
                  ...chipStyle({ active, color: gameUiTheme.accentStrong, size: "sm" }),
                  width: 26,
                  fontFamily: gameUiFonts.numbers,
                  fontWeight: 600,
                  background: active ? `${gameUiTheme.accent}15` : "rgba(12, 22, 28, 0.6)",
                  border: `2px solid ${active ? gameUiTheme.accent : gameUiTheme.border}`,
                }}
              >
                {speed}×
              </motion.button>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => engine.toggleEndlessMode()}
          style={{
            ...buttonStyle(endlessMode ? "accent" : "ghost"),
            padding: "4px 8px",
            fontSize: 8,
            color: endlessMode ? gameUiTheme.violet : gameUiTheme.muted,
            background: endlessMode ? `${gameUiTheme.violet}10` : "transparent",
            border: endlessMode ? `1px solid ${gameUiTheme.violet}40` : "none",
          }}
        >
          Endless
        </motion.button>

        {!waveInProgress && !isLastWave && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNextWave}
            style={{ ...buttonStyle("accent"), padding: "5px 10px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IconImg src="/sprites/ui/banner_wave.png" size={11} />
              Send Wave
            </div>
          </motion.button>
        )}

        {waveInProgress && engine.canSendNextWave() && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSendNextWave}
            style={{ ...buttonStyle("success"), padding: "5px 10px" }}
          >
            Rush Next
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPause}
          title={gameState === "paused" ? "Resume" : "Pause"}
          style={{
            ...buttonStyle("soft"),
            width: 28,
            height: 24,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(12, 22, 28, 0.6)",
            border: `2px solid ${gameUiTheme.border}`,
          }}
        >
          <PauseIcon isPaused={gameState === "paused"} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReturnToMenu}
          style={{
            ...buttonStyle("ghost"),
            padding: "4px 8px",
            fontSize: 8,
            background: "transparent",
            border: "none",
          }}
        >
          Menu
        </motion.button>
      </div>

      <style>{`
        @keyframes hud-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.01); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

function HudMetric({
  label,
  value,
  color,
  iconSrc,
  sub,
  pulse,
}: {
  label: string;
  value: string;
  color: string;
  iconSrc: string;
  sub?: string;
  pulse?: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 5,
      minWidth: 65,
      padding: "5px 8px",
      background: "rgba(12, 22, 28, 0.6)",
      borderRadius: 4,
      border: `2px solid ${gameUiTheme.border}`,
      boxShadow: "inset 0 0 10px rgba(0,0,0,0.4)",
      animation: pulse ? "hud-pulse 1s infinite" : "none",
    }}>
      <IconImg src={iconSrc} size={14} />
      <div>
        <div style={{ ...metricValueStyle(color), fontSize: 12 }}>{value}</div>
        <div style={{ color: gameUiTheme.mutedSoft, fontFamily: gameUiFonts.body, fontSize: 7, marginTop: 0 }}>
          {label}
          {sub && <span style={{ marginLeft: 2, color: gameUiTheme.success }}> {sub}</span>}
        </div>
      </div>
    </div>
  );
}

function PauseIcon({ isPaused }: { isPaused: boolean }) {
  if (isPaused) {
    return <IconImg src="/sprites/ui/button_play.png" size={12} />;
  }
  return <IconImg src="/sprites/ui/button_pause.png" size={12} />;
}