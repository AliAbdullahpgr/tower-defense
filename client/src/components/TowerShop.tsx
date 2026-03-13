// ============================================================
// Fantasy Tower Defense — Tower Shop Sidebar
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

// ── Mini Canvas Tower Preview ──
function TowerPreviewCanvas({ type }: { type: TowerType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
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
      style={{ borderRadius: '6px', border: '1px solid rgba(74,138,138,0.4)', flexShrink: 0, display: 'block' }}
    />
  );
}


function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#4a8a8a', marginBottom: '2px' }}>
        <span>{label}</span>
        <span style={{ color: '#67e8f9' }}>{value}</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(0,0,0,0.4)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function AbilityButton({ ability, onUse }: {
  ability: { type: string; name: string; description: string; cooldown: number; currentCooldown: number; active: boolean };
  onUse: () => void;
}) {
  const ready = ability.currentCooldown <= 0 && !ability.active;
  const cdPct = ability.cooldown > 0 ? (ability.currentCooldown / ability.cooldown) * 100 : 0;

  const labels: Record<string, string> = {
    lightningStorm: 'Storm',
    freezeWave: 'Freeze',
    goldRush: 'Gold',
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
        border: ready ? '1px solid #4dd0e1' : '1px solid rgba(74,138,138,0.4)',
        background: ready
          ? 'linear-gradient(135deg, rgba(0,100,100,0.6), rgba(0,60,60,0.8))'
          : 'rgba(10,40,40,0.6)',
        cursor: ready ? 'pointer' : 'not-allowed',
        color: ready ? '#4dd0e1' : '#2a6a6a',
        fontSize: '9px',
        textAlign: 'center',
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      {!ready && (
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0,
            height: `${cdPct}%`,
            width: '100%',
            background: 'rgba(0,0,0,0.5)',
            transition: 'height 0.1s',
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '10px', marginBottom: '2px', lineHeight: 1.2 }}>{labels[ability.type] ?? ability.name}</div>
        {!ready && ability.currentCooldown > 0 && (
          <div style={{ fontSize: '8px', color: '#ef4444' }}>{Math.ceil(ability.currentCooldown / 1000)}s</div>
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
        background: 'linear-gradient(180deg, #0a1a1a 0%, #061010 100%)',
        borderLeft: '2px solid #2a6a6a',
        scrollbarColor: '#2a6a6a #0a1a1a',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 10px',
          textAlign: 'center',
          borderBottom: '1px solid #2a6a6a',
          background: 'linear-gradient(90deg, #0a2a2a, #1a4a4a, #0a2a2a)',
          flexShrink: 0,
        }}
      >
        <div style={{ color: '#4dd0e1', fontFamily: "'Uncial Antiqua', serif", fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>
          Tower Forge
        </div>
        <div style={{ color: '#4a8a8a', fontSize: '9px', marginTop: '2px' }}>
          Select · Place on grass · Upgrade
        </div>
      </div>

      {/* Selected Tower Panel — two buttons only */}
      {selectedTower && (
        <div
          style={{
            margin: '6px 6px 0',
            padding: '8px',
            background: 'rgba(45,26,8,0.95)',
            border: '2px solid #d97706',
            borderRadius: '8px',
            flexShrink: 0,
          }}
        >
          <div style={{ color: '#fde68a', fontFamily: "'Philosopher', serif", fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', textAlign: 'center' }}>
            {selectedTower.name} — Lv{selectedTower.level}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {selectedTower.level < 3 ? (
              <button
                onClick={() => { engine.upgradeTower(selectedTower.id); SFX.towerUpgrade(); }}
                disabled={stats.gold < selectedTower.upgradeCost}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '6px',
                  fontSize: '11px', fontWeight: 'bold', fontFamily: "'Philosopher', serif",
                  cursor: stats.gold >= selectedTower.upgradeCost ? 'pointer' : 'not-allowed',
                  background: stats.gold >= selectedTower.upgradeCost
                    ? 'linear-gradient(90deg, #1e40af, #2563eb)'
                    : 'rgba(20,20,40,0.7)',
                  border: stats.gold >= selectedTower.upgradeCost
                    ? '2px solid #60a5fa'
                    : '2px solid rgba(59,130,246,0.25)',
                  color: stats.gold >= selectedTower.upgradeCost ? '#bfdbfe' : '#4b5563',
                  transition: 'all 0.15s',
                }}
              >
                Upgrade ({selectedTower.upgradeCost}g)
              </button>
            ) : (
              <div style={{
                flex: 1, padding: '8px 4px', borderRadius: '6px', fontSize: '11px',
                fontWeight: 'bold', textAlign: 'center', background: 'rgba(255,215,0,0.1)',
                border: '2px solid rgba(255,215,0,0.4)', color: '#FFD700',
              }}>
                Max Level
              </div>
            )}
            <button
              onClick={() => { engine.sellTower(selectedTower.id); SFX.towerSell(); }}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: '6px',
                fontSize: '11px', fontWeight: 'bold', fontFamily: "'Philosopher', serif",
                cursor: 'pointer', background: 'linear-gradient(90deg, #7f1d1d, #991b1b)',
                border: '2px solid #b91c1c', color: '#fca5a5', transition: 'all 0.15s',
              }}
            >
              Sell (+{selectedTower.sellValue}g)
            </button>
          </div>
        </div>
      )}

      {/* Active Abilities */}
      {abilities && abilities.length > 0 && (
        <div style={{ padding: '6px 8px', borderBottom: '1px solid #1a4a4a', flexShrink: 0 }}>
          <div style={{ color: '#4a8a8a', fontSize: '9px', marginBottom: '5px', textAlign: 'center', fontFamily: "'Philosopher', serif", letterSpacing: '0.5px' }}>
            ACTIVE ABILITIES
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
        <div style={{ padding: '6px 8px', borderBottom: '1px solid #1a4a4a', flexShrink: 0 }}>
          <div style={{ color: '#67e8f9', fontSize: '9px', marginBottom: '4px', textAlign: 'center', fontFamily: "'Philosopher', serif", letterSpacing: '0.5px' }}>
            ACTIVE SYNERGIES
          </div>
          {state.activeSynergies.map((syn, i) => (
            <div
              key={i}
              style={{
                fontSize: '8px', color: '#a78bfa', background: 'rgba(109,40,217,0.15)',
                borderRadius: '3px', padding: '3px 6px', marginBottom: '2px',
              }}
            >
              <span style={{ color: '#c4b5fd', fontWeight: 'bold' }}>{syn.name}:</span>{' '}
              {syn.description}
            </div>
          ))}
        </div>
      )}

      {/* Category Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a4a4a', flexShrink: 0 }}>
        {TOWER_CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(i)}
            style={{
              flex: 1, padding: '5px 2px', fontSize: '9px',
              fontFamily: "'Philosopher', serif", fontWeight: 'bold',
              border: 'none',
              borderBottom: activeCategory === i ? '2px solid #4dd0e1' : '2px solid transparent',
              background: activeCategory === i ? 'rgba(0,100,100,0.3)' : 'transparent',
              color: activeCategory === i ? '#4dd0e1' : '#4a8a8a',
              cursor: 'pointer', transition: 'all 0.15s',
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
                position: 'relative', display: 'flex', alignItems: 'flex-start',
                gap: '7px', padding: '7px', borderRadius: '8px',
                border: isSelected ? '2px solid #4dd0e1' : canAfford ? '2px solid #2a6a6a' : '2px solid rgba(74,138,138,0.3)',
                background: isSelected ? 'rgba(0,100,100,0.5)' : canAfford ? 'rgba(10,40,40,0.8)' : 'rgba(5,20,20,0.5)',
                cursor: canAfford || isSelected ? 'pointer' : 'not-allowed',
                opacity: !canAfford && !isSelected ? 0.5 : 1,
                textAlign: 'left', transition: 'all 0.15s',
                boxShadow: isSelected ? '0 0 12px rgba(255,215,0,0.3)' : 'none',
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  width: '16px', height: '16px', background: '#FFD700',
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '8px', color: '#000',
                  fontWeight: 'bold', zIndex: 1,
                }}>
                  ON
                </div>
              )}
              {TOWER_HOTKEY_MAP[type] && (
                <div style={{
                  position: 'absolute', top: '2px', left: '2px',
                  width: '14px', height: '14px', background: 'rgba(0,0,0,0.6)',
                  borderRadius: '3px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '8px', color: '#92400e',
                  fontWeight: 'bold', zIndex: 1,
                }}>
                  {TOWER_HOTKEY_MAP[type]}
                </div>
              )}

              <TowerPreviewCanvas type={type} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fde68a', fontFamily: "'Philosopher', serif", fontSize: '10px', fontWeight: 'bold', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {def.name}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: canAfford ? '#fbbf24' : '#ef4444', marginBottom: '3px' }}>
                  {def.cost}g
                </div>
                <div style={{ fontSize: '8px', color: '#92400e', lineHeight: 1.3, marginBottom: '3px', fontStyle: 'italic' }}>
                  {def.description}
                </div>
                <StatBar label="DMG" value={def.damage} max={150} color="#ef4444" />
                <StatBar label="RNG" value={def.range * 10} max={55} color="#3b82f6" />
                {def.specialEffect && (
                  <div style={{ fontSize: '8px', color: '#a78bfa', marginTop: '2px', background: 'rgba(109,40,217,0.2)', borderRadius: '3px', padding: '1px 4px', display: 'inline-block' }}>
                    {def.specialEffect.toUpperCase()}
                  </div>
                )}
                {def.unitType && (
                  <div style={{ fontSize: '8px', color: '#4ade80', marginTop: '2px', background: 'rgba(20,83,45,0.3)', borderRadius: '3px', padding: '1px 4px', display: 'inline-block' }}>
                    SPAWNS ALLIES
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Placement hint */}
      {selectedTowerType && (
        <div style={{ margin: '0 6px 6px', padding: '7px', background: 'rgba(20,83,45,0.4)', border: '1px solid #166534', borderRadius: '6px', fontSize: '10px', color: '#86efac', textAlign: 'center', flexShrink: 0 }}>
          Click any grass tile to place
          <br />
          <button
            onClick={() => engine.selectTowerType(null)}
            style={{ marginTop: '4px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', textDecoration: 'underline' }}
          >
            Cancel (ESC)
          </button>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Game Stats */}
      <div style={{ padding: '6px 8px', borderTop: '1px solid #3d2010', fontSize: '9px', color: '#78350f', fontFamily: "'Philosopher', serif", flexShrink: 0 }}>
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
