# 🛠️ Comandos Úteis - Arena Neon FS

## ⚡ Desenvolvimento

### Iniciar servidor de desenvolvimento

```bash
npm run dev
```

- Abre em http://localhost:5173
- Hot reload automático
- Console com erros em tempo real

### Build para produção

```bash
npm run build
```

- Otimiza e minifica código
- Gera pasta `dist/`
- Pronto para deploy

### Preview do build

```bash
npm run preview
```

- Simula build de produção localmente
- Verifica se build funciona corretamente

---

## 🔍 Debugging

### Abrir DevTools

```
F12 ou Ctrl + Shift + I (Windows/Linux)
Cmd + Option + I (Mac)
```

### Ver Console

```
Console tab → Ver logs
[🔄] [✅] [❌] Icons nos logs
```

### Inspecionar Elemento

```
Ctrl + Shift + C → Clicar no elemento
Ver HTML, CSS, Eventos
```

### Storage

```
Console → localStorage.getItem('neon_arena_highscore')
```

### Performance

```
Performance tab → Record → Play game → Stop
Ver FPS, CPU, Memory usage
```

---

## 📦 Gerenciar Dependências

### Listar pacotes instalados

```bash
npm list
```

### Instalar novo pacote

```bash
npm install nome-do-pacote
# ou
npm i nome-do-pacote
```

### Desinstalar pacote

```bash
npm uninstall nome-do-pacote
```

### Atualizar pacotes

```bash
npm update
```

### Limpar cache

```bash
npm cache clean --force
```

---

## 🐛 Troubleshooting

### Erro: "Node modules quebrado"

```bash
rm -r node_modules
npm install
npm run dev
```

### Erro: "Porta 5173 em uso"

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5173
kill -9 <PID>
```

### Erro: "TypeScript"

```bash
# VS Code
Ctrl + Shift + P
> TypeScript: Restart TS Server
```

### Cache do navegador

```bash
Ctrl + Shift + Delete → Limpar cache
ou
Hard refresh: Ctrl + Shift + R
```

---

## 🚀 Git Workflow

### Ver status

```bash
git status
```

### Ver histórico

```bash
git log --oneline -10
```

### Adicionar arquivos

```bash
git add .        # Todos os arquivos
git add arquivo  # Arquivo específico
```

### Fazer commit

```bash
git commit -m "Descrição clara da mudança"
```

### Enviar para GitHub

```bash
git push origin main
```

### Puxar atualizações

```bash
git pull origin main
```

### Ver diferenças

```bash
git diff              # Mudanças não commitadas
git diff --staged     # Mudanças staged
```

---

## 📊 Analisar Código

### Ver arquivo completo

```bash
cat src/App.tsx
```

### Buscar padrão no código

```bash
grep -r "useAuth" src/
```

### Ver estrutura de pastas

```bash
tree -L 3 src/
```

### Contar linhas de código

```bash
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l
```

---

## 🔧 Verificação de Qualidade

### ESLint (se configurado)

```bash
npm run lint
```

### TypeScript check

```bash
npx tsc --noEmit
```

### Ver tamanho do build

```bash
npm run build
# Verificar pasta dist/
```

---

## ☁️ Firebase (Local)

### Emulador do Firebase

```bash
firebase emulators:start
```

### Deploy para Firebase Hosting

```bash
firebase deploy
```

### Ver logs

```bash
firebase functions:log
```

---

## 📱 Responsividade

### Testar em mobile

```
DevTools → Ctrl + Shift + M
ou
Clique no icon de device
```

### Breakpoints Tailwind

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

---

## 🎯 VS Code Extensions Recomendadas

```bash
# Extensions para instalar
- ES7+ React/Redux/React-Native snippets
- TypeScript Vue Plugin
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint
- Firebase Explorer
- Thunder Client (APIs)
```

---

## 📝 Editar Arquivos

### Criar novo arquivo

```bash
touch src/hooks/useNewHook.ts
```

### Deletar arquivo

```bash
rm src/hooks/useOldHook.ts
```

### Renomear arquivo

```bash
mv src/old-name.ts src/new-name.ts
```

### Copiar arquivo

```bash
cp src/file.ts src/file-backup.ts
```

---

## 🔑 Atalhos VS Code Úteis

| Atalho             | Ação                          |
| ------------------ | ----------------------------- |
| `Ctrl + /`         | Comentar/descomentar linha    |
| `Ctrl + D`         | Selecionar próxima ocorrência |
| `Ctrl + H`         | Find & Replace                |
| `Ctrl + Shift + L` | Selecionar todas ocorrências  |
| `Alt + Up/Down`    | Mover linha para cima/baixo   |
| `Ctrl + X`         | Cortar linha                  |
| `Ctrl + C`         | Copiar linha (sem seleção)    |
| `F2`               | Renomear símbolo              |
| `Ctrl + .`         | Quick fix                     |
| `Ctrl + Space`     | Autocomplete                  |

---

## 🧪 Testes (Futuro)

### Rodar testes

```bash
npm test
```

### Cobertura de testes

```bash
npm test -- --coverage
```

### Watch mode

```bash
npm test -- --watch
```

---

## 📊 Monitoramento

### Ver performance em produção

```
Vercel Dashboard → Deployments → Analytics
```

### Ver erros em produção

```
Sentry Dashboard (se configurado)
```

### Monitor Firebase

```
Firebase Console → Performance
```

---

## 🚨 Emergency Commands

### Reset completo (CUIDADO!)

```bash
rm -r node_modules dist
npm cache clean --force
npm install
npm run build
```

### Limpar localStorage (CUIDADO!)

```bash
# No console do navegador
localStorage.clear()
sessionStorage.clear()
```

### Reset Git (CUIDADO!)

```bash
git reset --hard HEAD~1
```

---

## 📋 Checklist pré-commit

```
[ ] npm run build (sem erros)
[ ] Código comentado removido
[ ] console.log de debug removidos
[ ] TypeScript sem erros (F1 → "Restart TS Server")
[ ] Git status limpo (apenas mudanças necessárias)
[ ] Commit message clara e descritiva
[ ] Testado localmente (npm run dev)
```

---

## 🔗 Links Úteis

| Recurso            | URL                                         |
| ------------------ | ------------------------------------------- |
| Documentação React | https://react.dev                           |
| TypeScript Docs    | https://www.typescriptlang.org/docs         |
| Tailwind CSS       | https://tailwindcss.com/docs                |
| Firebase Docs      | https://firebase.google.com/docs            |
| Vite Docs          | https://vitejs.dev/guide                    |
| GitHub             | https://github.com/felipy1993/Arena-Neon-FS |

---

## 💡 Tips & Tricks

### Rápido dev loop

```bash
npm run dev
# Mantém aberto, faz mudanças
# Auto-reload ao salvar
```

### Debug em mobile

```
DevTools → Network → Throttling
Simula 3G/4G lento
```

### Encontrar arquivo rápido

```
Ctrl + P → Type filename
```

### Encontrar símbolo

```
Ctrl + Shift + O → Type symbol name
```

### Ver definição

```
Ctrl + Click no símbolo
ou F12 em cima do símbolo
```

---

**Versão**: 1.0.0  
**Última atualização**: 1º de dezembro de 2025
