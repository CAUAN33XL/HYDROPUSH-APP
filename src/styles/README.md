# Sistema de Estilos do Hydropush

Para evitar o padrão de "God Objects", o CSS monolítico (`index.css` e o clone `globals.css`) foi descentralizado em módulos menores e focados por responsabilidade.

O arquivo raiz `src/index.css` serve apenas como um hub de importação (`@import`) para orquestrar a ordem do CSS.

## Arquitetura de Módulos

| Módulo | Responsabilidade |
|---|---|
| `tokens.css` | Variáveis CSS (`:root`, `.dark` e `@theme inline`). Design tokens (cores, border-radius, glassmorphism, z-index). |
| `base.css` | Estilos base (`body`, `html`, tipografia default, `color-scheme`). Elementos HTML puros. |
| `liquid-glass.css` | Sistema global de *Glassmorphism* e *Liquid Glass*. Regras que aplicam o efeito de vidro a superfícies (cards, popovers, backgrounds). |
| `animations.css` | Keyframes customizados (e.g. `shimmer`) e utilitários de animação (e.g. `animate-shimmer`). |
| `responsive.css` | Viewport constraints para mobile/smartphones. Media queries de layout global. |
| `components.css` | Estilos injetados em componentes globais via classes ou `data-slot` (botões, radius de container, cards responsivos). |

## Regras de Manutenção
- **Não escreva regras CSS no `index.css`**. Use-o apenas para gerenciar imports.
- **Evite classes híbridas**. Se a classe diz respeito à estrutura, ela não deve controlar a estética global (veja o bug resolvido com `backdrop-filter` em elementos `.fixed`).
- **Respeite o CSS Layers**. Para substituições específicas que devem ser fáceis de sobrescrever com utilitários do Tailwind, use `@layer base` ou `@layer components`.
