# 🎮 Arena Neon FS - Guia de Código

> Estrutura clara e organizada para fácil análise e manutenção

## 📋 Índice Rápido

1. **[Estrutura do Projeto](#estrutura-do-projeto)**
2. **[Fluxo de Dados](#fluxo-de-dados)**
3. **[Como Adicionar Recursos](#como-adicionar-recursos)**
4. **[Arquivos Principais](#arquivos-principais)**
5. **[Debugging](#debugging)**

---

## 📁 Estrutura do Projeto

```
src/
├── hooks/                    # Custom React Hooks
│   ├── useAuth.ts           # Autenticação do usuário
│   ├── useGameState.ts      # Estado do jogo (cache + cloud)
│   ├── useLeaderboard.ts    # Carregamento do ranking
│   └── index.ts             # Exports centralizados
│
├── services/                # Lógica de negócio
│   ├── firebase.ts          # Auth + Database
│   ├── audio.ts             # Sistema de áudio
│   └── competitive.ts       # Cálculos competitivos
│
├── types/                   # TypeScript tipos
│   ├── game.types.ts        # Tipos do jogo
│   └── index.ts             # Exports centralizados
│
├── constants/               # Constantes
│   ├── game.constants.ts    # Constantes do jogo
│   ├── upgrades.constants.ts # Upgrades disponíveis
│   ├── skins.constants.ts   # Skins disponíveis
│   └── index.ts             # Exports centralizados
│
├── components/              # Componentes React
│   ├── GameCanvas.tsx       # Renderização do jogo
│   ├── Leaderboard.tsx      # Ranking global
│   ├── UpgradePanel.tsx     # Painel de upgrades
│   └── StatsPanel.tsx       # Painel de stats
│
└── App.tsx                  # Componente principal
```

---

## 🔄 Fluxo de Dados

### Autenticação

```
[Login] → useAuth Hook → Firebase Auth → setCurrentUser → App
   ↓
[Carregar Save] → loadGameFromCloud() → useGameState → setGameState
```

### Jogo em Execução

```
[Start Game] → useGameLoop() → GameCanvas
   ↓
[Game Over] → updateGlobalStats() → saveGameToCloud()
   ↓
[Update Leaderboard] → updateLeaderboard() → Firebase
```

### Sincronização com Nuvem

```
Local Storage (localStorage) ← Persist ← App State
        ↓
    (60s interval)
        ↓
Firebase Cloud (Firestore) ← handleCloudSave()
```

---

## ✨ Como Adicionar Recursos

### 1️⃣ Novo Upgrade

```typescript
// src/constants/upgrades.constants.ts
INITIAL_UPGRADES.push({
  id: "new_upgrade",
  name: "Novo Upgrade",
  type: "attack",
  baseCost: 100,
  costMultiplier: 1.15,
  baseValue: 10,
  valuePerLevel: 5,
  level: 0,
  unit: "%",
  description: "Descrição do upgrade",
});
```

### 2️⃣ Novo Hook

```typescript
// src/hooks/useMyFeature.ts
export const useMyFeature = () => {
  // Lógica aqui
  return {
    /* dados */
  };
};

// src/hooks/index.ts (adicionar export)
export { useMyFeature } from "./useMyFeature";
```

### 3️⃣ Novo Componente

```typescript
// src/components/MyComponent.tsx
import { useMyHook } from "../hooks";

interface MyComponentProps {
  data: any;
}

export const MyComponent: React.FC<MyComponentProps> = ({ data }) => {
  const { value } = useMyHook();

  return <div>{value}</div>;
};

export default MyComponent;
```

---

## 📄 Arquivos Principais

### `src/hooks/useAuth.ts`

Gerencia autenticação do usuário.

**O que faz:**

- Listener de autenticação
- Login com Google/Email/Username
- Logout
- Carregamento de dados da nuvem

**Como usar:**

```typescript
const { currentUser, authMode, handleAuthAction } = useAuth();
```

---

### `src/hooks/useGameState.ts`

Gerencia estado do jogo (local + cloud).

**O que faz:**

- Persistência local (localStorage)
- Auto-save na nuvem (60s)
- Gerenciamento de stats
- Sincronização bidireccional

**Como usar:**

```typescript
const { gameState, setGameState, handleCloudSave } = useGameState(
  currentUser,
  initialState,
  initialUpgrades
);
```

---

### `src/hooks/useLeaderboard.ts`

Carrega e atualiza o ranking.

**O que faz:**

- Carregamento inicial
- Polling automático (30s)
- Tratamento de erros
- Validação de dados

**Como usar:**

```typescript
const { leaderboard, isLoading, error } = useLeaderboard(showLeaderboard);
```

---

### `src/services/firebase.ts`

Integração com Firebase.

**Funções principais:**

- `loginWithGoogle()` - Login com Google
- `registerWithEmail()` - Criar conta
- `loginWithEmailOrUsername()` - Login
- `saveGameToCloud()` - Salvar jogo
- `loadGameFromCloud()` - Carregar jogo
- `updateLeaderboard()` - Atualizar ranking
- `loadLeaderboard()` - Carregar ranking

---

### `src/services/audio.ts`

Sistema de áudio do jogo.

**Métodos:**

- `audioSystem.playShoot()` - Som de tiro
- `audioSystem.playHit()` - Som de impacto
- `audioSystem.playExplosion()` - Som de explosão
- `audioSystem.playUpgrade()` - Som de upgrade
- `audioSystem.playEmp()` - Som de EMP

---

### `src/services/competitive.ts`

Lógica competitiva e stats.

**Funções:**

- `calculateCompetitiveScore()` - Calcular score
- `updateGlobalStats()` - Atualizar stats globais
- `calculatePrestigeLevel()` - Calcular prestige

---

## 🐛 Debugging

### 1. Verificar Console

```typescript
// Logs automáticos:
console.log("🔄 Carregando leaderboard...");
console.log("✅ 5 jogadores carregados");
console.log("❌ Erro ao carregar leaderboard:");
```

### 2. Ver Estado Atual

```typescript
// Em App.tsx adicionar:
console.log("Current User:", currentUser);
console.log("Game State:", gameState);
console.log("Leaderboard:", leaderboard);
console.log("Cloud Status:", cloudStatus);
```

### 3. Teste Local

```bash
# Executar com Vite
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

### 4. Inspecionar Firebase

Acessar [Firebase Console](https://console.firebase.google.com/) para:

- Ver documentos do Firestore
- Verificar logs de autenticação
- Monitorar regras de segurança

---

## 🎯 Próximas Melhorias

- [ ] Separar lógica do game loop em `useGameLoop()` hook
- [ ] Criar `useUpgrades()` hook
- [ ] Refatorar `App.tsx` para usar mais hooks
- [ ] Adicionar testes unitários
- [ ] Implementar error boundary
- [ ] Melhorar performance do canvas

---

## 📞 Dúvidas?

Consulte:

1. **PROJECT_STRUCTURE.md** - Estrutura detalhada
2. **Console logs** - Debug automático
3. **Firebase Console** - Ver dados em tempo real
4. **Código dos hooks** - São bem documentados

---

**Última atualização**: 1º de dezembro de 2025
