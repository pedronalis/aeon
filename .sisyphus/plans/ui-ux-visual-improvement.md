# UI/UX Visual Improvement Plan (Core Flow)

## TL;DR

> **Quick Summary**: Refine the core flow visuals (Timer + navigation + Settings) to improve hierarchy, readability, and interaction clarity while preserving the medieval-premium aesthetic and low-FX mode.
>
> **Deliverables**:
> - Refined visual utilities/tokens for core flow (additive, minimal global impact)
> - Updated navigation + shared components styling
> - Updated Timer and Settings screens
> - Manual QA checklist + build/test verification
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2 → Tasks 3/4 → Task 5

---

## Context

### Original Request
"Preciso que você analise o projeto e crie um plano para melhorar o visual dele otimizando para as melhores praticas de UX/UI."

### Interview Summary
**Key Discussions**:
- Prioridade: core flow primeiro (Timer + navegacao + Settings).
- Publico: produtividade/gamificacao; fantasia leve e premium.
- Restricao: manter tema medieval e tokens atuais; apenas refinamento.
- Acessibilidade: WCAG AA.
- Plataforma: desktop (Tauri) apenas.
- Verificacao: QA manual apenas (sem nova infra de testes).

**Research Findings**:
- Stack: React 19 + Vite + TS; Tailwind com tokens/classes custom em `src/styles/globals.css` e `tailwind.config.js`.
- Layout base/tab: `src/App.tsx`.
- Paginas: `src/pages/TimerPage.tsx` e `src/pages/SettingsPage.tsx`.
- Componentes compartilhados: `src/components/shared/Button.tsx`, `src/components/shared/Card.tsx`.
- Modo low-FX: controle por `data-fx="low"` e env var `VITE_AEON_LOW_FX=1`.

### Metis Review
**Identified Gaps (addressed)**:
- Scope creep: bloquear mudancas em Stats/Quests/Tasks e logica de negocio.
- Global tokens: evitar alteracoes globais que afetem telas nao-alvo.
- Novas dependencias: proibidas sem aprovacao explicita.
- Acessibilidade: garantir estados default/hover/focus/disabled no core flow.

---

## Work Objectives

### Core Objective
Melhorar o visual e a usabilidade do core flow com ajustes de hierarquia, tipografia, espacamento e contraste, mantendo o tema medieval premium e o modo low-FX.

### Concrete Deliverables
- Refinamentos visuais aplicados ao core flow (Timer + navegacao + Settings)
- Classes utilitarias/core styling adicionadas (sem quebrar outras telas)
- Checklist de QA manual para core flow

### Definition of Done
- Core flow atualizado visualmente sem alterar logica/fluxos.
- Contraste e estados de foco atendem WCAG AA no core flow.
- `npm run build` executa com sucesso.
- `npm test` executa com sucesso.
- QA manual concluido com checklist documentado.

### Must Have
- Preservar tema medieval premium, apenas refinando.
- Manter modo low-FX e seu efeito em sombras/animacoes.
- Evitar mudanças visuais globais que impactem telas nao priorizadas.

### Must NOT Have (Guardrails)
- Nao adicionar novas dependencias (fonts, icons, libs).
- Nao alterar logica de timer, tarefas ou configuracoes.
- Nao mexer em Stats/Quests/Tasks alem de impactos indiretos inevitaveis.
- Nao remover classes existentes usadas por outras telas.

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **User wants tests**: Manual-only QA
- **Framework**: Vitest (sem novos testes obrigatorios)

### Manual QA (core flow)
Checklist minimo a ser seguido na etapa final:
- Timer: legibilidade do tempo, hierarquia dos controles, estados hover/focus.
- Navegacao: tabs claras, foco visivel, target areas adequadas.
- Settings: seccionamento, descricoes, toggles/inputs alinhados.
- Low-FX: `VITE_AEON_LOW_FX=1 npm run tauri:dev` confirma reducao de sombras/animacoes.

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately):
- Task 1: Refinar sistema visual (tokens/classes)

Wave 2 (After Wave 1):
- Task 2: Navegacao + componentes compartilhados
- Task 3: Timer page
- Task 4: Settings page

Wave 3 (After Wave 2):
- Task 5: QA manual + build/test

Critical Path: Task 1 → Task 2 → Task 3/4 → Task 5

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|----------------------|
| 1 | None | 2, 3, 4 | None |
| 2 | 1 | 3, 4 | 3, 4 |
| 3 | 2 | 5 | 4 |
| 4 | 2 | 5 | 3 |
| 5 | 3, 4 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|--------------------|
| 1 | 1 | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"]) |
| 2 | 2, 3, 4 | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"]) |
| 3 | 5 | delegate_task(category="quick", load_skills=["frontend-ui-ux"]) |

---

## TODOs

- [ ] 1. Refinar sistema visual do core flow

  **What to do**:
  - Revisar tokens e utilitarios em `src/styles/globals.css` e `tailwind.config.js`.
  - Adicionar classes utilitarias/variantes para hierarquia tipografica e espacamento do core flow.
  - Ajustar contrastes e estados de foco/hover para WCAG AA no core flow.
  - Garantir comportamento low-FX (reduzir sombras/animacoes) para novas classes.

  **Must NOT do**:
  - Nao renomear/remover tokens existentes.
  - Nao alterar tokens globais que impactem telas fora do core flow sem justificativa.
  - Nao adicionar novas dependencias (fonts/icons/libs).

  **Recommended Agent Profile**:
  - **Category**: visual-engineering
    - Reason: ajustes de UI/UX e design tokens.
  - **Skills**: ["frontend-ui-ux"]
    - frontend-ui-ux: necessario para refinamentos visuais e consistencia de design.
  - **Skills Evaluated but Omitted**:
    - playwright: verificação visual automatizada nao solicitada.
    - git-master: nao ha operacoes de git nesta tarefa.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (Sequential)
  - **Blocks**: Tasks 2, 3, 4
  - **Blocked By**: None (can start immediately)

  **References**:
  - `src/styles/globals.css` - tokens e classes existentes; definir refinamentos sem quebrar o tema.
  - `tailwind.config.js` - paleta, tipografia e sombras; respeitar o tema medieval premium.
  - `README.md` - contexto do tema e modo de performance (low-FX).

  **WHY Each Reference Matters**:
  - `src/styles/globals.css`: evitar conflitos com classes custom e modo low-FX.
  - `tailwind.config.js`: manter consistencia com a identidade visual atual.
  - `README.md`: reforca o foco em tema medieval premium e performance mode.

  **Acceptance Criteria**:
  - Novas classes/refinamentos sao aditivos e nao removem tokens existentes.
  - Estados de foco/hover/disabled do core flow atendem contraste AA.
  - Low-FX reduz sombras/animacoes para novas classes.

- [ ] 2. Atualizar navegacao e componentes compartilhados

  **What to do**:
  - Refinar layout/espacamento das tabs e do header em `src/App.tsx`.
  - Ajustar `Button` e `Card` para coerencia com novas classes do core flow.
  - Garantir estados de foco visiveis e area de clique adequada nas tabs.

  **Must NOT do**:
  - Nao alterar logica de navegacao ou estado das tabs.
  - Nao mudar a estrutura funcional de `App.tsx`.

  **Recommended Agent Profile**:
  - **Category**: visual-engineering
    - Reason: ajustes visuais em navegacao e componentes base.
  - **Skills**: ["frontend-ui-ux"]
    - frontend-ui-ux: refinamento de navegacao e consistencia visual.
  - **Skills Evaluated but Omitted**:
    - playwright: verificação visual automatizada nao solicitada.
    - git-master: nao ha operacoes de git nesta tarefa.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (Sequential start)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: Task 1

  **References**:
  - `src/App.tsx` - estrutura do header/nav/tabs.
  - `src/components/shared/Button.tsx` - padrao de botoes.
  - `src/components/shared/Card.tsx` - padrao de containers.
  - `src/styles/globals.css` - classes utilitarias e efeitos.

  **WHY Each Reference Matters**:
  - `src/App.tsx`: ponto central da navegacao; refino visual sem mexer na logica.
  - `src/components/shared/Button.tsx` e `src/components/shared/Card.tsx`: consistencia visual nas telas.
  - `src/styles/globals.css`: aplicar as novas classes do core flow.

  **Acceptance Criteria**:
  - Navegacao com hierarquia clara e foco visivel.
  - Tabs com area de clique adequada e contraste AA.
  - Componentes compartilhados refletem o refinamento visual.

- [ ] 3. Refinar visual do Timer (core)

  **What to do**:
  - Ajustar hierarquia tipografica do tempo e controles primarios.
  - Refinar espacamento entre seções e feedbacks.
  - Garantir legibilidade e contraste em estados default/hover/focus.

  **Must NOT do**:
  - Nao alterar logica do timer ou fluxos de inicio/pausa.
  - Nao mudar a estrutura de estado do componente.

  **Recommended Agent Profile**:
  - **Category**: visual-engineering
    - Reason: melhorias visuais com foco em hierarquia e clareza.
  - **Skills**: ["frontend-ui-ux"]
    - frontend-ui-ux: refinamento visual orientado a UX.
  - **Skills Evaluated but Omitted**:
    - playwright: verificação visual automatizada nao solicitada.
    - git-master: nao ha operacoes de git nesta tarefa.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 5
  - **Blocked By**: Task 2

  **References**:
  - `src/pages/TimerPage.tsx` - estrutura visual do timer.
  - `src/components/shared/Button.tsx` - padrao de botoes usados no timer.
  - `src/styles/globals.css` - classes e tokens de estilo.

  **WHY Each Reference Matters**:
  - `src/pages/TimerPage.tsx`: principal tela do core flow.
  - `src/components/shared/Button.tsx`: garantir consistencia visual nos controles.
  - `src/styles/globals.css`: aplicar refinamentos de tipografia/espacamento.

  **Acceptance Criteria**:
  - Tempo principal com hierarquia clara e legibilidade aumentada.
  - Controles primarios visivelmente destacados.
  - Contraste AA para textos e estados de foco.

- [ ] 4. Refinar visual de Settings (core)

  **What to do**:
  - Reestruturar seções e espaçamentos para leitura escaneavel.
  - Ajustar labels/descricoes com hierarquia tipografica consistente.
  - Melhorar alinhamento de toggles/inputs e estados de foco.

  **Must NOT do**:
  - Nao alterar logica de configuracoes.
  - Nao mudar persistencia ou comportamentos do app.

  **Recommended Agent Profile**:
  - **Category**: visual-engineering
    - Reason: organizacao visual e clareza de configuracoes.
  - **Skills**: ["frontend-ui-ux"]
    - frontend-ui-ux: legibilidade e hierarquia para settings.
  - **Skills Evaluated but Omitted**:
    - playwright: verificação visual automatizada nao solicitada.
    - git-master: nao ha operacoes de git nesta tarefa.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 5
  - **Blocked By**: Task 2

  **References**:
  - `src/pages/SettingsPage.tsx` - layout e componentes da tela de configuracoes.
  - `src/components/shared/Card.tsx` - agrupamento visual de seções.
  - `src/styles/globals.css` - classes utilitarias.

  **WHY Each Reference Matters**:
  - `src/pages/SettingsPage.tsx`: foco das melhorias visuais.
  - `src/components/shared/Card.tsx`: padrao visual de agrupamentos.
  - `src/styles/globals.css`: aplicacao de tokens e classes.

  **Acceptance Criteria**:
  - Secoes mais legiveis e escaneaveis.
  - Labels/descricoes com hierarquia consistente.
  - Foco visivel e contraste AA para inputs/toggles.

- [ ] 5. QA manual e verificacoes de build/test

  **What to do**:
  - Rodar `npm run build` e `npm test`.
  - Validar core flow via QA manual (Timer, navegacao, Settings).
  - Validar modo low-FX com `VITE_AEON_LOW_FX=1 npm run tauri:dev`.

  **Must NOT do**:
  - Nao adicionar novos testes obrigatorios.
  - Nao alterar scripts do `package.json`.

  **Recommended Agent Profile**:
  - **Category**: quick
    - Reason: execucao de comandos e checklist final.
  - **Skills**: ["frontend-ui-ux"]
    - frontend-ui-ux: avaliacao visual guiada.
  - **Skills Evaluated but Omitted**:
    - playwright: verificação visual automatizada nao solicitada.
    - git-master: nao ha operacoes de git nesta tarefa.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (Sequential)
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 4

  **References**:
  - `package.json` - scripts `build` e `test`.
  - `README.md` - comandos de dev/low-FX.
  - `src/App.tsx` - navegacao para verificar core flow.

  **WHY Each Reference Matters**:
  - `package.json`: comandos oficiais para build/test.
  - `README.md`: modo low-FX e fluxo de dev.
  - `src/App.tsx`: mapeia as telas do core flow.

  **Acceptance Criteria**:
  - `npm run build` -> exit code 0.
  - `npm test` -> exit code 0.
  - QA manual: core flow legivel, navegacao clara, Settings escaneavel.
  - Low-FX: sombras/animacoes reduzidas sem quebrar layout.

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2-4 | `chore(ui): refine core flow visuals` | `src/App.tsx`, `src/pages/TimerPage.tsx`, `src/pages/SettingsPage.tsx`, `src/styles/globals.css`, `src/components/shared/*` | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
npm run build
npm test
```

### Final Checklist
- [ ] Core flow visual hierarchy improved (Timer + navegacao + Settings).
- [ ] WCAG AA contraste/estados de foco no core flow.
- [ ] Low-FX reduz sombras/animacoes sem quebra visual.
- [ ] Nenhuma mudanca de logica ou novas dependencias.
