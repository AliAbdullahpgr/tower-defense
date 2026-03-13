// ============================================================
// Fantasy Tower Defense — Game HUD Component (Mega Expansion)
// Design: Painterly Storybook Fantasy — warm wood/gold aesthetic
// ============================================================

import { useEffect, useRef } from 'react';
import type { GameEngineState } from '../game/engine';
import type { GameEngine } from '../game/engine';
import { WAVE_CONFIGS, ENEMY_DEFINITIONS } from '../game/constants';

interface GameHUDProps {
  state: GameEngineState;
  engine: GameEngine;
  onPause: () => void;
  onNextWave: () => void;
  onSendNextWave: () => void;
  onReturnToMenu: () => void;
}

export default function GameHUD({ state, engine, onPause, onNextWave, onSendNextWave, onReturnToMenu }: GameHUDProps) {
  const { stats, waveInProgress, waveCountdown, gameState, endlessMode, speedMultiplier } = state;
  const countdownSec = Math.ceil((waveCountdown || 0) / 1000);
  const isLastWave = !endlessMode && stats.wave >= WAVE_CONFIGS.length;
  const interestGold = Math.floor(stats.gold * 0.01);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: 'linear-gradient(90deg, #0a1a1a, #1a3a3a, #2a4a4a, #1a3a3a, #0a1a1a)',
        borderBottom: '2px solid #3a8a8a',
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        flexShrink: 0,
        minHeight: '52px',
        gap: '8px',
      }}
    >
      {/* Left: Resources */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <HudStatWithIcon
          label="Gold"
          value={stats.gold}
          color="#4dd0e1"
          iconSrc="/sprites/ui/icon_coin.png"
          sub={interestGold > 0 ? `+${interestGold}/wave` : undefined}
          subColor="#2a8a8a"
        />
        <Divider />
        <HudStatWithIcon
          label="Lives"
          value={stats.lives}
          color={stats.lives <= 5 ? '#f87171' : '#86efac'}
          iconSrc="/sprites/ui/icon_heart.png"
          pulse={stats.lives <= 3}
        />
        <Divider />
        <HudStat
          label="Score"
          value={stats.score}
          color="#a7f3d0"
        />
        <Divider />
        <HudStatWithIcon
          label="Killed"
          value={stats.enemiesKilled}
          color="#67e8f9"
          iconSrc="/sprites/ui/icon_skull.png"
        />
      </div>

      {/* Center: Wave info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
        <div
          style={{
            color: '#a7f3d0',
            fontWeight: 'bold',
            fontSize: '15px',
            letterSpacing: '1px',
            fontFamily: "'Uncial Antiqua', serif",
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
        >
          {stats.wave === 0
            ? 'Prepare Your Defenses'
            : waveInProgress
              ? `Wave ${stats.wave}${endlessMode ? '' : ` / ${stats.totalWaves}`}`
              : isLastWave
                ? 'All Waves Defeated!'
                : `Wave ${stats.wave} Complete!`}
        </div>

        {!waveInProgress && !isLastWave && (
          <div style={{ color: '#4dd0e1', fontSize: '10px', marginTop: '2px' }}>
            {countdownSec > 0 ? `Next wave in ${countdownSec}s` : 'Ready!'}
          </div>
        )}

        {waveInProgress && !endlessMode && (
          <div style={{ display: 'flex', gap: '2px', marginTop: '3px' }}>
            {Array.from({ length: Math.min(stats.totalWaves, 20) }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: '5px',
                  width: '18px',
                  borderRadius: '3px',
                  background:
                    i < stats.wave - 1
                      ? '#2a8a8a'
                      : i === stats.wave - 1
                        ? '#4dd0e1'
                        : 'rgba(42,138,138,0.3)',
                  transition: 'background 0.3s',
                  boxShadow: i === stats.wave - 1 ? '0 0 4px #4dd0e1' : 'none',
                }}
              />
            ))}
          </div>
        )}

        {endlessMode && (
          <div
            style={{
              fontSize: '9px',
              color: '#c4b5fd',
              marginTop: '2px',
              background: 'rgba(109,40,217,0.3)',
              borderRadius: '3px',
              padding: '1px 6px',
            }}
          >
            {'ENDLESS MODE'}
          </div>
        )}

        {/* Wave Preview */}
        {state.nextWavePreview && state.nextWavePreview.length > 0 && !waveInProgress && !isLastWave && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '3px',
              padding: '2px 8px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              fontSize: '9px',
            }}
          >
            <span style={{ color: '#4a8a8a', fontFamily: "'Philosopher', serif" }}>Next:</span>
            {state.nextWavePreview.map((group, i) => {
              const enemyDef = ENEMY_DEFINITIONS[group.type];
              return (
                <span
                  key={i}
                  title={enemyDef?.name || group.type}
                  style={{
                    color: enemyDef?.color || '#67e8f9',
                    fontWeight: 'bold',
                  }}
                >
                  {enemyDef?.name || group.type} x{group.count}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Speed control */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {[1, 2, 4].map(spd => (
            <button
              key={spd}
              onClick={() => engine.setSpeed(spd)}
              style={{
                padding: '3px 7px',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '4px',
                border: (speedMultiplier || 1) === spd ? '1px solid #4dd0e1' : '1px solid rgba(74,138,138,0.5)',
                background: (speedMultiplier || 1) === spd ? 'rgba(0,100,100,0.6)' : 'rgba(10,40,40,0.6)',
                color: (speedMultiplier || 1) === spd ? '#4dd0e1' : '#2a6a6a',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {spd}x
            </button>
          ))}
        </div>

        <Divider />

        {/* Endless mode toggle */}
        <button
          onClick={() => engine.toggleEndlessMode()}
          title="Toggle Endless Mode"
          style={{
            padding: '3px 7px',
            fontSize: '9px',
            fontWeight: 'bold',
            borderRadius: '4px',
            border: endlessMode ? '1px solid #a78bfa' : '1px solid rgba(74,138,138,0.5)',
            background: endlessMode ? 'rgba(109,40,217,0.4)' : 'rgba(10,40,40,0.6)',
            color: endlessMode ? '#a78bfa' : '#2a6a6a',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Endless
        </button>

        {!waveInProgress && !isLastWave && (
          <button
            onClick={onNextWave}
            style={{
              padding: '5px 12px',
              background: 'linear-gradient(90deg, #065f46, #047857)',
              color: '#6ee7b7',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '5px',
              border: '1px solid #10b981',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 0 8px rgba(16,185,129,0.3)',
              fontFamily: "'Philosopher', serif",
            }}
          >
            Send Wave
          </button>
        )}

        {waveInProgress && engine.canSendNextWave() && (
          <button
            onClick={onSendNextWave}
            title="Send the next wave now for a gold bonus!"
            style={{
              padding: '5px 12px',
              background: 'linear-gradient(90deg, #7c2d12, #9a3412)',
              color: '#fdba74',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '5px',
              border: '1px solid #ea580c',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 0 8px rgba(234,88,12,0.3)',
              fontFamily: "'Philosopher', serif",
            }}
          >
            Rush Next Wave
          </button>
        )}

        <button
          onClick={onPause}
          title={gameState === 'paused' ? 'Resume' : 'Pause'}
          style={{
            padding: '3px',
            background: 'rgba(10,40,40,0.8)',
            color: '#a7f3d0',
            fontSize: '11px',
            fontWeight: 'bold',
            borderRadius: '5px',
            border: '1px solid #2a6a6a',
            cursor: 'pointer',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '32px',
          }}
        >
          <SpriteIcon
            src={gameState === 'paused' ? '/sprites/ui/button_play.png' : '/sprites/ui/button_pause.png'}
            fallback={gameState === 'paused' ? '▶' : '⏸'}
            size={22}
          />
        </button>

        <button
          onClick={onReturnToMenu}
          title="Return to Main Menu"
          style={{
            padding: '5px 8px',
            background: 'rgba(10,40,40,0.8)',
            color: '#4a8a8a',
            fontSize: '11px',
            fontWeight: 'bold',
            borderRadius: '5px',
            border: '1px solid rgba(74,138,138,0.5)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: "'Philosopher', serif",
          }}
        >
          Menu
        </button>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: '1px',
        height: '28px',
        background: 'rgba(74,138,138,0.4)',
        flexShrink: 0,
      }}
    />
  );
}

/** Renders a UI sprite icon; falls back to text if image not loaded */
function SpriteIcon({ src, fallback, size }: { src: string; fallback: string; size: number }) {
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.onerror = () => {
        if (imgRef.current) imgRef.current.style.display = 'none';
      };
    }
  }, [src]);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <img
        ref={imgRef}
        src={src}
        width={size}
        height={size}
        style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
        alt=""
      />
      <span style={{ display: 'none', fontSize: Math.round(size * 0.7) + 'px' }}>{fallback}</span>
    </span>
  );
}

function HudStatWithIcon({
  label,
  value,
  color,
  iconSrc,
  sub,
  subColor,
  pulse,
}: {
  label: string;
  value: number;
  color: string;
  iconSrc: string;
  sub?: string;
  subColor?: string;
  pulse?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', animation: pulse ? 'pulse 1s infinite' : 'none' }}>
      <SpriteIcon src={iconSrc} fallback="" size={20} />
      <div>
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '14px',
            lineHeight: 1,
            color,
            fontFamily: "'Philosopher', serif",
          }}
        >
          {value.toLocaleString()}
        </div>
        <div style={{ color: '#4a8a8a', fontSize: '9px', lineHeight: 1, marginTop: '1px' }}>
          {label}
          {sub && (
            <span style={{ color: subColor || '#2a8a8a', marginLeft: '4px' }}>{sub}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function HudStat({
  label,
  value,
  color,
  sub,
  subColor,
  pulse,
}: {
  label: string;
  value: number;
  color: string;
  sub?: string;
  subColor?: string;
  pulse?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', animation: pulse ? 'pulse 1s infinite' : 'none' }}>
      <div>
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '14px',
            lineHeight: 1,
            color,
            fontFamily: "'Philosopher', serif",
          }}
        >
          {value.toLocaleString()}
        </div>
        <div style={{ color: '#4a8a8a', fontSize: '9px', lineHeight: 1, marginTop: '1px' }}>
          {label}
          {sub && (
            <span style={{ color: subColor || '#2a8a8a', marginLeft: '4px' }}>{sub}</span>
          )}
        </div>
      </div>
    </div>
  );
}
