<div align="center">
  
  <img src="https://raw.githubusercontent.com/cauan33xl/HYDROPUSH-APP/main/public/assets/Hydropush-BzVbrEfF.png" alt="Hydropush Logo" width="120" />

  # 💧 Hydropush APP

  **Monitoramento Inteligente e Gamificado de Hidratação Diária**

  [![License](https://img.shields.io/badge/license-GPLv3-blue.svg)](./LICENSE)
  [![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](#)
  [![Capacitor](https://img.shields.io/badge/Capacitor-7-119EFF?logo=capacitor)](#)
  [![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](#)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwind-css)](#)

  *Hydropush é um aplicativo Single Codebase, projetado para operar como Web App (PWA) e Thin Client Nativo (Android), com interface premium e retenção de usuários focada em gamificação.*

</div>

---

## 📖 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura & Engenharia](#-arquitetura--engenharia)
- [Funcionalidades e Experiência do Usuário](#-funcionalidades-e-experiência-do-usuário)
- [Stack Tecnológica](#-stack-tecnológica)
- [Como Funciona o "Thin Client" Nativo?](#-como-funciona-o-thin-client-nativo)
- [Guia de Instalação e Desenvolvimento](#-guia-de-instalação-e-desenvolvimento)
- [Design System & Estética](#-design-system--estética)
- [Licença](#-licença)

---

## 🌊 Visão Geral

O **Hydropush** vai além de ser apenas um "contador de copos d'água". Ele foi construído para resolver o problema crônico de retenção em apps de saúde através de **Engajamento Gamificado (Estilo Duolingo)**, punindo a negligência e recompensando a consistência diária.

Com uma arquitetura unificada, o Hydropush roda primariamente na Web (com suporte PWA Offline-First) e é distribuído no Android como um *Thin Client* ultra-rápido via Capacitor.

---

## 🏗️ Arquitetura & Engenharia

O projeto abandonou a estrutura complexa de monorepo em favor de um modelo **Single Codebase** (Código-Fonte Único).

```text
HYDROPUSH-APP/
├── src/                      # Código fonte global (React + TypeScript)
│   ├── features/             # Módulos funcionais isolados
│   │   ├── auth/             # Onboarding e configuração inicial do usuário
│   │   ├── dashboard/        # Painel principal (Gráfico circular e registro rápido)
│   │   ├── history/          # Histórico detalhado de consumo
│   │   ├── profile/          # Status, avatar e gerenciamento de conquistas
│   │   └── stats/            # Analytics e projeções semanais/mensais
│   ├── core/                 # Núcleo da aplicação
│   │   └── services/         # Lógica de persistência (LocalStorage/IndexedDB)
│   ├── shared/               # Componentes UI (Radix, UI), hooks globais e Utils
│   └── styles/               # CSS global modularizado (Base, Tokens, Utilitários)
│
├── android/                  # Wrapper Nativo Android (Thin Client)
├── build/                    # Output otimizado gerado pelo Vite
│
├── capacitor.config.ts       # Ponte e configurações do WebView Mobile
├── vite.config.ts            # Configurações de Bundling
├── tailwind.config.js        # Definições do Design System
└── package.json              # Único gerenciador de dependências
```

---

## ✨ Funcionalidades e Experiência do Usuário

- 💧 **Registro Fluido:** Adição de água (em ML) com apenas 1 clique através de atalhos rápidos.
- 🎯 **Meta Biométrica Inteligente:** O app calcula a ingestão ideal com base na regra clínica de `peso (kg) × 35ml`.
- 🎮 **Sistema de Retenção (Gamificação):**
  - **Vidas & Punição:** Se o usuário não atingir a meta, perde "vidas".
  - **Ofensivas (Streaks):** Manter a constância acumula dias de ofensiva.
  - *Adeus às notificações irritantes:* O engajamento se dá pela responsabilidade orgânica do usuário e recompensas visuais.
- 🌙 **Temas Dinâmicos:** Suporte perfeito e em tempo real a Dark Mode e Light Mode.
- 📊 **Dashboard Analítico:** Visualização clara do progresso diário em anéis de preenchimento suave.

---

## 🛠️ Stack Tecnológica

O Hydropush é construído com as melhores ferramentas do ecossistema moderno do Front-end:

### Front-end & UI
- **React 18.3:** Motor de renderização base.
- **TypeScript 5.7:** Tipagem estrita e segurança em tempo de compilação.
- **Vite 7.x:** Bundler ultrarrápido (HMR instantâneo).
- **Tailwind CSS 4.x:** Estilização utilitária e customização profunda.
- **Framer Motion:** Micro-animações, transições de tela e fluidez de componentes.
- **Radix UI:** Acessibilidade e primitivas de UI sem estilo.
- **Recharts:** Gráficos interativos e responsivos.

### Cross-Platform & Nativo
- **Capacitor 7:** Ponte nativa para empacotamento Android.


---

## 📱 Como Funciona o "Thin Client" Nativo?

A maior inovação de infraestrutura do Hydropush é sua abordagem **Thin Client** para plataformas nativas (Android):

Em vez de carregar todo o código HTML/JS/CSS dentro do APK e depender de atualizações nas lojas (Play Store), o projeto Android (na pasta `android/`) é uma casca vazia super otimizada que **consome a URL de produção na Vercel**.

**Benefícios dessa abordagem:**
1. **APK Minúsculo:** O aplicativo Android pesa poucos Megabytes.
2. **Atualizações Over-The-Air (OTA):** Qualquer alteração feita na Vercel reflete **imediatamente** no celular de todos os usuários, sem necessidade de baixar um novo APK.
3. **PWA Offline-First:** Quando acessado pelo navegador ou instalado como Web App, o Hydropush tira vantagem completa do cache do navegador (LocalStorage/IndexedDB) para garantir que funcione perfeitamente sem internet (requer conexão apenas no primeiro carregamento).

---

## 🎨 Design System & Estética

O visual do Hydropush foi pensado para ser **Premium**. 
Baseado no conceito de *Liquid Glassmorphism*, a UI utiliza:

- **Translucidez e Blur:** Paineis flutuantes que se misturam ao fundo dinâmico.
- **Bottom Dock Adaptativo:** O menu de navegação inferior estilo iOS escala perfeitamente em desktops, mantendo a experiência mobile-first coerente.
- **Cores Terapêuticas:** Paletas desenhadas no modelo HSL para promover calma e fluidez, remetendo diretamente à água (Azul Água, Oceano, Menta).

---

## 🚀 Guia de Instalação e Desenvolvimento

Começar a contribuir com o Hydropush é simples, graças à estrutura unificada.

### 1. Pré-requisitos
- **Node.js** 18 LTS ou superior
- **Git**
- *(Opcional)* **Android Studio** (apenas caso queira gerar o APK do Thin Client).

### 2. Rodando Localmente

```bash
# Clone o repositório
git clone https://github.com/cauan33xl/HYDROPUSH-APP.git

# Acesse a pasta
cd HYDROPUSH-APP

# Instale as dependências (apenas Web, sem dependências nativas chatas)
npm install

# Inicie o servidor local
npm run dev
```
> Acesse: `http://localhost:5173`

### 3. Validação e Qualidade
O projeto adota o **ESLint Flat Config** (`eslint.config.js`) focado puramente nos diretórios de código-fonte (`src/`), ignorando sujeira de build.
```bash
npm run lint
```

### 4. Gerando a Build de Produção
Para compilar o pacote Web otimizado:
```bash
npm run build
```
*(O diretório gerado `build/` é o que será publicado na Vercel).*

---

## 📄 Licença

Este projeto é licenciado sob os termos da **GNU General Public License v3.0 (GPLv3)**.  
O uso, modificação e distribuição devem manter a natureza de código aberto.
Consulte o arquivo [LICENSE](./LICENSE) para informações completas.

<div align="center">
  <i>Desenvolvido com 🩵 por Cauan Gabriel Matos Silva (Cauan33XL) & Equipe Hydropush.</i>
</div>
