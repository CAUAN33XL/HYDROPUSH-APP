# 08 - Integração Contínua e Deploy (CI/CD)

O ciclo de vida do código no Hydropush é totalmente automatizado. 

## Vercel (Produção Web)

Sempre que a `main` recebe um código novo (via commit ou PR):
1. A Vercel detecta a mudança.
2. Roda o comando `npm run build` (que, por sua vez, aciona o `vite build`).
3. Faz o deploy da pasta `build/` globalmente no seu CDN edge.

> O arquivo `vercel.json` garante que, não importa qual rota o usuário digite, o tráfego sempre caia no `index.html` (vital para o React Router não crashar com Erro 404).

## Produção Android (Thin Client)

Como adotamos o modelo de **Thin Client** onde o APK apenas consome a URL da Vercel, o aplicativo nativo Android **não precisa ser recompilado** no GitHub Actions a cada alteração de código. 

O APK final (`app-debug.apk` ou `.aab`) só precisa ser gerado no Android Studio caso:
1. O ícone ou SplashScreen mudem.
2. Seja necessário instalar ou remover um Plugin Nativo novo no Capacitor.
3. A URL da Vercel no `capacitor.config.ts` mude.

Para todo o resto (99% do trabalho como layouts, botões, regras de negócio e rotas), a atualização acontece instantaneamente Over-The-Air via Vercel.
