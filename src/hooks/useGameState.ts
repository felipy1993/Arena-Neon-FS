import { useState, useEffect, useRef } from "react";
import { saveGameToCloud } from "../../firebase";
import { User } from "firebase/auth";
import {
  GameState,
  Upgrade,
  PlayerGlobalStats,
  GameSession,
} from "../../types";

/**
 * Hook para gerenciar o estado geral do jogo
 *
 * Responsabilidades:
 * - Persistência local (localStorage)
 * - Sincronização com nuvem (Firebase)
 * - Gerenciamento de sessão
 * - Auto-save periódico
 */

interface UseGameStateReturn {
  gameState: GameState;
  highScore: number;
  playerName: string;
  upgrades: Upgrade[];
  globalStats: PlayerGlobalStats;
  cloudStatus: "idle" | "saving" | "error" | "saved";
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  setHighScore: (score: number) => void;
  setPlayerName: (name: string) => void;
  setUpgrades: (upgrades: Upgrade[]) => void;
  setGlobalStats: (stats: PlayerGlobalStats) => void;
  handleCloudSave: () => Promise<void>;
}

export const useGameState = (
  currentUser: User | null,
  initialState: GameState,
  initialUpgrades: Upgrade[]
): UseGameStateReturn => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [highScore, setHighScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [upgrades, setUpgrades] = useState<Upgrade[]>(initialUpgrades);
  const [globalStats, setGlobalStats] = useState<PlayerGlobalStats>({
    totalEnemiesKilled: 0,
    totalDamageDeal: 0,
    totalDamageTaken: 0,
    longestWaveReached: 1,
    totalPlaytime: 0,
    prestigeLevel: 0,
    totalRuns: 0,
  });
  const [cloudStatus, setCloudStatus] = useState<
    "idle" | "saving" | "error" | "saved"
  >("idle");

  // --- AUTO-SAVE LOCAL (localStorage) ---
  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem("neon_arena_highscore", highScore.toString());
    }
  }, [highScore]);

  useEffect(() => {
    if (upgrades.length > 0) {
      localStorage.setItem("neon_arena_upgrades", JSON.stringify(upgrades));
      localStorage.setItem(
        "neon_arena_upgrades_timestamp",
        Date.now().toString()
      );
    }
  }, [upgrades]);

  useEffect(() => {
    if (!gameState.isGameStarted) {
      const stateToSave = {
        cash: gameState.cash,
        gems: gameState.gems,
        selectedSkinId: gameState.selectedSkinId,
        ownedSkinIds: gameState.ownedSkinIds,
        lastLoginDate: gameState.lastLoginDate,
        loginStreak: gameState.loginStreak,
      };
      localStorage.setItem("neon_arena_gamestate", JSON.stringify(stateToSave));
      localStorage.setItem(
        "neon_arena_gamestate_timestamp",
        Date.now().toString()
      );
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
  }, [currentUser, gameState.isGameStarted, gameState.isGameOver]);

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
