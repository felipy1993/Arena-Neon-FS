import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('🚀 Iniciando aplicação...');

const container = document.getElementById('root');
if (container) {
  console.log('✅ Container encontrado');
  try {
    const root = createRoot(container);
    console.log('✅ Root criado');
    root.render(<App />);
    console.log('✅ App renderizado');
  } catch (error) {
    console.error('❌ Erro ao renderizar:', error);
    container.innerHTML = `<div style="color: white; padding: 20px;">
      <h1>Erro ao carregar o jogo</h1>
      <pre>${error}</pre>
    </div>`;
  }
} else {
  console.error('❌ Failed to find the root element');
  document.body.innerHTML = '<div style="color: white; padding: 20px;"><h1>Erro: Elemento root não encontrado</h1></div>';
}