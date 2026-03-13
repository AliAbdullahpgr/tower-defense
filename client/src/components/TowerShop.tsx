// ============================================================
// Fantasy Tower Defense — Tower Shop Sidebar
// Ultra clean, less boxy design
// ============================================================

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameEngineState } from "../game/engine";
import type { GameEngine } from "../game/engine";
import type { TargetingMode, TowerType } from "../game/types";
import { TOWER_DEFINITIONS } from "../game/constants";
import { renderTowerPreview } from "../game/renderer";
import { SFX } from "../game/audio";
import {
  buttonStyle,
  cardStyle,
  chipStyle,
  gameUiFonts,
  gameUiTheme,
  metricValueStyle,
  panelStyle,
  sectionTitleStyle,
} from "../lib/game-ui-theme";

interface TowerShopProps {
  state: GameEngineState;
  engine: GameEngine;
}

const TOWER_CATEGORIES: Array<{
  label: string;
  icon: string;
  towers: TowerType[];
}> = [
    {
      label: "Ranged",
      icon: "✦",
      towers: ["archer", "mage", "cannon", "frost", "lightning", "poison", "ballista"],
    },
    {
      label: "Barracks",
      icon: "◆",
      towers: ["infantry", "archer_barracks", "pikeman_barracks", "hero", "paladin_shrine"],
    },
    {
      label: "Summons",
      icon: "★",
      towers: ["beastmaster", "necromancer"],
    },
    {
      label: "Siege",
      icon: "◉",
      towers: ["catapult", "tesla"],
    },
  ];

const TOWER_HOTKEY_MAP: Partial<Record<TowerType, string>> = {
  archer: "1", mage: "2", cannon: "3", frost: "4", lightning: "5", poison: "6", ballista: "7",
  infantry: "8", archer_barracks: "9", pikeman_barracks: "0", hero: "Q", paladin_shrine: "W",
  beastmaster: "E", necromancer: "R", catapult: "T", tesla: "Y",
};

const TARGETING_MODES: Array<{
  mode: TargetingMode;
  label: string;
  color: string;
}> = [
    { mode: "first", label: "First", color: gameUiTheme.success },
    { mode: "last", label: "Last", color: gameUiTheme.info },
    { mode: "strongest", label: "Strong", color: gameUiTheme.danger },
    { mode: "weakest", label: "Weak", color: gameUiTheme.warning },
    { mode: "fastest", label: "Fast", color: gameUiTheme.violet },
  ];

const ABILITY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  lightningStorm: { label: "Storm", icon: "⚡", color: gameUiTheme.info },
  freezeWave: { label: "Freeze", icon: "❄", color: gameUiTheme.accent },
  goldRush: { label: "Gold", icon: "◈", color: gameUiTheme.gold },
};

function IconImg({ src, size = 16 }: { src: string; size?: number }) {
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

function TowerPreviewCanvas({ type, size = 52 }: { type: TowerType; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(77, 208, 225, 0.05)");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    renderTowerPreview(ctx, type, size);
  }, [type, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        background: "rgba(20, 50, 50, 0.3)",
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}

function AbilityButton({
  ability,
  onUse,
}: {
  ability: { type: string; name: string; description: string; cooldown: number; currentCooldown: number; active: boolean };
  onUse: () => void;
}) {
  const ready = ability.currentCooldown <= 0 && !ability.active;
  const config = ABILITY_CONFIG[ability.type] || { label: ability.name, icon: "★", color: gameUiTheme.accent };

  return (
    <motion.button
      whileHover={ready ? { scale: 1.02 } : {}}
      whileTap={ready ? { scale: 0.98 } : {}}
      onClick={onUse}
      disabled={!ready}
      title={ability.description}
      style={{
        flex: 1,
        borderRadius: 4,
        border: `2px solid ${ability.active ? config.color : gameUiTheme.border}`,
        background: ability.active ? `linear-gradient(180deg, ${config.color}20, rgba(12, 22, 28, 0.9))` : "rgba(12, 22, 28, 0.6)",
        boxShadow: "inset 0 0 10px rgba(0,0,0,0.5)",
        cursor: ready ? "pointer" : "not-allowed",
        opacity: ready || ability.active ? 1 : 0.4,
        transition: "all 0.2s",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 3, fontSize: 13 }}>
        {config.icon}
      </div>
      <div style={{ ...sectionTitleStyle(), fontSize: 9, textAlign: "center", marginBottom: 1 }}>
        {config.label}
      </div>
      <div style={{
        color: ability.active ? config.color : ready ? gameUiTheme.muted : gameUiTheme.danger,
        fontFamily: gameUiFonts.numbers,
        fontSize: 8,
        textAlign: "center",
      }}>
        {ability.active ? "Active" : ready ? "Ready" : `${Math.ceil(ability.currentCooldown / 1000)}s`}
      </div>
    </motion.button>
  );
}

function TowerMetric({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: compact ? 0 : 45 }}>
      <span style={{ color: gameUiTheme.mutedSoft, fontFamily: gameUiFonts.body, fontSize: 7, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </span>
      <span style={{ ...metricValueStyle(), fontSize: compact ? 10 : 12 }}>{value}</span>
    </div>
  );
}

function TagPill({ color, text }: { color: string; text: string }) {
  return (
    <span style={{
      ...chipStyle({ active: true, color, size: "sm" }),
      background: `${color}08`,
      border: "none",
      padding: "2px 8px",
    }}>
      {text}
    </span>
  );
}

function SelectedTowerPanel({ state, engine }: { state: GameEngineState; engine: GameEngine }) {
  const selectedTower = state.selectedTowerId
    ? state.towers.find((tower) => tower.id === state.selectedTowerId)
    : null;

  if (!selectedTower) return null;

  const canUpgrade = selectedTower.level < 3 && state.stats.gold >= selectedTower.upgradeCost;
  const def = TOWER_DEFINITIONS[selectedTower.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        ...panelStyle({ padding: "12px", glow: true }),
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <TowerPreviewCanvas type={selectedTower.type} size={48} />
          <div style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            background: def?.color || gameUiTheme.accent,
            borderRadius: 10,
            padding: "1px 5px",
            fontFamily: gameUiFonts.numbers,
            fontSize: 7,
            color: gameUiTheme.page,
            fontWeight: 700,
          }}>
            {selectedTower.level}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...sectionTitleStyle(), fontSize: 13 }}>{selectedTower.name}</div>
          <div style={{ color: gameUiTheme.muted, fontFamily: gameUiFonts.body, fontSize: 9, marginTop: 1 }}>
            Sell: <span style={{ color: gameUiTheme.gold }}>{selectedTower.sellValue}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
        <TowerMetric label="DMG" value={selectedTower.damage.toString()} />
        <TowerMetric label="RNG" value={selectedTower.range.toFixed(1)} />
        <TowerMetric label="SPD" value={selectedTower.fireRate > 0 ? `${selectedTower.fireRate.toFixed(1)}` : "—"} />
        <TowerMetric label="PWR" value={selectedTower.powerBonus > 0 ? `+${Math.round(selectedTower.powerBonus * 25)}%` : "—"} />
      </div>

      <div>
        <div style={{ color: gameUiTheme.mutedSoft, fontFamily: gameUiFonts.body, fontSize: 7, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
          Targeting
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {TARGETING_MODES.map((item) => {
            const active = selectedTower.targetingMode === item.mode;
            return (
              <motion.button
                key={item.mode}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => engine.setTargetingMode(selectedTower.id, item.mode)}
                title={item.label}
                style={{
                  flex: 1,
                  padding: "4px 2px",
                  borderRadius: 2,
                  border: `1px solid ${active ? item.color : gameUiTheme.border}`,
                  background: active ? `${item.color}15` : "rgba(12, 22, 28, 0.6)",
                  color: active ? item.color : gameUiTheme.muted,
                  fontFamily: gameUiFonts.body,
                  fontSize: 7,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {item.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 5 }}>
        {selectedTower.level < 3 ? (
          <motion.button
            whileHover={canUpgrade ? { scale: 1.02 } : {}}
            whileTap={canUpgrade ? { scale: 0.98 } : {}}
            onClick={() => { engine.upgradeTower(selectedTower.id); SFX.towerUpgrade(); }}
            disabled={!canUpgrade}
            style={{
              flex: 1,
              ...buttonStyle(canUpgrade ? "accent" : "soft"),
              opacity: canUpgrade ? 1 : 0.4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <IconImg src="/sprites/ui/icon_arrow_up.png" size={10} />
              Upgrade · {selectedTower.upgradeCost}
            </div>
          </motion.button>
        ) : (
          <div style={{
            flex: 1,
            padding: "6px",
            borderRadius: 14,
            background: `${gameUiTheme.warning}08`,
            color: gameUiTheme.warning,
            fontFamily: gameUiFonts.body,
            fontSize: 9,
            fontWeight: 500,
            textAlign: "center",
          }}>
            Max Level
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { engine.sellTower(selectedTower.id); SFX.towerSell(); }}
          style={{ ...buttonStyle("danger"), flex: 1 }}
        >
          Sell · {selectedTower.sellValue}
        </motion.button>
      </div>
    </motion.div>
  );
}

function TowerCard({
  type,
  selected,
  canAfford,
  hovered,
  onSelect,
  onHover,
  onLeave,
}: {
  type: TowerType;
  selected: boolean;
  canAfford: boolean;
  hovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  const def = TOWER_DEFINITIONS[type];
  if (!def) return null;

  const color = canAfford ? def.color : gameUiTheme.mutedSoft;

  return (
    <motion.button
      whileHover={canAfford || selected ? { scale: 1.01 } : {}}
      whileTap={canAfford || selected ? { scale: 0.99 } : {}}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      disabled={!canAfford && !selected}
      title={def.description}
      style={{
        width: "100%",
        padding: "8px 10px",
        textAlign: "left",
        ...cardStyle({ selected, color }),
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        opacity: canAfford || selected ? 1 : 0.35,
        cursor: canAfford || selected ? "pointer" : "not-allowed",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {selected && (
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          background: color,
          opacity: 0.6,
        }} />
      )}

      <div style={{ position: "relative", flexShrink: 0 }}>
        <TowerPreviewCanvas type={type} size={44} />
        {TOWER_HOTKEY_MAP[type] && (
          <span style={{
            position: "absolute",
            top: -2,
            left: -2,
            background: gameUiTheme.surfaceStrong,
            borderRadius: 8,
            padding: "1px 4px",
            fontFamily: gameUiFonts.numbers,
            fontSize: 7,
            color: gameUiTheme.accent,
            fontWeight: 700,
          }}>
            {TOWER_HOTKEY_MAP[type]}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 5, marginBottom: 1 }}>
          <div style={{
            color: selected ? color : gameUiTheme.text,
            fontFamily: gameUiFonts.body,
            fontSize: 10,
            fontWeight: 500,
          }}>
            {def.name}
          </div>
          <span style={{
            ...chipStyle({ active: true, color, size: "sm" }),
            background: `${color}08`,
            border: "none",
            fontFamily: gameUiFonts.numbers,
            fontSize: 8,
          }}>
            {def.cost}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 4, marginTop: 4 }}>
          <TowerMetric label="DMG" value={def.damage.toString()} compact />
          <TowerMetric label="RNG" value={def.range.toFixed(1)} compact />
          <TowerMetric label="SPD" value={def.fireRate > 0 ? `${def.fireRate.toFixed(1)}` : "—"} compact />
        </div>

        <div style={{ display: "flex", gap: 2, marginTop: 4, flexWrap: "wrap" }}>
          {def.specialEffect && <TagPill color={gameUiTheme.violet} text={def.specialEffect.toUpperCase()} />}
          {def.unitType && <TagPill color={gameUiTheme.success} text="UNIT" />}
          {def.isAirCapable && <TagPill color={gameUiTheme.info} text="AIR" />}
        </div>
      </div>
    </motion.button>
  );
}

export default function TowerShop({ state, engine }: TowerShopProps) {
  const { stats, selectedTowerType, abilities } = state;
  const [activeCategory, setActiveCategory] = useState(0);
  const [hoveredType, setHoveredType] = useState<TowerType | null>(null);

  return (
    <div style={{
      width: 240,
      minWidth: 240,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 0,
      padding: "8px",
      background: "linear-gradient(180deg, rgba(20, 32, 40, 0.98), rgba(12, 22, 28, 1))",
      borderLeft: `2px solid ${gameUiTheme.borderStrong}`,
      boxShadow: "-4px 0 16px rgba(0,0,0,0.6)",
      overflowY: "hidden",
      overflowX: "hidden",
      flexShrink: 0,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 0",
        marginBottom: 8,
      }}>
        <IconImg src="/sprites/ui/icon_plus.png" size={12} />
        <div style={{ ...sectionTitleStyle(), fontSize: 12 }}>Tower Arsenal</div>
        <span style={{ color: gameUiTheme.gold, fontFamily: gameUiFonts.numbers, fontSize: 11 }}>
          {stats.gold}
        </span>
      </div>

      <AnimatePresence>
        {state.selectedTowerId && <SelectedTowerPanel state={state} engine={engine} />}
      </AnimatePresence>

      {abilities.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ ...sectionTitleStyle(), fontSize: 10 }}>Abilities</div>
            <span style={{ ...chipStyle({ size: "sm" }), color: gameUiTheme.info }}>Global</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {abilities.map((ability) => (
              <AbilityButton key={ability.type} ability={ability} onUse={() => engine.activateAbility(ability.type)} />
            ))}
          </div>
        </div>
      )}

      {state.activeSynergies.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ ...sectionTitleStyle(), fontSize: 10, marginBottom: 5 }}>Synergies</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {state.activeSynergies.map((synergy) => (
              <span key={synergy.name} title={synergy.description} style={{
                ...chipStyle({ active: true, color: gameUiTheme.violet, size: "sm" }),
                background: `${gameUiTheme.violet}08`,
              }}>
                {synergy.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 3, marginBottom: 6 }}>
        {TOWER_CATEGORIES.map((category, index) => {
          const active = index === activeCategory;
          return (
            <motion.button
              key={category.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveCategory(index)}
              style={{
                padding: "6px 2px",
                borderRadius: 4,
                border: `2px solid ${active ? gameUiTheme.accent : gameUiTheme.border}`,
                background: active ? `${gameUiTheme.accent}15` : "rgba(12, 22, 28, 0.6)",
                boxShadow: "inset 0 0 8px rgba(0,0,0,0.4)",
                color: active ? gameUiTheme.accent : gameUiTheme.muted,
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span style={{ fontSize: 11 }}>{category.icon}</span>
              <span style={{ fontSize: 7, fontFamily: gameUiFonts.body, fontWeight: 500 }}>{category.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        paddingRight: 4,
        paddingBottom: 4,
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={TOWER_CATEGORIES[activeCategory].label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            {TOWER_CATEGORIES[activeCategory].towers.map((type) => (
              <TowerCard
                key={type}
                type={type}
                selected={selectedTowerType === type}
                canAfford={stats.gold >= (TOWER_DEFINITIONS[type]?.cost ?? Infinity)}
                hovered={hoveredType === type}
                onSelect={() => engine.selectTowerType(selectedTowerType === type ? null : type)}
                onHover={() => setHoveredType(type)}
                onLeave={() => setHoveredType(null)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedTowerType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              ...panelStyle({ padding: "10px", glow: true }),
              marginTop: 6,
              flexShrink: 0,
            }}
          >
            <div style={{ ...sectionTitleStyle(), fontSize: 10, marginBottom: 4 }}>Placement Mode</div>
            <div style={{ color: gameUiTheme.muted, fontFamily: gameUiFonts.body, fontSize: 8, lineHeight: 1.3 }}>
              Click grass tiles to place. ESC to cancel.
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => engine.selectTowerType(null)}
              style={{ ...buttonStyle("ghost"), color: gameUiTheme.danger, marginTop: 6 }}
            >
              Cancel
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}