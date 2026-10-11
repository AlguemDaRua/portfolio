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
- `lib/theme-paint.ts` — tipos e geração determinística dos parâmetros da animação.
- `styles/` — tokens, base, navegação, secções, animação, responsividade e acessibilidade.
- `tests/` — testes de conteúdo, navegação e comportamento/estrutura do tema.
- `espreitar/` — exemplos de referência; não fazem parte da aplicação principal.

## Tema claro/escuro

A escolha de tema é aplicada e guardada imediatamente, sem esperar pela animação. A preferência inicial respeita o tema do sistema e é carregada antes da primeira pintura da página. O efeito de tinta é decorativo, dura cerca de 1,2 segundos e fica atrás do conteúdo: não cobre controlos, não altera cores à força e não bloqueia novos cliques. Com `prefers-reduced-motion`, a mudança de tema mantém-se imediata e a animação é omitida.
