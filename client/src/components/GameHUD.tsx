// ============================================================
// Fantasy Tower Defense — Game HUD Component (Mega Expansion)
// Design: Painterly Storybook Fantasy — warm wood/gold aesthetic
// ============================================================

import type { GameEngineState } from '../game/engine';
import type { GameEngine } from '../game/engine';
import { WAVE_CONFIGS } from '../game/constants';

interface GameHUDProps {
  state: GameEngineState;
  engine: GameEngine;
  onPause: () => void;
  onNextWave: () => void;
}

export default function GameHUD({ state, engine, onPause, onNextWave }: GameHUDProps) {
  const { stats, waveInProgress, waveCountdown, gameState, endlessMode, speedMultiplier } = state;
  const countdownSec = Math.ceil((waveCountdown || 0) / 1000);
  const isLastWave = !endlessMode && stats.wave >= WAVE_CONFIGS.length;
  const interestGold = Math.floor(stats.gold * 0.05);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: 'linear-gradient(90deg, #1c0a02, #3d2010, #5a3010, #3d2010, #1c0a02)',
        borderBottom: '2px solid #8B6914',
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        flexShrink: 0,
        minHeight: '52px',
        gap: '8px',
      }}
    >
      {/* Left: Resources */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <HudStat
          icon="💰"
          label="Gold"
          value={stats.gold}
          color="#fbbf24"
          sub={interestGold > 0 ? `+${interestGold}/wave` : undefined}
          subColor="#a16207"
        />
        <Divider />
        <HudStat
          icon="❤️"
          label="Lives"
          value={stats.lives}
          color={stats.lives <= 5 ? '#ef4444' : '#f87171'}
          pulse={stats.lives <= 3}
        />
        <Divider />
        <HudStat
          icon="⭐"
          label="Score"
          value={stats.score}
          color="#fde68a"
        />
        <Divider />
        <HudStat
          icon="🏆"
          label="Killed"
          value={stats.enemiesKilled}
          color="#d97706"
        />
      </div>

      {/* Center: Wave info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
        <div
          style={{
            color: '#fde68a',
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
              ? `⚔ Wave ${stats.wave}${endlessMode ? '' : ` / ${stats.totalWaves}`}`
              : isLastWave
                ? '✦ All Waves Defeated! ✦'
                : `Wave ${stats.wave} Complete!`}
        </div>

        {!waveInProgress && !isLastWave && (
          <div style={{ color: '#d97706', fontSize: '10px', marginTop: '2px' }}>
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
                      ? '#d97706'
                      : i === stats.wave - 1
                        ? '#fbbf24'
                        : 'rgba(120,53,15,0.4)',
                  transition: 'background 0.3s',
                  boxShadow: i === stats.wave - 1 ? '0 0 4px #fbbf24' : 'none',
                }}
              />
            ))}
          </div>
        )}

        {endlessMode && (
          <div
            style={{
              fontSize: '9px',
              color: '#a78bfa',
              marginTop: '2px',
              background: 'rgba(109,40,217,0.3)',
              borderRadius: '3px',
              padding: '1px 6px',
            }}
          >
            ∞ ENDLESS MODE
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
                border: (speedMultiplier || 1) === spd ? '1px solid #FFD700' : '1px solid rgba(120,53,15,0.5)',
                background: (speedMultiplier || 1) === spd ? 'rgba(120,80,0,0.6)' : 'rgba(45,26,8,0.6)',
                color: (speedMultiplier || 1) === spd ? '#fbbf24' : '#78350f',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {spd}×
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
            border: endlessMode ? '1px solid #a78bfa' : '1px solid rgba(120,53,15,0.5)',
            background: endlessMode ? 'rgba(109,40,217,0.4)' : 'rgba(45,26,8,0.6)',
            color: endlessMode ? '#a78bfa' : '#78350f',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          ∞
        </button>

        {!waveInProgress && !isLastWave && (
          <button
            onClick={onNextWave}
            style={{
              padding: '5px 12px',
              background: 'linear-gradient(90deg, #166534, #15803d)',
              color: '#86efac',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '5px',
              border: '1px solid #22c55e',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 0 8px rgba(34,197,94,0.3)',
              fontFamily: "'Philosopher', serif",
            }}
          >
            ▶ Send Wave
          </button>
        )}

        <button
          onClick={onPause}
          style={{
            padding: '5px 10px',
            background: 'rgba(45,26,8,0.8)',
            color: '#fde68a',
            fontSize: '11px',
            fontWeight: 'bold',
            borderRadius: '5px',
            border: '1px solid #78350f',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: "'Philosopher', serif",
          }}
        >
          {gameState === 'paused' ? '▶ Resume' : '⏸ Pause'}
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
        background: 'rgba(139,105,20,0.4)',
        flexShrink: 0,
      }}
    />
  );
}

function HudStat({
  icon,
  label,
  value,
  color,
  sub,
  subColor,
  pulse,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  sub?: string;
  subColor?: string;
  pulse?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span
        style={{
          fontSize: '16px',
          animation: pulse ? 'pulse 1s infinite' : 'none',
        }}
      >
        {icon}
      </span>
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
        <div style={{ color: '#78350f', fontSize: '9px', lineHeight: 1, marginTop: '1px' }}>
          {label}
          {sub && (
            <span style={{ color: subColor || '#a16207', marginLeft: '4px' }}>{sub}</span>
          )}
        </div>
      </div>
    </div>
  );
}
