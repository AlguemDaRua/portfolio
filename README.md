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
- `lib/theme-paint.ts` — geometria, temporização e máscara Canvas procedural do tema.
- `styles/` — tokens, base, navegação, secções, animação, responsividade e acessibilidade.
- `tests/` — testes de conteúdo, navegação e comportamento/estrutura do tema.
- `espreitar/` — exemplos de referência; não fazem parte da aplicação principal.

## Tema claro/escuro

A preferência inicial respeita o tema do sistema e é carregada antes da primeira pintura da página. Em navegadores compatíveis, **64 gotas cumulativas** com posições, raios e tempos de chegada aleatórios revelam o novo tema em cerca de **1,6 segundos**. Uma gota por célula de uma grelha de cobertura (com centros e ordem aleatórios), mais 16 gotas livres, garante a cobertura de todo o viewport sem uma mancha gigante nem um preenchimento abrupto no fim.

### Como funciona

- `ThemeToggle` continua a usar `changeTheme` do contexto, sem coordenadas do botão nem alterações na composição das secções.
- `ThemeContext` usa `document.startViewTransition()` e `flushSync` para capturar os dois temas com os tokens corretos. Desativa temporariamente as transições de cor dos componentes para não capturar cores intermédias.
- `lib/theme-paint.ts` desenha círculos brancos num Canvas 2D **fora do DOM**. A cada `requestAnimationFrame`, as gotas chegam e crescem sem apagar tinta anterior. O PNG procedural é aplicado como máscara de alfa ao pseudo-elemento `::view-transition-new(root)`; nunca é uma camada de tinta opaca sobre o texto.
- `styles/theme-transition.css` mantém a captura antiga por baixo e a nova por cima, sem fades ou inversão de cores. Assim, uma gota a meio de uma letra revela nessa parte a letra do tema novo. A máscara inicial é transparente; uma animação de opacidade constante mantém as capturas vivas até o Canvas terminar.
- A última máscara totalmente coberta tem uma oportunidade de pintura antes da remoção das capturas. Frames, estilos temporários, animação e memória do Canvas são libertados também em interrupções e erros.

Escolheu-se a máscara, em vez de `mix-blend-mode: difference`, porque os fundos não são branco/preto puros e os tokens incluem azul de destaque. A inversão não produziria as cores reais do tema de destino.

### Compatibilidade e desempenho

Sem View Transitions, máscaras CSS ou Canvas 2D, e com `prefers-reduced-motion`, o tema muda sem o efeito de gotas. Redimensionar, deslocar a página, ocultar o separador ou ativar movimento reduzido durante o efeito termina a animação no tema solicitado. Cliques sucessivos invalidam callbacks antigos: prevalece a última escolha. A persistência e a sincronização com o sistema/outros separadores continuam no contexto.

O Canvas usa `willReadFrequently` para evitar leituras dispendiosas da GPU. A resolução da máscara acompanha o viewport, com DPR máximo de 2 e um orçamento aproximado de 2 milhões de píxeis; em ecrãs maiores só a máscara é reamostrada, não o texto. A regra CSS atualizada pertence apenas ao pseudo-elemento, evitando alterar uma variável herdada em toda a árvore DOM a cada frame. A codificação PNG e a composição continuam dependentes do browser/dispositivo: não há garantia de 60/120 fps.

`tests/theme.test.ts` verifica a distribuição determinística, chegada progressiva, crescimento monotónico, cobertura geométrica de todas as células (incluindo viewports extremos), ciclo de vida do Canvas, limpeza e contrato de estilos. As antigas verificações específicas de SVG/`@property` foram substituídas pelas da máscara Canvas.

Verificação visual recomendada: alternar nos dois sentidos em desktop/mobile, observar uma gota a atravessar o título e links azuis, testar cliques rápidos, redimensionamento e movimento reduzido. Não devem aparecer letras tapadas, cores invertidas, fades globais nem recursos de máscara pendurados após a transição.
