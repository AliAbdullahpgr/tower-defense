// ============================================================
// Fantasy Tower Defense — Settings Panel
// Dark Fantasy Minimalist UI
// ============================================================

import { useState } from "react";
import { motion } from "framer-motion";
import { Music, SFX } from "../game/audio";
import {
  buttonStyle,
  gameUiFonts,
  gameUiTheme,
  panelStyle,
  sectionTitleStyle,
} from "../lib/game-ui-theme";

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [sfxMuted, setSfxMuted] = useState(SFX.muted);
  const [musicVolume, setMusicVolume] = useState(Music.volume);

  const handleToggleSfx = () => {
    SFX.toggle();
    setSfxMuted(SFX.muted);
    if (SFX.muted) {
      Music.stop();
    } else {
      Music.start();
    }
  };

  const handleMusicVolume = (value: number) => {
    Music.volume = value;
    setMusicVolume(value);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(5, 15, 15, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        onClick={(event) => event.stopPropagation()}
        style={{
          ...panelStyle({ padding: "24px", glow: true }),
          width: "min(360px, 100%)",
        }}
      >
        <div style={{ ...sectionTitleStyle(), fontSize: 22, textAlign: "center", marginBottom: 6 }}>
          ⚙ Settings
        </div>
        <div style={{
          color: gameUiTheme.muted,
          fontFamily: gameUiFonts.body,
          fontSize: 11,
          textAlign: "center",
          marginBottom: 20,
        }}>
          Adjust audio and gameplay options
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...panelStyle({ padding: "14px" }), background: gameUiTheme.surfaceSoft }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ color: gameUiTheme.text, fontFamily: gameUiFonts.body, fontSize: 13, fontWeight: 600 }}>
                  Sound Effects
                </div>
                <div style={{ color: gameUiTheme.mutedSoft, fontFamily: gameUiFonts.body, fontSize: 10, marginTop: 2 }}>
                  Tower actions, combat sounds
                </div>
              </div>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleToggleSfx}
                style={{
                  ...buttonStyle(sfxMuted ? "danger" : "success"),
                  padding: "6px 14px",
                  fontSize: 11,
                }}
              >
                {sfxMuted ? "Off" : "On"}
              </motion.button>
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: "14px" }), background: gameUiTheme.surfaceSoft }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ color: gameUiTheme.text, fontFamily: gameUiFonts.body, fontSize: 13, fontWeight: 600 }}>
                  Music Volume
                </div>
                <div style={{ color: gameUiTheme.mutedSoft, fontFamily: gameUiFonts.body, fontSize: 10, marginTop: 2 }}>
                  Ambient soundtrack
                </div>
              </div>
              <div style={{
                color: gameUiTheme.accent,
                fontFamily: gameUiFonts.numbers,
                fontSize: 13,
                fontWeight: 700,
              }}>
                {Math.round(musicVolume * 100)}%
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(musicVolume * 100)}
              onChange={(event) => handleMusicVolume(Number(event.target.value) / 100)}
              style={{
                width: "100%",
                accentColor: gameUiTheme.accent,
                cursor: "pointer",
                height: 4,
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            style={buttonStyle("accent")}
          >
            Done
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}