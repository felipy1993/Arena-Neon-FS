# Guia de Deploy na Vercel - Arena Neon Idle

## ✅ Correções Aplicadas

O problema da tela preta foi causado por:

1. **Tailwind CDN** - Não funciona em produção (removido)
2. **Import Maps** - Incompatível com build de produção (removido)
3. **Arquivo CSS faltando** - `index.css` não existia (criado)
4. **Dependências via CDN** - Causavam problemas no build (migrado para npm)

## 🚀 Passos para Deploy

### 1. Commit e Push das Alterações

```bash
git add .
git commit -m "Fix: Corrige tela preta na Vercel - Remove CDN, adiciona Tailwind via npm"
git push origin main
```

### 2. Configurar Projeto na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Add New Project"**
3. Importe seu repositório do GitHub
4. A Vercel detectará automaticamente que é um projeto Vite

### 3. Configurar Variáveis de Ambiente (Opcional)

Se você estiver usando a API do Gemini:

1. No painel da Vercel, vá em **Settings** → **Environment Variables**
2. Adicione:
   - Nome: `GEMINI_API_KEY`
   - Valor: Sua chave da API

### 4. Deploy

- Clique em **Deploy**
- A Vercel fará o build automaticamente
- Aguarde alguns minutos

## 🔍 Verificação

Após o deploy, verifique:

- ✅ A página carrega sem tela preta
- ✅ Os estilos do Tailwind estão aplicados
- ✅ O jogo funciona corretamente
- ✅ Não há erros no console do navegador

## 🛠️ Configurações Aplicadas

### Arquivos Criados/Modificados:

- ✅ `vercel.json` - Configuração do Vercel
- ✅ `tailwind.config.js` - Configuração do Tailwind
- ✅ `postcss.config.js` - Processamento CSS
- ✅ `index.css` - Estilos globais + Tailwind
- ✅ `package.json` - Dependências do Tailwind
- ✅ `index.html` - Removido CDN e import maps

### Build de Teste Local:

O build foi testado localmente e gerou:
- `dist/index.html` (1.71 kB)
- `dist/assets/index-*.css` (60.37 kB)
- `dist/assets/index-*.js` (721.40 kB)

## 📝 Notas Importantes

1. **Primeiro Deploy**: Pode levar 2-3 minutos
2. **Deploys Subsequentes**: Mais rápidos (1-2 minutos)
3. **Cache**: A Vercel faz cache das dependências
4. **Logs**: Verifique os logs de build se houver problemas

## 🐛 Solução de Problemas

### Se ainda aparecer tela preta:

1. Verifique o console do navegador (F12)
2. Veja os logs de build na Vercel
3. Confirme que todas as variáveis de ambiente estão configuradas
4. Tente fazer um redeploy forçado

### Comandos Úteis:

```bash
# Testar build localmente
npm run build

# Preview do build
npm run preview

# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## ✨ Resultado Esperado

Após o deploy, você deve ver:
- Interface do jogo carregando corretamente
- Estilos neon aplicados
- Efeitos visuais (scanlines, vignette)
- Jogo totalmente funcional

---

**Status**: ✅ Pronto para deploy
**Build Local**: ✅ Testado e funcionando
**Configuração**: ✅ Completa
