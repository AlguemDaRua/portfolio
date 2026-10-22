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
- **Auditoria:** `npm run audit` inclui dependências de desenvolvimento e falha perante vulnerabilidades de qualquer severidade — é a verificação completa, para correr à mão. Na CI corre `npm audit --omit=dev --audit-level=high`, para que uma falha numa ferramenta de desenvolvimento não bloqueie um deploy e para que o pipeline fique verde quando o que é publicado está limpo. Um resultado limpo é uma verificação pontual, não uma garantia permanente de segurança.
- **Atualizações futuras:** Dependabot está configurado para propor atualizações semanais de npm e GitHub Actions, em grupos para manter pacotes relacionados juntos. Só fica ativo quando esta configuração chegar à branch principal. PRs continuam sujeitos a revisão, scripts aprovados e testes; não há merge automático. Node/npm também devem ser revistos periodicamente.

### Lint com TypeScript 7

O lint usa **Oxlint**, com regras de Next.js, React/hooks, TypeScript, imports e acessibilidade; avisos também fazem falhar `npm run lint`. O type-check continua separado, com `tsc --noEmit` e modo estrito, e o build Next.js também verifica os tipos.

Esta migração remove a cadeia antiga `eslint-config-next → fast-glob → micromatch → braces`, que mantinha uma vulnerabilidade sem versão corrigida, e evita forçar ESLint 10/TypeScript 7 em plugins que ainda não declaram compatibilidade. Não é uma promessa de equivalência regra a regra com os presets antigos: `.oxlintrc.json` passa a ser a configuração explícita. `tests/tooling.test.ts` confirma que hooks condicionais, dependências de efeitos em falta, listas sem keys, imagens Next incorretas, falhas de acessibilidade e `any` explícito são detetados.

As exceções são intencionais: o JSX automático não exige `React` no scope; CSS pode ser importado pelos seus efeitos; grupos de botões podem usar ARIA sem virar formulários. Apenas `SideRail.tsx` permite `onBlur` no `aside`, para fechar o menu quando o foco sai — não para tornar o contentor clicável. As restantes regras de interação/acessibilidade mantêm-se ativas.

## CI/CD e deploy

Tudo o que corre automaticamente parte de **`main`**. Branches de trabalho não gastam minutos de CI nem criam deploys de pré-visualização.

```text
1 · Tipos, lint e dependências   type-check, oxlint, npm audit --omit=dev --audit-level=high
2 · Testes de unidade            tsx --test
3 · Build de produção            next build  (artefacto reutilizado)
4 · Browser                      Playwright/Chromium contra esse build
5 · Deploy                       pedido ao Vercel, só depois de 2 e 4 passarem
```

- As fases encadeiam-se com `needs`: uma falha na fase 1 não deixa correr o build nem os browsers. `concurrency` cancela execuções antigas do mesmo ref.
- A matriz completa (Firefox + WebKit) fica disponível em **Actions → CI → Run workflow**, com a opção `browsers`. Não corre sozinha para poupar recursos.
- `vercel.json` desativa deploys de outras branches (`git.deploymentEnabled`), fixa `npm ci --engine-strict=false` como instalação, acrescenta cabeçalhos de segurança e cache longo para fontes e imagens.
- O Vercel publica `main` pela integração Git. Para o deploy só acontecer **depois** dos testes, cria um Deploy Hook e guarda-o no segredo `VERCEL_DEPLOY_HOOK`: a fase 5 passa a ser a única porta de entrada (sem o segredo, a fase apenas informa e sai com sucesso).

### Tratamento de erros

- `app/error.tsx` — fronteira de erro da rota: mensagem bilingue, botão para tentar de novo e ligação ao formulário.
- `app/global-error.tsx` — fallback quando o próprio layout falha (traz o seu `<html>`/`<body>` e estilos inline, porque o CSS global pode não existir).
- `app/not-found.tsx` — 404 com o mesmo desenho, marcado `noindex`.
- Os erros continuam a aparecer na consola e nos *runtime logs* do Vercel; não há serviço externo de monitorização.

## Formulário de contacto

Não há endereço em lado nenhum da página — nem no HTML, nem no bundle, nem nos estados de erro. A única porta é o formulário, e ele fala com o próprio servidor.

- **Rota:** `POST /api/contact` (`app/api/contact/route.ts`). Corpo JSON `{ name, email, subject, message, elapsed, company }`.
- **Validação:** `lib/contact.ts` é a única fonte da verdade — os mesmos limites servem o browser e o servidor. O browser valida para dar resposta imediata; o servidor valida outra vez porque a única validação que conta é a dele. Devolve `422` com os campos em falta e o código do erro (`required`, `email`, `short`, `long`); as frases vivem no dicionário, para qualquer idioma novo funcionar sem tocar em lógica.
- **Anti-spam:** campo-armadilha fora do ecrã (`company`), tempo mínimo entre abrir e enviar (`elapsed` < 1,2 s é bot), limite de 5 envios por IP a cada 10 minutos (por instância, suficiente para travar um script) e teto de 8 KB no corpo do pedido. A um bot a rota responde `202` — o mesmo que um humano recebe — e não entrega nada.
- **O endereço existe?** Sim, é verificado antes de qualquer entrega (`lib/contact-verify.ts`), em duas camadas:
  1. **Domínio** — sempre, sem conta e sem chave. Uma consulta DNS-over-HTTPS confirma que o domínio aceita correio (registo MX, ou o `A`/`AAAA` que a RFC 5321 ainda permite). Apanha domínios inventados, gralhas no domínio e endereços de sítios que não têm correio. Uma gralha conhecida (`gmial.com`, `gmail.con`, `hotmial.com`…) volta com a correção pronta, num botão que preenche o campo.
  2. **Caixa de correio** — só se configurares uma chave gratuita. Provar que uma caixa concreta existe obriga a falar SMTP na porta 25 com o fornecedor, o que uma função serverless não pode fazer; por isso essa parte é delegada a uma API gratuita: `abstract` (100/mês), `quickemailverification` (100/dia) ou `mailboxlayer` (100/mês).
  Se a rede não souber responder (DNS em baixo, API a devolver erro), o endereço **passa**: uma avaria nossa nunca pode custar a mensagem de uma pessoa real. Nunca há um "válido" inventado — há "não sei", que não bloqueia.
- **Entrega:** `lib/contact-delivery.ts` escolhe a via conforme o ambiente. Nada é lido do browser.

| Variável | Para quê |
| --- | --- |
| `RESEND_API_KEY` + `CONTACT_TO` | [Resend](https://resend.com), gratuito até 3 000 e-mails/mês (100/dia), sem cartão. O plano gratuito só entrega ao endereço dono da conta, por isso cria a conta com o endereço que queres receber e repete-o em `CONTACT_TO`. |
| `CONTACT_FROM` | Opcional. Só com domínio verificado no Resend (`Portfolio <hello@dominio.com>`). |
| `CONTACT_WEBHOOK` | Qualquer endpoint que aceite JSON (Zapier, Make, Formspree, Slack, Discord…). Recebe `{ name, email, subject, message, text }`. |
| `EMAIL_VERIFIER_PROVIDER` + `EMAIL_VERIFIER_KEY` | Opcional. Verificação da caixa de quem escreve por uma API gratuita (`abstract`, `quickemailverification` ou `mailboxlayer`). Sem isto, só o domínio é verificado. |

**Resend em quatro passos, sem pagar nada:** criar conta em resend.com com o endereço de destino → **API Keys → Create API Key** (permissão de envio) → colar a chave em `RESEND_API_KEY` e o teu endereço em `CONTACT_TO` (Vercel: **Settings → Environment Variables**, ou `.env.local` se estiveres a correr o site na tua máquina) → voltar a publicar. O e-mail do visitante vai no `reply_to`, portanto responderes é um clique.

Sem nenhuma variável definida a rota responde `503` e o formulário diz que o envio não está disponível — nunca finge que enviou. As variáveis estão documentadas em `.env.example` e configuram-se no Vercel em **Project → Settings → Environment Variables**.

- **Estados:** erro por campo com `aria-invalid` e `aria-describedby`, foco no primeiro campo inválido, botão em `aria-busy` enquanto envia, falha de rede distinguida de falha do fornecedor, e um painel de sucesso que permite enviar outra mensagem.
- **Testes:** `tests/verify.test.ts` cobre a verificação do domínio (MX, recurso ao `A`, NXDOMAIN, DNS em baixo), as gralhas sugeridas e as três APIs, tudo com `fetch` injectado; `tests/contact.test.ts` cobre a validação campo a campo, a detecção de bots e as duas entregas (com `fetch` injectado, sem rede); `e2e/contact.spec.ts` cobre o formulário real, os estados de erro, o sucesso, a falha do fornecedor, a rede em baixo e a própria rota (422, 503, 202).

## Estrutura

- `app/` — rotas Next.js, metadados e entrada dos estilos globais; `app/api/contact/` é a única rota de servidor.
- `components/layout/` — composição principal e navegação lateral.
- `components/sections/` — secções do portfólio (hero, perfil, projectos, competências, currículo, contacto e o formulário).
- `components/ui/` — cartão de identidade, alternadores de tema/idioma, cabeçalhos e ligações utilitárias.
- `context/` — estado persistente do tema e do idioma.
- `data/` — conteúdo bilingue e tipos.
- `lib/theme-water.ts` — ondas, paleta e camada Canvas da transição de água.
- `lib/scramble.ts` — revelação letra a letra usada na troca de idioma.
- `lib/contact.ts` — contrato do formulário: limites, validação, armadilha e detecção de bots.
- `lib/contact-verify.ts` — o endereço existe? DNS (sempre) e verificação da caixa (opcional).
- `lib/contact-delivery.ts` — entrega por Resend ou webhook, escolhida pelo ambiente.
- `lib/water-change.ts` — corre a transição: copia a página, aplica a mudança e limpa tudo.
- `lib/water-snapshot.ts` — cópia visual da página anterior por baixo da animação.
- `styles/` — tokens, base, navegação, secções, animação do tema e acessibilidade/impressão.
- `tests/` — testes de conteúdo, navegação, formulário e comportamento/estrutura do tema.

## Interface e manutenção

O visual é editorial e contido: uma nav fixa à esquerda, tipografia grande, muito espaço branco e um único azul reservado a detalhes. O cartão `AU / 01—03` traduz o monograma numa placa escura que se mantém legível nos dois temas. Não há screenshots fictícios, percentagens de competências nem links de projectos sem destino real.

- **Conteúdo:** textos e mensagens de interface em `data/content.ts`, com paridade PT/EN garantida por tipos e testes. Os projectos e os PDFs existentes foram preservados; o texto de apresentação foi reescrito em ambas as línguas.
- **Componentes:** `SectionHeading` uniformiza cabeçalhos; as secções mantêm a composição em `PortfolioShell`. Projectos e competências usam listas semânticas; o cartão de identidade é decorativo (`aria-hidden`).
- **Estilos:** cores, largura máxima, raios e ritmo vertical em `styles/tokens.css`. A responsividade vive junto de cada bloco e a acessibilidade/impressão tem ficheiro próprio; a nav lateral passa a barra compacta aos 980px.
- **Acessibilidade:** ligação para saltar para o conteúdo, IDs únicos, títulos associados às secções, foco visível e menu mobile com Escape, foco inicial e fecho ao sair. Tudo o que é decorativo respeita `prefers-reduced-motion`, `forced-colors` e impressão.
- **Contacto:** o formulário só anuncia sucesso depois de o servidor confirmar a entrega; falhas dizem qual falhou (rede ou fornecedor) e nunca apagam o texto escrito. Não há endereço de e-mail em lado nenhum.
- **Testes:** `tests/ui.test.ts` verifica o HTML renderizado no servidor, navegação, traduções de controlos, destinos reais e contraste dos tokens de texto. Os testes da transição de água continuam independentes.

Antes de publicar, testar PT/EN e claro/escuro entre 320px e desktop, navegação apenas com teclado, menu mobile, formulário e estados de erro, PDFs e persistência após recarregar. Uma auditoria automática de acessibilidade não substitui a verificação com leitores de ecrã e dispositivos reais.

## Tema claro/escuro e idioma

A preferência inicial respeita o tema do sistema e é carregada antes da primeira pintura da página. Em navegadores compatíveis, a troca de tema é revelada por **uma onda de água vista de cima**: no centro exato do viewport nasce um ponto de impacto, e dali partem **ondas concêntricas** que se propagam em tempo real até às margens. Não há gota a cair através da página — é uma superfície vista de cima, e a primeira frame já abre a água. Duração total: **900 ms**.

O **idioma não usa água**: PT ↔ EN troca as palavras na hora e cada texto volta a entrar **letra a letra** (`lib/scramble.ts` + `components/ui/ScrambleText.tsx`). Um único `requestAnimationFrame` serve a página inteira, as letras mantêm o comprimento e o espaçamento originais (nada salta de linha) e um pequeno desfasamento faz a leitura descer pela página.

### Como funciona

- `ThemeToggle` chama `runWaterChange`, sem coordenadas do botão nem alterações na composição das secções. `LanguageToggle` só confirma o idioma: o efeito é o texto.
- `lib/water-snapshot.ts` cria uma cópia visual temporária da página **no estado anterior** (tema antigo, palavras antigas), fixando os tokens computados. A cópia fica por baixo da página viva, é `inert`, `aria-hidden`, não interceta cliques e não duplica IDs. A posição do conteúdo, da nav fixa e do cabeçalho sticky é preservada, mesmo com a página deslocada.
- `lib/water-change.ts` faz o commit do novo estado na árvore React real, por cima dessa cópia, e garante watchdog, listeners e limpeza. Nenhuma inversão de cores é usada.
- A revelação é um **`clip-path: circle()`** aplicado à página viva: o círculo cresce a partir do centro e descobre o estado novo, deixando a cópia antiga à vista à volta. Um clip é a forma mais barata que um browser consegue animar; uma máscara de Canvas obrigava a codificar uma imagem por frame e cortava a fluidez para menos de metade.
- `lib/theme-water.ts` desenha a água num **Canvas 2D fora do DOM**, de resolução completa (até 1,5× DPR), a cada frame: o clarão e o anel do impacto, os salpicos radiais, a frente e as ondulações que viajam com ela. Tudo são círculos (`arc`), por isso uma frame custa poucos traços.
- **Cor do tema que chega:** a água não tem cor própria. A frente, as ondas e os salpicos usam os neutros do tema de destino — água escura quando a página vai escurecer, água clara quando vai iluminar. As ondulações à frente da frente leem-se sobre a página que sai; as que ficam para trás leem-se sobre a que já chegou. Na troca de idioma não há tema novo, por isso a água usa os tons da própria página.
- **Suavidade:** a frente arranca depressa e desacelera, com uma curva quadrática contínua (`1.45t − 0.45t²`) em vez de um salto; o clip e o brilho são atualizados a cada frame e decaem de forma contínua até zero. Não existe fase de queda nem espera inicial: a primeira frame já abre a superfície.
- **Luz só da navegação:** o fundo escuro é preto puro. A única luz da página nasce atrás da barra lateral (`--rail-glow-core` / `--rail-glow-spill`) e espalha-se suavemente para a direita; no tema claro é a mesma ideia, muito mais discreta. Abaixo dos 980px a barra passa a topo e o brilho acompanha-a, sem nunca virar uma segunda fonte de luz.
- **Navegação no hover:** o crescimento acontece na camada de luz, não na linha. O item mantém exactamente a mesma caixa e a mesma posição — quem cresce (10% na horizontal, 20% na vertical) é a pílula iluminada atrás do texto, que ignora o ponteiro, e o texto sobe 5%. Como o alvo nunca se move nem se encolhe, é impossível o cursor «cair» dele: não há rato para perseguir.
- **Luz do hover:** a pílula acende com as cores do tema (`--rail-hover-bg`, `--rail-hover-edge`, `--rail-hover-glow`) e, enquanto se navega, a barra inteira espalha mais luz pela página (`:has()`), sempre a partir da mesma fonte. Sem inclinação, sem tilt.
- **Assinatura:** o topo da barra é só o nome, em duas vozes — «Azam» no tom forte e «Usman» no acento. Ao passar o rato (ou com foco de teclado) as duas cores trocam de lugar, com a segunda palavra a entrar 60ms depois, o que faz a troca ler-se como uma passagem de testemunho. Sem monograma, sem cargo.
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
| Idioma (PT ↔ EN) | Palavras trocadas na hora e reveladas letra a letra; sem cópia, sem Canvas, sem clip |
| `clip-path`/Canvas indisponíveis ou contexto 2D bloqueado | Mudança direta, sem deixar uma cópia a tapar a página |
| `localStorage` bloqueado | Tema e idioma funcionam na sessão, sem prometer persistência |
| `/api/contact` sem variáveis definidas | O formulário diz que o envio está indisponível; nada é enviado nem perdido em silêncio |
| Unidades `svh`/`dvh` indisponíveis | Dimensões alternativas em `vh` |

Redimensionar, deslocar a página, ocultar o separador ou ativar movimento reduzido durante a água termina a animação no estado solicitado. Cliques sucessivos no tema invalidam callbacks antigos: prevalece a última escolha. Uma troca de idioma nunca espera pela água — as letras entram por cima do estado que já foi confirmado.

### Testes entre motores

```bash
npm ci
npm run test:all
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
# Apenas o motor usado como base pelo Firefox/Zen:
npm run test:browser -- --project=firefox
```

O Playwright inicia o build de produção na porta 3100. `PLAYWRIGHT_BASE_URL` permite usar um servidor local já iniciado (fora de CI). Em `main`, a CI corre sempre Chromium; Firefox e WebKit correm na matriz completa quando alguém os pede no GitHub Actions (`.github/workflows/ci.yml`).

`tests/theme.test.ts` verifica a origem central, a paleta neutra do tema de destino, a desaceleração das ondas, a monotonia do raio, a cobertura final dos cantos em vários viewports, o clip a cada frame, a limpeza de recursos e a revelação letra a letra (comprimento, espaços, movimento reduzido e palavra final). `e2e/compatibility.spec.ts` verifica a animação **com View Transitions removido**, a troca de idioma sem água e sem cópia, separação dos tokens, alinhamento desktop/mobile após scroll, clip final, cliques rápidos, movimento reduzido, redimensionamento, falhas de APIs, idiomas, menu e PDFs; `e2e/contact.spec.ts` trata do formulário.

Testar os três motores reduz regressões, mas não certifica todas as versões de Zen, Safari/iOS ou browsers modificados. Confirmar também no browser/dispositivo real, especialmente com extensões e proteções de privacidade que possam bloquear Canvas.
