# 02 - O Padrão Thin Client no Android

O aplicativo Android do Hydropush é desenhado sob o paradigma de **Thin Client** (Cliente Leve). Isso significa que o APK final quase não contém lógica de negócios ou dependências nativas pesadas; ele atua primariamente como uma "janela" ultra-otimizada.

## Como funciona?

No arquivo `capacitor.config.ts`, a chave `server.url` está apontando diretamente para a URL de produção hospedada na Vercel:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hydropush.app',
  appName: 'Hydropush',
  webDir: 'build',
  bundledWebRuntime: false,
  server: {
    url: 'https://hydropush-app.vercel.app/',
    cleartext: true
  },
  // ...
};
```

## Benefícios

1. **Atualizações Over-The-Air (OTA):**
   Como o app lê os assets diretamente do servidor remoto, nós **nunca** precisamos submeter uma atualização para a Google Play Store apenas para corrigir um bug de interface ou adicionar uma nova funcionalidade (a menos que envolvam permissões nativas, o que evitamos).
2. **Leveza Extrema:**
   Extirpamos plugins nativos (como SQLite, Background Runner, Local Notifications). Isso reduziu o tamanho da pasta `node_modules` e do APK gerado.
3. **Consistência Absoluta:**
   O usuário da versão Web e o usuário do App Nativo rodam literalmente a mesma versão em tempo real.
