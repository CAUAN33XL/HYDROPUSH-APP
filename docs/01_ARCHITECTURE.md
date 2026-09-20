# 01 - Arquitetura Geral do Sistema (Single Codebase)

O Hydropush adota uma arquitetura do tipo **Single Codebase** (Código-Fonte Único). Isso significa que, a partir da pasta `src/`, geramos tanto a aplicação Web (PWA) quanto o empacotamento nativo (Android).

## A Filosofia

Antigamente, o projeto era um monorepo (separando `hydropush-react` e `hydropush-capacitor`). Isso trazia "gordura" e complexidade para a manutenção.

Hoje, a arquitetura é enxuta:
- **`src/`**: O coração do projeto (React, Zustand, Tailwind). Tudo que envolve UI e lógica vive aqui.
- **`build/`**: O output otimizado e minificado gerado pelo Vite. Esta pasta é servida para os usuários web.
- **`android/`**: Uma casca (Thin Client) gerada pelo Capacitor que não compila os arquivos do `build/`, mas sim aponta o WebView nativo diretamente para a URL de produção (Vercel).

## Benefícios Desta Arquitetura
1. **Zero Duplicação:** As rotas, os estilos e a lógica de gamificação rodam da mesma forma em qualquer plataforma.
2. **Ciclo de Desenvolvimento Rápido:** Você coda no navegador (`npm run dev`) e confia que o Android vai espelhar exatamente aquele comportamento.
3. **Escalabilidade Horizontal:** Adicionar um módulo novo (ex: "Store" ou "Ranking") só requer criar os componentes em `src/features/` e linká-los no React Router.
