import { PlayerGlobalStats, GameSession } from "./types";

// Inicializa stats globais vazias
export const initializeGlobalStats = (): PlayerGlobalStats => ({
  totalEnemiesKilled: 0,
  totalDamageDeal: 0,
  totalDamageTaken: 0,
  longestWaveReached: 1,
  totalPlaytime: 0,
  prestigeLevel: 0,
  totalRuns: 0,
});

// Calcula score de forma competitiva (evita apenas "sorte")
export const calculateCompetitiveScore = (
  wave: number,
  enemiesKilled: number,
  criticalHits: number,
  wavesSurvived: number
): number => {
  const baseScore = enemiesKilled * wave * 10; // Inimigos * Onda
  const waveBonus = wave * 500; // Bônus por chegar em ondas altas
  const critBonus = criticalHits * 25; // Bônus por skill (críticos)
  const survivalBonus = wavesSurvived * 100; // Recompensa por progresso

  return baseScore + waveBonus + critBonus + survivalBonus;
};

// Atualiza stats globais com dados da sessão
export const updateGlobalStats = (
  current: PlayerGlobalStats,
  session: GameSession
): PlayerGlobalStats => {
  return {
    ...current,
    totalEnemiesKilled: current.totalEnemiesKilled + session.totalKills,
    totalDamageDeal: current.totalDamageDeal + session.totalDamage,
    longestWaveReached: Math.max(current.longestWaveReached, session.finalWave),
    totalPlaytime: current.totalPlaytime + session.duration,
    totalRuns: current.totalRuns + 1,
    lastSessionEndTime: session.timestamp + session.duration * 1000,
  };
};

// Calcula prestige (quanto mais jogado, mais prestige)
export const calculatePrestigeLevel = (stats: PlayerGlobalStats): number => {
  // A cada 100 inimigos derrotados = 1 prestige
  // A cada 50 ondas chegadas = 1 prestige
  const killPrestige = Math.floor(stats.totalEnemiesKilled / 100);
  const wavePrestige = Math.floor(stats.longestWaveReached / 50);
  const timePrestige = Math.floor(stats.totalPlaytime / 3600); // 1h de play = 1 prestige

  return killPrestige + wavePrestige + Math.floor(timePrestige / 2); // weight time menos
};

// Formata playtime para exibição
export const formatPlaytime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Gera badge de prestígio visual
export const getPrestigeBadge = (level: number): string => {
  if (level === 0) return "🆕"; // Novato
  if (level < 3) return "⭐"; // Iniciante
  if (level < 6) return "⭐⭐"; // Intermediário
  if (level < 10) return "⭐⭐⭐"; // Avançado
  if (level < 20) return "👑"; // Mestre
  return "🔥"; // Lendário
};
