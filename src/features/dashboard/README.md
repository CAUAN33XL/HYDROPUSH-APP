# Feature: Dashboard (Painel de Hidratação)

Este é o módulo central do Hydropush. Ele é responsável por gerenciar a experiência primária do usuário: acompanhar, adicionar e gerenciar o consumo diário de água.

## Arquitetura e Padrão Adotado

Utilizamos a divisão entre **Componentes Orquestradores (Controllers/Views)** e **Componentes Apresentacionais (Dumb Components)**:

### 1. Controllers (Views)
Arquivos na raiz deste diretório (como `MainApp.tsx` e `HydrationDashboard.tsx`) são os orquestradores.
Eles gerenciam o **Estado** (state) principal, se conectam aos serviços (como o `StorageService`) e orquestram a distribuição dos dados de hidratação para as camadas visuais. 

*Estes arquivos não devem conter formatação complexa de CSS ou grandes blocos de UI (God Objects).*

### 2. Componentes (Apresentacionais)
Todo o código puramente visual vive dentro da pasta `components/`. Eles recebem as informações via `props` e não controlam o banco de dados diretamente.

Para ver como os componentes estão organizados, consulte:
👉 [components/README.md](./components/README.md)
