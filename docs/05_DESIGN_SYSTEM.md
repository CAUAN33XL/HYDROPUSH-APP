# 05 - Design System (Liquid Glassmorphism)

O Hydropush possui uma estética muito bem definida, criada com o intuito de passar uma sensação premium de frescor e tecnologia.

## O Conceito "Liquid Glassmorphism"

1. **Blur Extremo e Translucidez:** Elementos flutuantes, como cartões e modals, adotam cores com `rgba` e filtros de `backdrop-blur`. Isso dá a ilusão de que o conteúdo está "mergulhado" ou coberto por um vidro fosco.
2. **Paletas HSL:** Usamos cores vibrantes ajustadas via HSL para garantir que os gradientes fiquem fluidos (Azul Água, Oceano, Menta, Lavanda, Coral).
3. **Animações (Motion):** `Framer Motion` é intensamente usado para garantir que *nada* simplesmente apareça na tela; as coisas deslizam, saltam suavemente ou fazem um *fade in*.

## Tailwind CSS v4 e Variáveis Globais

No arquivo `index.css`, definimos variáveis CSS que o Tailwind consome para o suporte dinâmico a Dark Mode. 

```css
@layer base {
  :root {
    --background: 210 50% 98%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    /* ... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    /* ... */
  }
}
```
A troca de temas é orgânica e instantânea graças a essa engenharia.
