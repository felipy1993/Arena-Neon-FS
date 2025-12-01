# 📁 Estrutura do Projeto - Arena Neon FS

## Organização Geral

```
Arena-Neon-FS/
├── src/                           # Código-fonte principal
│   ├── components/                # Componentes React reutilizáveis
│   ├── hooks/                     # Custom React Hooks
│   ├── services/                  # Serviços (Firebase, API, Audio)
│   ├── utils/                     # Funções utilitárias
│   ├── types/                     # Definições de tipos TypeScript
│   ├── constants/                 # Constantes e configurações
│   └── App.tsx                    # Componente principal
├── components/                    # [LEGADO] Componentes antigos (migrar para src/)
├── public/                        # Arquivos estáticos
├── node_modules/                  # Dependências
├── package.json                   # Dependências e scripts
└── vite.config.ts                 # Configuração do Vite
```

## 📂 Detalhamento por Pasta

### `/src/components`

Componentes React reutilizáveis e isolados:

- `GameCanvas.tsx` - Renderização do jogo (canvas)
- `Leaderboard.tsx` - Exibição do ranking
- `UpgradePanel.tsx` - Painel de upgrades
- `StatsPanel.tsx` - Painel de estatísticas
- `AuthForm.tsx` - Formulário de autenticação [TODO]
- `SkinModal.tsx` - Modal de skins [TODO]

### `/src/hooks`

Custom React Hooks para lógica reutilizável:

- `useGameLoop.ts` - Lógica do loop do jogo
- `useLeaderboard.ts` - Gerenciamento do leaderboard
- `useAuth.ts` - Autenticação e usuário
- `useGameState.ts` - Estado do jogo
- `useUpgrades.ts` - Gerenciamento de upgrades

### `/src/services`

Serviços de negócio e integrações externas:

- `firebase.ts` - Autenticação, banco de dados
- `audio.ts` - Sistema de áudio
- `competitive.ts` - Sistema competitivo (stats, prestige)
- `gameEngine.ts` - Motor do jogo (spawn, colisão) [TODO]

### `/src/utils`

Funções utilitárias puras:

- `helpers.ts` - Funções helper gerais
- `validation.ts` - Validações [TODO]
- `calculations.ts` - Cálculos complexos [TODO]
- `formatters.ts` - Formatação de dados [TODO]

### `/src/types`

Definições centralizadas de tipos TypeScript:

- `game.types.ts` - Tipos relacionados ao jogo
- `user.types.ts` - Tipos do usuário [TODO]
- `api.types.ts` - Tipos de API/Firebase [TODO]
- `index.ts` - Export central de tipos

### `/src/constants`

Constantes e configurações:

- `game.constants.ts` - Constantes do jogo
- `upgrades.constants.ts` - Definição de upgrades
- `skins.constants.ts` - Definição de skins
- `colors.constants.ts` - Paleta de cores
- `index.ts` - Export central de constantes

## 🔄 Fluxo de Dados

```
App.tsx (Componente Principal)
├── useAuth() Hook → Gerencia autenticação
├── useGameState() Hook → Estado do jogo
├── useGameLoop() Hook → Loop do jogo
├── useLeaderboard() Hook → Carregamento do ranking
│
├── Components
│   ├── GameCanvas (lógica: useGameLoop)
│   ├── UpgradePanel (lógica: useUpgrades)
│   ├── StatsPanel (lógica: globalStats)
│   └── Leaderboard (lógica: useLeaderboard)
│
└── Services
    ├── firebase.ts → Auth & Database
    ├── audio.ts → Reprodução de áudio
    └── competitive.ts → Cálculos competitivos
```

## ✅ Checklist de Migração

- [ ] Criar `src/hooks/useAuth.ts`
- [ ] Criar `src/hooks/useGameState.ts`
- [ ] Criar `src/hooks/useGameLoop.ts`
- [ ] Criar `src/hooks/useLeaderboard.ts`
- [ ] Criar `src/hooks/useUpgrades.ts`
- [ ] Mover `types.ts` → `src/types/index.ts`
- [ ] Mover `constants.ts` → `src/constants/index.ts`
- [ ] Mover `firebase.ts` → `src/services/firebase.ts`
- [ ] Mover `audio.ts` → `src/services/audio.ts`
- [ ] Mover `competitive.ts` → `src/services/competitive.ts`
- [ ] Mover componentes → `src/components/`
- [ ] Atualizar imports em App.tsx
- [ ] Deletar arquivos legados

## 🎯 Benefícios

1. **Maintainibilidade** - Código organizado e fácil de encontrar
2. **Escalabilidade** - Estrutura pronta para crescimento
3. **Reusabilidade** - Hooks e services facilitam reutilização
4. **Testabilidade** - Código isolado é mais fácil de testar
5. **Onboarding** - Novos devs entendem a estrutura rapidamente

## 📝 Convenções

- **Componentes**: `PascalCase` + `.tsx`
- **Hooks**: `camelCase` + `use` prefix + `.ts`
- **Services**: `camelCase` + `.ts`
- **Tipos**: Pasta `types/` com organização por domínio
- **Constantes**: Pasta `constants/` com organização por domínio

---

**Status**: Em progresso 🚀
**Última atualização**: 1º de dezembro de 2025
