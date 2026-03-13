// ============================================================
// Fantasy Tower Defense — Tower Shop Sidebar
// Clean in-game UI revamp
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
    icon: "Arc",
    towers: [
      "archer",
      "mage",
      "cannon",
      "frost",
      "lightning",
      "poison",
      "ballista",
    ],
  },
  {
    label: "Barracks",
    icon: "Guard",
    towers: [
      "infantry",
      "archer_barracks",
      "pikeman_barracks",
      "hero",
      "paladin_shrine",
    ],
  },
  {
    label: "Summons",
    icon: "Wild",
    towers: ["beastmaster", "necromancer"],
  },
  {
    label: "Siege",
    icon: "Heavy",
    towers: ["catapult", "tesla"],
  },
];

const TOWER_HOTKEY_MAP: Partial<Record<TowerType, string>> = {
  archer: "1",
  mage: "2",
  cannon: "3",
  frost: "4",
  lightning: "5",
  poison: "6",
  ballista: "7",
  infantry: "8",
  archer_barracks: "9",
  pikeman_barracks: "0",
  hero: "Q",
  paladin_shrine: "W",
  beastmaster: "E",
  necromancer: "R",
  catapult: "T",
  tesla: "Y",
};

const TARGETING_MODES: Array<{
  mode: TargetingMode;
  short: string;
  label: string;
  color: string;
}> = [
  { mode: "first", short: "1st", label: "First", color: gameUiTheme.success },
  { mode: "last", short: "Last", label: "Last", color: gameUiTheme.info },
  { mode: "strongest", short: "Strong", label: "Strongest", color: gameUiTheme.danger },
  { mode: "weakest", short: "Weak", label: "Weakest", color: gameUiTheme.warning },
  { mode: "fastest", short: "Fast", label: "Fastest", color: gameUiTheme.violet },
];

const ABILITY_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; background: string }
> = {
  lightningStorm: {
    label: "Storm",
    icon: "LT",
    color: gameUiTheme.info,
    background: gameUiTheme.infoSoft,
  },
  freezeWave: {
    label: "Freeze",
    icon: "FR",
    color: gameUiTheme.accent,
    background: gameUiTheme.accentSoft,
  },
  goldRush: {
    label: "Gold",
    icon: "GD",
    color: gameUiTheme.warning,
    background: gameUiTheme.warningSoft,
  },
};

function TowerPreviewCanvas({ type, size = 64 }: { type: TowerType; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bg = ctx.createLinearGradient(0, 0, size, size);
    bg.addColorStop(0, "#f9fcfb");
    bg.addColorStop(1, "#e8f3f0");
    ctx.fillStyle = bg;
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
        borderRadius: 14,
        border: `1px solid ${gameUiTheme.border}`,
        background: "#f8fcfb",
        boxShadow: gameUiTheme.inset,
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
  ability: {
    type: string;
    name: string;
    description: string;
    cooldown: number;
    currentCooldown: number;
    active: boolean;
  };
  onUse: () => void;
}) {
  const ready = ability.currentCooldown <= 0 && !ability.active;
  const config = ABILITY_CONFIG[ability.type] || {
    label: ability.name,
    icon: "--",
    color: gameUiTheme.accent,
    background: gameUiTheme.accentSoft,
  };

  return (
    <motion.button
      whileHover={ready ? { y: -1 } : {}}
      whileTap={ready ? { scale: 0.98 } : {}}
      onClick={onUse}
      disabled={!ready}
      title={ability.description}
      style={{
        ...panelStyle({ padding: "10px 10px 9px" }),
        background: ability.active ? config.background : gameUiTheme.surfaceSoft,
        border: `1px solid ${ability.active ? config.color : gameUiTheme.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 5,
        flex: 1,
        cursor: ready ? "pointer" : "not-allowed",
        opacity: ready || ability.active ? 1 : 0.6,
      }}
    >
      <span
        style={{
          ...chipStyle({ active: true, color: config.color, background: `${config.color}16` }),
          padding: "3px 7px",
          minWidth: 0,
        }}
      >
        {config.icon}
      </span>
      <div style={{ textAlign: "left" }}>
        <div
          style={{
            color: gameUiTheme.textStrong,
            fontFamily: gameUiFonts.body,
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {config.label}
        </div>
        <div
          style={{
            color: ability.active
              ? config.color
              : ready
                ? gameUiTheme.muted
                : gameUiTheme.danger,
            fontFamily: gameUiFonts.body,
            fontSize: 10,
            marginTop: 2,
          }}
        >
          {ability.active
            ? "Active"
            : ready
              ? "Ready"
              : `${Math.ceil(ability.currentCooldown / 1000)}s`}
        </div>
      </div>
    </motion.button>
  );
}

function TowerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        ...panelStyle({ padding: "7px 8px" }),
        background: gameUiTheme.surfaceSoft,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        minWidth: 0,
      }}
    >
      <span
        style={{
          color: gameUiTheme.mutedSoft,
          fontFamily: gameUiFonts.body,
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
      <span style={{ ...metricValueStyle(), fontSize: 12 }}>{value}</span>
    </div>
  );
}

function TagPill({ color, text }: { color: string; text: string }) {
  return (
    <span
      style={{
        ...chipStyle({ active: true, color, background: `${color}14` }),
        padding: "3px 8px",
        fontSize: 9,
      }}
    >
      {text}
    </span>
  );
}

function SelectedTowerPanel({
  state,
  engine,
}: {
  state: GameEngineState;
  engine: GameEngine;
}) {
  const selectedTower = state.selectedTowerId
    ? state.towers.find((tower) => tower.id === state.selectedTowerId)
    : null;

  if (!selectedTower) return null;

  const canUpgrade =
    selectedTower.level < 3 && state.stats.gold >= selectedTower.upgradeCost;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{ ...panelStyle({ padding: "14px" }), display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <TowerPreviewCanvas type={selectedTower.type} size={62} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ ...sectionTitleStyle(), fontSize: 16 }}>{selectedTower.name}</div>
          <div
            style={{
              color: gameUiTheme.muted,
              fontFamily: gameUiFonts.body,
              fontSize: 11,
              marginTop: 3,
            }}
          >
            Level {selectedTower.level} · Sell for {selectedTower.sellValue}g
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background:
                    index < selectedTower.level
                      ? gameUiTheme.warning
                      : "rgba(97, 128, 135, 0.22)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        <TowerMetric label="Damage" value={selectedTower.damage.toString()} />
        <TowerMetric label="Range" value={selectedTower.range.toFixed(1)} />
        <TowerMetric
          label="Rate"
          value={selectedTower.fireRate > 0 ? `${selectedTower.fireRate.toFixed(1)}/s` : "Unit"}
        />
        <TowerMetric
          label="Bonus"
          value={selectedTower.powerBonus > 0 ? `+${Math.round(selectedTower.powerBonus * 25)}%` : "None"}
        />
      </div>

      <div>
        <div
          style={{
            color: gameUiTheme.mutedSoft,
            fontFamily: gameUiFonts.body,
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 0.7,
            marginBottom: 6,
          }}
        >
          Targeting
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6 }}>
          {TARGETING_MODES.map((item) => {
            const active = selectedTower.targetingMode === item.mode;
            return (
              <motion.button
                key={item.mode}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => engine.setTargetingMode(selectedTower.id, item.mode)}
                title={item.label}
                style={{
                  ...chipStyle({ active, color: item.color, background: active ? `${item.color}16` : gameUiTheme.surfaceSoft }),
                  width: "100%",
                  minWidth: 0,
                  padding: "8px 4px",
                  fontSize: 9,
                }}
              >
                {item.short}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {selectedTower.level < 3 ? (
          <motion.button
            whileHover={canUpgrade ? { y: -1 } : {}}
            whileTap={canUpgrade ? { scale: 0.98 } : {}}
            onClick={() => {
              engine.upgradeTower(selectedTower.id);
              SFX.towerUpgrade();
            }}
            disabled={!canUpgrade}
            style={{
              ...buttonStyle("accent"),
              flex: 1,
              opacity: canUpgrade ? 1 : 0.55,
              cursor: canUpgrade ? "pointer" : "not-allowed",
            }}
          >
            Upgrade {selectedTower.upgradeCost}g
          </motion.button>
        ) : (
          <div
            style={{
              ...chipStyle({ active: true, color: gameUiTheme.warning, background: gameUiTheme.warningSoft }),
              flex: 1,
              padding: "10px 14px",
              justifyContent: "center",
            }}
          >
            Max Level
          </div>
        )}
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            engine.sellTower(selectedTower.id);
            SFX.towerSell();
          }}
          style={{ ...buttonStyle("danger"), flex: 1 }}
        >
          Sell {selectedTower.sellValue}g
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

  const tone = canAfford ? def.color : gameUiTheme.mutedSoft;

  return (
    <motion.button
      whileHover={canAfford || selected ? { y: -1 } : {}}
      whileTap={canAfford || selected ? { scale: 0.985 } : {}}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      disabled={!canAfford && !selected}
      style={{
        ...panelStyle({ padding: "12px" }),
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        textAlign: "left",
        width: "100%",
        background: selected
          ? `${def.color}12`
          : hovered
            ? gameUiTheme.surfaceStrong
            : gameUiTheme.surface,
        border: `1px solid ${selected ? def.color : gameUiTheme.border}`,
        opacity: canAfford || selected ? 1 : 0.56,
        cursor: canAfford || selected ? "pointer" : "not-allowed",
        position: "relative",
        overflow: "hidden",
      }}
      title={def.description}
    >
      {selected ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: def.color,
          }}
        />
      ) : null}

      <div style={{ position: "relative" }}>
        <TowerPreviewCanvas type={type} />
        {TOWER_HOTKEY_MAP[type] ? (
          <span
            style={{
              position: "absolute",
              top: -5,
              left: -5,
              ...chipStyle({ active: true, color: gameUiTheme.textStrong, background: gameUiTheme.surfaceStrong }),
              padding: "3px 6px",
              minWidth: 0,
              boxShadow: gameUiTheme.shadowSoft,
            }}
          >
            {TOWER_HOTKEY_MAP[type]}
          </span>
        ) : null}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: selected ? def.color : gameUiTheme.textStrong,
                fontFamily: gameUiFonts.body,
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.15,
              }}
            >
              {def.name}
            </div>
            <div
              style={{
                color: gameUiTheme.muted,
                fontFamily: gameUiFonts.body,
                fontSize: 10,
                lineHeight: 1.4,
                marginTop: 4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {def.description}
            </div>
          </div>
          <span
            style={{
              ...chipStyle({ active: true, color: tone, background: `${tone}12` }),
              fontFamily: gameUiFonts.numbers,
              padding: "5px 9px",
              flexShrink: 0,
            }}
          >
            {def.cost}g
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, marginTop: 10 }}>
          <TowerMetric label="Damage" value={def.damage.toString()} />
          <TowerMetric label="Range" value={def.range.toFixed(1)} />
          <TowerMetric
            label="Rate"
            value={def.fireRate > 0 ? `${def.fireRate.toFixed(1)}/s` : "Unit"}
          />
        </div>

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
          {def.specialEffect ? <TagPill color={gameUiTheme.violet} text={def.specialEffect.toUpperCase()} /> : null}
          {def.unitType ? <TagPill color={gameUiTheme.success} text="SUMMON" /> : null}
          {def.isAirCapable ? <TagPill color={gameUiTheme.info} text="AIR" /> : null}
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
    <div
      style={{
        width: 304,
        minWidth: 304,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        padding: 12,
        background: "linear-gradient(180deg, rgba(233,244,242,0.88), rgba(242,248,247,0.92))",
        borderLeft: `1px solid ${gameUiTheme.border}`,
        boxShadow: "inset 1px 0 0 rgba(255,255,255,0.45)",
        overflowY: "auto",
        overflowX: "hidden",
        flexShrink: 0,
      }}
    >
      <div style={{ ...panelStyle({ padding: "14px" }), marginBottom: 10 }}>
        <div style={{ ...sectionTitleStyle(), fontSize: 18 }}>Tower Shop</div>
        <div
          style={{
            color: gameUiTheme.muted,
            fontFamily: gameUiFonts.body,
            fontSize: 11,
            marginTop: 4,
          }}
        >
          Clean loadout, faster reading, better control.
        </div>
      </div>

      <AnimatePresence>{state.selectedTowerId ? <SelectedTowerPanel state={state} engine={engine} /> : null}</AnimatePresence>

      {abilities.length > 0 ? (
        <div style={{ ...panelStyle({ padding: "12px" }), marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={sectionTitleStyle()}>Abilities</div>
            <span style={{ ...chipStyle(), padding: "4px 9px" }}>Global</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {abilities.map((ability) => (
              <AbilityButton
                key={ability.type}
                ability={ability}
                onUse={() => engine.activateAbility(ability.type)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {state.activeSynergies.length > 0 ? (
        <div style={{ ...panelStyle({ padding: "12px" }), marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={sectionTitleStyle()}>Synergies</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {state.activeSynergies.map((synergy) => (
              <span
                key={synergy.name}
                title={synergy.description}
                style={{ ...chipStyle({ active: true, color: gameUiTheme.violet, background: gameUiTheme.violetSoft }), padding: "5px 10px" }}
              >
                {synergy.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ ...panelStyle({ padding: "8px" }), marginTop: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
          {TOWER_CATEGORIES.map((category, index) => {
            const active = index === activeCategory;
            return (
              <motion.button
                key={category.label}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(index)}
                style={{
                  ...chipStyle({ active, color: gameUiTheme.accentStrong, background: active ? gameUiTheme.accentSoft : gameUiTheme.surfaceSoft }),
                  width: "100%",
                  padding: "10px 8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 9, opacity: 0.85 }}>{category.icon}</span>
                <span>{category.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={TOWER_CATEGORIES[activeCategory].label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
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
        {selectedTowerType ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            style={{ ...panelStyle({ padding: "12px" }), marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{ ...sectionTitleStyle(), fontSize: 14 }}>Placement Mode</div>
            <div
              style={{
                color: gameUiTheme.muted,
                fontFamily: gameUiFonts.body,
                fontSize: 11,
                lineHeight: 1.45,
              }}
            >
              Click any open grass tile to place the selected tower.
            </div>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => engine.selectTowerType(null)}
              style={buttonStyle("ghost")}
            >
              Cancel placement
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div style={{ ...panelStyle({ padding: "12px" }), marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <TowerMetric label="Towers" value={state.towers.length.toString()} />
        <TowerMetric label="Allies" value={state.alliedUnits.filter((unit) => unit.alive).length.toString()} />
        <TowerMetric label="Kills" value={state.stats.enemiesKilled.toString()} />
      </div>
    </div>
  );
}
