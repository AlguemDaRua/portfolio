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

## Interface e manutenção

O visual é editorial e minimalista: títulos com hierarquia clara, uma escala de espaçamento partilhada, texto legível e azul reservado aos detalhes. Não são usados screenshots fictícios, percentagens de competências ou links de projetos sem destino real.

- **Conteúdo:** textos e mensagens de interface em `data/content.ts`, com tipos e paridade PT/EN. As informações dos projetos e os PDFs existentes foram preservados.
- **Componentes:** `SectionHeading` uniformiza cabeçalhos; as secções mantêm a composição em `PortfolioShell`. Projetos e competências usam listas semânticas.
- **Estilos:** cores, largura máxima, raios e ritmo vertical em `styles/tokens.css`. Responsividade, acessibilidade e impressão têm responsabilidades separadas; o cabeçalho mobile entra aos 900px.
- **Acessibilidade:** ligação para saltar para o conteúdo, IDs únicos, títulos associados às secções, foco visível e menu mobile com Escape, foco inicial e fecho ao sair. O scramble fica limitado a rótulos curtos, não é anunciado aos leitores de ecrã e respeita movimento reduzido.
- **Contacto:** a cópia só anuncia sucesso depois de a API Clipboard confirmar; falhas apresentam uma alternativa e o `mailto:` continua disponível.
- **Testes:** `tests/ui.test.ts` verifica o HTML renderizado no servidor, navegação, traduções de controlos, destinos reais e contraste dos tokens de texto. Os testes da máscara de tinta continuam independentes.

Antes de publicar, testar PT/EN e claro/escuro entre 320px e desktop, navegação apenas com teclado, menu mobile, cópia de e-mail permitida/negada, PDFs e persistência após recarregar. Uma auditoria automática de acessibilidade não substitui a verificação com leitores de ecrã e dispositivos reais.

## Tema claro/escuro

A preferência inicial respeita o tema do sistema e é carregada antes da primeira pintura da página. Em navegadores compatíveis, **384 salpicos cumulativos** com posições, contornos e tempos de chegada aleatórios revelam o novo tema em cerca de **1,6 segundos**. Cada salpico aparece imediatamente no tamanho final e fica imóvel: não há círculos a crescer. Uma mancha por célula de uma grelha de cobertura (com centros e ordem aleatórios), mais 192 salpicos livres, garante a cobertura de todo o viewport sem uma mancha gigante nem um preenchimento abrupto no fim.

### Como funciona

- `ThemeToggle` continua a usar `changeTheme`, sem coordenadas do botão nem alterações na composição das secções.
- `lib/theme-snapshot.ts` cria uma cópia visual temporária do portfólio no **tema antigo**, fixando os tokens computados. A cópia é `inert`, `aria-hidden`, não interceta cliques e não duplica IDs. A posição do conteúdo, da barra fixa e do cabeçalho sticky é preservada, mesmo com a página deslocada.
- `ThemeContext` faz o commit do tema novo na árvore React real, por baixo dessa cópia. Nenhuma inversão de cores é usada.
- `lib/theme-paint.ts` gera os mesmos salpicos irregulares com curvas quadráticas e manchas satélite num Canvas 2D **fora do DOM**. A máscara começa opaca; cada novo impacto usa `destination-out` para abrir um recorte na cópia antiga. Nesse recorte vê-se o tema novo real, incluindo as letras e os componentes.
- A máscara é aplicada diretamente a um **elemento HTML normal**, com `mask-image` e o equivalente `-webkit-mask-image`. Não depende de `document.startViewTransition()`, animação de pseudo-elementos, deteção do nome do browser ou `mix-blend-mode: difference`.
- A tinta que já caiu nunca cresce nem é redesenhada. No fim, a máscara completamente apagada tem uma oportunidade de pintura antes da remoção da cópia. Frames, listeners, cópia e memória do Canvas são libertados também em interrupções e erros.

A cópia visual foi desenhada para os componentes estáticos deste portfólio, não como biblioteca genérica de screenshots de qualquer DOM. Ao acrescentar vídeos, iframes, Canvas visíveis ou componentes com seletores dependentes de IDs, rever a fidelidade da cópia e os testes de alinhamento.

### Compatibilidade e desempenho

O objetivo é **compatibilidade funcional com melhoria progressiva**, não garantir animações idênticas em todos os browsers e versões existentes. A aplicação continua a depender dos browsers modernos suportados por Next.js e Tailwind CSS.

| Capacidade | Comportamento |
| --- | --- |
| Canvas 2D e máscaras CSS normais | Salpicos nos dois sentidos, independentemente de existir View Transitions |
| Movimento reduzido ou separador oculto | Mudança de tema sem animação |
| Máscaras/Canvas indisponíveis, leitura do Canvas bloqueada ou erro de codificação | Mudança direta, sem deixar uma cópia a tapar a página |
| `localStorage` bloqueado | Tema e idioma funcionam na sessão, sem prometer persistência |
| Clipboard indisponível/negado | Mensagem de erro; endereço selecionável e ligação `mailto:` continuam disponíveis |
| Unidades `svh`/`dvh` indisponíveis | Dimensões alternativas em `vh` |

Redimensionar, deslocar a página, ocultar o separador ou ativar movimento reduzido durante o efeito termina a animação no tema solicitado. Cliques sucessivos invalidam callbacks antigos: prevalece a última escolha.

O Canvas usa `willReadFrequently` para evitar leituras dispendiosas da GPU. A máscara tem DPR máximo de 2 e um orçamento aproximado de 2 milhões de píxeis; em ecrãs maiores só a máscara é reamostrada, não o texto. As propriedades da máscara são atualizadas diretamente no elemento temporário, sem invalidar variáveis herdadas em toda a cópia. O desempenho depende do dispositivo: não há garantia de 60/120 fps.

### Testes entre motores

```bash
npm ci
npm run test:all
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
# Apenas o motor usado como base pelo Firefox/Zen:
npm run test:browser -- --project=firefox
```

O Playwright inicia o build de produção na porta 3100. `PLAYWRIGHT_BASE_URL` permite usar um servidor local já iniciado (fora de CI). A CI executa projetos separados para Chromium, Firefox e WebKit, além dos testes unitários/build.

`tests/theme.test.ts` verifica distribuição, geometria fixa, cobertura, acumulação e limpeza. `e2e/compatibility.spec.ts` verifica a animação **com View Transitions removido**, separação dos tokens, alinhamento desktop/mobile após scroll, máscara final, cliques rápidos, movimento reduzido, redimensionamento, falhas de APIs, idiomas, menu e PDFs.

Testar os três motores reduz regressões, mas não certifica todas as versões de Zen, Safari/iOS ou browsers modificados. Confirmar também no browser/dispositivo real, especialmente com extensões e proteções de privacidade que possam bloquear Canvas.
