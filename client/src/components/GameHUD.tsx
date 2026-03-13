// ============================================================
// Fantasy Tower Defense — Game HUD
// Clean in-game UI revamp
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
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 10,
        padding: "10px 12px",
        background: "linear-gradient(180deg, rgba(243,249,248,0.95), rgba(233,244,242,0.92))",
        borderBottom: `1px solid ${gameUiTheme.border}`,
        boxShadow: `0 8px 24px rgba(8,34,38,0.08), inset 0 1px 0 rgba(255,255,255,0.55)`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <HudMetricCard
          label="Gold"
          value={stats.gold.toLocaleString()}
          color={gameUiTheme.warning}
          iconSrc="/sprites/ui/icon_coin.png"
          sub={interestGold > 0 ? `+${interestGold}/wave` : undefined}
        />
        <HudMetricCard
          label="Lives"
          value={stats.lives.toLocaleString()}
          color={stats.lives <= 5 ? gameUiTheme.danger : gameUiTheme.success}
          iconSrc="/sprites/ui/icon_heart.png"
          pulse={stats.lives <= 3}
        />
        <HudMetricCard
          label="Score"
          value={stats.score.toLocaleString()}
          color={gameUiTheme.textStrong}
        />
        <HudMetricCard
          label="Kills"
          value={stats.enemiesKilled.toLocaleString()}
          color={gameUiTheme.accentStrong}
          iconSrc="/sprites/ui/icon_skull.png"
        />
      </div>

      <div style={{ ...panelStyle({ padding: "10px 16px" }), flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...sectionTitleStyle(), fontSize: 16 }}>
              {stats.wave === 0
                ? "Prepare Your Defenses"
                : waveInProgress
                  ? `Wave ${stats.wave}${endlessMode ? "" : ` / ${stats.totalWaves}`}`
                  : isLastWave
                    ? "All Waves Defeated"
                    : `Wave ${stats.wave} Complete`}
            </div>
            <div
              style={{
                color: nextWaveHasBoss ? gameUiTheme.danger : gameUiTheme.muted,
                fontFamily: gameUiFonts.body,
                fontSize: 11,
                marginTop: 3,
                fontWeight: nextWaveHasBoss ? 700 : 400,
              }}
            >
              {!waveInProgress && !isLastWave
                ? countdownSec > 0
                  ? `${nextWaveHasBoss ? "Boss arrives in" : "Auto-start in"} ${countdownSec}s`
                  : "Ready to begin"
                : endlessMode
                  ? "Endless mode active"
                  : waveInProgress
                    ? "Defend the path and prepare the next wave"
                    : "The realm is safe"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {endlessMode ? (
              <span style={{ ...chipStyle({ active: true, color: gameUiTheme.violet, background: gameUiTheme.violetSoft }) }}>
                Endless
              </span>
            ) : null}
            {nextWaveHasBoss ? (
              <span style={{ ...chipStyle({ active: true, color: gameUiTheme.danger, background: gameUiTheme.dangerSoft }) }}>
                Boss Next
              </span>
            ) : null}
          </div>
        </div>

        {!endlessMode ? (
          <div style={{ display: "flex", gap: 4, marginTop: 9, flexWrap: "wrap" }}>
            {Array.from({ length: Math.min(stats.totalWaves, 20) }).map((_, index) => (
              <div
                key={index}
                style={{
                  height: 6,
                  width: 18,
                  borderRadius: 999,
                  background:
                    index < stats.wave - 1
                      ? gameUiTheme.accent
                      : index === stats.wave - 1 && waveInProgress
                        ? gameUiTheme.warning
                        : "rgba(97,128,135,0.2)",
                }}
              />
            ))}
          </div>
        ) : null}

        {state.nextWavePreview.length > 0 && !waveInProgress && !isLastWave ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            <span style={{ ...chipStyle(), padding: "4px 8px" }}>Next</span>
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
                      background: isBossPreview ? gameUiTheme.dangerSoft : gameUiTheme.surfaceSoft,
                    }),
                    padding: "4px 8px",
                  }}
                >
                  {isBossPreview ? "Boss " : ""}
                  {enemyDef?.name || group.type} x{group.count}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      <div style={{ ...panelStyle({ padding: "10px" }), display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 4].map((speed) => {
            const active = (speedMultiplier || 1) === speed;
            return (
              <motion.button
                key={speed}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => engine.setSpeed(speed)}
                style={{
                  ...chipStyle({ active, color: gameUiTheme.accentStrong, background: active ? gameUiTheme.accentSoft : gameUiTheme.surfaceSoft }),
                  padding: "9px 10px",
                }}
              >
                {speed}x
              </motion.button>
            );
          })}
        </div>

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => engine.toggleEndlessMode()}
          style={{
            ...buttonStyle("ghost"),
            color: endlessMode ? gameUiTheme.violet : gameUiTheme.muted,
            border: `1px solid ${endlessMode ? gameUiTheme.violet : gameUiTheme.border}`,
            background: endlessMode ? gameUiTheme.violetSoft : "transparent",
          }}
        >
          Endless
        </motion.button>

        {!waveInProgress && !isLastWave ? (
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={onNextWave} style={buttonStyle("success")}>
            Send Wave
          </motion.button>
        ) : null}

        {waveInProgress && engine.canSendNextWave() ? (
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={onSendNextWave} style={buttonStyle("accent")}>
            Rush Next
          </motion.button>
        ) : null}

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPause}
          title={gameState === "paused" ? "Resume" : "Pause"}
          style={{
            ...buttonStyle("soft"),
            width: 42,
            height: 38,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SpriteIcon
            src={gameState === "paused" ? "/sprites/ui/button_play.png" : "/sprites/ui/button_pause.png"}
            fallback={gameState === "paused" ? "▶" : "⏸"}
            size={18}
          />
        </motion.button>

        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={onReturnToMenu} style={buttonStyle("ghost")}>
          Menu
        </motion.button>
      </div>

      <style>{`
        @keyframes hud-pulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }
      `}</style>
    </div>
  );
}

function HudMetricCard({
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
  iconSrc?: string;
  sub?: string;
  pulse?: boolean;
}) {
  return (
    <div
      style={{
        ...panelStyle({ padding: "9px 12px" }),
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 88,
        animation: pulse ? "hud-pulse 1s infinite" : "none",
      }}
    >
      {iconSrc ? <SpriteIcon src={iconSrc} fallback="" size={18} /> : null}
      <div>
        <div style={{ ...metricValueStyle(color) }}>{value}</div>
        <div style={{ color: gameUiTheme.muted, fontFamily: gameUiFonts.body, fontSize: 10, marginTop: 2 }}>
          {label}
          {sub ? <span style={{ marginLeft: 4, color: gameUiTheme.accentStrong }}>{sub}</span> : null}
        </div>
      </div>
    </div>
  );
}

function SpriteIcon({ src, fallback, size }: { src: string; fallback: string; size: number }) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.onerror = () => {
        if (imgRef.current) imgRef.current.style.display = "none";
      };
    }
  }, [src]);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <img
        ref={imgRef}
        src={src}
        width={size}
        height={size}
        style={{ objectFit: "contain", imageRendering: "pixelated" }}
        alt=""
      />
      <span style={{ display: "none", fontSize: `${Math.round(size * 0.7)}px` }}>{fallback}</span>
    </span>
  );
}
