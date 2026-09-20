# 09 - Otimizações de Performance

Este documento rastreia as medidas tomadas para garantir que o aplicativo continue absurdamente leve.

## O Que Foi Removido (A "Gordura")
1. **SQLite (`@capacitor-community/sqlite`):** 
   Trazia bibliotecas nativas binárias (C/C++) que pesavam no APK e quebravam compilações em certos ambientes. Retirado em favor do LocalStorage.
2. **Background Runner:**
   Usar recursos em segundo plano consome bateria e irrita usuários. 
3. **Local Notifications:**
   Cancelado porque optamos por um modelo de Retenção Orgânica Gamificada em vez do velho estilo "Hora de beber água!".

## Redução Visual
Usamos **SVGs inline** sempre que possível, o **Vite** faz o *Tree Shaking* de bibliotecas grandes, e o pacote do app inteiro fica minúsculo, carregando quase que instantaneamente.
