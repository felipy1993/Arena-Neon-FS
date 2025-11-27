import React from "react";
import { Upgrade } from "../types";
import {
  Shield,
  Sword,
  Zap,
  Heart,
  Crosshair,
  Move,
  Circle,
  Layers,
} from "lucide-react";

interface UpgradePanelProps {
  upgrades: Upgrade[];
  cash: number;
  onBuy: (id: string) => void;
  maxedIds?: Set<string>;
}

const UpgradePanel: React.FC<UpgradePanelProps> = ({
  upgrades,
  cash,
  onBuy,
  maxedIds,
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case "dmg":
        return <Sword size={16} />;
      case "atk_spd":
        return <Zap size={16} />;
      case "range":
        return <Crosshair size={16} />;
      case "multi_shot":
        return <Layers size={16} />;
      case "hp":
        return <Heart size={16} />;
      case "max_shield":
        return <Circle size={16} />;
      case "armor":
        return <Shield size={16} />;
      case "moveSpeed":
        return <Move size={16} />;
      case "emp_dmg":
        return <Zap size={16} />;
      case "emp_cdr":
        return <Zap size={16} />;
      default:
        return <Zap size={16} />;
    }
  };

  // Custo = Base * (Multiplicador ^ NívelAtual)
  const calculateCost = (u: Upgrade) =>
    Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.level));

  return (
    <div className="flex-1 overflow-y-auto p-2 bg-black/90 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-black h-full">
      {/* Responsive Grid: 2 cols on very small screens, 2 on sidebar, auto-fill for larger panels if reused */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 pb-8">
        {upgrades.map((u) => {
          const cost = calculateCost(u);
          const canAfford = cash >= cost;
          const isMaxedEffective = maxedIds ? maxedIds.has(u.id) : false;
          const isAttack = u.type === "attack";
          const isUtility = u.type === "utility";
          const isLocked = u.level === 0;

          const currentValue = isLocked
            ? 0
            : u.baseValue + u.valuePerLevel * (u.level - 1);
          const nextValue = isLocked
            ? u.baseValue
            : currentValue + u.valuePerLevel;

          const themeColor = isUtility
            ? "text-purple-500"
            : isAttack
            ? "text-red-500"
            : "text-cyan-500";
          const borderColor = isUtility
            ? "border-purple-900/50"
            : isAttack
            ? "border-red-900/50"
            : "border-cyan-900/50";
          const hoverBorder = isUtility
            ? "group-hover:border-purple-500"
            : isAttack
            ? "group-hover:border-red-500"
            : "group-hover:border-cyan-400";
          const bgHover = isUtility
            ? "hover:bg-purple-900/20"
            : isAttack
            ? "hover:bg-red-900/20"
            : "hover:bg-cyan-900/20";
          const textColor = isUtility
            ? "text-purple-400"
            : isAttack
            ? "text-red-400"
            : "text-cyan-400";

          return (
            <button
              key={u.id}
              onClick={() => {
                if (!canAfford || isMaxedEffective) return;
                onBuy(u.id);
              }}
              aria-label={
                isMaxedEffective
                  ? `${u.name} no nível máximo`
                  : `Comprar ${u.name} por ${cost}`
              }
              disabled={!canAfford || isMaxedEffective}
              className={`
                relative p-2 flex flex-col justify-between transition-all group text-left min-h-[80px]
                bg-gray-900/40 border ${borderColor} ${hoverBorder} ${bgHover}
                ${
                  isMaxedEffective
                    ? "opacity-70 cursor-not-allowed"
                    : canAfford
                    ? "opacity-100 active:scale-95 cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }
              `}
              style={{
                clipPath:
                  "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)",
              }}
            >
              {/* Corner Indicators */}
              <div
                className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${
                  isUtility
                    ? "border-purple-500"
                    : isAttack
                    ? "border-red-500"
                    : "border-cyan-500"
                } opacity-50`}
              ></div>

              {/* Header */}
              <div className="flex justify-between items-start mb-1 w-full">
                <span
                  className={`font-bold font-orbitron text-[10px] md:text-xs tracking-wider uppercase truncate pr-1 ${textColor}`}
                >
                  {u.name}
                </span>
                <span className="text-[9px] text-gray-500 font-mono bg-black/80 px-1 rounded border border-gray-800 shrink-0">
                  L{u.level}
                </span>
              </div>

              {/* Stats */}
              <div className="text-[10px] text-gray-400 mb-2 font-share font-bold flex flex-col justify-center">
                {isLocked ? (
                  <div className="flex items-center gap-1 text-yellow-500/90 animate-pulse">
                    <span>DESBLOQUEAR</span>
                  </div>
                ) : (
                  <div className="flex items-center flex-wrap gap-1 leading-tight">
                    <span className="text-white">
                      {currentValue.toFixed(currentValue % 1 === 0 ? 0 : 1)}
                      <span className="text-[8px] ml-0.5 opacity-70">
                        {u.unit}
                      </span>
                    </span>
                    <span className={`${themeColor}`}>
                      » {nextValue.toFixed(nextValue % 1 === 0 ? 0 : 1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Price Button */}
              <div
                className={`
                mt-auto w-full py-1 px-1 flex items-center justify-center gap-1
                text-[10px] font-bold font-mono border-t border-b border-opacity-30
                transition-colors
                ${
                  isMaxedEffective
                    ? "bg-gray-700/60 border-gray-600 text-gray-300"
                    : canAfford
                    ? "bg-yellow-500/10 border-yellow-500 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.1)] group-hover:bg-yellow-500 group-hover:text-black"
                    : "bg-gray-800/50 border-gray-700 text-gray-500"
                }
              `}
              >
                {isMaxedEffective ? (
                  <span className="text-[10px] font-bold">MAX</span>
                ) : (
                  <>
                    <span>$</span>
                    <span>{cost.toLocaleString()}</span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default UpgradePanel;
