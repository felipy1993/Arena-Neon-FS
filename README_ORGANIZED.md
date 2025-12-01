# 📚 Arena Neon FS - Documentação Completa

> Guia organizado e estruturado para entender e manter o projeto

## 🎯 Começar Por Aqui

Você é novo no projeto? Leia nesta ordem:

1. **[Este arquivo](#) - Visão Geral** (5 min)
2. **[CODE_ORGANIZATION.md](./CODE_ORGANIZATION.md)** - Como o código está organizado (10 min)
3. **[FLOW_DIAGRAM.md](./FLOW_DIAGRAM.md)** - Fluxo de dados visual (10 min)
4. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Estrutura detalhada (5 min)
5. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Como resolver problemas (consultado quando necessário)

**Tempo total**: ~30 minutos para entender o projeto completo

---

## 🎮 O Que É Arena Neon FS?

Um jogo de defesa em tempo real com:

- 🎯 Sistema de upgrades progressivos
- 🏆 Ranking global (Leaderboard)
- ⭐ Sistema de prestige
- ☁️ Sincronização cloud (Firebase)
- 🎮 Gameplay roguelike com ondas infinitas
- 🔐 Autenticação segura com Google/Email

---

## 📊 Estatísticas do Projeto

| Métrica              | Valor                             |
| -------------------- | --------------------------------- |
| Linhas de Código     | ~2500+                            |
| Componentes          | 4 principais                      |
| Hooks Custom         | 3 (+ 2 planejados)                |
| Serviços             | 3 (Firebase, Audio, Competitive)  |
| Upgrades             | 15+                               |
| Skins                | 5+                                |
| Firebase Collections | 3 (users, leaderboard, usernames) |

---

## 🏗️ Arquitetura em Camadas

```
┌─────────────────────────────────────────────────┐
│  UI LAYER (React Components)                    │
│  - GameCanvas, Leaderboard, UpgradePanel       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  LOGIC LAYER (Custom Hooks)                     │
│  - useAuth, useGameState, useLeaderboard       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  BUSINESS LAYER (Services)                      │
│  - Firebase, Audio, Competitive                 │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  DATA LAYER (External APIs)                     │
│  - Firebase Auth, Firestore, Cloud Storage      │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Segurança

### Autenticação

- ✅ Firebase Authentication
- ✅ Login com Google
- ✅ Login com Email/Senha
- ✅ Login com Username
- ✅ Password hashing automático (Google)

### Database

- ✅ Firestore com regras de segurança
- ✅ Usuários só acessam seus dados
- ✅ Leaderboard pública (leitura)
- ✅ Usernames protegidos

### Dados

- ✅ LocalStorage para cache
- ✅ Sincronização automática
- ✅ Backup em nuvem
- ✅ Merge automático (local vs cloud)

---

## 💾 Persistência

### Local (localStorage)

```
neon_arena_highscore          → Maior score
neon_arena_gamestate          → Dinheiro, Skins
neon_arena_upgrades           → Níveis dos upgrades
neon_arena_session_score      → Score da sessão atual
```

### Cloud (Firestore)

```
/users/{userId}               → Dados completos do jogador
/leaderboard/{userId}         → Entrada no ranking
/usernames/{username}         → Mapeamento username ↔ uid
```

---

## 🔄 Estados Principais

### GameState

```typescript
{
  cash: number,              // Moeda em-jogo
  gems: number,              // Moeda premium
  wave: number,              // Onda atual
  score: number,             // Score da sessão
  isGameStarted: boolean,    // Jogo em andamento?
  isGameOver: boolean,       // Jogo terminou?
  isPaused: boolean,         // Jogo pausado?
  selectedSkinId: string,    // Skin equipado
  ownedSkinIds: string[],    // Skins possuídas
}
```

### GlobalStats

```typescript
{
  totalEnemiesKilled: number,    // Total de kills
  totalDamageDeal: number,       // Dano total causado
  totalDamageTaken: number,      // Dano total recebido
  longestWaveReached: number,    // Onda máxima
  totalPlaytime: number,         // Tempo jogado (segundos)
  prestigeLevel: number,         // Nível de prestige
  totalRuns: number,             // Total de rodadas
}
```

---

## 🎯 Fluxo Principal

```
1. INICIAR APP
   └─ useAuth → Detecta usuário ou exibe login

2. LOGIN (se necessário)
   └─ handleAuthAction → Firebase Auth

3. CARREGAR DADOS
   └─ useGameState → localStorage + Firebase

4. JOGAR
   └─ GameCanvas → Game Loop (60 FPS)

5. GAME OVER
   └─ updateGlobalStats → Calcular stats
   └─ updateLeaderboard → Atualizar ranking
   └─ handleCloudSave → Salvar na nuvem

6. AUTO-SYNC (a cada 60s)
   └─ saveGameToCloud → Sincronizar dados
```

---

## 📁 Estrutura de Pastas (Nova)

```
src/
├── hooks/
│   ├── useAuth.ts              ✅ Pronto
│   ├── useGameState.ts         ✅ Pronto
│   ├── useLeaderboard.ts       ✅ Pronto
│   └── index.ts
├── services/
│   ├── firebase.ts             ✅ Integrado
│   ├── audio.ts                ✅ Integrado
│   └── competitive.ts          ✅ Integrado
├── types/
│   ├── game.types.ts           ✅ Definido
│   └── index.ts
├── constants/
│   ├── game.constants.ts       ✅ Definido
│   ├── upgrades.constants.ts   ✅ Definido
│   └── index.ts
├── components/
│   ├── GameCanvas.tsx          ✅ Pronto
│   ├── Leaderboard.tsx         ✅ Pronto
│   ├── UpgradePanel.tsx        ✅ Pronto
│   └── StatsPanel.tsx          ✅ Pronto
└── App.tsx                     ✅ Principal
```

---

## 🚀 Como Começar a Desenvolver

### 1. Setup Inicial

```bash
cd Arena-Neon-FS
npm install
npm run dev
```

### 2. Entender a Estrutura

- Abrir `src/App.tsx` → Componente principal
- Abrir `src/hooks/` → Lógica reutilizável
- Abrir `src/services/firebase.ts` → Integrações

### 3. Fazer uma Mudança Pequena

```typescript
// Exemplo: Aumentar moeda de spawn
// src/constants/game.constants.ts
const INITIAL_CASH = 150; // Mudar para 200
```

### 4. Ver a Mudança

- O app reloada automaticamente (Vite)
- Verificar se funciona

### 5. Fazer Commit

```bash
git add .
git commit -m "Aumentar moeda inicial para 200"
git push
```

---

## 🎨 Tecnologias Usadas

| Tecnologia        | Uso                  |
| ----------------- | -------------------- |
| **React**         | Framework UI         |
| **TypeScript**    | Type safety          |
| **Tailwind CSS**  | Styling              |
| **Firebase**      | Backend + Database   |
| **Vite**          | Build tool           |
| **Canvas API**    | Renderização do jogo |
| **Web Audio API** | Sistema de áudio     |

---

## 📊 Capacidades

### Performance

- 60 FPS gaming
- Max 200 inimigos simultâneos
- Max 500 partículas
- Auto-save a cada 60s
- Polling leaderboard a cada 30s

### Escalabilidade

- Suporta infinitas ondas
- Prestige infinito
- Leaderboard com top 50

### Compatibilidade

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

---

## 🐛 Debugging Tips

### Ver Status em Tempo Real

Abrir DevTools (F12) e colocar breakpoints em:

- `App.tsx` - Estado global
- `GameCanvas.tsx` - Game loop
- `firebase.ts` - Chamadas API

### Logs Automáticos

```
🔄 = Processo em andamento
✅ = Sucesso
❌ = Erro
ℹ️ = Informação
⚠️ = Aviso
```

### Storage Inspector

```typescript
// Ver localStorage
localStorage.getItem("neon_arena_highscore");
localStorage.getItem("neon_arena_gamestate");

// Limpar (CUIDADO!)
localStorage.clear();
```

---

## 📈 Próximas Melhorias

### Curto Prazo

- [ ] Refatorar `App.tsx` em componentes menores
- [ ] Criar `useGameLoop()` hook
- [ ] Criar `useUpgrades()` hook
- [ ] Adicionar sound settings

### Médio Prazo

- [ ] Sistema de missões
- [ ] Achievements/Badges
- [ ] Multiplayer (PvP)
- [ ] Mais skins

### Longo Prazo

- [ ] Testes automatizados
- [ ] Performance monitoring
- [ ] Analytics
- [ ] Mobile app (React Native)

---

## 🆘 Precisa de Ajuda?

1. **Verificar [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**
2. **Ler [CODE_ORGANIZATION.md](./CODE_ORGANIZATION.md)**
3. **Consultar [FLOW_DIAGRAM.md](./FLOW_DIAGRAM.md)**
4. **Abrir issue no GitHub**
5. **Contatar desenvolvedor**

---

## 📞 Contatos

- **Repository**: github.com/felipy1993/Arena-Neon-FS
- **Issues**: GitHub Issues
- **Deploy**: Vercel (arena-neon.vercel.app)

---

## 📜 Licença

MIT License - veja arquivo LICENSE

---

## 👥 Colaboradores

- **felipy1993** - Developer principal
- **Comunidade** - Contribuições bem-vindas!

---

## 🎉 Conclusão

Este projeto está organizado para ser:

- ✅ **Fácil de entender** - Estrutura clara
- ✅ **Fácil de manter** - Código bem dividido
- ✅ **Fácil de expandir** - Pronto para crescer
- ✅ **Fácil de debugar** - Logs e TypeScript

**Aproveite desenvolvendo! 🚀**

---

**Versão**: 1.0.0  
**Última atualização**: 1º de dezembro de 2025  
**Próxima revisão**: 15 de dezembro de 2025
