<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1x0APDoMho1kgAGa1wxRZPvR5k9tZiSu

## Arena Neon Idle

Um jogo idle com estética neon e efeitos visuais retrô.

## 🚀 Deploy na Vercel

### Configuração de Variáveis de Ambiente

Antes de fazer o deploy, configure as seguintes variáveis de ambiente no painel da Vercel:

1. Acesse o projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione a variável:
   - `GEMINI_API_KEY`: Sua chave da API do Gemini (se estiver usando)

### Deploy Automático

O projeto está configurado para deploy automático na Vercel. Basta fazer push para o repositório conectado.

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

## 📋 Correções Aplicadas

Este projeto foi corrigido para resolver o problema de tela preta na Vercel:

1. ✅ Removido Tailwind CDN (não funciona em produção)
2. ✅ Adicionado Tailwind CSS via npm com configuração adequada
3. ✅ Removidos import maps (incompatíveis com build de produção)
4. ✅ Criado arquivo `index.css` que estava faltando
5. ✅ Adicionado `vercel.json` com configuração correta
6. ✅ Configurado PostCSS e Tailwind para build

## 🔧 Tecnologias

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Firebase
- Lucide React (ícones)

## 📝 Notas

- O projeto usa Vite como bundler
- As dependências são instaladas via npm (não CDN)
- O Tailwind CSS é processado durante o build
- Firebase é usado para autenticação e banco de dados
