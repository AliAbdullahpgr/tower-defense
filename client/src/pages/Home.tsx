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

// Singleton engine to avoid re-creation issues
let globalEngine: GameEngine | null = null;

export default function Home() {
  const [gameState, setGameState] = useState<GameEngineState | null>(null);
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        engineRef.current?.selectTowerType(null);
        engineRef.current?.selectTower(null);
      }
      if (e.key === " " || e.key === "p") {
        e.preventDefault();
        engineRef.current?.pauseGame();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!gameState || !engineRef.current) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0702",
        }}
      >
        <div
          style={{
            color: "#fbbf24",
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
        background: "#0d0702",
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
          background: "linear-gradient(90deg, #1a0f04, #2d1a08, #1a0f04)",
          borderTop: "1px solid #3d2010",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#92400e", fontFamily: "'Philosopher', serif" }}>
          ESC: Deselect · Space/P: Pause
        </span>
        <span style={{ color: "#78350f", fontFamily: "'Philosopher', serif" }}>
          Fantasy Tower Defense ⚔️
        </span>
      </div>
    </div>
  );
}
