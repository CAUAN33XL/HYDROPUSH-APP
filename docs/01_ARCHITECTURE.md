# 01 - Arquitetura Geral do Sistema (PWA Puro)

O Hydropush adotou a iniciativa radical de expurgar a complexidade nativa. O aplicativo é agora um **Progressive Web App (PWA) 100% Web**.

## A Filosofia

Antigamente, o projeto tentou ser um aplicativo nativo usando o Capacitor, o que trazia "gordura", conflitos de dependências, e complexidade para a manutenção dos builds e da distribuição nas lojas de aplicativos.

Hoje, a arquitetura é enxuta e liberta da burocracia das lojas (Google Play/App Store):
- **`src/`**: O coração do projeto (React, Zustand, Tailwind). Tudo que envolve UI e lógica vive aqui.
- **Persistência de Dados**: Migrada do banco de dados nativo para a API `window.localStorage` da Web.
- **`build/`**: O output otimizado e minificado gerado pelo Vite. Esta pasta é servida para os usuários web através da Vercel.

## Benefícios Desta Arquitetura
1. **Zero Burocracia:** O App é distribuído pela web (via URL) e pode ser instalado adicionando à tela inicial (PWA). Zero tempo de build no Android Studio.
2. **Ciclo de Desenvolvimento Imediato:** Você coda no navegador (`npm run dev`) e empurra para a Vercel. O usuário recebe a atualização instantaneamente no próximo recarregamento.
3. **Código Limpo:** Sem plugins do Capacitor, o pacote final é mais leve, sem dependências sujeitas à quebras em atualizações de SDK do Android.
