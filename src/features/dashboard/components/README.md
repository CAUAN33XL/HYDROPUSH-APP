# Dashboard Components

Esta pasta contém as peças de UI (Componentes Apresentacionais) que formam as telas do Dashboard. Para manter o código modularizado, escalável e de fácil leitura, dividimos os componentes em 3 categorias lógicas, exportadas através de `index.ts` (Barrel pattern).

## 📁 `layout/`
Componentes responsáveis pela estrutura primária da tela e navegação do app.
- **`Sidebar.tsx`**: Menu lateral (Desktop).
- **`BottomNav.tsx`**: Menu inferior flutuante (Mobile).
- **`TopHeader.tsx`**: Barra superior de saudação.

## 📁 `indicators/`
Componentes puramente informativos e visuais, criados para mostrar ao usuário um determinado estado, métrica ou histórico visualmente.
- **`WaterGlass.tsx`**: O clássico copo de água animado.
- **`DashboardStatusHeader.tsx`**: Textos de encorajamento (ex: "Continue assim!").
- **`DailyHistoryCard.tsx`**: Card inferior mostrando a porcentagem e as gotas de hidratação.

## 📁 `controls/`
Componentes voltados para interação e captura de ações do usuário (botões, formulários, inputs).
- **`QuickAddSection.tsx`**: Os botões de adicionar quantidade de água e o modal/input expansível personalizado.

> 💡 **Nota de Design:** Componentes que moram nestas subpastas não devem fazer chamadas diretas a banco de dados (`StorageService`) ou lidar com `useEffect` complexos que mudam o estado global da aplicação. Toda informação deve entrar via `props` (`currentAmount`, `dailyGoal`, etc) e toda ação deve sair via callbacks genéricos (`onAddDrink`, `onTabChange`, etc).
