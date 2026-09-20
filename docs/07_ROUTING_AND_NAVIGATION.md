# 07 - Roteamento e Navegação

Utilizamos o **React Router** para orquestrar as páginas e a navegação (SPA - Single Page Application).

## A Estrutura Base

- `/` (Dashboard Principal)
- `/history` (Histórico de Hidratação)
- `/profile` (Página de Perfil, Configurações e Status)
- `/stats` (Métricas e Analytics)
- `/onboarding` (Telas iniciais de Boas Vindas)

## O Bottom Dock (Navegação Inferior)

Diferente das web apps clássicas com barras no topo, usamos um *Bottom Dock* altamente refinado que se espelha na experiência iOS.
Este componente (`MainDock`) fica fixo na base da tela e utiliza classes específicas para se adaptar, inclusive não escondendo conteúdo quando rolamos até o fim da página (o padding extra é cuidadosamente calculado no wrapper das rotas).
