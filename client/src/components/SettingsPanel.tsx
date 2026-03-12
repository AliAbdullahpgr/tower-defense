// ============================================================
// Fantasy Tower Defense — Settings Panel
// Volume controls, mute toggle
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SFX, Music } from '../game/audio';

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
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.3 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(13,7,2,0.95)',
          border: '2px solid #78350f',
          borderRadius: '16px',
          padding: '24px 32px',
          minWidth: '300px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            fontFamily: "'Uncial Antiqua', serif",
            fontSize: '20px',
            color: '#fbbf24',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          Settings
        </div>

        {/* SFX Mute Toggle */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                color: '#fde68a',
                fontSize: '13px',
                fontFamily: "'Philosopher', serif",
              }}
            >
              Sound Effects
            </span>
            <button
              onClick={handleToggleSfx}
              style={{
                padding: '4px 14px',
                borderRadius: '6px',
                border: sfxMuted ? '1px solid #991b1b' : '1px solid #22c55e',
                background: sfxMuted ? 'rgba(127,29,29,0.4)' : 'rgba(22,101,52,0.4)',
                color: sfxMuted ? '#fca5a5' : '#86efac',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: "'Philosopher', serif",
              }}
            >
              {sfxMuted ? 'MUTED' : 'ON'}
            </button>
          </div>
        </div>

        {/* Music Volume */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                color: '#fde68a',
                fontSize: '13px',
                fontFamily: "'Philosopher', serif",
              }}
            >
              Music Volume
            </span>
            <span
              style={{
                color: '#d97706',
                fontSize: '11px',
                fontFamily: "'Philosopher', serif",
              }}
            >
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(musicVolume * 100)}
            onChange={e => handleMusicVolume(Number(e.target.value) / 100)}
            style={{
              width: '100%',
              accentColor: '#fbbf24',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Close button */}
        <div style={{ textAlign: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            style={{
              padding: '8px 28px',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#fde68a',
              borderRadius: '8px',
              border: '2px solid #78350f',
              background: 'rgba(45,26,8,0.8)',
              cursor: 'pointer',
              fontFamily: "'Philosopher', serif",
            }}
          >
            Done
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
