# Portfólio de Azam Usman

Portfólio pessoal construído com Next.js 16, React e TypeScript. O conteúdo está disponível em português e inglês; os currículos em PDF encontram-se em `public/pdf/`.

## Desenvolvimento

Requer **Node.js 26** e **npm 12.2+ (major 12)**. A versão testada de Node está em `.nvmrc` (26.11.1); `packageManager` fixa npm 12.2.0. Os tipos de Node acompanham o runtime 26. São versões estáveis atuais, não versões beta/canary.

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
- **Acessibilidade:** ligação para saltar para o conteúdo, IDs únicos, títulos associados às secções, foco visível e menu mobile com Escape, foco inicial e fecho ao sair. A troca PT ↔ EN restaura o scramble nos títulos, descrições e rótulos: os glifos são decorativos, o texto real reserva o espaço e continua acessível. A animação respeita movimento reduzido e cancela frames antigos em trocas rápidas.
- **Contacto:** formulário bilingue com destinatário identificado por um ID opaco do FormSubmit, sem endereço no HTML/dados públicos. Só confirma aceitação após resposta positiva do serviço; mantém o rascunho em falhas. Os PDFs foram mantidos intactos por decisão do proprietário e continuam a conter e-mails.
- **Testes:** `tests/ui.test.ts` verifica o HTML renderizado no servidor, navegação, traduções de controlos, destinos reais e contraste dos tokens de texto. Os testes da máscara de tinta continuam independentes.

Antes de publicar, testar PT/EN e claro/escuro entre 320px e desktop, navegação apenas com teclado, menu mobile, envio de formulário aceite/rejeitado, PDFs e persistência após recarregar. Uma auditoria automática de acessibilidade não substitui a verificação com leitores de ecrã e dispositivos reais.

## Contacto gratuito, sem destinatário público no formulário

O formulário usa [FormSubmit](https://formsubmit.co/documentation), com o recurso **Invisible emails** e [envio AJAX](https://formsubmit.co/ajax-documentation). O serviço anuncia formulários/envios gratuitos e ilimitados, sem conta obrigatória. Isso não é uma garantia de disponibilidade ou de condições gratuitas para sempre: aplicam-se filtros anti-spam e eventuais limites técnicos do fornecedor.

### Ativação obrigatória (uma vez)

1. Abre o [demo oficial](https://formsubmit.co/live-demo), configura o destinatário **apenas no serviço** e submete uma mensagem de ativação.
2. Confirma o endereço pelo e-mail enviado pelo FormSubmit. Obtém o identificador aleatório **Invisible emails**, fornecido após confirmação. Não publiques a ligação de ativação nem uses o endereço como ID.
3. Copia `.env.example` para `.env.local` e preenche **somente o identificador público**:
   ```dotenv
   NEXT_PUBLIC_FORMSUBMIT_ID=identificador-recebido-do-formsubmit
   ```
   O exemplo acima não é um ID funcional. Usa o valor real fornecido pelo serviço. O prefixo `NEXT_PUBLIC_` é intencional: este identificador é um endpoint público de submissão, não uma chave privada. **Nunca coloques o e-mail ou segredos nessa variável.** Configurações com e-mail/URL são rejeitadas ao iniciar o build/dev.
4. Reinicia `npm run dev`. Na hospedagem, configura a mesma variável **antes do build** e faz novo deploy: Next incorpora variáveis públicas durante a compilação.
5. Envia uma mensagem de teste pelo site publicado, confirma a receção na tua caixa e verifica que responder usa o e-mail do visitante.

Sem configuração, o envio fica desativado com uma mensagem explícita — não há sucesso simulado. Não foi enviada nenhuma mensagem real durante o desenvolvimento: os testes interceptam o fornecedor.

### Comportamento e privacidade

- Nome, e-mail do visitante e mensagem; validação de campos, limites de tamanho e honeypot. Nenhuma nova dependência, servidor de correio ou plano pago é necessário para esta integração.
- Envio na própria página com JavaScript. Sem JavaScript, o formulário configurado usa o POST nativo para a confirmação do FormSubmit.
- Bloqueia envios repetidos enquanto aguarda resposta e cancela após 15 segundos. Só uma resposta HTTP bem-sucedida com `success: true` (ou `"true"`) mostra aceitação. Aceitação pelo serviço **não certifica entrega na caixa de entrada**; um timeout também não prova que nada foi enviado.
- O rascunho não é apagado em erros, timeouts ou troca de idioma. Mensagens internas do fornecedor e conteúdo da submissão não são mostrados em logs/UI.
- Os dados seguem diretamente do browser para FormSubmit por HTTPS, para que o proprietário possa responder. A UI informa esse processamento e liga à política do serviço. A documentação do fornecedor indica um arquivo de submissões de 30 dias. Não usar para dados sensíveis.
- Um ID público não é um segredo nem uma proteção anti-spam completa. Validação no browser e honeypot são barreiras de conveniência, não autenticação; a filtragem final pertence ao serviço. Não desativamos o CAPTCHA nas opções enviadas, embora o fluxo AJAX tenha as suas próprias limitações.
- **Limite da privacidade escolhido:** os dois CVs públicos permanecem inalterados, com os contactos originais. Também podem existir cópias do endereço em commits antigos, caches e versões anteriores. Não é uma promessa de anonimato nem de remoção do endereço de toda a internet.

### Testes do formulário e do idioma

`tests/contact.test.ts` valida IDs, campos, payload, respostas e estado sem configuração. `e2e/contact-language.spec.ts` verifica ambos os sentidos do scramble, movimento reduzido, rascunhos, sucesso, rejeição, HTTP 429, falha de rede, resposta não JSON, timeout e honeypot. **Todos os pedidos ao FormSubmit são interceptados**, sem enviar e-mail.

Para exercitar os envios localmente, compila e executa os testes com o mesmo ID fictício:

```bash
NEXT_PUBLIC_FORMSUBMIT_ID=e2e-contact-fixture-only npm run build
NEXT_PUBLIC_FORMSUBMIT_ID=e2e-contact-fixture-only npm run test:browser
```

A CI já define esse ID apenas nos jobs de browser. Sem a variável, os cenários de submissão configurada são assinalados como ignorados; os restantes testes continuam a executar. **Nunca publiques o build com o ID fictício.**

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
| Serviço de contacto indisponível ou envio não confirmado | Mensagem de erro; rascunho preservado e nova tentativa possível |
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
