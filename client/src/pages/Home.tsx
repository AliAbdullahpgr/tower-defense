"use client";

// ============================================================
// Fantasy Tower Defense — Main Game Page
// Design: Painterly Storybook Fantasy
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { GameEngine } from "../game/engine";
import type { GameEngineState } from "../game/engine";
import GameCanvas from "../components/GameCanvas";
import GameHUD from "../components/GameHUD";
import TowerShop from "../components/TowerShop";
import MenuScreen from "../components/MenuScreen";
import GameOverlay from "../components/GameOverlay";
import SettingsPanel from "../components/SettingsPanel";
import { Music, SFX } from "../game/audio";

// Singleton engine to avoid re-creation issues
let globalEngine: GameEngine | null = null;

export default function Home() {
  const [gameState, setGameState] = useState<GameEngineState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const engineRef = useRef<GameEngine | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!globalEngine) {
      globalEngine = new GameEngine(state => {
        setGameState({ ...state });
      });
    } else {
      globalEngine.setStateChangeCallback(state => {
        setGameState({ ...state });
      });
    }

    engineRef.current = globalEngine;
    setGameState({ ...globalEngine.getState() });

    return () => {
      // Don't stop the engine on cleanup — just detach
    };
  }, []);

  const handleStart = useCallback(
    (
      mapId?: import("../game/types").MapId,
      difficulty?: import("../game/types").Difficulty
    ) => {
      engineRef.current?.startGame(mapId, difficulty);
      if (!SFX.muted) Music.start();
    },
    []
  );

  const handleRestart = useCallback(() => {
    engineRef.current?.startGame();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pauseGame();
  }, []);

  const handleNextWave = useCallback(() => {
    if (engineRef.current) {
      const s = engineRef.current.getState();
      if (!s.waveInProgress) engineRef.current.startNextWave();
    }
  }, []);

  const handleSendNextWave = useCallback(() => {
    engineRef.current?.sendNextWaveDuringWave();
  }, []);

  const handleReturnToMenu = useCallback(() => {
    Music.stop();
    engineRef.current?.stopGame();
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  // All tower types in order for hotkey selection
  const TOWER_HOTKEYS: Array<[string, import("../game/types").TowerType]> = [
    ['1', 'archer'],
    ['2', 'mage'],
    ['3', 'cannon'],
    ['4', 'frost'],
    ['5', 'lightning'],
    ['6', 'poison'],
    ['7', 'ballista'],
    ['8', 'infantry'],
    ['9', 'archer_barracks'],
    ['0', 'pikeman_barracks'],
    ['q', 'hero'],
    ['w', 'paladin_shrine'],
    ['e', 'beastmaster'],
    ['r', 'necromancer'],
    ['t', 'catapult'],
    ['y', 'tesla'],
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't handle hotkeys when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Escape") {
        if (showSettings) {
          setShowSettings(false);
        } else {
          engineRef.current?.selectTowerType(null);
          engineRef.current?.selectTower(null);
        }
      }
      if (e.key === " " || e.key === "p" || e.key === "P") {
        e.preventDefault();
        engineRef.current?.pauseGame();
      }

      const towerType = TOWER_HOTKEYS.find(([key]) => key === e.key.toLowerCase())?.[1];
      if (towerType) {
        const currentState = engineRef.current?.getState();
        if (currentState?.gameState === 'playing') {
          if (currentState.selectedTowerType === towerType) {
            engineRef.current?.selectTowerType(null);
          } else {
            engineRef.current?.selectTowerType(towerType);
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSettings]);

  if (!gameState || !engineRef.current) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a1a1a",
        }}
      >
        <div
          style={{
            color: "#4dd0e1",
            fontSize: "1.25rem",
            fontFamily: "'Uncial Antiqua', serif",
          }}
        >
          Loading the realm...
        </div>
      </div>
    );
  }

  const gs = gameState.gameState;
  const isMenu = gs === "menu";

  if (isMenu) {
    return (
      <MenuScreen
        onStart={(mapId, difficulty) => handleStart(mapId, difficulty)}
      />
    );
  }

  // Full-screen game layout — fits exactly in viewport
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#0a1a1a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HUD bar — fixed height */}
      <GameHUD
        state={gameState}
        engine={engineRef.current!}
        onPause={handlePause}
        onNextWave={handleNextWave}
        onSendNextWave={handleSendNextWave}
        onReturnToMenu={handleReturnToMenu}
      />

      {/* Main game area — takes remaining height */}
      <div
        style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}
      >
        {/* Canvas area */}
        <div
          style={{
            position: "relative",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <GameCanvas engine={engineRef.current} state={gameState} />
          {/* Overlay for victory/defeat/pause */}
          {gs !== "playing" && (
            <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
              <GameOverlay
                state={gameState}
                onStart={handleStart}
                onRestart={handleRestart}
                onReturnToMenu={handleReturnToMenu}
                onResume={handlePause}
                onOpenSettings={handleOpenSettings}
              />
            </div>
          )}
        </div>

        {/* Tower Shop sidebar */}
        <TowerShop state={gameState} engine={engineRef.current} />
      </div>

      {/* Footer hint bar */}
      <div
        style={{
          padding: "4px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "10px",
          background: "linear-gradient(90deg, #0a1a1a, #1a3a3a, #0a1a1a)",
          borderTop: "1px solid #2a5a5a",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#4a8a8a", fontFamily: "'Philosopher', serif" }}>
          ESC: Deselect · Space/P: Pause · 1-0, Q-Y: Select Tower
        </span>
        <span style={{ color: "#3a6a6a", fontFamily: "'Philosopher', serif" }}>
          Fantasy Tower Defense
        </span>
      </div>

      {/* Settings Panel Overlay */}
      {showSettings && (
        <SettingsPanel onClose={handleCloseSettings} />
      )}
    </div>
  );
}
