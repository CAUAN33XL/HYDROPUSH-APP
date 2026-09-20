# 10 - Contribuindo com o Projeto

Gostaria de contribuir ou clonar o projeto para alterar algo localmente? É simples!

## Rodando Localmente

```bash
# 1. Instale as dependências (sem sofrimento com bibliotecas C++!)
npm install

# 2. Inicie o Server de Desenvolvimento
npm run dev
```

## Regras de Código (Linting)

Nós usamos o **ESLint Flat Config** (arquivo `eslint.config.js`). Ele foi programado para varrer **apenas** a pasta `src/`, ignorando completamente os diretórios `android/` e `build/`. 
Isso evita que o ESLint se estresse com código Kotlin ou JavaScript minificado.

Sempre antes de commitar, você pode testar:
```bash
npm run lint
```

## IDE (Visual Studio Code)
Para quem usa VS Code, adicionamos nas configurações do projeto (`.vscode/settings.json`) regras para que a extensão de Java não tente analisar o código Android, prevenindo mensagens vermelhas falsas e permitindo foco 100% no React.
