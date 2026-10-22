# Portfólio de Azam Usman

Portfólio pessoal construído com Next.js 16, React e TypeScript. O conteúdo está disponível em português e inglês; os currículos em PDF encontram-se em `public/pdf/`.

## Desenvolvimento

Requer **Node.js 24+** (testado em **Node.js 26** localmente e na CI com `.nvmrc` em 26.11.1; compatível com **Node.js 24 LTS** na Vercel) e **npm 11+** (com `packageManager` a fixar npm 12.2.0). Os tipos de Node acompanham o runtime 26. São versões estáveis atuais, não versões beta/canary.

Se usas nvm, prepara o ambiente antes de instalar as dependências:

```bash
nvm install
nvm use
npm install --global npm@12.2.0
```

Sem nvm, instala as mesmas versões através do teu gestor de Node preferido. Depois:

```bash
npm ci
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Verificações

```bash
npm run audit
npm outdated
npm run type-check
npm run lint
npm run test
npm run build
# Executa type-check, lint, testes e build
npm run test:all
```

## Dependências e segurança

- **Âmbito das versões:** as dependências diretas estão nas versões estáveis mais recentes verificadas. As transitivas são atualizadas dentro dos intervalos suportados; versões fixadas internamente por Next.js/Tailwind (por exemplo, PostCSS/Lightning CSS) não são forçadas com overrides só para alterar um número. `npm outdated` verifica as diretas; `npm outdated --all` também pode listar esses pins e binários opcionais de outras plataformas.
- **Instalação reproduzível:** usa `npm ci` e mantém `package-lock.json` versionado. `.npmrc` rejeita runtimes incompatíveis e scripts de instalação sem uma decisão explícita.
- **Scripts aprovados:** apenas `esbuild@0.28.2`, necessário ao `tsx`, tem o `postinstall` autorizado. O script prepara/verifica o binário da plataforma; a autorização é limitada à versão revista. `unrs-resolver` deixou de fazer parte da árvore.
- **Ao atualizar um pacote com scripts:** revê o código de instalação da nova versão antes de aprovar. `npm install-scripts ls` mostra as decisões pendentes. Para obter uma atualização para revisão, usa `npm install --ignore-scripts`; depois de rever, `npm install-scripts approve <pacote>` regista a versão aprovada e `npm ci` valida a instalação normal. Não uses aprovações globais, `--legacy-peer-deps` ou `npm audit fix --force` para esconder incompatibilidades.
- **Auditoria:** `npm run audit` inclui dependências de desenvolvimento e falha perante vulnerabilidades conhecidas de qualquer severidade. Também é obrigatório na CI. Um resultado limpo é uma verificação pontual, não uma garantia permanente de segurança.
- **Atualizações futuras:** Dependabot está configurado para propor atualizações semanais de npm e GitHub Actions, em grupos para manter pacotes relacionados juntos. Só fica ativo quando esta configuração chegar à branch principal. PRs continuam sujeitos a revisão, scripts aprovados e testes; não há merge automático. Node/npm também devem ser revistos periodicamente.

### Lint com TypeScript 7

O lint usa **Oxlint**, com regras de Next.js, React/hooks, TypeScript, imports e acessibilidade; avisos também fazem falhar `npm run lint`. O type-check continua separado, com `tsc --noEmit` e modo estrito, e o build Next.js também verifica os tipos.

Esta migração remove a cadeia antiga `eslint-config-next → fast-glob → micromatch → braces`, que mantinha uma vulnerabilidade sem versão corrigida, e evita forçar ESLint 10/TypeScript 7 em plugins que ainda não declaram compatibilidade. Não é uma promessa de equivalência regra a regra com os presets antigos: `.oxlintrc.json` passa a ser a configuração explícita. `tests/tooling.test.ts` confirma que hooks condicionais, dependências de efeitos em falta, listas sem keys, imagens Next incorretas, falhas de acessibilidade e `any` explícito são detetados.

As exceções são intencionais: o JSX automático não exige `React` no scope; CSS pode ser importado pelos seus efeitos; grupos de botões podem usar ARIA sem virar formulários. Apenas `SideRail.tsx` permite `onBlur` no `aside`, para fechar o menu quando o foco sai — não para tornar o contentor clicável. As restantes regras de interação/acessibilidade mantêm-se ativas.

## Estrutura

- `app/` — rotas Next.js, metadados e entrada dos estilos globais.
- `components/layout/` — composição principal e navegação lateral.
- `components/sections/` — secções do portfólio (hero, perfil, projectos, competências, currículo, contacto).
- `components/ui/` — cartão de identidade, alternadores de tema/idioma, cabeçalhos e ligações utilitárias.
- `context/` — estado persistente do tema e do idioma.
- `data/` — conteúdo bilingue e tipos.
- `lib/theme-water.ts` — ondas, paleta e camada Canvas da transição de água.
- `lib/water-change.ts` — corre a transição: copia a página, aplica a mudança e limpa tudo.
- `lib/water-snapshot.ts` — cópia visual da página anterior por baixo da animação.
- `styles/` — tokens, base, navegação, secções, animação do tema e acessibilidade/impressão.
- `tests/` — testes de conteúdo, navegação e comportamento/estrutura do tema.

## Interface e manutenção

O visual é editorial e contido: uma nav fixa à esquerda, tipografia grande, muito espaço branco e um único azul reservado a detalhes. O cartão `AU / 01—03` traduz o monograma numa placa escura que se mantém legível nos dois temas. Não há screenshots fictícios, percentagens de competências nem links de projectos sem destino real.

- **Conteúdo:** textos e mensagens de interface em `data/content.ts`, com paridade PT/EN garantida por tipos e testes. Os projectos e os PDFs existentes foram preservados; o texto de apresentação foi reescrito em ambas as línguas.
- **Componentes:** `SectionHeading` uniformiza cabeçalhos; as secções mantêm a composição em `PortfolioShell`. Projectos e competências usam listas semânticas; o cartão de identidade é decorativo (`aria-hidden`).
- **Estilos:** cores, largura máxima, raios e ritmo vertical em `styles/tokens.css`. A responsividade vive junto de cada bloco e a acessibilidade/impressão tem ficheiro próprio; a nav lateral passa a barra compacta aos 980px.
- **Acessibilidade:** ligação para saltar para o conteúdo, IDs únicos, títulos associados às secções, foco visível e menu mobile com Escape, foco inicial e fecho ao sair. Tudo o que é decorativo respeita `prefers-reduced-motion`, `forced-colors` e impressão.
- **Contacto:** a cópia só anuncia sucesso depois de a API Clipboard confirmar; falhas apresentam uma alternativa e o `mailto:` continua disponível.
- **Testes:** `tests/ui.test.ts` verifica o HTML renderizado no servidor, navegação, traduções de controlos, destinos reais e contraste dos tokens de texto. Os testes da transição de água continuam independentes.

Antes de publicar, testar PT/EN e claro/escuro entre 320px e desktop, navegação apenas com teclado, menu mobile, cópia de e-mail permitida/negada, PDFs e persistência após recarregar. Uma auditoria automática de acessibilidade não substitui a verificação com leitores de ecrã e dispositivos reais.

## Tema claro/escuro e idioma

A preferência inicial respeita o tema do sistema e é carregada antes da primeira pintura da página. Em navegadores compatíveis, tanto a troca de tema como a troca de idioma são reveladas por **uma onda de água vista de cima**: no centro exato do viewport nasce um ponto de impacto, e dali partem **ondas concêntricas** que se propagam em tempo real até às margens. Não há gota a cair através da página — é uma superfície vista de cima, e a primeira frame já abre a água. Duração total: **900 ms**.

### Como funciona

- `ThemeToggle` e `LanguageToggle` chamam `runWaterChange`, sem coordenadas do botão nem alterações na composição das secções.
- `lib/water-snapshot.ts` cria uma cópia visual temporária da página **no estado anterior** (tema antigo, palavras antigas), fixando os tokens computados. A cópia fica por baixo da página viva, é `inert`, `aria-hidden`, não interceta cliques e não duplica IDs. A posição do conteúdo, da nav fixa e do cabeçalho sticky é preservada, mesmo com a página deslocada.
- `lib/water-change.ts` faz o commit do novo estado na árvore React real, por cima dessa cópia, e garante watchdog, listeners e limpeza. Nenhuma inversão de cores é usada.
- A revelação é um **`clip-path: circle()`** aplicado à página viva: o círculo cresce a partir do centro e descobre o estado novo, deixando a cópia antiga à vista à volta. Um clip é a forma mais barata que um browser consegue animar; uma máscara de Canvas obrigava a codificar uma imagem por frame e cortava a fluidez para menos de metade.
- `lib/theme-water.ts` desenha a água num **Canvas 2D fora do DOM**, de resolução completa (até 1,5× DPR), a cada frame: o clarão e o anel do impacto, os salpicos radiais, a frente e as ondulações que viajam com ela. Tudo são círculos (`arc`), por isso uma frame custa poucos traços.
- **Cor do tema que chega:** a água não tem cor própria. A frente, as ondas e os salpicos usam os neutros do tema de destino — água escura quando a página vai escurecer, água clara quando vai iluminar. As ondulações à frente da frente leem-se sobre a página que sai; as que ficam para trás leem-se sobre a que já chegou. Na troca de idioma não há tema novo, por isso a água usa os tons da própria página.
- **Suavidade:** a frente arranca depressa e desacelera, com uma curva quadrática contínua (`1.45t − 0.45t²`) em vez de um salto; o clip e o brilho são atualizados a cada frame e decaem de forma contínua até zero. Não existe fase de queda nem espera inicial: a primeira frame já abre a superfície.
- **Garantia de cobertura:** o raio máximo é a diagonal da viewport com 6% de folga, por isso o último frame cobre sempre os cantos, testado de 1×1 a 4000×300. Nesse frame o clip é removido, sem “pop”.
- **A água nunca anda para trás:** o raio é monotónico e o clip é substituído, nunca recriado. O Canvas, os listeners e a cópia são libertados no fim, em interrupções e em erros.
- O clip é aplicado diretamente a um **elemento HTML normal**, com `clip-path` e o equivalente `-webkit-clip-path`. Não depende de `document.startViewTransition()`, animação de pseudo-elementos, deteção do nome do browser ou `mix-blend-mode: difference`.

A cópia visual foi desenhada para os componentes estáticos deste portfólio, não como biblioteca genérica de screenshots de qualquer DOM. Ao acrescentar vídeos, iframes, Canvas visíveis ou componentes com seletores dependentes de IDs, rever a fidelidade da cópia e os testes de alinhamento.

### Compatibilidade e desempenho

O objetivo é **compatibilidade funcional com melhoria progressiva**, não garantir animações idênticas em todos os browsers e versões existentes. A aplicação continua a depender dos browsers modernos suportados por Next.js e Tailwind CSS.

| Capacidade | Comportamento |
| --- | --- |
| Canvas 2D e `clip-path` | Impacto, frente e ondas em ambos os sentidos, independentemente de existir View Transitions |
| Movimento reduzido ou separador oculto | Mudança de tema ou idioma sem animação |
| `clip-path`/Canvas indisponíveis ou contexto 2D bloqueado | Mudança direta, sem deixar uma cópia a tapar a página |
| `localStorage` bloqueado | Tema e idioma funcionam na sessão, sem prometer persistência |
| Clipboard indisponível/negado | Mensagem de erro; endereço selecionável e ligação `mailto:` continuam disponíveis |
| Unidades `svh`/`dvh` indisponíveis | Dimensões alternativas em `vh` |

Redimensionar, deslocar a página, ocultar o separador ou ativar movimento reduzido durante o efeito termina a animação no estado solicitado. Cliques sucessivos invalidam callbacks antigos: prevalece a última escolha, e uma troca de idioma a meio de uma troca de tema assenta a primeira antes de começar a segunda.

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

`tests/theme.test.ts` verifica a origem central, a paleta neutra do tema de destino, a desaceleração das ondas, a monotonia do raio, a cobertura final dos cantos em vários viewports, o clip a cada frame e a limpeza de recursos. `e2e/compatibility.spec.ts` verifica a animação **com View Transitions removido**, a troca de idioma pela mesma água, separação dos tokens, alinhamento desktop/mobile após scroll, clip final, cliques rápidos, movimento reduzido, redimensionamento, falhas de APIs, idiomas, menu e PDFs.

Testar os três motores reduz regressões, mas não certifica todas as versões de Zen, Safari/iOS ou browsers modificados. Confirmar também no browser/dispositivo real, especialmente com extensões e proteções de privacidade que possam bloquear Canvas.
