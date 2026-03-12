// ============================================================
// Fantasy Tower Defense — Game Engine (Mega Expansion)
// ============================================================

import { nanoid } from 'nanoid';
import type {
  Enemy, Tower, Projectile, FloatingText, Particle,
  GameStats, AlliedUnit, ActiveAbility, ScreenShake,
  TowerType, EnemyType, TargetingMode, Difficulty, MapId
} from './types';
import {
  CELL_SIZE, ENEMY_DEFINITIONS, TOWER_DEFINITIONS,
  WAVE_CONFIGS, STARTING_GOLD, STARTING_LIVES,
  getPathCells, MAP_CONFIGS, ABILITY_DEFINITIONS, DIFFICULTY_MULTIPLIERS
} from './constants';

export interface GameEngineState {
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  alliedUnits: AlliedUnit[];
  floatingTexts: FloatingText[];
  particles: Particle[];
  stats: GameStats;
  gameState: 'menu' | 'playing' | 'paused' | 'victory' | 'defeat';
  selectedTowerType: TowerType | null;
  selectedTowerId: string | null;
  waveInProgress: boolean;
  waveCountdown: number;
  spawnQueue: Array<{ type: EnemyType; delay: number; timer: number }>;
  pathCells: Set<string>;
  towerCells: Set<string>;
  powerSpots: Set<string>;
  abilities: ActiveAbility[];
  screenShake: ScreenShake;
  goldRushActive: boolean;
  goldRushTimer: number;
  mapId: MapId;
  difficulty: Difficulty;
  waypoints: Array<[number, number]>;
  endlessMode: boolean;
  speedMultiplier: number;
  bossHp: number;
  bossMaxHp: number;
  bossActive: boolean;
  nextWavePreview: Array<{ type: EnemyType; count: number }>;
}

function createAbilities(): ActiveAbility[] {
  return Object.values(ABILITY_DEFINITIONS).map(def => ({
    ...def,
    currentCooldown: 0,
    active: false,
    activeTimer: 0,
  }));
}

function createInitialState(mapId: MapId = 'serpentine', difficulty: Difficulty = 'normal'): GameEngineState {
  const mapConfig = MAP_CONFIGS[mapId];
  const waypoints = mapConfig.waypoints as Array<[number, number]>;
  const diffMult = DIFFICULTY_MULTIPLIERS[difficulty];
  const powerSpots = new Set<string>(
    (mapConfig.powerSpots || []).map(([c, r]) => `${c},${r}`)
  );
  return {
    enemies: [],
    towers: [],
    projectiles: [],
    alliedUnits: [],
    floatingTexts: [],
    particles: [],
    stats: {
      wave: 0,
      gold: Math.round(STARTING_GOLD * diffMult.gold),
      lives: diffMult.lives,
      score: 0,
      towersPlaced: 0,
      enemiesKilled: 0,
      totalWaves: WAVE_CONFIGS.length,
      damageDealt: 0,
      goldEarned: Math.round(STARTING_GOLD * diffMult.gold),
      wavesSurvived: 0,
      towerKills: {},
    },
    gameState: 'menu',
    selectedTowerType: null,
    selectedTowerId: null,
    waveInProgress: false,
    waveCountdown: 5000,
    spawnQueue: [],
    pathCells: getPathCells(waypoints),
    towerCells: new Set(),
    powerSpots,
    abilities: createAbilities(),
    screenShake: { intensity: 0, duration: 0, timer: 0 },
    goldRushActive: false,
    goldRushTimer: 0,
    mapId,
    difficulty,
    waypoints,
    endlessMode: false,
    speedMultiplier: 1,
    bossHp: 0,
    bossMaxHp: 0,
    bossActive: false,
    nextWavePreview: [],
  };
}

export class GameEngine {
  private state: GameEngineState;
  private lastTime: number = 0;
  private animFrameId: number = 0;
  private onStateChange: (state: GameEngineState) => void;
  private renderCallback: ((state: GameEngineState, dt: number) => void) | null = null;

  constructor(onStateChange: (state: GameEngineState) => void) {
    this.state = createInitialState();
    this.onStateChange = onStateChange;
  }

  getState(): GameEngineState { return this.state; }

  setRenderCallback(cb: (state: GameEngineState, dt: number) => void) {
    this.renderCallback = cb;
  }

  setStateChangeCallback(cb: (state: GameEngineState) => void) {
    this.onStateChange = cb;
  }

  startGame(mapId: MapId = 'serpentine', difficulty: Difficulty = 'normal') {
    cancelAnimationFrame(this.animFrameId);
    this.state = createInitialState(mapId, difficulty);
    this.state.gameState = 'playing';
    this.state.waveCountdown = 3000;
    this.updateNextWavePreview();
    this.notify();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  pauseGame() {
    if (this.state.gameState === 'playing') {
      this.state.gameState = 'paused';
      cancelAnimationFrame(this.animFrameId);
      this.notify();
    } else if (this.state.gameState === 'paused') {
      this.state.gameState = 'playing';
      this.lastTime = performance.now();
      this.loop(this.lastTime);
      this.notify();
    }
  }

  stopGame() {
    cancelAnimationFrame(this.animFrameId);
    this.state.gameState = 'menu';
    this.notify();
  }

  private loop(timestamp: number) {
    const rawDt = Math.min(timestamp - this.lastTime, 50);
    const dt = rawDt * (this.state.speedMultiplier || 1);
    this.lastTime = timestamp;
    if (this.state.gameState === 'playing') {
      this.update(dt);
      if (this.renderCallback) this.renderCallback(this.state, rawDt);
      this.notify();
    }
    if (this.state.gameState === 'playing') {
      this.animFrameId = requestAnimationFrame((t) => this.loop(t));
    }
  }

  private update(dt: number) {
    this.updateWave(dt);
    this.updateEnemies(dt);
    this.updateTowers(dt);
    this.updateProjectiles(dt);
    this.updateAlliedUnits(dt);
    this.updateAbilities(dt);
    this.updateFloatingTexts(dt);
    this.updateParticles(dt);
    this.updateScreenShake(dt);
    this.cleanupDead();
  }

  // ============================================================
  // WAVE MANAGEMENT
  // ============================================================

  private updateWave(dt: number) {
    const s = this.state;

    // Process spawn queue
    if (s.spawnQueue.length > 0) {
      s.spawnQueue[0].timer -= dt;
      if (s.spawnQueue[0].timer <= 0) {
        const item = s.spawnQueue.shift()!;
        this.spawnEnemy(item.type);
        if (s.spawnQueue.length > 0) {
          s.spawnQueue[0].timer = s.spawnQueue[0].delay;
        }
      }
    }

    // Check if wave is done
    if (s.waveInProgress && s.spawnQueue.length === 0 && s.enemies.length === 0) {
      s.waveInProgress = false;
      s.bossActive = false;
      s.stats.wavesSurvived = s.stats.wave;

      const waveConfig = WAVE_CONFIGS[s.stats.wave - 1];
      if (waveConfig) {
        // Interest system: +1% of current gold per wave
        const interest = Math.floor(s.stats.gold * 0.01);
        const totalReward = waveConfig.reward + interest;
        const goldGain = s.goldRushActive ? totalReward * 2 : totalReward;
        s.stats.gold += goldGain;
        s.stats.goldEarned += goldGain;
        if (interest > 0) this.addFloatingText(540, 80, `+${interest}g interest`, '#F4C842');
        this.addFloatingText(540, 50, `+${waveConfig.reward}g Wave Bonus`, '#FFD700', 1.4);
      }

      // Check victory
      if (s.stats.wave >= WAVE_CONFIGS.length && !s.endlessMode) {
        s.gameState = 'victory';
        return;
      }

      s.waveCountdown = 8000;
      this.updateNextWavePreview();
    }

    // Countdown to next wave
    if (!s.waveInProgress) {
      s.waveCountdown -= dt;
      if (s.waveCountdown <= 0) {
        this.startNextWave();
      }
    }
  }

  startNextWave() {
    const s = this.state;
    s.stats.wave++;
    s.waveInProgress = true;

    let config = WAVE_CONFIGS[s.stats.wave - 1];

    // Endless mode: generate scaled waves beyond wave 20
    if (!config) {
      const scale = 1 + (s.stats.wave - WAVE_CONFIGS.length) * 0.15;
      const allTypes: EnemyType[] = ['darkKnight', 'dragon', 'armored', 'flyer', 'splitterBoss', 'golem', 'troll'];
      config = {
        waveNumber: s.stats.wave,
        enemies: allTypes.slice(0, 3).map(t => ({ type: t, count: Math.round(3 * scale), delay: 1000 })),
        reward: Math.round(300 * scale),
        isBoss: s.stats.wave % 5 === 0,
      };
    }

    s.spawnQueue = [];
    for (const group of config.enemies) {
      for (let i = 0; i < group.count; i++) {
        s.spawnQueue.push({ type: group.type, delay: group.delay, timer: i === 0 ? 0 : group.delay });
      }
    }
    if (s.spawnQueue.length > 0) s.spawnQueue[0].timer = 0;

    // Boss wave: spawn a boss enemy
    if (config.isBoss && config.bossType) {
      const bossDef = ENEMY_DEFINITIONS[config.bossType];
      const scaleFactor = 1 + (s.stats.wave - 1) * 0.1;
      s.bossMaxHp = Math.round(bossDef.hp * scaleFactor * 2);
      s.bossHp = s.bossMaxHp;
      s.bossActive = true;
      s.spawnQueue.push({ type: config.bossType, delay: 3000, timer: 3000 });
    }

    this.updateNextWavePreview();
  }

  private updateNextWavePreview() {
    const s = this.state;
    const nextWaveIdx = s.stats.wave; // 0-indexed for next wave
    if (nextWaveIdx < WAVE_CONFIGS.length) {
      const config = WAVE_CONFIGS[nextWaveIdx];
      s.nextWavePreview = config.enemies.map(e => ({ type: e.type, count: e.count }));
    } else {
      s.nextWavePreview = [];
    }
  }

  // ============================================================
  // ENEMY MANAGEMENT
  // ============================================================

  private spawnEnemy(type: EnemyType) {
    const def = ENEMY_DEFINITIONS[type];
    const [startCol, startRow] = this.state.waypoints[0];
    const diffMult = DIFFICULTY_MULTIPLIERS[this.state.difficulty];
    const scaleFactor = (1 + (this.state.stats.wave - 1) * 0.08) * diffMult.hp;
    const speedScale = diffMult.speed;

    const enemy: Enemy = {
      id: nanoid(),
      type,
      x: startCol * CELL_SIZE + CELL_SIZE / 2,
      y: startRow * CELL_SIZE + CELL_SIZE / 2,
      hp: Math.round(def.hp * scaleFactor),
      maxHp: Math.round(def.hp * scaleFactor),
      speed: def.speed * speedScale,
      baseSpeed: def.speed * speedScale,
      reward: def.reward,
      damage: def.damage,
      pathIndex: 0,
      progress: 0,
      frozen: false,
      frozenTimer: 0,
      slowFactor: 1,
      slowTimer: 0,
      poisonTimer: 0,
      poisonDamage: 0,
      alive: true,
      reached: false,
      size: def.size,
      color: def.color,
      emoji: def.emoji,
      animFrame: 0,
      animTimer: 0,
      facingLeft: false,
      walkCycle: Math.random(),
      isFlying: def.isFlying || false,
      isArmored: def.isArmored || false,
      isTunneling: false,
      tunnelTimer: 0,
      isHealer: def.isHealer || false,
      isBoss: def.isBoss || false,
      dying: false,
      dyingTimer: 0,
      splitCount: def.splitCount,
    };
    this.state.enemies.push(enemy);
  }

  private updateEnemies(dt: number) {
    const s = this.state;
    for (const enemy of s.enemies) {
      if (!enemy.alive || enemy.reached) continue;

      // Death animation
      if (enemy.dying) {
        enemy.dyingTimer -= dt;
        if (enemy.dyingTimer <= 0) {
          enemy.alive = false;
        }
        continue;
      }

      // Poison tick
      if (enemy.poisonTimer > 0) {
        enemy.poisonTimer -= dt;
        const poisonTick = (enemy.poisonDamage * dt) / 1000;
        enemy.hp -= poisonTick;
        if (enemy.hp <= 0) {
          this.killEnemy(enemy, 'poison');
          continue;
        }
      }

      // Freeze/slow timers
      if (enemy.frozenTimer > 0) {
        enemy.frozenTimer -= dt;
        if (enemy.frozenTimer <= 0) {
          enemy.frozen = false;
          enemy.frozenTimer = 0;
          enemy.speed = enemy.baseSpeed;
        }
      }
      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= dt;
        if (enemy.slowTimer <= 0) {
          enemy.slowFactor = 1;
          enemy.slowTimer = 0;
          enemy.speed = enemy.baseSpeed;
        }
      }
      if (enemy.frozen) continue;

      // Tunneler: periodically burrow
      if (enemy.type === 'tunneler') {
        enemy.tunnelTimer -= dt;
        if (enemy.tunnelTimer <= 0) {
          enemy.isTunneling = !enemy.isTunneling;
          enemy.tunnelTimer = enemy.isTunneling ? 2000 : 4000;
        }
      }

      // Healer: heal nearby enemies
      if (enemy.isHealer) {
        enemy.animTimer -= dt;
        if (enemy.animTimer <= 0) {
          enemy.animTimer = 1500;
          for (const other of s.enemies) {
            if (other.id === enemy.id || !other.alive || other.dying) continue;
            const dx = other.x - enemy.x;
            const dy = other.y - enemy.y;
            if (Math.sqrt(dx * dx + dy * dy) < 120) {
              const heal = Math.round(other.maxHp * 0.05);
              other.hp = Math.min(other.maxHp, other.hp + heal);
              this.addFloatingText(other.x, other.y - 20, `+${heal}`, '#66BB6A');
            }
          }
        }
      }

      // Movement
      const waypoints = s.waypoints;
      const currentWP = waypoints[enemy.pathIndex];
      const nextWP = waypoints[enemy.pathIndex + 1];
      if (!nextWP) {
        enemy.reached = true;
        enemy.alive = false;
        s.stats.lives -= enemy.damage;
        this.triggerScreenShake(8, 400);
        this.addFloatingText(currentWP[0] * CELL_SIZE, currentWP[1] * CELL_SIZE, `-${enemy.damage}❤️`, '#FF4444', 1.3);
        if (s.stats.lives <= 0) {
          s.stats.lives = 0;
          s.gameState = 'defeat';
        }
        continue;
      }

      const targetX = nextWP[0] * CELL_SIZE + CELL_SIZE / 2;
      const targetY = nextWP[1] * CELL_SIZE + CELL_SIZE / 2;
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const moveSpeed = enemy.speed * enemy.slowFactor * CELL_SIZE * (dt / 1000);

      if (dist <= moveSpeed) {
        enemy.x = targetX;
        enemy.y = targetY;
        enemy.pathIndex++;
        if (enemy.pathIndex >= waypoints.length - 1) {
          enemy.reached = true;
          enemy.alive = false;
          s.stats.lives -= enemy.damage;
          this.triggerScreenShake(8, 400);
          if (s.stats.lives <= 0) {
            s.stats.lives = 0;
            s.gameState = 'defeat';
          }
        }
      } else {
        enemy.x += (dx / dist) * moveSpeed;
        enemy.y += (dy / dist) * moveSpeed;
        enemy.walkCycle = (enemy.walkCycle + (dt / 1000) * enemy.speed * 3) % 1;
        enemy.facingLeft = dx < 0;
      }
    }
  }

  private killEnemy(enemy: Enemy, source?: string) {
    if (enemy.dying || !enemy.alive) return;
    enemy.dying = true;
    enemy.dyingTimer = 300;
    enemy.hp = 0;

    const goldGain = this.state.goldRushActive ? enemy.reward * 2 : enemy.reward;
    this.state.stats.gold += goldGain;
    this.state.stats.goldEarned += goldGain;
    this.state.stats.enemiesKilled++;
    this.state.stats.score += enemy.reward * 10;

    if (source && this.state.stats.towerKills[source] !== undefined) {
      this.state.stats.towerKills[source]++;
    }

    this.addFloatingText(enemy.x, enemy.y - 20, `+${goldGain}g`, '#F4C842');
    this.spawnDeathParticles(enemy.x, enemy.y, enemy.color);

    // Splitter boss: spawn two smaller enemies
    if (enemy.type === 'splitterBoss' && (enemy.splitCount || 0) > 0) {
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          const mini: Enemy = {
            id: nanoid(),
            type: 'darkKnight',
            x: enemy.x + (i === 0 ? -20 : 20),
            y: enemy.y,
            hp: Math.round(enemy.maxHp * 0.35),
            maxHp: Math.round(enemy.maxHp * 0.35),
            speed: enemy.baseSpeed * 1.3,
            baseSpeed: enemy.baseSpeed * 1.3,
            reward: Math.round(enemy.reward * 0.3),
            damage: Math.round(enemy.damage * 0.5),
            pathIndex: enemy.pathIndex,
            progress: 0,
            frozen: false, frozenTimer: 0,
            slowFactor: 1, slowTimer: 0,
            poisonTimer: 0, poisonDamage: 0,
            alive: true, reached: false,
            size: Math.round(enemy.size * 0.65),
            color: '#FF7043',
            emoji: '🐲',
            animFrame: 0, animTimer: 0,
            facingLeft: enemy.facingLeft,
            walkCycle: Math.random(),
            isFlying: false, isArmored: false,
            isTunneling: false, tunnelTimer: 0,
            isHealer: false, isBoss: false,
            dying: false, dyingTimer: 0,
          };
          this.state.enemies.push(mini);
        }, i * 200);
      }
    }

    // Necromancer: raise skeleton ally
    const necroTower = this.state.towers.find(t => t.type === 'necromancer');
    if (necroTower && Math.random() < 0.3) {
      const existingSkeletons = this.state.alliedUnits.filter(u => u.towerId === necroTower.id && u.alive);
      if (existingSkeletons.length < (necroTower.maxUnits || 4)) {
        this.spawnAlliedUnit(necroTower, 'skeleton', enemy.x, enemy.y);
      }
    }
  }

  // ============================================================
  // TOWER MANAGEMENT
  // ============================================================

  private updateTowers(dt: number) {
    for (const tower of this.state.towers) {
      // Attack animation decay
      if (tower.attackAnim > 0) {
        tower.attackAnim = Math.max(0, tower.attackAnim - dt / 150);
      }

      // Unit-spawning towers
      if (tower.spawnsUnits && tower.spawnCooldown) {
        tower.spawnTimer = (tower.spawnTimer || 0) - dt;
        if (tower.spawnTimer <= 0) {
          tower.spawnTimer = tower.spawnCooldown;
          const existing = this.state.alliedUnits.filter(u => u.towerId === tower.id && u.alive);
          if (existing.length < (tower.maxUnits || 1)) {
            this.spawnAlliedUnit(tower, tower.unitType || 'soldier');
          }
        }
        continue; // unit towers don't fire projectiles themselves (except necromancer)
      }

      tower.fireCooldown -= dt;
      if (tower.fireCooldown > 0) continue;

      const target = this.findTarget(tower);
      if (!target) { tower.target = null; continue; }

      tower.target = target.id;
      tower.fireCooldown = 1000 / (tower.fireRate * (1 + tower.powerBonus * 0.2));
      tower.attackAnim = 1;
      tower.attackAnimTimer = 150;
      this.fireProjectile(tower, target);
    }
  }

  private findTarget(tower: Tower): Enemy | null {
    const rangePixels = tower.range * CELL_SIZE * (1 + tower.powerBonus * 0.15);
    const isAirCapable = TOWER_DEFINITIONS[tower.type]?.isAirCapable || false;
    const candidates: Enemy[] = [];

    for (const enemy of this.state.enemies) {
      if (!enemy.alive || enemy.reached || enemy.dying) continue;
      if (enemy.isTunneling) continue;
      if (enemy.isFlying && !isAirCapable) continue;
      // Armored enemies immune to physical towers
      if (enemy.isArmored && ['archer', 'cannon', 'ballista', 'catapult'].includes(tower.type)) continue;

      const dx = enemy.x - tower.x;
      const dy = enemy.y - tower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= rangePixels) {
        candidates.push(enemy);
      }
    }

    if (candidates.length === 0) return null;

    const mode = tower.targetingMode;
    if (mode === 'first') {
      return candidates.reduce((a, b) => (a.pathIndex + a.progress > b.pathIndex + b.progress ? a : b));
    } else if (mode === 'last') {
      return candidates.reduce((a, b) => (a.pathIndex + a.progress < b.pathIndex + b.progress ? a : b));
    } else if (mode === 'strongest') {
      return candidates.reduce((a, b) => (a.hp > b.hp ? a : b));
    } else if (mode === 'weakest') {
      return candidates.reduce((a, b) => (a.hp < b.hp ? a : b));
    } else { // fastest
      return candidates.reduce((a, b) => (a.speed > b.speed ? a : b));
    }
  }

  private fireProjectile(tower: Tower, target: Enemy) {
    const def = TOWER_DEFINITIONS[tower.type];
    const dmgBonus = 1 + tower.powerBonus * 0.25;
    const proj: Projectile = {
      id: nanoid(),
      type: tower.projectileType,
      x: tower.x,
      y: tower.y,
      targetId: target.id,
      targetX: target.x,
      targetY: target.y,
      speed: tower.type === 'catapult' ? 350 : tower.type === 'ballista' ? 700 : 500,
      damage: Math.round(tower.damage * dmgBonus),
      color: tower.color,
      size: tower.type === 'catapult' ? 18 : tower.type === 'cannon' ? 12 : tower.type === 'ballista' ? 10 : 8,
      towerId: tower.id,
      splashRadius: def.splashRadius ? def.splashRadius * CELL_SIZE : undefined,
      chainCount: def.specialEffect === 'chain' ? (tower.type === 'tesla' ? 5 : 3) : undefined,
      slowFactor: def.specialEffect === 'slow' ? 0.4 : undefined,
      slowDuration: def.specialEffect === 'slow' ? 2500 : undefined,
      piercing: def.specialEffect === 'pierce',
      alive: true,
    };
    this.state.projectiles.push(proj);
  }

  // ============================================================
  // PROJECTILE MANAGEMENT
  // ============================================================

  private updateProjectiles(dt: number) {
    for (const proj of this.state.projectiles) {
      if (!proj.alive) continue;

      const target = this.state.enemies.find(e => e.id === proj.targetId);
      if (target && target.alive && !target.dying) {
        proj.targetX = target.x;
        proj.targetY = target.y;
      }

      const dx = proj.targetX - proj.x;
      const dy = proj.targetY - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const moveSpeed = proj.speed * (dt / 1000);

      if (dist <= moveSpeed + 5) {
        this.onProjectileHit(proj);
        proj.alive = false;
      } else {
        proj.x += (dx / dist) * moveSpeed;
        proj.y += (dy / dist) * moveSpeed;
      }
    }
  }

  private onProjectileHit(proj: Projectile) {
    const tower = this.state.towers.find(t => t.id === proj.towerId);
    const towerType = tower?.type || 'archer';

    if (proj.splashRadius && proj.splashRadius > 0) {
      // Splash damage
      for (const enemy of this.state.enemies) {
        if (!enemy.alive || enemy.dying) continue;
        const dx = enemy.x - proj.targetX;
        const dy = enemy.y - proj.targetY;
        if (Math.sqrt(dx * dx + dy * dy) <= proj.splashRadius) {
          if (enemy.isArmored && ['cannon', 'ballista', 'catapult'].includes(towerType)) continue;
          this.dealDamage(enemy, proj.damage, proj.type, towerType);
          if (proj.type === 'poison') {
            enemy.poisonTimer = 4000;
            enemy.poisonDamage = proj.damage * 0.5;
          }
        }
      }
      this.spawnExplosionParticles(proj.targetX, proj.targetY, proj.color);
    } else if (proj.chainCount && proj.chainCount > 0) {
      // Chain lightning
      const hitIds = new Set<string>([proj.targetId]);
      let lastX = proj.targetX, lastY = proj.targetY;
      let chainRange = 150;

      const primaryTarget = this.state.enemies.find(e => e.id === proj.targetId);
      if (primaryTarget && primaryTarget.alive && !primaryTarget.dying) {
        this.dealDamage(primaryTarget, proj.damage, proj.type, towerType);
      }

      for (let c = 0; c < proj.chainCount; c++) {
        let closest: Enemy | null = null;
        let closestDist = chainRange;
        for (const enemy of this.state.enemies) {
          if (!enemy.alive || enemy.dying || hitIds.has(enemy.id)) continue;
          const dx = enemy.x - lastX;
          const dy = enemy.y - lastY;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < closestDist) { closestDist = d; closest = enemy; }
        }
        if (!closest) break;
        hitIds.add(closest.id);
        this.dealDamage(closest, Math.round(proj.damage * 0.7), proj.type, towerType);
        this.spawnLightningParticles(lastX, lastY, closest.x, closest.y);
        lastX = closest.x; lastY = closest.y;
      }
    } else if (proj.piercing) {
      // Piercing bolt — hits all enemies in a line
      const dx = proj.targetX - proj.x;
      const dy = proj.targetY - proj.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / len, ny = dy / len;
      for (const enemy of this.state.enemies) {
        if (!enemy.alive || enemy.dying) continue;
        // Project enemy onto bolt line
        const ex = enemy.x - proj.x, ey = enemy.y - proj.y;
        const dot = ex * nx + ey * ny;
        const perpX = ex - dot * nx, perpY = ey - dot * ny;
        const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);
        if (perpDist < enemy.size + 8 && dot > 0) {
          this.dealDamage(enemy, proj.damage, proj.type, towerType);
        }
      }
    } else {
      // Single target
      const target = this.state.enemies.find(e => e.id === proj.targetId);
      if (target && target.alive && !target.dying) {
        this.dealDamage(target, proj.damage, proj.type, towerType);
        if (proj.slowFactor && proj.slowDuration) {
          target.slowFactor = proj.slowFactor;
          target.slowTimer = proj.slowDuration;
          target.speed = target.baseSpeed * proj.slowFactor;
        }
        if (proj.type === 'poison') {
          target.poisonTimer = 4000;
          target.poisonDamage = proj.damage * 0.5;
        }
      }
    }
  }

  private dealDamage(enemy: Enemy, damage: number, projType: string, towerType: string) {
    if (!enemy.alive || enemy.dying) return;
    // Banshee immune to frost/poison
    if (enemy.type === 'banshee' && (projType === 'frost' || projType === 'poison')) return;
    // Armored immune to physical
    if (enemy.isArmored && ['arrow', 'cannonball', 'bolt', 'boulder'].includes(projType)) return;

    enemy.hp -= damage;
    this.state.stats.damageDealt += damage;

    // Update boss HP bar
    if (enemy.isBoss) {
      this.state.bossHp = Math.max(0, enemy.hp);
    }

    this.addFloatingText(enemy.x + (Math.random() - 0.5) * 20, enemy.y - 15, `-${Math.round(damage)}`, '#FF6B6B');

    if (enemy.hp <= 0) {
      this.killEnemy(enemy, towerType);
    }
  }

  // ============================================================
  // ALLIED UNITS
  // ============================================================

  private spawnAlliedUnit(tower: Tower, unitType: 'soldier' | 'hero' | 'wolf' | 'golem' | 'skeleton', spawnX?: number, spawnY?: number) {
    const stats: Record<string, { hp: number; damage: number; speed: number; range: number; attackCooldown: number }> = {
      soldier: { hp: 120, damage: 25, speed: 1.5, range: 40, attackCooldown: 1200 },
      hero:    { hp: 400, damage: 80, speed: 2.0, range: 60, attackCooldown: 800 },
      wolf:    { hp: 80,  damage: 35, speed: 2.8, range: 35, attackCooldown: 900 },
      golem:   { hp: 300, damage: 50, speed: 0.8, range: 45, attackCooldown: 1500 },
      skeleton:{ hp: 60,  damage: 20, speed: 1.8, range: 38, attackCooldown: 1000 },
    };
    const s = stats[unitType];
    const lvlBonus = 1 + (tower.level - 1) * 0.4;

    const unit: AlliedUnit = {
      id: nanoid(),
      towerId: tower.id,
      type: unitType,
      x: spawnX ?? tower.x + (Math.random() - 0.5) * 40,
      y: spawnY ?? tower.y + (Math.random() - 0.5) * 40,
      hp: Math.round(s.hp * lvlBonus),
      maxHp: Math.round(s.hp * lvlBonus),
      damage: Math.round(s.damage * lvlBonus),
      speed: s.speed,
      range: s.range,
      attackCooldown: s.attackCooldown,
      attackTimer: 0,
      targetId: null,
      alive: true,
      walkCycle: Math.random(),
      facingLeft: false,
      patrolX: tower.x,
      patrolY: tower.y,
      patrolRadius: tower.range * CELL_SIZE * 0.8,
      returning: false,
    };
    this.state.alliedUnits.push(unit);
  }

  private updateAlliedUnits(dt: number) {
    for (const unit of this.state.alliedUnits) {
      if (!unit.alive) continue;

      // Find nearest enemy
      let nearestEnemy: Enemy | null = null;
      let nearestDist = unit.patrolRadius + 60;
      for (const enemy of this.state.enemies) {
        if (!enemy.alive || enemy.dying || enemy.reached) continue;
        const dx = enemy.x - unit.x;
        const dy = enemy.y - unit.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < nearestDist) { nearestDist = d; nearestEnemy = enemy; }
      }

      if (nearestEnemy) {
        // Move toward enemy
        const dx = nearestEnemy.x - unit.x;
        const dy = nearestEnemy.y - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        unit.facingLeft = dx < 0;
        unit.walkCycle = (unit.walkCycle + dt / 400) % 1;

        if (dist > unit.range) {
          const moveSpeed = unit.speed * CELL_SIZE * (dt / 1000);
          unit.x += (dx / dist) * moveSpeed;
          unit.y += (dy / dist) * moveSpeed;
        } else {
          // Attack
          unit.attackTimer -= dt;
          if (unit.attackTimer <= 0) {
            unit.attackTimer = unit.attackCooldown;
            this.dealDamage(nearestEnemy, unit.damage, 'physical', unit.type);
            this.addFloatingText(nearestEnemy.x, nearestEnemy.y - 25, `-${unit.damage}`, '#FFA726');
          }
        }
        unit.returning = false;
      } else {
        // Return to patrol position
        const dx = unit.patrolX - unit.x;
        const dy = unit.patrolY - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 20) {
          const moveSpeed = unit.speed * CELL_SIZE * (dt / 1000);
          unit.x += (dx / dist) * moveSpeed;
          unit.y += (dy / dist) * moveSpeed;
          unit.walkCycle = (unit.walkCycle + dt / 500) % 1;
          unit.facingLeft = dx < 0;
          unit.returning = true;
        }
      }
    }
  }

  // ============================================================
  // ACTIVE ABILITIES
  // ============================================================

  private updateAbilities(dt: number) {
    for (const ability of this.state.abilities) {
      if (ability.currentCooldown > 0) ability.currentCooldown -= dt;
      if (ability.active) {
        ability.activeTimer -= dt;
        if (ability.activeTimer <= 0) {
          ability.active = false;
          if (ability.type === 'goldRush') {
            this.state.goldRushActive = false;
          }
        }
      }
    }
  }

  activateAbility(type: string) {
    const ability = this.state.abilities.find(a => a.type === type);
    if (!ability || ability.currentCooldown > 0) return;

    ability.currentCooldown = ability.cooldown;
    ability.active = ability.duration > 0;
    ability.activeTimer = ability.duration;

    if (type === 'lightningStorm') {
      for (const enemy of this.state.enemies) {
        if (!enemy.alive || enemy.dying) continue;
        this.dealDamage(enemy, 80, 'lightning', 'ability');
        this.spawnLightningParticles(540, 360, enemy.x, enemy.y);
      }
      this.triggerScreenShake(12, 600);
      this.addFloatingText(540, 200, '⚡ LIGHTNING STORM!', '#FFD700', 1.8);
    } else if (type === 'freezeWave') {
      for (const enemy of this.state.enemies) {
        if (!enemy.alive || enemy.dying) continue;
        enemy.frozen = true;
        enemy.frozenTimer = 4000;
        enemy.speed = 0;
      }
      this.addFloatingText(540, 200, '❄️ FREEZE WAVE!', '#4FC3F7', 1.8);
    } else if (type === 'goldRush') {
      this.state.goldRushActive = true;
      this.addFloatingText(540, 200, '💰 GOLD RUSH!', '#F4C842', 1.8);
    }

    this.notify();
  }

  // ============================================================
  // VISUAL EFFECTS
  // ============================================================

  private updateFloatingTexts(dt: number) {
    for (const ft of this.state.floatingTexts) {
      ft.y += ft.vy * (dt / 1000);
      ft.life -= dt;
      ft.opacity = Math.max(0, ft.life / 1200);
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.state.particles) {
      p.x += p.vx * (dt / 1000);
      p.y += p.vy * (dt / 1000);
      p.vy += 200 * (dt / 1000); // gravity
      p.life -= dt;
      p.opacity = Math.max(0, p.life / p.maxLife);
    }
  }

  private updateScreenShake(dt: number) {
    const ss = this.state.screenShake;
    if (ss.timer > 0) {
      ss.timer -= dt;
      ss.intensity = ss.intensity * (ss.timer / ss.duration);
    } else {
      ss.intensity = 0;
    }
  }

  triggerScreenShake(intensity: number, duration: number) {
    this.state.screenShake = { intensity, duration, timer: duration };
  }

  private addFloatingText(x: number, y: number, text: string, color: string, scale = 1) {
    this.state.floatingTexts.push({
      id: nanoid(),
      x, y, text, color,
      opacity: 1,
      vy: -60,
      life: 1200,
      scale,
    });
  }

  private spawnDeathParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      const speed = 80 + Math.random() * 120;
      this.state.particles.push({
        id: nanoid(), x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        color, size: 4 + Math.random() * 4,
        life: 600, maxLife: 600, opacity: 1,
      });
    }
  }

  private spawnExplosionParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const speed = 100 + Math.random() * 150;
      this.state.particles.push({
        id: nanoid(), x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        color, size: 5 + Math.random() * 5,
        life: 800, maxLife: 800, opacity: 1,
      });
    }
  }

  private spawnLightningParticles(x1: number, y1: number, x2: number, y2: number) {
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20;
      const py = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20;
      this.state.particles.push({
        id: nanoid(), x: px, y: py,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        color: '#FFD700', size: 3 + Math.random() * 3,
        life: 300, maxLife: 300, opacity: 1,
      });
    }
  }

  private cleanupDead() {
    this.state.enemies = this.state.enemies.filter(e => e.alive || e.dying);
    this.state.projectiles = this.state.projectiles.filter(p => p.alive);
    this.state.floatingTexts = this.state.floatingTexts.filter(ft => ft.life > 0);
    this.state.particles = this.state.particles.filter(p => p.life > 0);
    this.state.alliedUnits = this.state.alliedUnits.filter(u => u.alive);
  }

  // ============================================================
  // TOWER PLACEMENT & MANAGEMENT
  // ============================================================

  canPlaceTower(col: number, row: number): boolean {
    const key = `${col},${row}`;
    return !this.state.pathCells.has(key) && !this.state.towerCells.has(key);
  }

  placeTower(col: number, row: number, type: TowerType): boolean {
    const def = TOWER_DEFINITIONS[type];
    if (!def) return false;
    if (this.state.stats.gold < def.cost) return false;
    if (!this.canPlaceTower(col, row)) return false;

    const key = `${col},${row}`;
    const isPowerSpot = this.state.powerSpots.has(key);

    const tower: Tower = {
      id: nanoid(),
      type, col, row,
      x: col * CELL_SIZE + CELL_SIZE / 2,
      y: row * CELL_SIZE + CELL_SIZE / 2,
      level: 1,
      damage: def.damage,
      range: def.range,
      fireRate: def.fireRate,
      fireCooldown: 0,
      target: null,
      projectileType: def.projectileType,
      color: def.color,
      emoji: def.emoji,
      name: def.name,
      upgradeCost: def.upgradeCost,
      sellValue: Math.floor(def.cost * 0.6),
      specialEffect: def.specialEffect,
      splashRadius: def.splashRadius,
      targetingMode: 'first',
      spawnsUnits: def.spawnsUnits,
      unitType: def.unitType,
      spawnCooldown: def.spawnCooldown,
      spawnTimer: 2000, // first spawn quickly
      maxUnits: def.maxUnits,
      attackAnim: 0,
      attackAnimTimer: 0,
      powerBonus: isPowerSpot ? 1 : 0,
    };

    this.state.towers.push(tower);
    this.state.towerCells.add(key);
    this.state.stats.gold -= def.cost;
    this.state.stats.towersPlaced++;
    this.state.stats.towerKills[type] = this.state.stats.towerKills[type] || 0;

    if (isPowerSpot) {
      this.addFloatingText(tower.x, tower.y - 30, '⭐ Power Spot! +25% bonus', '#FFD700', 1.2);
    } else {
      this.addFloatingText(tower.x, tower.y - 30, 'Placed!', '#F4C842');
    }
    return true;
  }

  upgradeTower(towerId: string): boolean {
    const tower = this.state.towers.find(t => t.id === towerId);
    if (!tower || tower.level >= 3 || this.state.stats.gold < tower.upgradeCost) return false;

    this.state.stats.gold -= tower.upgradeCost;
    tower.level++;
    tower.damage = Math.round(tower.damage * 1.5);
    tower.range *= 1.15;
    tower.fireRate *= 1.2;
    tower.upgradeCost = Math.round(tower.upgradeCost * 1.8);
    tower.sellValue = Math.round(tower.sellValue * 1.4);
    if (tower.spawnCooldown) tower.spawnCooldown = Math.round(tower.spawnCooldown * 0.75);
    this.addFloatingText(tower.x, tower.y - 30, `⬆ Level ${tower.level}!`, '#00E5FF', 1.2);
    return true;
  }

  sellTower(towerId: string): boolean {
    const tower = this.state.towers.find(t => t.id === towerId);
    if (!tower) return false;
    this.state.stats.gold += tower.sellValue;
    this.addFloatingText(tower.x, tower.y - 30, `+${tower.sellValue}g`, '#F4C842');
    this.state.towers = this.state.towers.filter(t => t.id !== towerId);
    this.state.towerCells.delete(`${tower.col},${tower.row}`);
    // Remove allied units from this tower
    this.state.alliedUnits = this.state.alliedUnits.filter(u => u.towerId !== towerId);
    if (this.state.selectedTowerId === towerId) this.state.selectedTowerId = null;
    return true;
  }

  setTargetingMode(towerId: string, mode: TargetingMode) {
    const tower = this.state.towers.find(t => t.id === towerId);
    if (tower) { tower.targetingMode = mode; this.notify(); }
  }

  selectTowerType(type: TowerType | null) {
    this.state.selectedTowerType = type;
    this.state.selectedTowerId = null;
    this.notify();
  }

  selectTower(towerId: string | null) {
    this.state.selectedTowerId = towerId;
    this.state.selectedTowerType = null;
    this.notify();
  }

   toggleEndlessMode() {
    this.state.endlessMode = !this.state.endlessMode;
    this.notify();
  }
  setSpeed(multiplier: number) {
    this.state.speedMultiplier = Math.max(1, Math.min(4, multiplier));
    this.notify();
  }
  private notify() {
    this.onStateChange({ ...this.state });
  }
}
