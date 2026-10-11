# Portfólio de Azam Usman

Portfólio pessoal construído com Next.js 16, React e TypeScript. O conteúdo está disponível em português e inglês; os currículos em PDF encontram-se em `public/pdf/`.

## Desenvolvimento

Requer Node.js 20.9 ou superior.

```bash
npm ci
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Verificações

```bash
npm run type-check
npm run lint
npm run test
npm run build
# Executa todas as verificações acima
npm run test:all
```

## Estrutura

- `app/` — rotas Next.js, metadados e entrada dos estilos globais.
- `components/layout/` — composição principal e navegação lateral.
- `components/sections/` — secções do portfólio.
- `components/ui/` — controlos e elementos visuais reutilizáveis.
- `context/` — estado persistente do tema e do idioma.
- `data/` — conteúdo bilingue e tipos.
- `lib/theme-paint.ts` — geometria e temporização dos pontos de entrada do tema.
- `styles/` — tokens, base, navegação, secções, animação, responsividade e acessibilidade.
- `tests/` — testes de conteúdo, navegação e comportamento/estrutura do tema.
- `espreitar/` — exemplos de referência; não fazem parte da aplicação principal.

## Tema claro/escuro

A preferência inicial respeita o tema do sistema e é carregada antes da primeira pintura da página. Em navegadores compatíveis, a página conserva o tema atual enquanto gotas com contornos orgânicos de tinta revelam progressivamente a captura do novo tema: cada gota altera de imediato o fundo, o texto e os cartões dentro da sua área, incluindo painéis opacos. Não há camada translúcida nem mudança global antes ou depois da revelação. A dispersão demora cerca de três segundos; com `prefers-reduced-motion` ou sem suporte às máscaras ou às View Transitions, o tema muda imediatamente.
