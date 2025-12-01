import { Upgrade, Skin } from "./types";

export const CANVAS_SIZE = 800; // Resolução interna
export const TICK_RATE = 60;
export const MAX_ENEMIES_ON_SCREEN = 25; // Performance Limit - Reduzido para 25 conforme solicitado
export const MAX_PARTICLES = 100;
export const UI_UPDATE_INTERVAL = 100; // ms

// --- SKIN GENERATOR ---
const generateSkins = (): Skin[] => {
  const skins: Skin[] = [];

  // 1. Default Skin (Always Free)
  skins.push({
    id: "default",
    name: "Operador Padrão",
    type: "hexagon",
    color: "#00f3ff",
    price: 0,
  });

  // Helpers
  const shapes: Skin["type"][] = [
    "hexagon",
    "triangle",
    "square",
    "star",
    "circle",
  ];
  const prefixes = [
    "Neon",
    "Dark",
    "Hyper",
    "Void",
    "Cyber",
    "Quantum",
    "Omega",
    "Plasma",
    "Solar",
    "Lunar",
    "Mecha",
    "Nano",
    "Glitch",
    "Flux",
    "Aero",
  ];
  const suffixes = [
    "Viper",
    "Core",
    "Star",
    "Shard",
    "Ghost",
    "Prime",
    "Hex",
    "Pulse",
    "Drifter",
    "Nova",
    "Blade",
    "Matrix",
    "Spark",
    "Storm",
    "Titan",
  ];

  const getRandomItem = (arr: any[]) =>
    arr[Math.floor(Math.random() * arr.length)];

  // Generator Logic
  // Total target: ~100 skins

  // TIER 1: Common (Cheap) - 20 Skins
  for (let i = 0; i < 20; i++) {
    const hue = Math.floor(Math.random() * 360);
    skins.push({
      id: `t1_${i}`,
      name: `${getRandomItem(prefixes)} ${getRandomItem(suffixes)}`,
      type: getRandomItem(shapes),
      color: `hsl(${hue}, 100%, 60%)`,
      price: 50 + i * 50, // 50 -> 1000
    });
  }

  // TIER 2: Rare (Medium) - 30 Skins
  for (let i = 0; i < 30; i++) {
    const hue = Math.floor(Math.random() * 360);
    skins.push({
      id: `t2_${i}`,
      name: `MK-II ${getRandomItem(prefixes)}`,
      type: getRandomItem(shapes),
      color: `hsl(${hue}, 100%, 50%)`, // Mais saturado
      price: 2000 + i * 500, // 2k -> 17k
    });
  }

  // TIER 3: Epic (Expensive) - 25 Skins
  for (let i = 0; i < 25; i++) {
    const hue = Math.floor(Math.random() * 360);
    skins.push({
      id: `t3_${i}`,
      name: `Elite ${getRandomItem(suffixes)}`,
      type: getRandomItem(shapes),
      color: `hsl(${hue}, 90%, 70%)`, // Brilhante
      price: 25000 + i * 2000, // 25k -> 75k
    });
  }

  // TIER 4: Legendary (Very Expensive) - 15 Skins
  for (let i = 0; i < 15; i++) {
    const hue = Math.floor(Math.random() * 360);
    skins.push({
      id: `t4_${i}`,
      name: `Lendário ${getRandomItem(prefixes)}`,
      type: "star", // Stars are cool
      color: `hsl(${hue}, 100%, 80%)`, // Muito brilhante
      price: 100000 + i * 50000, // 100k -> 850k
    });
  }

  // TIER 5: Divine (Impossible) - 10 Skins
  for (let i = 0; i < 10; i++) {
    const hue = Math.floor(Math.random() * 360);
    skins.push({
      id: `t5_${i}`,
      name: `DEUS ${getRandomItem(prefixes).toUpperCase()}`,
      type: getRandomItem(shapes),
      color: "#ffffff", // White core with colored glow usually
      price: 1000000 + i * 10000000, // 1M -> 100M
    });
  }

  return skins;
};

export const AVAILABLE_SKINS: Skin[] = generateSkins();

export const INITIAL_UPGRADES: Upgrade[] = [
  // Ataque Básico
  {
    id: "dmg",
    name: "Dano",
    type: "attack",
    baseCost: 10,
    costMultiplier: 1.4,
    baseValue: 5,
    valuePerLevel: 2,
    level: 1,
    unit: "",
    description: "Dano base por acerto",
  },
  {
    id: "atk_spd",
    name: "Vel. Ataque",
    type: "attack",
    baseCost: 15,
    costMultiplier: 1.5,
    baseValue: 1.0,
    valuePerLevel: 0.1,
    level: 1,
    unit: "/s",
    description: "Ataques por segundo",
  },
  {
    id: "range",
    name: "Alcance",
    type: "attack",
    baseCost: 20,
    costMultiplier: 1.3,
    baseValue: 150,
    valuePerLevel: 10,
    level: 1,
    unit: "m",
    description: "Distância máx. de ataque",
  },

  // Ataque Avançado
  {
    id: "multi_shot",
    name: "Projéteis",
    type: "attack",
    baseCost: 500,
    costMultiplier: 2.0,
    baseValue: 3,
    valuePerLevel: 1,
    level: 0,
    unit: "x",
    description: "Alvos simultâneos",
  },
  {
    id: "crit_chn",
    name: "Chance Crít.",
    type: "attack",
    baseCost: 100,
    costMultiplier: 1.5,
    baseValue: 2,
    valuePerLevel: 0.5,
    level: 0,
    unit: "%",
    description: "Chance de dano duplo",
  },
  {
    id: "crit_fac",
    name: "Fator Crít.",
    type: "attack",
    baseCost: 150,
    costMultiplier: 1.6,
    baseValue: 1.1,
    valuePerLevel: 0.1,
    level: 0,
    unit: "x",
    description: "Multiplicador ao criticar",
  },
  {
    id: "dmg_mtr",
    name: "Dano/Metro",
    type: "attack",
    baseCost: 200,
    costMultiplier: 1.6,
    baseValue: 1,
    valuePerLevel: 0.5,
    level: 0,
    unit: "%",
    description: "Bônus por distância",
  },

  // Defesa
  {
    id: "hp",
    name: "Vida",
    type: "defense",
    baseCost: 10,
    costMultiplier: 1.3,
    baseValue: 100,
    valuePerLevel: 20,
    level: 1,
    unit: "",
    description: "Pontos de Vida Máximos",
  },
  {
    id: "max_shield",
    name: "Escudo Energia",
    type: "defense",
    baseCost: 150,
    costMultiplier: 1.5,
    baseValue: 20,
    valuePerLevel: 10,
    level: 0,
    unit: "",
    description: "Proteção regenerativa",
  },
  {
    id: "regen",
    name: "Regen.",
    type: "defense",
    baseCost: 50,
    costMultiplier: 1.4,
    baseValue: 1,
    valuePerLevel: 0.5,
    level: 0,
    unit: "/s",
    description: "Vida restaurada p/ seg.",
  },
  {
    id: "armor",
    name: "Armadura",
    type: "defense",
    baseCost: 75,
    costMultiplier: 1.5,
    baseValue: 1,
    valuePerLevel: 1,
    level: 0,
    unit: "",
    description: "Redução fixa de dano",
  },
  {
    id: "dodge",
    name: "Esquiva",
    type: "defense",
    baseCost: 100,
    costMultiplier: 1.6,
    baseValue: 5,
    valuePerLevel: 0.5,
    level: 0,
    unit: "%",
    description: "Chance de evitar dano",
  },

  // Habilidades (Utilities)
  {
    id: "emp_dmg",
    name: "Dano EMP",
    type: "utility",
    baseCost: 300,
    costMultiplier: 1.5,
    baseValue: 50,
    valuePerLevel: 25,
    level: 1,
    unit: "",
    description: "Dano da onda de choque",
  },
  {
    id: "emp_cdr",
    name: "Recarga EMP",
    type: "utility",
    baseCost: 400,
    costMultiplier: 1.5,
    baseValue: 30,
    valuePerLevel: -2,
    level: 1,
    unit: "s",
    description: "Tempo de espera do EMP",
  },
];

export const COLOR_PALETTE = {
  background: "#050510", // Preto azulado profundo (Cyberpunk)
  primary: "#00f3ff", // Ciano Elétrico (Jogador Padrão)
  secondary: "#ff0055", // Rosa Neon (Inimigo)
  accent: "#fcee0a", // Amarelo Ácido (Crítico/Ouro)
  success: "#00ff9d", // Verde Neon (Vida)
  shield: "#00f3ff", // Ciano (Escudo)
  grid: "#1a1a2e", // Grade azulada escura
  text: "#ffffff",
  uiBg: "rgba(5, 5, 16, 0.95)",
};

// Maximum / Minimum caps for certain upgrade-derived stats
export const UPGRADE_LIMITS: Record<string, { min?: number; max?: number }> = {
  // Range in pixels (do not exceed canvas size)
  range: { min: 50, max: 450 },
  // Crit chance: percentage 0-100
  crit_chn: { min: 0, max: 50 },
  // Crit factor multiplier
  crit_fac: { min: 1.0, max: 6.0 },
  // Multi shot: cap to renderer visual cap
  multi_shot: { min: 0, max: 15 },
  // Regen per second
  regen: { min: 0, max: 50 },
  // Armor flat reduction
  armor: { min: 0, max: 200 },
  // Dodge percent
  dodge: { min: 0, max: 90 },
  // Max shield
  max_shield: { min: 0, max: 2000 },
  // Damage per meter percent bonus
  dmg_mtr: { min: 0, max: 200 },
  // EMP damage
  emp_dmg: { min: 0, max: 5000 },
  // EMP cooldown (valuePerLevel may be negative) - set reasonable min
  emp_cdr: { min: 1, max: 120 },
};

// How long each wave lasts (seconds). Higher => longer game per wave.
export const WAVE_DURATION = 90; // 90s per wave to make runs longer
