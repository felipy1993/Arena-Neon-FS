import React, { useState, useEffect, useCallback } from "react";
import { saveGameToCloud, loadGameFromCloud, CloudSaveData } from "../../firebase";
import { User } from "firebase/auth";
import {
  GameState,
  Upgrade,
  PlayerGlobalStats,
} from "../../types";
import { INITIAL_UPGRADES } from "../../constants";

/**
 * Hook para gerenciar o estado geral do jogo
 *
 * Responsabilidades:
 * - Persistência local (localStorage)
 * - Sincronização com nuvem (Firebase)
 * - Gerenciamento de sessão
 * - Auto-save periódico
 * - Smart Merge (Local vs Cloud)
 */

interface UseGameStateReturn {
  gameState: GameState;
  highScore: number;
  playerName: string;
  upgrades: Upgrade[];
  globalStats: PlayerGlobalStats;
  cloudStatus: "idle" | "saving" | "error" | "saved";
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setHighScore: React.Dispatch<React.SetStateAction<number>>;
  setPlayerName: React.Dispatch<React.SetStateAction<string>>;
  setUpgrades: React.Dispatch<React.SetStateAction<Upgrade[]>>;
  setGlobalStats: React.Dispatch<React.SetStateAction<PlayerGlobalStats>>;
  handleCloudSave: () => Promise<void>;
}

// --- SMART MERGE HELPERS ---

const smartMergeUpgrades = (cloudData: CloudSaveData): Upgrade[] => {
  const localUpgradesJson = localStorage.getItem("neon_arena_upgrades");
  const localTimestamp = localStorage.getItem("neon_arena_upgrades_timestamp");

  if (!localUpgradesJson || !localTimestamp) {
    return cloudData.upgrades || INITIAL_UPGRADES;
  }

  try {
    const localUpgrades = JSON.parse(localUpgradesJson);
    const localTime = parseInt(localTimestamp);
    const cloudTime = cloudData.lastSaved?.toMillis?.() || 0;

    if (localTime > cloudTime) {
      console.log("🔄 Upgrade local é mais recente, mantendo local.");
      return localUpgrades;
    } else {
      console.log("📥 Nuvem é mais recente ou igual, usando nuvem.");
      return cloudData.upgrades || INITIAL_UPGRADES;
    }
  } catch (e) {
    console.error("❌ Erro ao fazer merge de upgrades:", e);
    return cloudData.upgrades || INITIAL_UPGRADES;
  }
};

const smartMergeSkin = (cloudData: CloudSaveData): string => {
  const localStateJson = localStorage.getItem("neon_arena_gamestate");
  
  if (localStateJson) {
    try {
      const localState = JSON.parse(localStateJson);
      const localSkin = localState.selectedSkinId || "default";
      
      const ownedSkinsLocal = localState.ownedSkinIds || ["default"];
      const ownedSkinsCloud = cloudData.ownedSkinIds || ["default"];
      const allOwnedSkins = [...new Set([...ownedSkinsLocal, ...ownedSkinsCloud])];

      if (allOwnedSkins.includes(localSkin)) {
        return localSkin;
      }
    } catch (e) {
      console.error("❌ Erro ao ler skin local:", e);
    }
  }
  return cloudData.selectedSkinId || "default";
};

export const useGameState = (currentUser: User | null): UseGameStateReturn => {
  // --- INITIALIZATION FROM LOCAL STORAGE ---
  
  const [playerName, setPlayerName] = useState<string>("");
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem("neon_arena_highscore");
    return saved ? parseInt(saved) : 0;
  });

  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => {
    const saved = localStorage.getItem("neon_arena_upgrades");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Erro ao carregar upgrades:", e);
      }
    }
    return INITIAL_UPGRADES;
  });

  const [gameState, setGameState] = useState<GameState>(() => {
    // Try to restore score from localStorage first (persists across F5)
    const savedCurrentScore = localStorage.getItem("neon_arena_current_score");
    const currentScore = savedCurrentScore ? parseInt(savedCurrentScore) : 0;
    
    // Fallback to sessionStorage (legacy)
    const savedSessionScore = sessionStorage.getItem("neon_arena_session_score");
    const sessionScore = savedSessionScore ? parseInt(savedSessionScore) : 0;

    const savedState = localStorage.getItem("neon_arena_gamestate");
    const parsedState = savedState ? JSON.parse(savedState) : {};

    // Try to restore gameplay state (if game was in progress during F5)
    const savedGameplayState = localStorage.getItem("neon_arena_gameplay_state");
    const gameplayState = savedGameplayState ? JSON.parse(savedGameplayState) : {};
    
    // If there's a saved gameplay state, it means game was in progress
    const wasGameInProgress = !!savedGameplayState;

    return {
      cash: gameplayState.cash || parsedState.cash || 150,
      gems: parsedState.gems || 0,
      wave: gameplayState.wave || 1,
      waveProgress: gameplayState.waveProgress || 0,
      gameSpeed: gameplayState.gameSpeed || 1,
      isGameOver: gameplayState.isGameOver || false,
      isPaused: gameplayState.isPaused || false,
      score: currentScore || sessionScore,
      isGameStarted: wasGameInProgress, // Auto-resume if game was in progress
      selectedSkinId: parsedState.selectedSkinId || "default",
      ownedSkinIds: parsedState.ownedSkinIds || ["default"],
      lastLoginDate: parsedState.lastLoginDate || "",
      loginStreak: parsedState.loginStreak || 0,
    };
  });

  const [globalStats, setGlobalStats] = useState<PlayerGlobalStats>({
    totalEnemiesKilled: 0,
    totalDamageDeal: 0,
    totalDamageTaken: 0,
    longestWaveReached: 1,
    totalPlaytime: 0,
    prestigeLevel: 0,
    totalRuns: 0,
  });

  const [cloudStatus, setCloudStatus] = useState<"idle" | "saving" | "error" | "saved">("idle");

  // --- LOAD DATA FROM CLOUD WHEN USER LOGS IN ---
  useEffect(() => {
    if (!currentUser) {
      // Reset sensitive data on logout if needed, but usually we keep local state
      // or we could reset to defaults. For now, we keep local state to allow offline play.
      return;
    }

    const loadData = async () => {
      console.log("☁️ Buscando dados da nuvem para:", currentUser.email);
      const data = await loadGameFromCloud(currentUser);
      
      if (data) {
        applyCloudData(data);
      } else {
        // New user or no data
        const fallbackName = currentUser.displayName || currentUser.email?.split("@")[0].toUpperCase() || "JOGADOR";
        setPlayerName(fallbackName);
      }
    };

    loadData();
  }, [currentUser]);

  const applyCloudData = useCallback((data: CloudSaveData) => {
    if (!data) return;

    setPlayerName(data.playerName || "JOGADOR");
    setHighScore((prev) => Math.max(prev, data.highScore || 0));

    const mergedUpgrades = smartMergeUpgrades(data);
    const mergedSkinId = smartMergeSkin(data);

    // Sanitize upgrades
    const sanitizedUpgrades = Array.isArray(mergedUpgrades)
      ? mergedUpgrades.map((u) => {
          if ((u.id === "crit_chn" || u.id === "crit_fac") && u.level > 0) {
            return { ...u, level: 0 };
          }
          return u;
        })
      : INITIAL_UPGRADES;

    setUpgrades(sanitizedUpgrades);
    
    setGameState((prev) => ({
      ...prev,
      cash: data.cash || 150,
      gems: data.gems || 0,
      wave: data.wave || 1, // Optional: could reset wave
      ownedSkinIds: Array.isArray(data.ownedSkinIds) ? data.ownedSkinIds : ["default"],
      selectedSkinId: mergedSkinId,
      lastLoginDate: data.lastLoginDate || "",
      loginStreak: data.loginStreak || 0,
    }));

    if (data.globalStats) {
      setGlobalStats(data.globalStats);
    }
  }, []);

  // --- AUTO-SAVE LOCAL (localStorage) ---
  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem("neon_arena_highscore", highScore.toString());
    }
  }, [highScore]);

  useEffect(() => {
    if (upgrades && upgrades.length > 0) {
      localStorage.setItem("neon_arena_upgrades", JSON.stringify(upgrades));
      localStorage.setItem("neon_arena_upgrades_timestamp", Date.now().toString());
    }
  }, [upgrades]);

  useEffect(() => {
    if (!gameState.isGameStarted) {
      // Save permanent state when not in game
      const stateToSave = {
        cash: gameState.cash,
        gems: gameState.gems,
        selectedSkinId: gameState.selectedSkinId,
        ownedSkinIds: gameState.ownedSkinIds,
        lastLoginDate: gameState.lastLoginDate,
        loginStreak: gameState.loginStreak,
      };
      localStorage.setItem("neon_arena_gamestate", JSON.stringify(stateToSave));
      localStorage.setItem("neon_arena_gamestate_timestamp", Date.now().toString());
    }
  }, [
    gameState.cash,
    gameState.gems,
    gameState.selectedSkinId,
    gameState.ownedSkinIds,
    gameState.lastLoginDate,
    gameState.loginStreak,
    gameState.isGameStarted,
  ]);

  // Save gameplay state during active game (for F5 recovery)
  useEffect(() => {
    if (gameState.isGameStarted) {
      const gameplayState = {
        cash: gameState.cash,
        wave: gameState.wave,
        waveProgress: gameState.waveProgress,
        gameSpeed: gameState.gameSpeed,
        isGameOver: gameState.isGameOver,
        isPaused: gameState.isPaused,
      };
      localStorage.setItem("neon_arena_gameplay_state", JSON.stringify(gameplayState));
    } else {
      // Clear gameplay state when game ends
      localStorage.removeItem("neon_arena_gameplay_state");
    }
  }, [
    gameState.isGameStarted,
    gameState.cash,
    gameState.wave,
    gameState.waveProgress,
    gameState.gameSpeed,
    gameState.isGameOver,
    gameState.isPaused,
  ]);

  // Save score during gameplay to prevent loss on page reload
  useEffect(() => {
    if (gameState.isGameStarted && gameState.score > 0) {
      localStorage.setItem("neon_arena_current_score", gameState.score.toString());
    }
  }, [gameState.score, gameState.isGameStarted]);

  // --- AUTO-SAVE CLOUD (Firebase) ---
  const handleCloudSave = async () => {
    if (!currentUser) return;

    try {
      setCloudStatus("saving");
      const success = await saveGameToCloud(
        currentUser,
        gameState,
        upgrades,
        playerName,
        highScore,
        globalStats
      );
      setCloudStatus(success ? "saved" : "error");
      setTimeout(() => setCloudStatus("idle"), 3000);
    } catch (error) {
      console.error("Erro ao salvar na nuvem:", error);
      setCloudStatus("error");
    }
  };

  // --- PERIODIC AUTO-SAVE (60s) ---
  useEffect(() => {
    if (!currentUser || !gameState.isGameStarted || gameState.isGameOver) {
      return;
    }

    const interval = setInterval(() => {
      handleCloudSave();
    }, 60000);

    return () => clearInterval(interval);
  }, [currentUser, gameState.isGameStarted, gameState.isGameOver, gameState, upgrades]);

  return {
    gameState,
    highScore,
    playerName,
    upgrades,
    globalStats,
    cloudStatus,
    setGameState,
    setHighScore,
    setPlayerName,
    setUpgrades,
    setGlobalStats,
    handleCloudSave,
  };
};
