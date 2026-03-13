// ============================================================
// Fantasy Tower Defense — Settings Panel
// Clean in-game UI revamp
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
        background: "rgba(7, 23, 25, 0.5)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        onClick={(event) => event.stopPropagation()}
        style={{
          ...panelStyle({ padding: "22px" }),
          width: "min(380px, 100%)",
          boxShadow: gameUiTheme.shadow,
        }}
      >
        <div style={{ ...sectionTitleStyle(), fontSize: 24, textAlign: "center" }}>Settings</div>
        <div
          style={{
            color: gameUiTheme.muted,
            fontFamily: gameUiFonts.body,
            fontSize: 12,
            textAlign: "center",
            marginTop: 6,
            marginBottom: 18,
          }}
        >
          Tune the audio without leaving the battle.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...panelStyle({ padding: "14px" }), background: gameUiTheme.surfaceSoft }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ color: gameUiTheme.textStrong, fontFamily: gameUiFonts.body, fontSize: 14, fontWeight: 700 }}>
                  Sound Effects
                </div>
                <div style={{ color: gameUiTheme.muted, fontFamily: gameUiFonts.body, fontSize: 11, marginTop: 3 }}>
                  Tower placement, upgrades, impact sounds.
                </div>
              </div>
              <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={handleToggleSfx} style={sfxMuted ? buttonStyle("danger") : buttonStyle("success")}>
                {sfxMuted ? "Muted" : "On"}
              </motion.button>
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: "14px" }), background: gameUiTheme.surfaceSoft }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ color: gameUiTheme.textStrong, fontFamily: gameUiFonts.body, fontSize: 14, fontWeight: 700 }}>
                  Music Volume
                </div>
                <div style={{ color: gameUiTheme.muted, fontFamily: gameUiFonts.body, fontSize: 11, marginTop: 3 }}>
                  Ambient soundtrack intensity.
                </div>
              </div>
              <div style={{ color: gameUiTheme.accentStrong, fontFamily: gameUiFonts.numbers, fontSize: 14, fontWeight: 700 }}>
                {Math.round(musicVolume * 100)}%
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(musicVolume * 100)}
              onChange={(event) => handleMusicVolume(Number(event.target.value) / 100)}
              style={{ width: "100%", accentColor: gameUiTheme.accentStrong, cursor: "pointer" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={onClose} style={buttonStyle("accent")}>
            Done
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
