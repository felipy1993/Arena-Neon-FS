import { useState, useEffect } from "react";
import { loadLeaderboard } from "../../firebase";

/**
 * Hook para gerenciar carregamento e atualização do leaderboard
 *
 * Responsabilidades:
 * - Carregamento inicial do leaderboard
 * - Polling automático (30s)
 * - Controle de estado de loading
 * - Tratamento de erros
 */

interface LeaderboardEntry {
  id: string;
  uid: string;
  playerName: string;
  highScore: number;
  prestigeLevel: number;
  lastUpdate: any;
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

export const useLeaderboard = (shouldLoad: boolean): UseLeaderboardReturn => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldLoad) return;

    const loadLeaderboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("🔄 Carregando leaderboard...");

        const data = await loadLeaderboard(50);

        if (!Array.isArray(data)) {
          throw new Error("Formato de dados inválido");
        }

        const validData = data.filter(
          (entry) => entry.playerName && typeof entry.highScore === "number"
        );

        console.log(`✅ ${validData.length} jogadores carregados`);
        setLeaderboard(validData);
      } catch (err) {
        console.error("❌ Erro ao carregar leaderboard:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setLeaderboard([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Carregamento inicial
    loadLeaderboardData();

    // Polling automático a cada 30s
    const interval = setInterval(loadLeaderboardData, 30000);

    return () => clearInterval(interval);
  }, [shouldLoad]);

  return {
    leaderboard,
    isLoading,
    error,
  };
};
