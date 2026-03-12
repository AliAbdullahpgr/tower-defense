// ============================================================
// Fantasy Tower Defense — Tower Shop Sidebar (Mega Expansion)
// Design: Painterly Storybook Fantasy — carved wood panel
// All tower previews drawn procedurally on mini canvas — NO emoji
// ============================================================

import { useEffect, useRef, useState } from 'react';
import type { GameEngineState } from '../game/engine';
import type { GameEngine } from '../game/engine';
import type { TowerType, TargetingMode } from '../game/types';
import { TOWER_DEFINITIONS } from '../game/constants';
import { renderTowerPreview } from '../game/renderer';
import { SFX } from '../game/audio';

interface TowerShopProps {
  state: GameEngineState;
  engine: GameEngine;
}

const TOWER_CATEGORIES = [
  {
    label: 'Ranged',
    towers: ['archer', 'mage', 'cannon', 'frost', 'lightning', 'poison', 'ballista'] as TowerType[],
  },
  {
    label: 'Allies',
    towers: ['infantry', 'hero', 'beastmaster', 'necromancer'] as TowerType[],
  },
  {
    label: 'Siege',
    towers: ['catapult', 'tesla'] as TowerType[],
  },
];

// Hotkey mapping: 1-9 for the first 9 tower types
const TOWER_HOTKEY_MAP: Record<string, number> = {
  archer: 1, mage: 2, cannon: 3, frost: 4, lightning: 5, poison: 6, ballista: 7,
  infantry: 8, hero: 9,
};

const TARGETING_LABELS: Record<TargetingMode, string> = {
  first: '1st',
  last: 'Last',
  strongest: 'Strong',
  weakest: 'Weak',
  fastest: 'Fast',
};

const TARGETING_COLORS: Record<TargetingMode, string> = {
  first: '#4CAF50',
  last: '#2196F3',
  strongest: '#F44336',
  weakest: '#FF9800',
  fastest: '#9C27B0',
};

// ── Mini Canvas Tower Preview Component ──
function TowerPreviewCanvas({ type }: { type: TowerType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    const bg = ctx.createRadialGradient(28, 28, 2, 28, 28, 28);
    bg.addColorStop(0, 'rgba(60,30,10,0.8)');
    bg.addColorStop(1, 'rgba(20,10,4,0.95)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 56, 56);

    renderTowerPreview(ctx, type, 56);
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      width={56}
      height={56}
      style={{
        borderRadius: '6px',
        border: '1px solid rgba(139,105,20,0.4)',
        flexShrink: 0,
      }}
    />
  );
}

// ── Stat bar component ──
function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#92400e', marginBottom: '2px' }}>
        <span>{label}</span>
        <span style={{ color: '#d97706' }}>{value}</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(0,0,0,0.4)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// ── Ability Button ──
function AbilityButton({ ability, onUse }: { ability: { type: string; name: string; description: string; cooldown: number; currentCooldown: number; active: boolean }; onUse: () => void }) {
  const ready = ability.currentCooldown <= 0 && !ability.active;
  const cdPct = ability.cooldown > 0 ? (ability.currentCooldown / ability.cooldown) * 100 : 0;

  const icons: Record<string, string> = {
    lightningStorm: '⚡',
    freezeWave: '❄',
    goldRush: '💰',
  };

  return (
    <button
      onClick={onUse}
      disabled={!ready}
      title={ability.description}
      style={{
        position: 'relative',
        flex: 1,
        padding: '6px 4px',
        borderRadius: '6px',
        border: ready ? '1px solid #FFD700' : '1px solid rgba(120,53,15,0.4)',
        background: ready
          ? 'linear-gradient(135deg, rgba(120,80,0,0.6), rgba(60,30,0,0.8))'
          : 'rgba(20,10,4,0.6)',
        cursor: ready ? 'pointer' : 'not-allowed',
        color: ready ? '#FFD700' : '#78350f',
        fontSize: '11px',
        textAlign: 'center',
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      {!ready && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: `${cdPct}%`,
            width: '100%',
            background: 'rgba(0,0,0,0.5)',
            transition: 'height 0.1s',
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '14px' }}>{icons[ability.type] || '✦'}</div>
        <div style={{ fontSize: '8px', marginTop: '2px', lineHeight: 1.2 }}>{ability.name}</div>
        {!ready && ability.currentCooldown > 0 && (
          <div style={{ fontSize: '8px', color: '#ef4444' }}>
            {Math.ceil(ability.currentCooldown / 1000)}s
          </div>
        )}
      </div>
    </button>
  );
}

export default function TowerShop({ state, engine }: TowerShopProps) {
  const { stats, selectedTowerType, selectedTowerId, abilities } = state;
  const selectedTower = selectedTowerId ? state.towers.find(t => t.id === selectedTowerId) : null;
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div
      style={{
        width: '210px',
        minWidth: '210px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #2d1a08 0%, #1a0f04 100%)',
        borderLeft: '2px solid #8B6914',
        scrollbarWidth: 'thin',
        scrollbarColor: '#78350f #1a0f04',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 10px',
          textAlign: 'center',
          borderBottom: '1px solid #78350f',
          background: 'linear-gradient(90deg, #3d2010, #5a3010, #3d2010)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            color: '#fbbf24',
            fontFamily: "'Uncial Antiqua', serif",
            fontSize: '13px',
            fontWeight: 'bold',
            letterSpacing: '1px',
          }}
        >
          Tower Forge
        </div>
        <div style={{ color: '#92400e', fontSize: '9px', marginTop: '2px' }}>
          Select · Place on grass · Upgrade
        </div>
      </div>

      {/* Active Abilities */}
      {abilities && abilities.length > 0 && (
        <div
          style={{
            padding: '6px 8px',
            borderBottom: '1px solid #3d2010',
            flexShrink: 0,
          }}
        >
          <div style={{ color: '#92400e', fontSize: '9px', marginBottom: '5px', textAlign: 'center', fontFamily: "'Philosopher', serif" }}>
            ✦ ACTIVE ABILITIES ✦
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {abilities.map(ability => (
              <AbilityButton
                key={ability.type}
                ability={ability}
                onUse={() => engine.activateAbility(ability.type)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Synergies */}
      {state.activeSynergies && state.activeSynergies.length > 0 && (
        <div
          style={{
            padding: '6px 8px',
            borderBottom: '1px solid #3d2010',
            flexShrink: 0,
          }}
        >
          <div style={{ color: '#d97706', fontSize: '9px', marginBottom: '4px', textAlign: 'center', fontFamily: "'Philosopher', serif" }}>
            ✦ ACTIVE SYNERGIES ✦
          </div>
          {state.activeSynergies.map((syn, i) => (
            <div
              key={i}
              style={{
                fontSize: '8px',
                color: '#a78bfa',
                background: 'rgba(109,40,217,0.15)',
                borderRadius: '3px',
                padding: '3px 6px',
                marginBottom: '2px',
              }}
            >
              <span style={{ color: '#c4b5fd', fontWeight: 'bold' }}>{syn.name}:</span>{' '}
              {syn.description}
            </div>
          ))}
        </div>
      )}

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #3d2010',
          flexShrink: 0,
        }}
      >
        {TOWER_CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(i)}
            style={{
              flex: 1,
              padding: '5px 2px',
              fontSize: '9px',
              fontFamily: "'Philosopher', serif",
              fontWeight: 'bold',
              border: 'none',
              borderBottom: activeCategory === i ? '2px solid #FFD700' : '2px solid transparent',
              background: activeCategory === i ? 'rgba(120,80,0,0.3)' : 'transparent',
              color: activeCategory === i ? '#fbbf24' : '#78350f',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tower Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '6px' }}>
        {TOWER_CATEGORIES[activeCategory].towers.map(type => {
          const def = TOWER_DEFINITIONS[type];
          if (!def) return null;
          const canAfford = stats.gold >= def.cost;
          const isSelected = selectedTowerType === type;

          return (
            <button
              key={type}
              onClick={() => engine.selectTowerType(isSelected ? null : type)}
              disabled={!canAfford && !isSelected}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '7px',
                padding: '7px',
                borderRadius: '8px',
                border: isSelected
                  ? '2px solid #FFD700'
                  : canAfford
                    ? '2px solid #78350f'
                    : '2px solid rgba(120,53,15,0.3)',
                background: isSelected
                  ? 'rgba(120,80,0,0.5)'
                  : canAfford
                    ? 'rgba(45,26,8,0.8)'
                    : 'rgba(20,10,4,0.5)',
                cursor: canAfford || isSelected ? 'pointer' : 'not-allowed',
                opacity: !canAfford && !isSelected ? 0.5 : 1,
                textAlign: 'left',
                transition: 'all 0.15s',
                boxShadow: isSelected ? '0 0 12px rgba(255,215,0,0.3)' : 'none',
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '16px',
                    height: '16px',
                    background: '#FFD700',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    color: '#000',
                    fontWeight: 'bold',
                    zIndex: 1,
                  }}
                >
                  ✓
                </div>
              )}
              {TOWER_HOTKEY_MAP[type] && (
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: '2px',
                    width: '14px',
                    height: '14px',
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    color: '#92400e',
                    fontWeight: 'bold',
                    zIndex: 1,
                  }}
                >
                  {TOWER_HOTKEY_MAP[type]}
                </div>
              )}

              <TowerPreviewCanvas type={type} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: '#fde68a',
                    fontFamily: "'Philosopher', serif",
                    fontSize: '10px',
                    fontWeight: 'bold',
                    marginBottom: '1px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {def.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: canAfford ? '#fbbf24' : '#ef4444',
                    marginBottom: '3px',
                  }}
                >
                  {def.cost}g
                </div>
                <div
                  style={{
                    fontSize: '8px',
                    color: '#92400e',
                    lineHeight: 1.3,
                    marginBottom: '3px',
                    fontStyle: 'italic',
                  }}
                >
                  {def.description}
                </div>
                <StatBar label="DMG" value={def.damage} max={150} color="#ef4444" />
                <StatBar label="RNG" value={def.range * 10} max={55} color="#3b82f6" />
                {def.specialEffect && (
                  <div
                    style={{
                      fontSize: '8px',
                      color: '#a78bfa',
                      marginTop: '2px',
                      background: 'rgba(109,40,217,0.2)',
                      borderRadius: '3px',
                      padding: '1px 4px',
                      display: 'inline-block',
                    }}
                  >
                    ✦ {def.specialEffect.toUpperCase()}
                  </div>
                )}
                {def.unitType && (
                  <div
                    style={{
                      fontSize: '8px',
                      color: '#4ade80',
                      marginTop: '2px',
                      background: 'rgba(20,83,45,0.3)',
                      borderRadius: '3px',
                      padding: '1px 4px',
                      display: 'inline-block',
                    }}
                  >
                    ⚔ SPAWNS ALLIES
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Placement hint */}
      {selectedTowerType && (
        <div
          style={{
            margin: '0 6px 6px',
            padding: '7px',
            background: 'rgba(20,83,45,0.4)',
            border: '1px solid #166534',
            borderRadius: '6px',
            fontSize: '10px',
            color: '#86efac',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          Click on any grass tile to place
          <br />
          <button
            onClick={() => engine.selectTowerType(null)}
            style={{
              marginTop: '4px',
              color: '#f87171',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '10px',
              textDecoration: 'underline',
            }}
          >
            Cancel (ESC)
          </button>
        </div>
      )}

      {/* Selected Tower Info */}
      {selectedTower && (
        <div
          style={{
            margin: '0 6px 6px',
            padding: '9px',
            background: 'rgba(45,26,8,0.9)',
            border: '1px solid #78350f',
            borderRadius: '8px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px' }}>
            <TowerPreviewCanvas type={selectedTower.type} />
            <div>
              <div
                style={{
                  color: '#fde68a',
                  fontFamily: "'Philosopher', serif",
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              >
                {selectedTower.name}
              </div>
              <div style={{ color: '#92400e', fontSize: '9px' }}>Level {selectedTower.level}/3</div>
              {(selectedTower.powerBonus || 0) > 0 && (
                <div style={{ fontSize: '8px', color: '#FFD700' }}>★ Power Spot Bonus</div>
              )}
            </div>
          </div>

          {/* Level bar */}
          <div style={{ display: 'flex', gap: '3px', marginBottom: '7px' }}>
            {[1, 2, 3].map(l => (
              <div
                key={l}
                style={{
                  flex: 1,
                  height: '5px',
                  borderRadius: '3px',
                  background: l <= selectedTower.level ? '#FFD700' : 'rgba(120,53,15,0.4)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>

          <div style={{ marginBottom: '7px' }}>
            <StatBar label="Damage" value={selectedTower.damage} max={200} color="#ef4444" />
            <StatBar label="Range" value={selectedTower.range * 10} max={60} color="#3b82f6" />
            <StatBar label="Fire Rate" value={selectedTower.fireRate * 10} max={25} color="#22c55e" />
          </div>

          {/* Targeting Mode */}
          <div style={{ marginBottom: '7px' }}>
            <div style={{ fontSize: '9px', color: '#92400e', marginBottom: '4px' }}>TARGETING:</div>
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
              {(['first', 'last', 'strongest', 'weakest', 'fastest'] as TargetingMode[]).map(mode => {
                const isActive = selectedTower.targetingMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => engine.setTargetingMode(selectedTower.id, mode)}
                    style={{
                      padding: '2px 5px',
                      fontSize: '8px',
                      borderRadius: '3px',
                      border: isActive ? `1px solid ${TARGETING_COLORS[mode]}` : '1px solid rgba(120,53,15,0.4)',
                      background: isActive ? `${TARGETING_COLORS[mode]}33` : 'transparent',
                      color: isActive ? TARGETING_COLORS[mode] : '#78350f',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontWeight: isActive ? 'bold' : 'normal',
                    }}
                  >
                    {TARGETING_LABELS[mode]}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {selectedTower.level < 3 && (
              <button
                onClick={() => { engine.upgradeTower(selectedTower.id); SFX.towerUpgrade(); }}
                disabled={state.stats.gold < selectedTower.upgradeCost}
                style={{
                  width: '100%',
                  padding: '5px',
                  borderRadius: '5px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: state.stats.gold >= selectedTower.upgradeCost ? 'pointer' : 'not-allowed',
                  background: state.stats.gold >= selectedTower.upgradeCost
                    ? 'linear-gradient(90deg, #1e40af, #2563eb)'
                    : 'rgba(30,30,50,0.5)',
                  border: state.stats.gold >= selectedTower.upgradeCost
                    ? '1px solid #3b82f6'
                    : '1px solid rgba(59,130,246,0.3)',
                  color: state.stats.gold >= selectedTower.upgradeCost ? '#bfdbfe' : '#4b5563',
                  transition: 'all 0.15s',
                }}
              >
                ⬆ Upgrade ({selectedTower.upgradeCost}g)
              </button>
            )}
            <button
              onClick={() => { engine.sellTower(selectedTower.id); SFX.towerSell(); }}
              style={{
                width: '100%',
                padding: '5px',
                borderRadius: '5px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: 'linear-gradient(90deg, #7f1d1d, #991b1b)',
                border: '1px solid #b91c1c',
                color: '#fca5a5',
                transition: 'all 0.15s',
              }}
            >
              Sell (+{selectedTower.sellValue}g)
            </button>
            <button
              onClick={() => engine.selectTower(null)}
              style={{
                width: '100%',
                padding: '3px',
                borderRadius: '5px',
                fontSize: '9px',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                color: '#92400e',
              }}
            >
              ✕ Deselect
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Game Stats */}
      <div
        style={{
          padding: '6px 8px',
          borderTop: '1px solid #3d2010',
          fontSize: '9px',
          color: '#78350f',
          fontFamily: "'Philosopher', serif",
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Towers Placed:</span>
          <span style={{ color: '#d97706' }}>{state.towers.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Allies Active:</span>
          <span style={{ color: '#4ade80' }}>{(state.alliedUnits || []).filter(u => u.alive).length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Enemies Killed:</span>
          <span style={{ color: '#ef4444' }}>{state.stats.enemiesKilled}</span>
        </div>
      </div>
    </div>
  );
}
