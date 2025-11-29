import React from "react";
import { PlayerGlobalStats } from "../types";
import { formatPlaytime, getPrestigeBadge } from "../competitive";

interface StatsPanelProps {
  stats: PlayerGlobalStats;
  highScore: number;
  playerName: string;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  highScore,
  playerName,
}) => {
  const prestigeBadge = getPrestigeBadge(stats.prestigeLevel);

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 border border-cyan-500/30 rounded-lg p-6 shadow-2xl">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyan-500/20">
        <div>
          <h2 className="text-2xl font-black text-cyan-400 font-orbitron uppercase">
            {playerName}
          </h2>
          <p className="text-gray-400 text-sm">Perfil Competitivo</p>
        </div>
        <div className="text-4xl text-yellow-400">{prestigeBadge}</div>
      </div>

      {/* MAIN STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* High Score */}
        <div className="bg-black/50 border border-yellow-500/30 rounded p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider">
            High Score
          </p>
          <p className="text-2xl font-bold text-yellow-400 font-mono">
            {highScore.toLocaleString()}
          </p>
        </div>

        {/* Enemies Killed */}
        <div className="bg-black/50 border border-red-500/30 rounded p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider">
            Inimigos Derrotados
          </p>
          <p className="text-2xl font-bold text-red-400 font-mono">
            {stats.totalEnemiesKilled.toLocaleString()}
          </p>
        </div>

        {/* Prestige Level */}
        <div className="bg-black/50 border border-purple-500/30 rounded p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider">
            Prestígio
          </p>
          <p className="text-2xl font-bold text-purple-400 font-mono">
            {stats.prestigeLevel}
          </p>
        </div>

        {/* Total Runs */}
        <div className="bg-black/50 border border-blue-500/30 rounded p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider">
            Partidas Jogadas
          </p>
          <p className="text-2xl font-bold text-blue-400 font-mono">
            {stats.totalRuns}
          </p>
        </div>
      </div>

      {/* DETAILED STATS */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Longest Wave */}
        <div className="flex justify-between items-center bg-black/30 p-3 rounded border border-gray-700">
          <span className="text-gray-300 text-sm">Onda Máxima:</span>
          <span className="text-cyan-400 font-bold">
            {stats.longestWaveReached}
          </span>
        </div>

        {/* Total Damage */}
        <div className="flex justify-between items-center bg-black/30 p-3 rounded border border-gray-700">
          <span className="text-gray-300 text-sm">Dano Total:</span>
          <span className="text-red-400 font-bold">
            {Math.floor(stats.totalDamageDeal).toLocaleString()}
          </span>
        </div>

        {/* Playtime */}
        <div className="flex justify-between items-center bg-black/30 p-3 rounded border border-gray-700">
          <span className="text-gray-300 text-sm">Tempo Jogado:</span>
          <span className="text-green-400 font-bold">
            {formatPlaytime(stats.totalPlaytime)}
          </span>
        </div>

        {/* Average Wave per Run */}
        <div className="flex justify-between items-center bg-black/30 p-3 rounded border border-gray-700">
          <span className="text-gray-300 text-sm">Onda Média:</span>
          <span className="text-purple-400 font-bold">
            {(stats.longestWaveReached / Math.max(stats.totalRuns, 1)).toFixed(
              1
            )}
          </span>
        </div>
      </div>

      {/* PRESTIGE INFO */}
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded p-4">
        <p className="text-purple-300 text-xs uppercase tracking-wider mb-2">
          Sobre Prestígio
        </p>
        <p className="text-gray-300 text-sm">
          Seu nível de prestígio ({stats.prestigeLevel}) reflete seu dedicação
          ao jogo. Quanto mais você joga e progride, maior seu prestígio!
        </p>
        <p className="text-gray-400 text-xs mt-2 italic">
          Próximo marco: +{100 - (stats.totalEnemiesKilled % 100)} inimigos até
          próximo nível
        </p>
      </div>
    </div>
  );
};

export default StatsPanel;
