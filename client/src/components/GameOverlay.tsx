// ============================================================
// Fantasy Tower Defense — Game Overlay Screens (Mega Expansion)
// Design: Painterly Storybook Fantasy
// Features: Victory/Defeat with high score saving, stats display
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameEngineState } from '../game/engine';

interface GameOverlayProps {
  state: GameEngineState;
  onStart: () => void;
  onRestart: () => void;
  onReturnToMenu: () => void;
  onResume: () => void;
  onOpenSettings?: () => void;
}

interface HighScore {
  name: string;
  score: number;
  wave: number;
  map: string;
  difficulty: string;
  date: string;
}

function saveHighScore(score: HighScore) {
  try {
    const scores: HighScore[] = JSON.parse(localStorage.getItem('ftd_highscores') || '[]');
    scores.push(score);
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('ftd_highscores', JSON.stringify(scores.slice(0, 20)));
  } catch { /* ignore */ }
}

export default function GameOverlay({ state, onStart, onRestart, onReturnToMenu, onResume, onOpenSettings }: GameOverlayProps) {
  const { gameState } = state;

  return (
    <AnimatePresence>
      {gameState === 'victory' && (
        <VictoryScreen key="victory" state={state} onRestart={onRestart} onReturnToMenu={onReturnToMenu} />
      )}
      {gameState === 'defeat' && (
        <DefeatScreen key="defeat" state={state} onRestart={onRestart} onReturnToMenu={onReturnToMenu} />
      )}
      {gameState === 'paused' && (
        <PauseScreen key="paused" onResume={onResume} onReturnToMenu={onReturnToMenu} onOpenSettings={onOpenSettings} />
      )}
    </AnimatePresence>
  );
}

function VictoryScreen({ state, onRestart, onReturnToMenu }: { state: GameEngineState; onRestart: () => void; onReturnToMenu: () => void }) {
  const { stats, mapId, difficulty } = state;
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    saveHighScore({
      name: name.trim(),
      score: stats.score,
      wave: stats.wave,
      map: mapId,
      difficulty,
      date: new Date().toLocaleDateString(),
    });
    setSaved(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        background: 'radial-gradient(ellipse at center, rgba(20,60,15,0.92) 0%, rgba(0,0,0,0.88) 100%)',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
        style={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}
      >
        <div style={{ fontSize: '56px', marginBottom: '8px' }}>🏆</div>
        <h1
          style={{
            fontFamily: "'Uncial Antiqua', serif",
            fontSize: '40px',
            fontWeight: 'bold',
            color: '#fde68a',
            marginBottom: '6px',
            textShadow: '0 0 30px rgba(255,215,0,0.5)',
          }}
        >
          Victory!
        </h1>
        <p style={{ color: '#86efac', fontSize: '14px', marginBottom: '20px', fontFamily: "'Philosopher', serif" }}>
          The realm is saved! All {stats.totalWaves} waves defeated!
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <StatCard icon="⭐" label="Final Score" value={stats.score.toLocaleString()} color="#fde68a" />
          <StatCard icon="💰" label="Gold Remaining" value={`${stats.gold}g`} color="#fbbf24" />
          <StatCard icon="⚔" label="Enemies Slain" value={stats.enemiesKilled} color="#86efac" />
          <StatCard icon="🏰" label="Towers Built" value={stats.towersPlaced} color="#93c5fd" />
          <StatCard icon="💥" label="Damage Dealt" value={stats.damageDealt.toLocaleString()} color="#fca5a5" />
          <StatCard icon="🌊" label="Waves Survived" value={stats.wavesSurvived} color="#c4b5fd" />
        </div>

        {/* High score save */}
        {!saved ? (
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #78350f',
                background: 'rgba(45,26,8,0.8)',
                color: '#fde68a',
                fontSize: '12px',
                fontFamily: "'Philosopher', serif",
                outline: 'none',
              }}
            />
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #FFD700',
                background: name.trim() ? 'rgba(120,80,0,0.6)' : 'rgba(45,26,8,0.4)',
                color: name.trim() ? '#fbbf24' : '#78350f',
                fontSize: '11px',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                fontFamily: "'Philosopher', serif",
              }}
            >
              Save Score
            </button>
          </div>
        ) : (
          <div style={{ color: '#86efac', fontSize: '12px', marginBottom: '16px' }}>
            ✓ Score saved to Hall of Fame!
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            style={{
              padding: '12px 36px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#fde68a',
              borderRadius: '10px',
              border: '2px solid #fbbf24',
              background: 'linear-gradient(135deg, #78350f, #b45309)',
              cursor: 'pointer',
              fontFamily: "'Uncial Antiqua', serif",
              boxShadow: '0 0 20px rgba(251,191,36,0.3)',
            }}
          >
            ⚔ Play Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReturnToMenu}
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#d97706',
              borderRadius: '10px',
              border: '2px solid #78350f',
              background: 'rgba(45,26,8,0.8)',
              cursor: 'pointer',
              fontFamily: "'Philosopher', serif",
            }}
          >
            Return to Menu
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DefeatScreen({ state, onRestart, onReturnToMenu }: { state: GameEngineState; onRestart: () => void; onReturnToMenu: () => void }) {
  const { stats, mapId, difficulty } = state;
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    saveHighScore({
      name: name.trim(),
      score: stats.score,
      wave: stats.wave,
      map: mapId,
      difficulty,
      date: new Date().toLocaleDateString(),
    });
    setSaved(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        background: 'radial-gradient(ellipse at center, rgba(60,10,10,0.92) 0%, rgba(0,0,0,0.9) 100%)',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
        style={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}
      >
        <div style={{ fontSize: '56px', marginBottom: '8px' }}>💀</div>
        <h1
          style={{
            fontFamily: "'Uncial Antiqua', serif",
            fontSize: '40px',
            fontWeight: 'bold',
            color: '#fca5a5',
            marginBottom: '6px',
            textShadow: '0 0 30px rgba(239,68,68,0.5)',
          }}
        >
          Defeated!
        </h1>
        <p style={{ color: '#fca5a5', fontSize: '14px', marginBottom: '20px', fontFamily: "'Philosopher', serif" }}>
          The castle has fallen... The dark horde prevails.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <StatCard icon="🌊" label="Wave Reached" value={`${stats.wave} / ${stats.totalWaves}`} color="#fca5a5" />
          <StatCard icon="⭐" label="Score" value={stats.score.toLocaleString()} color="#fde68a" />
          <StatCard icon="⚔" label="Enemies Slain" value={stats.enemiesKilled} color="#fdba74" />
          <StatCard icon="🏰" label="Towers Built" value={stats.towersPlaced} color="#93c5fd" />
          <StatCard icon="💥" label="Damage Dealt" value={stats.damageDealt.toLocaleString()} color="#fca5a5" />
          <StatCard icon="💰" label="Gold Earned" value={`${stats.goldEarned}g`} color="#fbbf24" />
        </div>

        {/* High score save */}
        {!saved ? (
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #78350f',
                background: 'rgba(45,26,8,0.8)',
                color: '#fde68a',
                fontSize: '12px',
                fontFamily: "'Philosopher', serif",
                outline: 'none',
              }}
            />
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #ef4444',
                background: name.trim() ? 'rgba(120,20,20,0.6)' : 'rgba(45,26,8,0.4)',
                color: name.trim() ? '#fca5a5' : '#78350f',
                fontSize: '11px',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                fontFamily: "'Philosopher', serif",
              }}
            >
              Save Score
            </button>
          </div>
        ) : (
          <div style={{ color: '#86efac', fontSize: '12px', marginBottom: '16px' }}>
            ✓ Score saved to Hall of Fame!
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            style={{
              padding: '12px 36px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#fca5a5',
              borderRadius: '10px',
              border: '2px solid #ef4444',
              background: 'linear-gradient(135deg, #7f1d1d, #450a0a)',
              cursor: 'pointer',
              fontFamily: "'Uncial Antiqua', serif",
              boxShadow: '0 0 20px rgba(239,68,68,0.3)',
            }}
          >
            🔄 Try Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReturnToMenu}
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#d97706',
              borderRadius: '10px',
              border: '2px solid #78350f',
              background: 'rgba(45,26,8,0.8)',
              cursor: 'pointer',
              fontFamily: "'Philosopher', serif",
            }}
          >
            Return to Menu
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PauseScreen({ onResume, onReturnToMenu, onOpenSettings }: { onResume: () => void; onReturnToMenu: () => void; onOpenSettings?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        background: 'rgba(0,0,0,0.65)',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.4 }}
        style={{
          textAlign: 'center',
          background: 'rgba(13,7,2,0.95)',
          border: '2px solid #78350f',
          borderRadius: '16px',
          padding: '32px 48px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            fontFamily: "'Uncial Antiqua', serif",
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#fde68a',
            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
            marginBottom: '20px',
          }}
        >
          ⏸ Paused
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onResume}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#86efac',
              borderRadius: '8px',
              border: '2px solid #22c55e',
              background: 'linear-gradient(135deg, #166534, #15803d)',
              cursor: 'pointer',
              fontFamily: "'Philosopher', serif",
            }}
          >
            ▶ Resume
          </motion.button>

          {onOpenSettings && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenSettings}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#fde68a',
                borderRadius: '8px',
                border: '2px solid #78350f',
                background: 'rgba(45,26,8,0.8)',
                cursor: 'pointer',
                fontFamily: "'Philosopher', serif",
              }}
            >
              ⚙ Settings
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReturnToMenu}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#fca5a5',
              borderRadius: '8px',
              border: '2px solid #991b1b',
              background: 'rgba(127,29,29,0.6)',
              cursor: 'pointer',
              fontFamily: "'Philosopher', serif",
            }}
          >
            ✕ Quit to Menu
          </motion.button>
        </div>

        <div
          style={{
            fontSize: '11px',
            color: '#78350f',
            marginTop: '16px',
            fontFamily: "'Philosopher', serif",
          }}
        >
          Press P or Space to resume
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(120,53,15,0.5)',
        borderRadius: '8px',
        padding: '10px 14px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color, fontFamily: "'Philosopher', serif" }}>
        {value}
      </div>
      <div style={{ color: '#78350f', fontSize: '10px' }}>{label}</div>
    </div>
  );
}
