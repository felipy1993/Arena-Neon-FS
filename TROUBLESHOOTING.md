# 🔧 Guia de Troubleshooting - Arena Neon FS

## Problemas Comuns e Soluções

---

## 🔴 AUTENTICAÇÃO

### ❌ "Erro de Segurança do Banco de Dados"

**Causa**: Firestore rules não configuradas corretamente

**Solução**:

1. Ir para [Firebase Console](https://console.firebase.google.com/)
2. Projeto → Firestore Database → Rules tab
3. Copiar e colar as regras em `firestore.rules`
4. Publicar as regras

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /usernames/{username} {
      allow read: if true;
      allow create: if request.auth != null;
    }
    match /leaderboard/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

### ❌ "Este nome de usuário já está em uso"

**Causa**: Nome de usuário já foi registrado

**Solução**:

- Escolher outro nome de usuário
- Ou usar email + senha para login

---

### ❌ "Usuário não encontrado"

**Causa**: Email ou username não existe no banco

**Solução**:

- Verificar ortografia
- Usar email se fez login com username
- Criar nova conta se é novo usuário

---

### ❌ "Senha incorreta"

**Causa**: Password não corresponde

**Solução**:

- Verificar se Caps Lock está ON
- Confirmar password
- Se esquecer, criar nova conta

---

## 🎮 GAMEPLAY

### ❌ "O jogo não inicia"

**Debug**:

```typescript
// Abrir console (F12)
// Procurar por erro específico
console.log("Current User:", currentUser);
console.log("Game State:", gameState);
```

**Soluções comuns**:

1. ❌ Não logado → Fazer login
2. ❌ Browser offline → Conectar à internet
3. ❌ JavaScript desabilitado → Habilitar JS

---

### ❌ "Inimigos não spawnando"

**Causa**: Lógica de spawn com erro

**Check**:

```typescript
// Em App.tsx, game loop:
console.log("Wave:", gameState.wave);
console.log("Enemies on screen:", enemiesRef.current.length);
console.log("Max allowed:", MAX_ENEMIES_ON_SCREEN);
```

**Solução**:

- Verificar se `MAX_ENEMIES_ON_SCREEN` está correto
- Resetar jogo com botão de reset
- Limpar cache: `localStorage.clear()`

---

### ❌ "Score não está aumentando"

**Causa**: Possivelmente inimigos não sendo mortos

**Check**:

```typescript
console.log("Kills this session:", sessionEnemyKillsRef.current);
console.log("Current score:", gameState.score);
```

**Solução**:

- Verificar se está disparando projéteis
- Ativar o EMP (botão direito) para checar se mata inimigos
- Verificar se upgrades de dano estão sendo aplicados

---

## 💾 SALVAMENTO

### ❌ "Ranking não carrega"

**Causa**: Erro ao buscar dados do Firebase

**Debug**:

```typescript
// Console logs automáticos aparecem
🔄 Carregando leaderboard...
❌ Erro ao carregar leaderboard: [erro específico]
```

**Soluções**:

1. **Conexão perdida**: Verificar internet
2. **Firebase offline**: Aguardar Firebase voltar
3. **Dados inválidos**: Verificar Firestore console
4. **Regras de segurança**: Validar firestore.rules

---

### ❌ "Jogo não está sendo salvo"

**Verificar**:

```typescript
// Cloud Status
- "saving" = Enviando para nuvem
- "saved" = Salvo com sucesso ✅
- "error" = Falha no envio ❌
- "idle" = Sem atividade
```

**Debug**:

1. Abrir console (F12)
2. Procurar por `"Jogo salvo na nuvem"`
3. Se vir erro, anotar a mensagem

**Soluções**:

1. **localStorage cheio**: `localStorage.clear()` (cuidado!)
2. **Sem permissão Firebase**: Adicionar regras (ver acima)
3. **Usuário offline**: Conectar à internet
4. **Dados muito grandes**: Deletar alguns upgrades antigos

---

### ❌ "Save está diferente em outro device"

**Causa**: Dados locais diferentes da nuvem

**Explicação**: O sistema usa "smart merge":

- Local é usado se mais recente
- Nuvem é usado se mais recente
- Timestamp define o "campeão"

**Solução**: Auto-sincroniza em 60s. Aguardar.

---

## 🎨 UI/UX

### ❌ "Layout quebrado em mobile"

**Causa**: Responsividade com problema

**Fix**: Verificar classes tailwind com `md:` breakpoint

```tsx
// Exemplo correto
<div className="text-sm md:text-lg">
  {/* text-sm em mobile, text-lg em desktop */}
</div>
```

---

### ❌ "Botões não respondem"

**Causa**: Elemento com `pointer-events-none`

**Debug**:

```typescript
// Inspecionar elemento (F12)
// Procurar por pointer-events-none
// Se tiver, remover ou mover elemento
```

---

### ❌ "Performance lenta"

**Causa**: Muitos inimigos/partículas

**Limits**:

```typescript
MAX_ENEMIES_ON_SCREEN = 200; // Max inimigos
MAX_PARTICLES = 500; // Max partículas
```

**Otimizações**:

1. Reduzir limite se necessário
2. Verificar outros tabs abertos
3. Desligar extensões de browser
4. Tentar em outro browser

---

## 🔊 ÁUDIO

### ❌ "Nenhum som"

**Causa**: AudioContext não resumido

**Debug**:

```typescript
// Console
console.log("AudioContext state:", audioSystem);
```

**Solução**:

1. Clicar em qualquer lugar da página
2. Tocar um som (upgrade, tiro, etc)
3. Se ainda não funcionar, verificar volume do PC

---

### ❌ "Som muito alto/baixo"

**Onde ajustar**: `src/services/audio.ts`

```typescript
// Procurar por volume ou gain
audioContext.createGain(); // ← Controla volume
```

---

## 📊 DADOS

### ❌ "Leaderboard vazio"

**Verificar**:

1. Firebase console → Firestore
2. Coleção `leaderboard` existe?
3. Tem documentos?

**Se vazio**: Jogar algumas rodadas para popular

**Se tem dados mas não carrega**: Ver "Ranking não carrega" acima

---

### ❌ "Prestige incorreto"

**Causa**: Cálculo errado em `competitive.ts`

**Validar**:

```typescript
const prestigeLevel = calculatePrestigeLevel(globalStats);

// Debugar:
console.log("Total enemies killed:", globalStats.totalEnemiesKilled);
console.log(
  "Prestige from kills:",
  Math.floor(globalStats.totalEnemiesKilled / 100)
);
```

---

## 🛠️ DESENVOLVIMENTO

### ❌ "Imports não funcionam"

**Causa**: Caminho errado ou arquivo não existe

```typescript
// ❌ Errado
import { useAuth } from "./hooks/useAuth";

// ✅ Correto
import { useAuth } from "./hooks";
```

---

### ❌ "TypeScript mostra erro"

**Solução**:

```bash
# Reloadar TypeScript no VS Code
Ctrl + Shift + P
> TypeScript: Restart TS Server
```

---

### ❌ "Build falha"

**Soluções**:

```bash
# Limpar node_modules
rm -r node_modules
npm install

# Limpar cache
npm cache clean --force

# Novo build
npm run build
```

---

## 📋 Checklist de Debug

Quando algo não funciona:

```
[ ] Abrir console (F12)
[ ] Procurar por mensagens de erro (vermelho)
[ ] Procurar por warnings (amarelo)
[ ] Testar em modo offline/online
[ ] Limpar cache (Ctrl + Shift + Del)
[ ] Testar em incognito
[ ] Testar em outro browser
[ ] Verificar conexão internet
[ ] Reiniciar o PC
[ ] Consultar este guia
[ ] Abrir issue no GitHub
```

---

## 🆘 Últimos Recursos

### Logs Automáticos

```
🔄 = Carregando
✅ = Sucesso
❌ = Erro
ℹ️ = Informação
⚠️ = Aviso
```

### Verificar Status

- **Auth**: `currentUser` no console
- **Game**: `gameState` no console
- **Cloud**: Badge "Cloud On/Saving/Saved"
- **Leaderboard**: Badge e número de jogadores

### Contato

Se o problema persistir:

1. Anotar a mensagem de erro exata
2. Verificar console completo
3. Abrir issue no GitHub com screenshots

---

**Última atualização**: 1º de dezembro de 2025
