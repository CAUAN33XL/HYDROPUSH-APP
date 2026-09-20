# 06 - Configuração PWA (Progressive Web App)

O Hydropush foi criado para se comportar como um aplicativo nativo mesmo quando acessado de um navegador (Chrome/Safari). 

## Componentes PWA

1. **Manifest (`manifest.json`):**
   Define os ícones, cor do tema, e como o aplicativo deve aparecer ao ser "Adicionado à Tela Inicial" (Standalone mode).
2. **Service Workers:**
   Trabalham nos bastidores para cachear os *assets* da aplicação. Isso significa que, depois do primeiro carregamento, o usuário pode acessar o aplicativo mesmo sem internet (modo Avião), e toda a interface carregará instantaneamente.
3. **PWA Install Banner:**
   (A ser configurado) Lógica para encorajar o usuário web a instalar o aplicativo para a tela inicial do celular.

O suporte PWA é a pedra fundamental que permite o *Thin Client Android* (visto que a janela nativa depende das mesmas regras do navegador para rodar velozmente).
