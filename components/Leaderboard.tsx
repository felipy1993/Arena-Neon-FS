import React from "react";

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  highScore: number;
  prestigeLevel: number;
  lastUpdate: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentPlayerUid?: string;
  isLoading?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  currentPlayerUid,
  isLoading = false,
}) => {
  const getPrestigeBadge = (level: number): string => {
    if (level === 0) return "🆕";
    if (level < 3) return "⭐";
    if (level < 6) return "⭐⭐";
    if (level < 10) return "⭐⭐⭐";
    if (level < 20) return "👑";
    return "🔥";
  };

  const getMedalEmoji = (rank: number): string => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-gray-900 border border-cyan-500/30 rounded-lg shadow-2xl overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-cyan-900/40 to-purple-900/40 p-6 border-b border-cyan-500/20">
        <h2 className="text-3xl font-black text-cyan-400 font-orbitron uppercase">
          🏆 LEADERBOARD GLOBAL
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          Top 50 melhores jogadores • Rankings em tempo real
        </p>
      </div>

      {/* LOADING STATE */}
      {isLoading && (
        <div className="p-8 text-center">
          <p className="text-gray-400 animate-pulse">Carregando ranking...</p>
        </div>
      )}

      {/* LEADERBOARD TABLE */}
      {!isLoading && entries.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-gray-400">Nenhum jogador no ranking ainda.</p>
        </div>
      )}

      {!isLoading && entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/50 border-b border-cyan-500/20">
              <tr>
                <th className="px-4 py-3 text-gray-400 uppercase text-xs tracking-wider font-mono">
                  Pos
                </th>
                <th className="px-4 py-3 text-gray-400 uppercase text-xs tracking-wider">
                  Jogador
                </th>
                <th className="px-4 py-3 text-gray-400 uppercase text-xs tracking-wider font-mono">
                  Score
                </th>
                <th className="px-4 py-3 text-gray-400 uppercase text-xs tracking-wider">
                  Prestígio
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr
                  key={entry.playerName + idx}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition ${
                    currentPlayerUid === entry.playerName
                      ? "bg-cyan-900/20 border-l-4 border-l-cyan-400"
                      : ""
                  }`}
                >
                  {/* RANK */}
                  <td className="px-4 py-4 font-bold text-center text-lg">
                    {getMedalEmoji(entry.rank)}
                  </td>

                  {/* PLAYER NAME */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          entry.rank <= 3 ? "text-yellow-400" : "text-cyan-300"
                        }`}
                      >
                        {entry.playerName}
                      </span>
                    </div>
                  </td>

                  {/* SCORE */}
                  <td className="px-4 py-4">
                    <span className="font-mono text-yellow-400 font-bold text-lg">
                      {entry.highScore.toLocaleString()}
                    </span>
                  </td>

                  {/* PRESTIGE */}
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-2xl">
                        {getPrestigeBadge(entry.prestigeLevel)}
                      </span>
                      <span className="text-purple-300 font-bold">
                        Lv. {entry.prestigeLevel}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FOOTER */}
      <div className="bg-black/50 border-t border-gray-800 p-4 text-center text-xs text-gray-500">
        Ranking atualizado a cada 5 minutos • Seu score sobe conforme você
        progride
      </div>
    </div>
  );
};

export default Leaderboard;
