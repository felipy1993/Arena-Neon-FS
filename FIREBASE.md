# Configuração do Firebase - Arena Neon

## 🔐 Regras de Segurança do Firestore

As regras estão configuradas corretamente em `firestore.rules`.

### ✅ O que as regras fazem:

#### Regra 1: Dados do Jogador (`/users/{userId}`)
- **Leitura/Escrita:** Apenas o próprio usuário autenticado
- **Segurança:** Ninguém pode acessar o save de outro jogador
- **Proteção:** Impede roubo de gemas, cash ou progresso

#### Regra 2: Nomes de Usuário (`/usernames/{username}`)
- **Leitura:** Qualquer pessoa (necessário para o login funcionar)
- **Criação:** Apenas usuários autenticados
- **Proteção:** Impede criação de contas sem autenticação

## 🔧 Configuração do Firebase

### Credenciais (já configuradas no código):

```javascript
apiKey: "AIzaSyDtIC46fSYBhDKWbhZmubHQ1vAMck3U67s"
authDomain: "arena-neon.firebaseapp.com"
projectId: "arena-neon"
storageBucket: "arena-neon.firebasestorage.app"
messagingSenderId: "493945862852"
appId: "1:493945862852:web:bd3ee9cc9ecf503589e791"
```

## 📋 Estrutura do Banco de Dados

### Coleção: `users`
Documento por usuário (UID):
```
/users/{uid}
  - playerName: string
  - highScore: number
  - cash: number
  - gems: number
  - wave: number
  - upgrades: Upgrade[]
  - ownedSkinIds: string[]
  - selectedSkinId: string
  - lastLoginDate: string
  - loginStreak: number
  - lastSaved: timestamp
```

### Coleção: `usernames`
Mapeamento de username para UID:
```
/usernames/{username}
  - email: string
  - uid: string
```

## 🚀 Deploy das Regras

Para atualizar as regras no Firebase Console:

1. Acesse: https://console.firebase.google.com
2. Selecione o projeto "arena-neon"
3. Vá em **Firestore Database** → **Rules**
4. Cole o conteúdo de `firestore.rules`
5. Clique em **Publish**

## ⚠️ Domínios Autorizados

Certifique-se de adicionar seu domínio da Vercel em:
**Authentication** → **Settings** → **Authorized domains**

Exemplo:
- `arena-neon-fs.vercel.app`
- `localhost` (para desenvolvimento)

## 🔍 Testando a Segurança

As regras impedem:
- ❌ Usuário A ler dados do Usuário B
- ❌ Usuário não autenticado criar username
- ❌ Modificar dados sem estar logado
- ❌ Acessar coleções não especificadas

As regras permitem:
- ✅ Usuário ler/escrever próprios dados
- ✅ Qualquer um ler lista de usernames (necessário para login)
- ✅ Usuário autenticado criar novo username

## 📝 Notas de Segurança

1. **Senhas:** NUNCA são salvas no Firestore (gerenciadas pelo Firebase Auth)
2. **UID:** Único identificador seguro do Firebase
3. **Tokens:** Gerenciados automaticamente pelo SDK
4. **HTTPS:** Todas as comunicações são criptografadas

---

**Status:** ✅ Configuração segura e pronta para produção
