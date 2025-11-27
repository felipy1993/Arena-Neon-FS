import React, { useState, useEffect, useRef } from "react";
import GameCanvas from "./components/GameCanvas";
import UpgradePanel from "./components/UpgradePanel";
import {
  GameState,
  PlayerStats,
  Enemy,
  Projectile,
  FloatingText,
  Upgrade,
  Particle,
  EnemyType,
} from "./types";
import {
  INITIAL_UPGRADES,
  CANVAS_SIZE,
  COLOR_PALETTE,
  AVAILABLE_SKINS,
  MAX_ENEMIES_ON_SCREEN,
} from "./constants";
import {
  Coins,
  Skull,
  Pause,
  Play,
  Zap,
  Radio,
  Heart,
  Trophy,
  User as UserIcon,
  PlayCircle,
  Shield,
  Diamond,
  Palette,
  X,
  Lock,
  Check,
  Calendar,
  Gift,
  Cloud,
  CloudLightning,
  LogOut,
  Mail,
  LockKeyhole,
  Tag,
  Copy,
  AlertTriangle,
  ShieldCheck,
  ArrowLeft,
  Save,
  Home,
  KeyRound,
  RotateCcw,
} from "lucide-react";
import { audioSystem } from "./audio";
import {
  registerWithEmail,
  loginWithEmailOrUsername,
  logoutUser,
  saveGameToCloud,
  loadGameFromCloud,
  auth,
  CloudSaveData,
} from "./firebase";
import { User } from "firebase/auth";

const App: React.FC = () => {
  // --- Persistent State ---
  const [playerName, setPlayerName] = useState<string>("");
  const [tempName, setTempName] = useState<string>("");
  const [highScore, setHighScore] = useState<number>(0);

  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [gameState, setGameState] = useState<GameState>({
    cash: 150,
    gems: 0,
    wave: 1,
    waveProgress: 0,
    gameSpeed: 1,
    isGameOver: false,
    isPaused: false,
    score: 0,
    isGameStarted: false,
    selectedSkinId: "default",
    ownedSkinIds: ["default"],
    lastLoginDate: "",
    loginStreak: 0,
  });

  const [showSkinModal, setShowSkinModal] = useState(false);

  // --- CLOUD / FIREBASE STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<
    "idle" | "saving" | "error" | "saved"
  >("idle");

  // UI State for Start Screen
  const [authMode, setAuthMode] = useState<"hidden" | "login" | "register">(
    "login"
  );

  // Auth Form State
  const [emailOrUser, setEmailOrUser] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUser, setRegUser] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Permission Error Helper
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Daily Reward State
  const [dailyRewardPopup, setDailyRewardPopup] = useState<{
    show: boolean;
    amount: number;
    streak: number;
  } | null>(null);

  const [empCooldown, setEmpCooldown] = useState(0);

  // --- WAVE ENEMY TRACKING ---
  const [enemiesSpawnedThisWave, setEnemiesSpawnedThisWave] = useState(0);
  const [totalEnemiesThisWave, setTotalEnemiesThisWave] = useState(0);

  // --- FIREBASE AUTH LISTENER ---
  useEffect(() => {
    if (!auth) {
      console.warn("⚠️ Auth não inicializado, pulando listener");
      return;
    }

    try {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        try {
          setCurrentUser(user);
          if (user) {
            // If user logs in, try to load data
            const cloudData = await loadGameFromCloud(user);
            if (cloudData) {
              setTempName(cloudData.playerName);
              setHighScore((prev) => Math.max(prev, cloudData.highScore));
              applyCloudData(cloudData); // Carrega o estado completo (incluindo datas de login)
            } else {
              // Novo usuário ou sem save
              const fallbackName =
                user.displayName ||
                user.email?.split("@")[0].toUpperCase() ||
                "OPERADOR";
              setTempName(fallbackName);
            }
            setAuthMode("hidden"); // Vai para o menu "Logado"
          } else {
            // User logged out
            setTempName("");
            setHighScore(0);
            setAuthMode("login"); // Volta para a tela de login
          }
        } catch (error) {
          console.error("❌ Erro no auth state changed:", error);
        }
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("❌ Erro ao configurar auth listener:", error);
    }
  }, []);

  // --- PERSISTENCE: INITIAL LOAD (LOCAL) ---
  useEffect(() => {
    const savedScore = localStorage.getItem("neon_arena_highscore");
    if (savedScore) {
      setHighScore(parseInt(savedScore));
    }
  }, []);

  // --- PERSISTENCE: AUTO-SAVE HIGHSCORE ---
  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem("neon_arena_highscore", highScore.toString());
    }
  }, [highScore]);

  // Auto-Save Interval (every 60s)
  useEffect(() => {
    if (!currentUser || !gameState.isGameStarted || gameState.isGameOver)
      return;

    const interval = setInterval(() => {
      handleCloudSave();
    }, 60000);
    return () => clearInterval(interval);
  }, [
    currentUser,
    gameState.isGameStarted,
    gameState.isGameOver,
    gameState,
    upgrades,
  ]);

  const handleCloudSave = async () => {
    if (!currentUser) return;
    setCloudStatus("saving");
    const success = await saveGameToCloud(
      currentUser,
      gameState,
      upgrades,
      playerName,
      highScore
    );
    setCloudStatus(success ? "saved" : "error");
    setTimeout(() => setCloudStatus("idle"), 3000);
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const isRegistering = authMode === "register";

    // Sanitize inputs
    const cleanRegUser = regUser.trim();
    const cleanRegEmail = regEmail.trim();
    const cleanEmailOrUser = emailOrUser.trim();
    const cleanPass = password.trim();

    if (isRegistering) {
      if (!cleanRegEmail || !cleanPass || !cleanRegUser) {
        setAuthError("Preencha todos os campos.");
        return;
      }
      if (cleanRegUser.length < 3) {
        setAuthError("Nome de usuário muito curto.");
        return;
      }
      if (cleanPass.length < 6) {
        setAuthError("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
    } else {
      if (!cleanEmailOrUser || !cleanPass) {
        setAuthError("Preencha login e senha.");
        return;
      }
    }

    setIsSyncing(true);

    try {
      let user;
      if (isRegistering) {
        user = await registerWithEmail(cleanRegEmail, cleanPass, cleanRegUser);
        setTempName(cleanRegUser.toUpperCase());
      } else {
        user = await loginWithEmailOrUsername(cleanEmailOrUser, cleanPass);
      }

      setPassword("");

      if (user) {
        const data = await loadGameFromCloud(user);
        if (data) {
          applyCloudData(data);
          setTempName(data.playerName);
        } else {
          if (!isRegistering) {
            const derivedName =
              user.displayName ||
              user.email?.split("@")[0].toUpperCase() ||
              cleanRegUser.toUpperCase();
            if (derivedName) setTempName(derivedName);
          }
        }
        setAuthMode("hidden");
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let msg = "Erro desconhecido.";

      const errCode = error.code || "";
      const errMsg = error.message || "";

      if (
        errCode.includes("permission-denied") ||
        errMsg.includes("Missing or insufficient permissions")
      ) {
        msg = "Erro de Segurança do Banco de Dados.";
        setShowRulesModal(true);
      } else if (errMsg === "USERNAME_TAKEN")
        msg = "Este nome de usuário já está em uso.";
      else if (errMsg === "USER_NOT_FOUND") msg = "Usuário não encontrado.";
      else if (errMsg === "USER_LOOKUP_FAILED")
        msg = "Falha ao buscar usuário. Tente com Email.";
      else if (errCode === "auth/invalid-email") msg = "Email inválido.";
      else if (errCode === "auth/user-not-found") msg = "Conta não encontrada.";
      else if (
        errCode === "auth/wrong-password" ||
        errCode === "auth/invalid-credential"
      )
        msg = "Senha incorreta.";
      else if (errCode === "auth/email-already-in-use")
        msg = "Este email já possui conta.";
      else if (errCode === "auth/weak-password")
        msg = "Senha muito fraca (min 6 caracteres).";
      else if (errCode === "auth/unauthorized-domain") {
        msg = "Domínio não autorizado no Firebase.";
        const currentDomain = window.location.hostname;
        prompt(
          "Copie este domínio e adicione no Firebase Authentication > Settings > Authorized Domains:",
          currentDomain
        );
      }

      setAuthError(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const applyCloudData = (data: CloudSaveData) => {
    if (!data) {
      console.error("❌ Dados da nuvem inválidos");
      return;
    }

    setPlayerName(data.playerName || "JOGADOR");
    setTempName(data.playerName || "JOGADOR");
    setHighScore(data.highScore || 0);
    setUpgrades(
      Array.isArray(data.upgrades) ? data.upgrades : INITIAL_UPGRADES
    );
    setGameState((prev) => ({
      ...prev,
      cash: data.cash || 150,
      gems: data.gems || 0,
      wave: data.wave || 1,
      ownedSkinIds: Array.isArray(data.ownedSkinIds)
        ? data.ownedSkinIds
        : ["default"],
      selectedSkinId: data.selectedSkinId || "default",
      lastLoginDate: data.lastLoginDate || "",
      loginStreak: data.loginStreak || 0,
    }));
    setStats(
      calculateStats(
        Array.isArray(data.upgrades) ? data.upgrades : INITIAL_UPGRADES
      )
    );
  };

  const calculateStats = (
    currentUpgrades: Upgrade[],
    currentHp?: number,
    currentShield?: number
  ): PlayerStats => {
    const s: Record<string, number> = {};

    currentUpgrades.forEach((u) => {
      if (u.level === 0) {
        s[u.id] = 0;
      } else {
        s[u.id] = u.baseValue + u.valuePerLevel * (u.level - 1);
      }
    });

    const maxHealth = Math.max(10, s["hp"] || 100);
    const health =
      currentHp !== undefined ? Math.min(currentHp, maxHealth) : maxHealth;

    const maxShield = s["max_shield"] || 0;
    const shield =
      currentShield !== undefined
        ? Math.min(currentShield, maxShield)
        : maxShield;

    const baseRegen = 0.3;
    const totalRegen = baseRegen + (s["regen"] || 0);
    const projCount = 3 + (s["multi_shot"] || 0); // Base 3 + upgrade

    return {
      damage: s["dmg"] || 5,
      attackSpeed: s["atk_spd"] || 1,
      range: s["range"] || 150,
      critChance: s["crit_chn"] || 0,
      critFactor: s["crit_fac"] || 1.0,
      damagePerMeter: s["dmg_mtr"] || 0,
      projectileCount: projCount,
      health: health,
      maxHealth: maxHealth,
      regen: totalRegen,
      armor: s["armor"] || 0,
      dodge: s["dodge"] || 0,
      moveSpeed: 1,
      shield: shield,
      maxShield: maxShield,
      empDamage: s["emp_dmg"] || 50,
      empCooldown: Math.max(5, s["emp_cdr"] || 30), // Min 5 seconds
    };
  };

  const [stats, setStats] = useState<PlayerStats>(() =>
    calculateStats(INITIAL_UPGRADES)
  );

  // CRITICAL PERFORMANCE FIX: Stats Ref for the game loop
  const statsRef = useRef(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // --- Mutable Game State ---
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shockwaveRef = useRef<{
    active: boolean;
    radius: number;
    hitIds: Set<number>;
  }>({ active: false, radius: 0, hitIds: new Set() });
  const screenShakeRef = useRef<number>(0);

  const lastShotTimeRef = useRef<number>(0);
  const lastRegenTimeRef = useRef<number>(0);
  const waveTimerRef = useRef<number>(0);
  const enemySpawnTimerRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);
  const empTimerRef = useRef<number>(0);

  // --- Helpers ---
  const spawnFloatingText = (
    x: number,
    y: number,
    text: string,
    color: string
  ) => {
    if (textsRef.current.length > 50) return;
    textsRef.current.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      life: 60,
      vy: -1,
    });
  };

  const spawnParticles = (
    x: number,
    y: number,
    color: string,
    count: number = 8
  ) => {
    const effectiveCount =
      enemiesRef.current.length > 100 ? Math.ceil(count / 3) : count;
    if (effectiveCount === 0) return;

    for (let i = 0; i < effectiveCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40 + Math.random() * 20,
        maxLife: 60,
        color: color,
        size: Math.random() * 4 + 2,
      });
    }
  };

  const addScreenShake = (amount: number) => {
    screenShakeRef.current = Math.min(screenShakeRef.current + amount, 30);
  };

  const startGame = () => {
    // Modo de desenvolvimento: permite jogar sem login
    const isDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!currentUser && !isDev) {
      alert("Erro: Você precisa estar logado para jogar.");
      setAuthMode("login");
      return;
    }

    let nameToUse =
      tempName.trim() ||
      currentUser?.email?.split("@")[0].toUpperCase() ||
      "JOGADOR";
    setPlayerName(nameToUse);

    // --- DAILY REWARD LOGIC ---
    const savedDate = gameState.lastLoginDate;
    const savedStreak = gameState.loginStreak || 0;
    const today = new Date().toDateString();

    let currentStreak = savedStreak;
    let rewardAmount = 0;
    let showReward = false;
    let newTotalGems = gameState.gems;
    let newDate = savedDate;

    if (savedDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (savedDate === yesterday.toDateString()) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }

      rewardAmount = 100 + currentStreak * 50;
      newTotalGems += rewardAmount;
      showReward = true;
      newDate = today;
    }

    setGameState((prev) => ({
      ...prev,
      isGameStarted: true,
      gems: newTotalGems,
      loginStreak: currentStreak,
      lastLoginDate: newDate,
    }));

    // Salva apenas se houver usuário logado
    if (currentUser) {
      saveGameToCloud(
        currentUser,
        {
          ...gameState,
          isGameStarted: true,
          gems: newTotalGems,
          loginStreak: currentStreak,
          lastLoginDate: newDate,
        } as GameState,
        upgrades,
        nameToUse,
        highScore
      );
    }

    if (showReward) {
      setDailyRewardPopup({
        show: true,
        amount: rewardAmount,
        streak: currentStreak,
      });
      setTimeout(() => audioSystem.playUpgrade(), 500);
    }

    // Inicializar contadores de inimigos para a primeira onda
    const WAVE_DURATION = 30;
    const spawnInterval = Math.max(0.2, 2.0 - 1 * 0.05); // Wave 1
    const spawnCount = Math.floor(1 + 1 / 5); // Wave 1
    const totalSpawns = Math.floor(WAVE_DURATION / spawnInterval);
    const totalEnemies = totalSpawns * spawnCount;
    setTotalEnemiesThisWave(totalEnemies);
    setEnemiesSpawnedThisWave(0);

    audioSystem.resume();
    audioSystem.playUpgrade();
  };

  const returnToMainMenu = () => {
    if (currentUser) handleCloudSave();
    setGameState((prev) => ({
      ...prev,
      isGameStarted: false,
      isPaused: false,
      isGameOver: false,
    }));
    enemiesRef.current = [];
    projectilesRef.current = [];
    textsRef.current = [];
    particlesRef.current = [];
  };

  const resetGame = async () => {
    // Reset all game state to initial values
    const resetState = {
      cash: 150,
      gems: gameState.gems, // Keep gems (premium currency)
      wave: 1,
      waveProgress: 0,
      gameSpeed: 1,
      isGameOver: false,
      isPaused: false,
      score: 0,
      isGameStarted: false,
      selectedSkinId: gameState.selectedSkinId, // Keep selected skin
      ownedSkinIds: gameState.ownedSkinIds, // Keep owned skins
      lastLoginDate: gameState.lastLoginDate, // Keep login streak
      loginStreak: gameState.loginStreak,
    };

    setGameState((prev) => ({
      ...prev,
      ...resetState,
    }));

    // Reset upgrades to initial state
    setUpgrades(INITIAL_UPGRADES);

    // Recalculate stats with initial upgrades
    setStats(calculateStats(INITIAL_UPGRADES));

    // Clear all game entities
    enemiesRef.current = [];
    projectilesRef.current = [];
    textsRef.current = [];
    particlesRef.current = [];
    shockwaveRef.current = { active: false, radius: 0, hitIds: new Set() };

    // Reset timers
    lastShotTimeRef.current = 0;
    lastRegenTimeRef.current = 0;
    waveTimerRef.current = 0;
    enemySpawnTimerRef.current = 0;
    gameTimeRef.current = 0;
    empTimerRef.current = 0;
    setEmpCooldown(0);

    // Reset screen shake
    screenShakeRef.current = 0;

    // Save reset state to cloud if logged in
    if (currentUser) {
      await saveGameToCloud(
        currentUser,
        resetState as GameState,
        INITIAL_UPGRADES,
        playerName,
        highScore
      );
    }

    // Play sound
    audioSystem.playUpgrade();
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const togglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const getSelectedSkin = () => {
    return (
      AVAILABLE_SKINS.find((s) => s.id === gameState.selectedSkinId) ||
      AVAILABLE_SKINS[0]
    );
  };

  // --- Game Loop ---
  useEffect(() => {
    if (!gameState.isGameStarted) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      if (gameState.isPaused) {
        lastTime = time;
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      if (gameState.isGameOver) {
        if (gameState.score > highScore) {
          setHighScore(gameState.score);
          localStorage.setItem(
            "neon_arena_highscore",
            gameState.score.toString()
          );
          if (currentUser) handleCloudSave();
        }
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      let deltaTime = (time - lastTime) / 1000;
      if (deltaTime > 0.1) deltaTime = 0.1;

      lastTime = time;

      const dt = deltaTime * gameState.gameSpeed;
      gameTimeRef.current += dt * 1000;

      // USE REF instead of State for logic to avoid stutter
      const currentStats = statsRef.current;

      if (empTimerRef.current > 0) {
        empTimerRef.current = Math.max(0, empTimerRef.current - dt);
        setEmpCooldown(empTimerRef.current);
      }

      const REGEN_TICK_RATE = 200; // Slower tick rate for UI updates
      if (
        time - lastRegenTimeRef.current >
        REGEN_TICK_RATE / (gameState.gameSpeed || 1)
      ) {
        setStats((prev) => {
          let newShield = prev.shield;
          let newHp = prev.health;
          const factor = REGEN_TICK_RATE / 1000;

          if (newShield < prev.maxShield) {
            newShield = Math.min(
              prev.maxShield,
              newShield + prev.maxShield * 0.05 * factor
            );
          }

          if (newHp < prev.maxHealth) {
            newHp = Math.min(prev.maxHealth, newHp + prev.regen * factor);
          }

          // Optimization: Only trigger react render if values actually changed visibly
          if (
            Math.floor(newShield) !== Math.floor(prev.shield) ||
            Math.floor(newHp) !== Math.floor(prev.health)
          ) {
            // Occasional text for regen
            if (
              prev.regen * factor >= 0.5 &&
              Math.random() > 0.95 &&
              newHp < prev.maxHealth
            ) {
              spawnFloatingText(
                CANVAS_SIZE / 2,
                CANVAS_SIZE / 2 - 40,
                `+${(prev.regen * factor).toFixed(1)}`,
                COLOR_PALETTE.success
              );
            }
            return { ...prev, shield: newShield, health: newHp };
          }
          // Update internal state without render if difference is microscopic (handled by next big tick)
          return { ...prev, shield: newShield, health: newHp };
        });
        lastRegenTimeRef.current = time;
      }

      waveTimerRef.current += dt;
      enemySpawnTimerRef.current -= dt;

      const WAVE_DURATION = 30;
      if (waveTimerRef.current >= WAVE_DURATION) {
        waveTimerRef.current = 0;

        const waveBonus = 100 + gameState.wave * 100;
        const scoreBonus = 500 * gameState.wave;

        let gemBonus = 1;
        if (gameState.wave % 10 === 0) gemBonus += 5;

        // Calcular total de inimigos para a próxima onda
        const nextWave = gameState.wave + 1;
        const spawnInterval = Math.max(0.2, 2.0 - nextWave * 0.05);
        const spawnCount = Math.floor(1 + nextWave / 5);
        const totalSpawns = Math.floor(WAVE_DURATION / spawnInterval);
        const totalEnemies = totalSpawns * spawnCount;
        
        setTotalEnemiesThisWave(totalEnemies);
        setEnemiesSpawnedThisWave(0);

        setGameState((prev) => ({
          ...prev,
          wave: prev.wave + 1,
          cash: prev.cash + waveBonus,
          score: prev.score + scoreBonus,
          gems: prev.gems + gemBonus,
        }));

        if (currentUser) handleCloudSave();

        spawnFloatingText(
          CANVAS_SIZE / 2,
          100,
          `ONDA ${gameState.wave} COMPLETA!`,
          COLOR_PALETTE.accent
        );
        spawnFloatingText(
          CANVAS_SIZE / 2,
          130,
          `+$${waveBonus}`,
          COLOR_PALETTE.accent
        );
        spawnFloatingText(
          CANVAS_SIZE / 2,
          160,
          `+${gemBonus} GEMAS`,
          "#a855f7"
        );
        audioSystem.playUpgrade();
      }

      setGameState((prev) => ({
        ...prev,
        waveProgress: (waveTimerRef.current / WAVE_DURATION) * 100,
      }));

      if (enemySpawnTimerRef.current <= 0) {
        if (enemiesRef.current.length < MAX_ENEMIES_ON_SCREEN) {
          const difficulty = 1 + gameState.wave * 0.2;
          const spawnCount = Math.floor(1 + gameState.wave / 5);

          for (let i = 0; i < spawnCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = CANVAS_SIZE / 2 + 50;

            let type: EnemyType = "standard";
            let hpMult = 1;
            let speedMult = 1;
            let radius = 12;
            let color = COLOR_PALETTE.secondary;
            let damageMult = 1;

            const chance = Math.random();

            if (gameState.wave >= 8 && chance > 0.8) {
              type = "tank";
              hpMult = 4;
              speedMult = 0.6;
              radius = 18;
              color = "#f97316";
              damageMult = 2;
            } else if (gameState.wave >= 5 && chance > 0.7) {
              type = "speedster";
              hpMult = 0.5;
              speedMult = 1.8;
              radius = 9;
              color = "#db2777";
            }

            enemiesRef.current.push({
              id: Math.random(),
              type: type,
              x: CANVAS_SIZE / 2 + Math.cos(angle) * dist,
              y: CANVAS_SIZE / 2 + Math.sin(angle) * dist,
              hp: 20 * difficulty * hpMult,
              maxHp: 20 * difficulty * hpMult,
              speed:
                (0.5 + Math.random() * 0.5) *
                (1 + gameState.wave * 0.05) *
                speedMult,
              damage: 2 * difficulty * damageMult,
              radius: radius,
              color: color,
              isDead: false,
              stunTimer: 0, // Initialize stun timer
            });
          }
          
          // Incrementar contador de inimigos spawnados
          setEnemiesSpawnedThisWave(prev => prev + spawnCount);
        }
        enemySpawnTimerRef.current = Math.max(0.2, 2.0 - gameState.wave * 0.05);
      }

      enemiesRef.current.forEach((enemy) => {
        if (enemy.isDead) return;

        // --- STUN LOGIC ---
        if (enemy.stunTimer > 0) {
          enemy.stunTimer -= dt;
          // Visual feedback handled in Canvas, but we can prevent movement here
          // If stunned, skip movement logic
        } else {
          const dx = CANVAS_SIZE / 2 - enemy.x;
          const dy = CANVAS_SIZE / 2 - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 30 + (enemy.type === "boss" ? 20 : 0)) {
            enemy.x += (dx / dist) * enemy.speed * gameState.gameSpeed;
            enemy.y += (dy / dist) * enemy.speed * gameState.gameSpeed;
          } else {
            // Use currentStats here
            const hit = Math.random() * 100 > currentStats.dodge;

            if (hit) {
              const rawDmg = Math.max(1, enemy.damage - currentStats.armor);

              setStats((prev) => {
                let currentShield = prev.shield;
                let currentHp = prev.health;
                let dmgToHp = rawDmg;

                if (currentShield > 0) {
                  if (currentShield >= rawDmg) {
                    currentShield -= rawDmg;
                    dmgToHp = 0;
                    spawnFloatingText(
                      CANVAS_SIZE / 2,
                      CANVAS_SIZE / 2,
                      `ABSORVIDO`,
                      COLOR_PALETTE.shield
                    );
                  } else {
                    dmgToHp = rawDmg - currentShield;
                    currentShield = 0;
                    spawnFloatingText(
                      CANVAS_SIZE / 2,
                      CANVAS_SIZE / 2,
                      `QUEBRA ESCUDO`,
                      COLOR_PALETTE.shield
                    );
                    addScreenShake(5);
                    audioSystem.playHit();
                  }
                }

                if (dmgToHp > 0) {
                  currentHp -= dmgToHp;
                  spawnFloatingText(
                    CANVAS_SIZE / 2,
                    CANVAS_SIZE / 2 + 20,
                    `-${dmgToHp.toFixed(0)}`,
                    "#ff0000"
                  );
                  addScreenShake(3);
                  if (currentHp <= 0) {
                    setGameState((g) => ({ ...g, isGameOver: true }));
                    audioSystem.playExplosion();
                    addScreenShake(20);
                  } else {
                    audioSystem.playHit();
                  }
                }

                return { ...prev, health: currentHp, shield: currentShield };
              });
            } else {
              spawnFloatingText(
                CANVAS_SIZE / 2,
                CANVAS_SIZE / 2,
                `ESQUIVA`,
                "#ffffff"
              );
            }

            if (enemy.type !== "boss") {
              enemy.isDead = true;
              spawnParticles(enemy.x, enemy.y, enemy.color);
            }
          }
        }
      });

      if (
        time - lastShotTimeRef.current >
        1000 / currentStats.attackSpeed / gameState.gameSpeed
      ) {
        const targets = [];
        const rangeSq = currentStats.range * currentStats.range;
        const centerX = CANVAS_SIZE / 2;
        const centerY = CANVAS_SIZE / 2;

        for (const e of enemiesRef.current) {
          if (e.isDead) continue;
          const dSq = Math.pow(e.x - centerX, 2) + Math.pow(e.y - centerY, 2);
          if (dSq <= rangeSq) {
            targets.push({ enemy: e, distSq: dSq });
          }
        }

        targets.sort((a, b) => a.distSq - b.distSq);

        const targetsToShoot = targets.slice(0, currentStats.projectileCount);

        if (targetsToShoot.length > 0) {
          targetsToShoot.forEach((targetItem) => {
            const target = targetItem.enemy;
            const isCrit = Math.random() * 100 < currentStats.critChance;
            const dmg =
              currentStats.damage * (isCrit ? currentStats.critFactor : 1);

            projectilesRef.current.push({
              id: Math.random(),
              x: CANVAS_SIZE / 2,
              y: CANVAS_SIZE / 2,
              targetId: target.id,
              speed: 12,
              damage: dmg,
              isCrit: isCrit,
              color: isCrit ? COLOR_PALETTE.accent : getSelectedSkin().color,
            });
          });

          lastShotTimeRef.current = time;
          audioSystem.playShoot();
        }
      }

      projectilesRef.current.forEach((p) => {
        const target = enemiesRef.current.find((e) => e.id === p.targetId);
        if (target && !target.isDead) {
          const dx = target.x - p.x;
          const dy = target.y - p.y;
          const distSq = dx * dx + dy * dy;
          const hitDist = p.speed * gameState.gameSpeed + target.radius;

          if (distSq < hitDist * hitDist) {
            const distFromCenter = Math.sqrt(
              Math.pow(target.x - CANVAS_SIZE / 2, 2) +
                Math.pow(target.y - CANVAS_SIZE / 2, 2)
            );
            const distanceBonus =
              1 + (distFromCenter / 10) * (currentStats.damagePerMeter / 100);
            const finalDamage = p.damage * distanceBonus;

            target.hp -= finalDamage;

            const overloaded = enemiesRef.current.length > 100;
            if (!overloaded || p.isCrit || target.hp <= 0) {
              spawnFloatingText(
                target.x,
                target.y - 20,
                finalDamage.toFixed(0),
                p.isCrit ? COLOR_PALETTE.accent : "#fff"
              );
            }

            spawnParticles(p.x, p.y, p.color, 3);

            if (target.hp <= 0) {
              target.isDead = true;

              let coinMult = 1;
              let scoreMult = 1;

              if (target.type === "speedster") {
                coinMult = 1.5;
                scoreMult = 1.5;
              }
              if (target.type === "tank") {
                coinMult = 3;
                scoreMult = 3;
              }

              const coinReward = (10 + gameState.wave * 5) * coinMult;
              const scoreReward = 10 * gameState.wave * scoreMult;

              setGameState((prev) => ({
                ...prev,
                cash: prev.cash + coinReward,
                score: prev.score + scoreReward,
              }));

              if (!overloaded) {
                spawnFloatingText(
                  target.x,
                  target.y,
                  `+$${coinReward.toFixed(0)}`,
                  COLOR_PALETTE.accent
                );
              }

              spawnParticles(target.x, target.y, target.color, 10);
              audioSystem.playHit();
            }
            p.damage = 0;
          } else {
            const dist = Math.sqrt(distSq);
            p.x += (dx / dist) * p.speed * gameState.gameSpeed;
            p.y += (dy / dist) * p.speed * gameState.gameSpeed;
          }
        } else {
          p.damage = 0;
        }
      });

      if (shockwaveRef.current.active) {
        shockwaveRef.current.radius += 15 * gameState.gameSpeed;

        enemiesRef.current.forEach((e) => {
          if (e.isDead) return;
          if (shockwaveRef.current.hitIds.has(e.id)) return;

          const dist = Math.sqrt(
            Math.pow(e.x - CANVAS_SIZE / 2, 2) +
              Math.pow(e.y - CANVAS_SIZE / 2, 2)
          );

          if (Math.abs(dist - shockwaveRef.current.radius) < 20) {
            shockwaveRef.current.hitIds.add(e.id);

            // --- EMP DAMAGE & STUN ---
            e.hp -= currentStats.empDamage; // Use upgraded damage
            e.stunTimer = 3.0; // Stun for 3 seconds

            if (Math.random() > 0.8)
              spawnFloatingText(e.x, e.y, "STUN!", "#ffff00");

            if (e.hp <= 0) {
              e.isDead = true;
              const coinReward = 10 + gameState.wave * 5;
              const scoreReward = 10 * gameState.wave;
              setGameState((prev) => ({
                ...prev,
                cash: prev.cash + coinReward,
                score: prev.score + scoreReward,
              }));
              spawnFloatingText(
                e.x,
                e.y,
                `+$${coinReward}`,
                COLOR_PALETTE.accent
              );
              spawnParticles(e.x, e.y, "#00ffff", 12);
            }
          }
        });

        if (shockwaveRef.current.radius < 50) {
          addScreenShake(10);
        }

        if (shockwaveRef.current.radius > CANVAS_SIZE) {
          shockwaveRef.current.active = false;
        }
      }

      enemiesRef.current = enemiesRef.current.filter((e) => !e.isDead);
      projectilesRef.current = projectilesRef.current.filter(
        (p) => p.damage > 0
      );
      textsRef.current.forEach((t) => {
        t.y += t.vy;
        t.life--;
      });
      textsRef.current = textsRef.current.filter((t) => t.life > 0);
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.vx *= 0.95;
        p.vy *= 0.95;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);

    // REMOVE 'stats' from dependencies. Using statsRef instead.
  }, [
    gameState.isGameOver,
    gameState.gameSpeed,
    gameState.wave,
    gameState.isGameStarted,
    gameState.isPaused,
  ]);

  const buyUpgrade = (id: string) => {
    let newUpgrades = [...upgrades];
    let cost = 0;
    let upgraded = false;

    newUpgrades = newUpgrades.map((u) => {
      if (u.id === id) {
        cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.level));
        if (gameState.cash >= cost) {
          upgraded = true;
          return { ...u, level: u.level + 1 };
        }
      }
      return u;
    });

    // Prevent purchases that would not change any effective stats (e.g. capped values)
    const oldStats = calculateStats(upgrades);
    const newStats = calculateStats(newUpgrades);
    if (JSON.stringify(oldStats) === JSON.stringify(newStats)) {
      // Show feedback to player that upgrade has no effect / is maxed
      try {
        spawnFloatingText(
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 - 40,
          "Máx. Nível",
          COLOR_PALETTE.accent
        );
      } catch (e) {
        // ignore if spawnFloatingText not available in scope (should be available)
      }
      return;
    }

    if (upgraded) {
      setUpgrades(newUpgrades);
      setGameState((prev) => ({ ...prev, cash: prev.cash - cost }));
      audioSystem.playUpgrade();

      // When buying HP or Shield, we want to heal the difference so the bar doesn't look like it took damage
      setStats((prev) => {
        const oldStats = calculateStats(upgrades);
        const newStats = calculateStats(newUpgrades);

        let newCurrentHp = prev.health;
        if (newStats.maxHealth > oldStats.maxHealth) {
          newCurrentHp += newStats.maxHealth - oldStats.maxHealth;
        }

        let newCurrentShield = prev.shield;
        if (newStats.maxShield > oldStats.maxShield) {
          newCurrentShield += newStats.maxShield - oldStats.maxShield;
        }

        // Recalculate everything with new current values
        return calculateStats(newUpgrades, newCurrentHp, newCurrentShield);
      });
    }
  };

  const triggerEmp = () => {
    // Check cooldown against current stats
    if (empCooldown > 0 || gameState.isPaused) return;

    // Use upgraded cooldown
    const currentMaxCd = statsRef.current.empCooldown;
    setEmpCooldown(currentMaxCd);
    empTimerRef.current = currentMaxCd;

    shockwaveRef.current = { active: true, radius: 10, hitIds: new Set() };
    audioSystem.playEmp();
  };

  const handleSkinAction = (skin: (typeof AVAILABLE_SKINS)[0]) => {
    if (gameState.ownedSkinIds.includes(skin.id)) {
      setGameState((prev) => {
        return { ...prev, selectedSkinId: skin.id };
      });
    } else {
      if (gameState.gems >= skin.price) {
        setGameState((prev) => {
          const newOwned = [...prev.ownedSkinIds, skin.id];
          const newGems = prev.gems - skin.price;
          return {
            ...prev,
            gems: newGems,
            ownedSkinIds: newOwned,
            selectedSkinId: skin.id,
          };
        });
        audioSystem.playUpgrade();
      }
    }
  };

  const handleInteraction = () => {
    audioSystem.resume();
  };

  if (!gameState.isGameStarted) {
    return (
      <div
        className="flex flex-col h-[100dvh] w-full bg-gray-950 items-center justify-center relative overflow-hidden font-sans"
        onClick={handleInteraction}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black animate-pulse"></div>
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-20 pointer-events-none">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border border-blue-500/10"></div>
          ))}
        </div>

        <div className="z-10 bg-gray-900/90 p-8 rounded-2xl border border-cyan-500/50 shadow-[0_0_50px_rgba(0,255,255,0.15)] flex flex-col items-center max-w-sm w-full backdrop-blur-md relative overflow-hidden mx-4">
          <div className="mb-8 relative text-center">
            <div className="absolute -inset-1 bg-cyan-500 blur opacity-30 animate-pulse rounded-full"></div>
            <div className="w-20 h-20 bg-gray-900 rounded-full border-4 border-cyan-400 flex items-center justify-center relative z-10 mx-auto mb-4">
              <div className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_10px_#00ffff]"></div>
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 uppercase tracking-widest font-orbitron">
              Arena Neon
            </h1>
            <p className="text-blue-200/60 text-xs uppercase tracking-wide font-share">
              Defesa do Núcleo v2.7 Secure
            </p>
          </div>

          {/* --- AUTH MODE IS NOW DEFAULT --- */}
          {authMode !== "hidden" ? (
            <div className="w-full animate-in fade-in slide-in-from-right duration-300">
              <div className="flex items-center gap-2 mb-4 justify-center">
                <span className="text-white font-bold font-orbitron uppercase text-sm">
                  {authMode === "login" ? "Conectar" : "Nova Conta"}
                </span>
              </div>

              <form onSubmit={handleAuthAction} className="flex flex-col gap-3">
                <div className="flex bg-gray-950 border border-gray-700 rounded-md overflow-hidden mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError("");
                    }}
                    className={`flex-1 py-2 text-xs font-bold uppercase transition-colors ${
                      authMode === "login"
                        ? "bg-cyan-900 text-cyan-200"
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError("");
                    }}
                    className={`flex-1 py-2 text-xs font-bold uppercase transition-colors ${
                      authMode === "register"
                        ? "bg-cyan-900 text-cyan-200"
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    Criar
                  </button>
                </div>

                <div className="space-y-2">
                  {authMode === "register" && (
                    <div className="relative">
                      <Tag
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder="Nome de Usuário (Único)"
                        value={regUser}
                        onChange={(e) =>
                          setRegUser(
                            e.target.value.replace(/[^a-zA-Z0-9_-]/g, "")
                          )
                        }
                        maxLength={12}
                        className="w-full bg-black/50 border border-gray-700 rounded p-2 pl-9 text-sm text-white focus:border-cyan-500 outline-none uppercase font-mono placeholder:normal-case"
                        required
                      />
                    </div>
                  )}

                  <div className="relative">
                    {authMode === "register" ? (
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                        size={16}
                      />
                    ) : (
                      <UserIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                        size={16}
                      />
                    )}
                    <input
                      type={authMode === "register" ? "email" : "text"}
                      placeholder={
                        authMode === "register"
                          ? "Seu Email"
                          : "Email ou Nome de Usuário"
                      }
                      value={authMode === "register" ? regEmail : emailOrUser}
                      onChange={(e) =>
                        authMode === "register"
                          ? setRegEmail(e.target.value)
                          : setEmailOrUser(e.target.value)
                      }
                      className="w-full bg-black/50 border border-gray-700 rounded p-2 pl-9 text-sm text-white focus:border-cyan-500 outline-none"
                      required
                    />
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      size={16}
                    />
                    <input
                      type="password"
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/50 border border-gray-700 rounded p-2 pl-9 text-sm text-white focus:border-cyan-500 outline-none"
                      required
                    />
                  </div>
                </div>

                {authError && (
                  <div className="text-[10px] text-red-400 bg-red-900/20 p-2 rounded border border-red-900/50">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSyncing}
                  className="w-full py-2 bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                  {isSyncing ? (
                    <CloudLightning className="animate-pulse" size={14} />
                  ) : authMode === "register" ? (
                    "Finalizar Cadastro"
                  ) : (
                    "Acessar Sistema"
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* --- LOGGED IN MENU MODE --- */
            <div className="w-full animate-in fade-in slide-in-from-left duration-300">
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6 flex flex-col gap-3 group relative overflow-hidden">
                <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-green-600 text-black flex items-center justify-center font-bold text-lg shadow-[0_0_10px_rgba(22,163,74,0.5)]">
                    {currentUser?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="text-sm flex-1">
                    <div className="text-green-500 text-[10px] uppercase font-bold tracking-wider">
                      Operador Logado
                    </div>
                    <div className="font-bold text-white font-mono tracking-wide truncate">
                      {tempName || currentUser?.displayName || "OPERADOR"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 hover:text-red-300 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 relative z-10 transition-colors"
                  title="Sair da Conta"
                >
                  <LogOut size={14} /> DESCONECTAR
                </button>
              </div>

              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-5 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.3)] flex items-center justify-center gap-3 transition-all active:scale-95 group font-orbitron text-lg mb-6"
              >
                <PlayCircle size={28} className="group-hover:animate-pulse" />
                INICIAR MISSÃO
              </button>
            </div>
          )}
        </div>

        {showRulesModal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
            <div className="bg-gray-900 border border-green-500 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
              <button
                onClick={() => setShowRulesModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X />
              </button>

              <div className="flex items-center gap-2 text-green-500 mb-4">
                <ShieldCheck size={24} />
                <h2 className="font-bold text-lg font-orbitron">
                  SEGURANÇA DO SERVIDOR
                </h2>
              </div>

              <p className="text-gray-300 text-sm mb-4">
                Para garantir que{" "}
                <strong>nenhum jogador roube dados de outro</strong>, e permitir
                o login seguro, você deve atualizar as regras do banco de dados.
              </p>

              <div className="bg-black border border-gray-700 rounded p-4 mb-4 relative group">
                <pre className="text-[10px] md:text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
                  {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /usernames/{username} {
      allow read: if true;
      allow create: if request.auth != null;
    }
  }
}`}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /usernames/{username} {
      allow read: if true;
      allow create: if request.auth != null;
    }
  }
}`);
                    alert("Código copiado!");
                  }}
                  className="absolute top-2 right-2 bg-gray-800 p-2 rounded hover:bg-gray-700 text-white opacity-50 group-hover:opacity-100 transition-opacity"
                  title="Copiar Código"
                >
                  <Copy size={14} />
                </button>
              </div>

              <ol className="text-xs text-gray-400 list-decimal pl-5 space-y-1">
                <li>
                  Acesse o{" "}
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    className="text-blue-400 underline"
                  >
                    Console Firebase
                  </a>{" "}
                  &gt; Firestore Database.
                </li>
                <li>
                  Clique na aba <strong>Rules</strong> (Regras).
                </li>
                <li>Apague tudo e cole o código acima.</li>
                <li>
                  Clique em <strong>Publish</strong>. Sua segurança estará
                  ativa.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-[100dvh] bg-gray-950 font-sans select-none overflow-hidden"
      onClick={handleInteraction}
    >
      {dailyRewardPopup && dailyRewardPopup.show && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto">
          <div className="bg-gray-900 border-2 border-green-500 p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(34,197,94,0.3)] transform scale-100 animate-[bounce_0.5s_ease-out]">
            <div className="flex justify-center mb-4">
              <Gift size={64} className="text-green-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 font-orbitron uppercase tracking-widest">
              Suprimento Diário
            </h2>
            <div className="text-green-400 mb-6 font-share text-lg">
              Sequência:{" "}
              <span className="font-bold text-white">
                {dailyRewardPopup.streak} Dias
              </span>
            </div>

            <div className="bg-black/50 p-6 rounded-xl mb-6 border border-green-900/50 flex flex-col items-center">
              <Diamond size={32} className="text-purple-400 mb-2" />
              <div className="text-4xl font-mono font-bold text-white mb-1">
                +{dailyRewardPopup.amount}
              </div>
              <div className="text-xs text-gray-400 uppercase">
                Gemas Adicionadas
              </div>
            </div>

            <button
              onClick={() => setDailyRewardPopup(null)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded uppercase tracking-wider font-orbitron shadow-lg shadow-green-900/50 transition-transform active:scale-95"
            >
              COLETAR
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center px-2 md:px-4 py-2 bg-gray-900 border-b border-gray-800 z-10 shadow-lg relative h-12 md:h-16 shrink-0">
        <div className="flex gap-2 md:gap-4 items-center">
          <div className="flex items-center gap-1 md:gap-2 text-yellow-400 font-bold text-xs md:text-lg bg-black/40 px-2 py-1 rounded border border-yellow-900/50 font-share shadow-[0_0_10px_rgba(255,200,0,0.1)]">
            <Coins size={14} className="md:w-5 md:h-5" />
            <span>{Math.floor(gameState.cash).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 text-purple-400 font-bold text-xs md:text-lg bg-black/40 px-2 py-1 rounded border border-purple-900/50 font-share shadow-[0_0_10px_rgba(168,85,247,0.1)]">
            <Diamond size={14} className="md:w-5 md:h-5" />
            <span>{gameState.gems.toLocaleString()}</span>
          </div>

          {currentUser && (
            <div
              className={`
                    hidden md:flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded border
                    ${
                      cloudStatus === "saving"
                        ? "border-yellow-500 text-yellow-500 animate-pulse"
                        : cloudStatus === "saved"
                        ? "border-green-500 text-green-500"
                        : cloudStatus === "error"
                        ? "border-red-500 text-red-500"
                        : "border-gray-800 text-gray-600"
                    }
                `}
            >
              <Cloud size={12} />
              {cloudStatus === "saving"
                ? "Salvando..."
                : cloudStatus === "saved"
                ? "Salvo"
                : cloudStatus === "error"
                ? "Erro"
                : "Cloud On"}
            </div>
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center top-1 md:top-2">
          <div className="hidden md:flex items-center gap-2 text-cyan-100/50 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5 font-orbitron">
            <UserIcon size={10} /> {playerName}
          </div>
          <div className="text-base md:text-2xl font-black text-white font-mono tracking-tighter leading-none shadow-black drop-shadow-lg">
            {gameState.score.toLocaleString().padStart(6, "0")}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowSkinModal(true);
              setGameState((prev) => ({ ...prev, isPaused: true }));
            }}
            className="p-2 md:p-2 bg-purple-900/40 border border-purple-500/30 rounded text-purple-400 hover:bg-purple-900/80 active:scale-95 transition-all"
            title="Loja de Skins"
          >
            <Palette size={16} className="md:w-5 md:h-5" />
          </button>
          <button
            onClick={togglePause}
            className={`p-1.5 md:p-2 rounded border transition-all active:scale-95 ${
              gameState.isPaused
                ? "bg-yellow-900/40 border-yellow-500 text-yellow-400 animate-pulse"
                : "bg-gray-800 border-gray-700 text-gray-400"
            }`}
          >
            {gameState.isPaused ? (
              <Play size={16} className="md:w-5 md:h-5" />
            ) : (
              <Pause size={16} className="md:w-5 md:h-5" />
            )}
          </button>
          <button
            onClick={resetGame}
            className="p-2 md:p-2 bg-red-900/40 border border-red-500/30 rounded text-red-400 hover:bg-red-900/80 active:scale-95 transition-all"
            title="Reiniciar Jogo (Começar do Zero)"
          >
            <RotateCcw size={16} className="md:w-5 md:h-5" />
          </button>
          <div className="text-right pl-1 md:pl-2 border-l border-gray-800">
            <div className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold font-share hidden sm:block">
              Nível
            </div>
            <div className="text-xs md:text-xl font-bold text-red-500 font-orbitron whitespace-nowrap">
              ONDA {gameState.wave}
            </div>
          </div>
          <div className="text-right pl-1 md:pl-2 border-l border-gray-800">
            <div className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold font-share hidden sm:block">
              Inimigos
            </div>
            <div className="text-[10px] md:text-sm font-bold text-orange-400 font-mono">
              {enemiesSpawnedThisWave}/{totalEnemiesThisWave}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {/* GAME AREA */}
        <div className="relative flex-1 bg-black flex items-center justify-center p-2 md:p-4 overflow-hidden order-1">
          <GameCanvas
            stats={stats}
            enemies={enemiesRef}
            projectiles={projectilesRef}
            texts={textsRef}
            particles={particlesRef}
            gameTimeRef={gameTimeRef}
            shockwaveRef={shockwaveRef}
            selectedSkin={getSelectedSkin()}
            screenShakeRef={screenShakeRef}
          />

          {gameState.isPaused && !showSkinModal && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-40 flex items-center justify-center pointer-events-auto">
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-4xl font-black text-yellow-500 font-orbitron tracking-widest mb-2">
                  PAUSADO
                </h2>

                <button
                  onClick={togglePause}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.5)] hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Play size={24} fill="black" />
                  RETOMAR
                </button>

                <button
                  onClick={returnToMainMenu}
                  className="text-red-400 hover:text-red-300 font-bold uppercase text-xs tracking-wider flex items-center gap-2 border border-red-900/50 hover:bg-red-900/20 px-4 py-2 rounded transition-colors"
                >
                  <LogOut size={14} />
                  Abondonar Missão (Menu)
                </button>
              </div>
            </div>
          )}

          {showSkinModal && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 pointer-events-auto">
              <div className="bg-gray-900 border border-purple-500/50 w-full max-w-4xl rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col overflow-hidden max-h-[85vh]">
                <div className="p-4 bg-black/50 border-b border-gray-800 flex justify-between items-center shrink-0">
                  <div>
                    <h2 className="text-xl font-orbitron font-bold text-purple-400 flex items-center gap-2">
                      <Palette size={20} /> SKIN ARSENAL
                    </h2>
                    <div className="text-xs text-purple-300/60 font-mono mt-1">
                      {AVAILABLE_SKINS.length} SKINS DISPONÍVEIS | SALDO:{" "}
                      {gameState.gems.toLocaleString()} GEMAS
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSkinModal(false);
                      setGameState((prev) => ({ ...prev, isPaused: false }));
                    }}
                    className="text-gray-400 hover:text-white bg-gray-800/50 p-2 rounded-full hover:bg-red-900/50 transition-colors"
                    title="Fechar Loja"
                  >
                    <X size={28} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 scrollbar-thin scrollbar-thumb-purple-900">
                  {AVAILABLE_SKINS.map((skin) => {
                    const isOwned = gameState.ownedSkinIds.includes(skin.id);
                    const isSelected = gameState.selectedSkinId === skin.id;
                    const canBuy = gameState.gems >= skin.price;

                    return (
                      <div
                        key={skin.id}
                        className={`relative bg-gray-800/50 rounded-lg p-3 flex flex-col items-center border-2 transition-all group hover:bg-gray-800 ${
                          isSelected
                            ? "border-green-500 bg-green-900/10"
                            : isOwned
                            ? "border-gray-700"
                            : "border-gray-800 opacity-80"
                        }`}
                      >
                        <div className="w-12 h-12 mb-3 flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/5 rounded-full"></div>
                          <div
                            style={{ color: skin.color }}
                            className="drop-shadow-[0_0_10px_currentColor] transform group-hover:scale-110 transition-transform duration-300"
                          >
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 100 100"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="8"
                            >
                              {skin.type === "hexagon" && (
                                <path d="M50 5 L93 27 L93 72 L50 95 L7 72 L7 27 Z" />
                              )}
                              {skin.type === "triangle" && (
                                <path d="M50 10 L90 85 L10 85 Z" />
                              )}
                              {skin.type === "square" && (
                                <rect x="15" y="15" width="70" height="70" />
                              )}
                              {skin.type === "circle" && (
                                <circle cx="50" cy="50" r="40" />
                              )}
                              {skin.type === "star" && (
                                <path d="M50 10 L61 38 L91 38 L67 56 L76 84 L50 68 L24 84 L33 56 L9 38 L39 38 Z" />
                              )}
                            </svg>
                          </div>
                        </div>

                        <h3 className="font-orbitron text-[10px] text-white mb-2 text-center leading-tight h-6 flex items-center justify-center">
                          {skin.name}
                        </h3>

                        {isOwned ? (
                          <button
                            onClick={() => handleSkinAction(skin)}
                            className={`w-full py-1.5 px-2 rounded text-[10px] font-bold font-mono flex items-center justify-center gap-1 ${
                              isSelected
                                ? "bg-green-600 text-white cursor-default"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check size={12} /> EQUIPADO
                              </>
                            ) : (
                              "EQUIPAR"
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSkinAction(skin)}
                            disabled={!canBuy}
                            className={`w-full py-1.5 px-2 rounded text-[10px] font-bold font-mono flex items-center justify-center gap-1 ${
                              canBuy
                                ? "bg-purple-600 hover:bg-purple-500 text-white"
                                : "bg-gray-800 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <Lock size={10} />{" "}
                            {skin.price > 1000
                              ? (skin.price / 1000).toFixed(0) + "K"
                              : skin.price}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border-t border-gray-800 bg-black/50 shrink-0 md:hidden">
                  <button
                    onClick={() => {
                      setShowSkinModal(false);
                      setGameState((prev) => ({ ...prev, isPaused: false }));
                    }}
                    className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 rounded font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <X size={16} /> FECHAR LOJA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OVERLAY UI ELEMENTS (EMP, HP) */}
          <div className="absolute inset-0 pointer-events-none p-2 md:p-4 flex flex-col justify-between z-10">
            {/* TOP: Progress & Speed */}
            <div className="flex justify-between items-start pointer-events-auto w-full">
              <div className="w-1/3 max-w-md bg-gray-900/80 h-2 md:h-3 rounded-full overflow-hidden border border-gray-700 shadow-lg backdrop-blur mt-1 md:mt-0">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300 relative"
                  style={{ width: `${gameState.waveProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>

              <div className="flex bg-gray-900/90 rounded-lg p-1 border border-gray-700 backdrop-blur scale-90 origin-top-right md:scale-100">
                {[1, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() =>
                      setGameState((g) => ({ ...g, gameSpeed: speed }))
                    }
                    className={`px-2 md:px-3 py-1 rounded text-xs font-bold font-mono transition-colors ${
                      gameState.gameSpeed === speed
                        ? "bg-cyan-700 text-white"
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    x{speed}
                  </button>
                ))}
              </div>
            </div>

            {gameState.isGameOver && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-auto">
                <div className="bg-gray-900 border-2 border-red-600 p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.3)] transform scale-110">
                  <Skull
                    size={48}
                    className="mx-auto text-red-500 mb-4 animate-bounce"
                  />
                  <h2 className="text-3xl font-black text-white mb-2 font-orbitron uppercase">
                    Sistema Crítico
                  </h2>
                  <p className="text-red-400 mb-6 font-share">
                    O núcleo foi destruído.
                  </p>

                  <div className="bg-black/50 p-4 rounded-lg mb-6 border border-red-900/30">
                    <div className="text-xs text-gray-500 uppercase mb-1">
                      Pontuação Final
                    </div>
                    <div className="text-2xl font-mono font-bold text-yellow-400">
                      {gameState.score.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={resetGame}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded uppercase tracking-wider font-orbitron shadow-lg shadow-red-900/50 transition-transform active:scale-95"
                  >
                    Reiniciar Sistema
                  </button>
                </div>
              </div>
            )}

            {/* BOTTOM: EMP & HP */}
            <div className="flex flex-col items-center gap-2 md:gap-4 pointer-events-auto w-full max-w-2xl mx-auto mb-2">
              {/* EMP Button - Positioned absolutely to not interfere with layout */}
              <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 pointer-events-auto">
                <button
                  onClick={triggerEmp}
                  disabled={empCooldown > 0 || gameState.isPaused}
                  className={`
                            relative w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center transition-all shadow-lg group
                            ${
                              empCooldown > 0 || gameState.isPaused
                                ? "bg-gray-900 border-gray-700 text-gray-600 cursor-not-allowed"
                                : "bg-cyan-950/80 border-cyan-400 text-cyan-400 hover:bg-cyan-900 hover:shadow-[0_0_20px_#00ffff] hover:scale-110 active:scale-95 cursor-pointer"
                            }
                        `}
                >
                  <Zap
                    size={20}
                    className={`md:w-6 md:h-6 ${
                      empCooldown === 0 && !gameState.isPaused
                        ? "animate-pulse"
                        : ""
                    }`}
                  />
                  {empCooldown > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                      <span className="text-[10px] md:text-xs font-bold text-white font-mono">
                        {Math.ceil(empCooldown)}
                      </span>
                    </div>
                  )}
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="46%"
                      fill="none"
                      stroke="#333"
                      strokeWidth="2"
                    />
                    {empCooldown > 0 && (
                      <circle
                        cx="50%"
                        cy="50%"
                        r="46%"
                        fill="none"
                        stroke="#00ffff"
                        strokeWidth="2"
                        strokeDasharray="289" // Approx circum for r=46
                        strokeDashoffset={
                          289 - 289 * (empCooldown / (stats.empCooldown || 30))
                        }
                        className="transition-all duration-100"
                      />
                    )}
                  </svg>
                </button>
              </div>

              <div className="w-2/3 md:w-2/3 flex flex-col gap-1 bg-black/40 p-2 rounded-lg backdrop-blur border border-gray-800/50">
                {stats.maxShield > 0 && (
                  <div className="flex items-center gap-2 h-2 md:h-3">
                    <Shield size={10} className="md:w-3 md:h-3 text-cyan-400" />
                    <div className="flex-1 h-full bg-gray-800 rounded-sm overflow-hidden relative">
                      <div
                        className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_10px_#00ffff]"
                        style={{
                          width: `${(stats.shield / stats.maxShield) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 w-8 md:w-12 text-right font-bold">
                      {Math.floor(stats.shield)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 h-3 md:h-4">
                  <Heart size={12} className="md:w-14px text-red-500" />
                  <div className="flex-1 h-full bg-gray-800 rounded-sm overflow-hidden relative">
                    <div
                      className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_10px_#ff0000]"
                      style={{
                        width: `${(stats.health / stats.maxHealth) * 100}%`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                    </div>
                  </div>
                  <span className="text-[10px] md:text-xs font-mono text-red-500 w-8 md:w-12 text-right font-bold">
                    {Math.ceil(stats.health)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR (UPGRADES) */}
        <div className="h-[35%] md:h-full md:w-96 bg-gray-900 border-t md:border-t-0 md:border-l border-gray-800 z-20 flex flex-col shadow-xl relative order-2">
          <div className="p-2 md:p-3 bg-gray-900 border-b border-gray-800 font-orbitron text-cyan-400 font-bold uppercase tracking-wider text-xs md:text-sm flex justify-between items-center shadow-md z-10 shrink-0">
            <div className="flex items-center gap-2">
              <Radio
                size={14}
                className="animate-pulse text-cyan-500 md:w-4 md:h-4"
              />
              <span>Engenharia</span>
            </div>
            <span className="text-[9px] md:text-[10px] text-gray-500 font-mono bg-black/30 px-2 py-0.5 rounded border border-gray-700">
              v2.5.0
            </span>
          </div>
          {/* Compute which upgrades would have no effect if bought (treated as maxed) */}
          {(() => {
            const maxed = new Set<string>();
            const baseStats = calculateStats(upgrades);
            upgrades.forEach((u) => {
              const simulated = upgrades.map((x) =>
                x.id === u.id ? { ...x, level: x.level + 1 } : x
              );
              const newStats = calculateStats(simulated);
              if (JSON.stringify(baseStats) === JSON.stringify(newStats)) {
                maxed.add(u.id);
              }
            });

            return (
              <UpgradePanel
                upgrades={upgrades}
                cash={gameState.cash}
                onBuy={buyUpgrade}
                maxedIds={maxed}
              />
            );
          })()}
          <div className="absolute bottom-0 left-0 right-0 h-4 md:h-8 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

export default App;
