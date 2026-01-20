# Plano de Reformulação Visual Premium - Pomodore

## Objetivo

Transformar a aplicação Pomodoro em um design **premium** e **bem alinhado** mantendo a identidade Tokyo Night Terminal mas elevando para um nível visual superior através de:

- Sistema de componentes React reutilizáveis
- Micro-interações e animações sofisticadas
- Hierarquia visual aprimorada
- Gradientes e efeitos de profundidade
- Tipografia refinada
- Responsividade otimizada
- Consistência visual completa

## Análise do Estado Atual

### Pontos Positivos
- Base sólida com tema Tokyo Night bem implementado
- Tailwind CSS 3.4 com classes customizadas organizadas
- Componentes bem separados por responsabilidade
- Paleta de cores consistente
- Estrutura escalável

### Oportunidades de Melhoria
1. **Componentes CSS apenas** - Botões, Cards e Badges são classes CSS, não componentes React
2. **Animações limitadas** - Apenas `pulse-slow` e `slideIn`
3. **Emojis inconsistentes** - Misturados com lucide-react (🎯, ☕, 🌙, 🔥)
4. **Layout plano** - Falta profundidade visual e camadas
5. **Tipografia básica** - Sem hierarquia clara e tamanhos fixos
6. **Select nativo** - Mode selector usa `<select>` HTML padrão
7. **Footer fixo** - Pode causar overlapping com conteúdo

## Estratégia de Implementação

### FASE 1: Fundações (Máxima Prioridade)
**Impacto: Alto | Esforço: Médio | Tempo: ~8-11h**

#### 1.1 Expandir Design Tokens

**Arquivo:** `tailwind.config.js`

Adicionar:
- **Cores com variantes**: primary.light/lighter/dark/glow, accent.light/dark/glow, success/warning/error com variantes
- **Sombras premium**: elevation-1/2/3, glow-primary/accent/success, soft/medium/hard
- **Tipografia com line-heights**: fontSize scale de xs até 7xl, timer-sm/md/lg específicos
- **Espaçamento**: garantir scale 4px completo
- **Border radius**: sm (4px) até 2xl (24px)
- **Z-index scale**: 0, 10, 20, 30, 40, 50
- **Transition timing**: fastest (100ms), fast (150ms), normal (200ms), slow (300ms), slower (500ms)
- **Breakpoint xs**: 375px para dispositivos muito pequenos

Exemplo de cores expandidas:
```javascript
primary: {
  DEFAULT: '#7aa2f7',
  light: '#89b4fa',
  lighter: '#a9cbfe',
  dark: '#6b92e7',
  glow: 'rgba(122, 162, 247, 0.15)',
}
```

#### 1.2 Criar Componentes Base do Design System

**Novos arquivos em:** `src/components/shared/`

**Button.tsx** - Sistema completo de botões
- Variantes: primary, secondary, accent, ghost, danger
- Tamanhos: sm, md, lg, xl
- Estados: loading, disabled com spinner animado
- Animações: scale on press (0.98), ripple effect, glow expansion

**Card.tsx** - Cards premium
- Variantes: default, elevated, outlined, glass (glassmorphism)
- Hover effects: lift (translateY -4px), glow intensification
- Props: hoverable, clickable, gradient, borderGlow

**Badge.tsx** - Badges/Pills sofisticados
- Variantes com cores: primary, accent, success, warning, error
- Tamanhos: sm, md, lg
- Animações: fade-in, scale-in, pulse

**Container.tsx** - Container responsivo
- Max-width presets: sm, md, lg, xl, 2xl
- Padding responsivo

#### 1.3 Adicionar Animações e Efeitos

**Arquivo:** `src/styles/globals.css`

**Keyframes:**
```css
@keyframes fadeIn { ... }
@keyframes slideInUp { ... }
@keyframes slideInDown { ... }
@keyframes scaleIn { ... }
@keyframes bounce { ... }
@keyframes shake { ... }
@keyframes shimmer { ... }
@keyframes glow-pulse { ... }
```

**Classes Premium:**
```css
.gradient-primary { linear-gradient(135deg, #7aa2f7 0%, #bb9af7 100%) }
.gradient-text-primary { background-clip: text }
.glass-card { backdrop-blur(24px), rgba background, border subtle }
.elevation-1/2/3 { layered box-shadows }
```

---

### FASE 2: Refatoração de Páginas (Alta Prioridade)
**Impacto: Alto | Esforço: Alto | Tempo: ~15-20h**

#### 2.1 Refatorar App.tsx

**Modificações:**
- Aplicar componentes Button e Container
- Header com backdrop blur e texto com gradiente
- Tab navigation melhorada:
  - Indicador ativo com gradiente animado
  - Hover effects evidentes
  - Icons only em mobile (breakpoint xs)
- Adicionar transições entre páginas (fade + slide 300ms)
- Footer: remover `position: fixed` → estático ou auto-hide on scroll
- Substituir emoji 🍅 e ❤️ por lucide-react icons ou manter 🍅 como branding

#### 2.2 Criar Select Customizado

**Novo arquivo:** `src/components/shared/Select.tsx`

- Substituir `<select>` nativo do mode selector
- Dropdown com animação slideInDown
- Opções customizáveis com ícones
- Keyboard navigation
- Hover state com bg surface + text primary

#### 2.3 Refatorar TimerPage.tsx

**Modificações:**
- Substituir `<select>` por Select customizado
- Envolver timer area em Card glass
- Layout com Container
- Animações ao trocar modo (fadeOut → fadeIn)
- Keyboard shortcuts com visual de teclas (kbd style)

#### 2.4 Refatorar Componentes de Timer

**TimerDisplay.tsx:**
- Aplicar Card premium com glow
- Tipografia responsiva: text-timer-sm (xs), text-timer-md (md), text-timer-lg (xl)
- Adicionar `font-variant-numeric: tabular-nums`
- Melhorar animate-pulse-timer (já existe)
- Transition de cores ao mudar fase (300ms)
- Scale sutil quando running (transform: scale(1.02))

**PhaseIndicator.tsx:**
- Aplicar Badge premium
- **CRÍTICO:** Substituir emojis por lucide-react:
  - 🎯 → `<Target />` ou `<Zap />`
  - ☕ → `<Coffee />`
  - 🌙 → `<Moon />`
- Criar `src/utils/phaseIcons.ts` com mapeamento
- Bounce-in animation ao trocar fase
- Glow pulse quando running

**TimerControls.tsx:**
- Aplicar componentes Button premium
- Ripple effect ao clicar
- Melhorar layout com Stack/Grid
- Adicionar Tooltips nos botões secundários

#### 2.5 Refatorar StatsPage.tsx

**Modificações:**
- Aplicar Card premium para cada stat
- Cores temáticas: hoje (primary), semana (success), total (accent)
- **CRÍTICO:** Substituir emojis:
  - 🔥 → `<Flame />` ou `<TrendingUp />`
  - 🔒 → `<Lock />`
- Count-up animation para números (implementar em JS)
- Stagger animation ao carregar cards (delay incremental)
- Unlock animation para achievements (scale + glow)
- Loading state com Skeleton component
- Export button mais destacado

#### 2.6 Refatorar SettingsPage.tsx

**Novo componente:** `src/components/shared/Switch.tsx`

- Toggle switch animado (substituir checkbox nativo)
- Track bg transition (text-secondary → primary)
- Thumb slide animation (translate-x 200ms)

**Novo componente:** `src/components/shared/Modal.tsx`

- Modal de confirmação premium
- Overlay com blur
- Animações: fadeIn overlay, scaleIn content
- Portal rendering

**Modificações:**
- Substituir checkboxes por Switch
- Aplicar Card premium
- Danger zone com border gradient vermelho
- Modal de confirmação ao resetar

---

### FASE 3: Componentes Avançados (Média Prioridade)
**Impacto: Médio | Esforço: Médio | Tempo: ~7-10h**

#### 3.1 Componentes Auxiliares

**Novos arquivos:**
- `Input.tsx` - Input com label floating, icon, error state
- `Progress.tsx` - Barra/círculo de progresso com animação
- `Tooltip.tsx` - Tooltip com posicionamento e arrow
- `IconButton.tsx` - Botões apenas com ícone
- `Skeleton.tsx` - Loading skeletons com shimmer animation
- `Stack.tsx` / `Grid.tsx` - Layout helpers

#### 3.2 Toast Notifications

**Novos arquivos:**
- `src/components/shared/Toast.tsx`
- `src/hooks/useToast.ts`
- Context provider para toasts
- Variantes: success, error, warning, info
- Animações: slideInUp + fadeIn (entrada), fadeOut (saída)

#### 3.3 Responsividade Otimizada

**Ajustes em todos os componentes:**
- Breakpoint xs (375px) para mobile muito pequeno
- Timer display responsivo (3rem → 4.5rem → 6rem)
- Stats grid: 1 col (xs) → 2 cols (md) → 3 cols (lg)
- Tab navigation: icons only (xs) → icons + labels (md)
- Modal: full screen (xs) → centered (md)

---

### FASE 4: Polimentos e Detalhes (Baixa Prioridade)
**Impacto: Baixo-Médio | Esforço: Baixo | Tempo: ~5-7h**

#### 4.1 Micro-interações Extras
- Ripple effect em todos os botões
- Hover effects em todos os cards
- Icon bounce on hover
- Subtle animations

#### 4.2 Estados Visuais
- Empty states para StatsPage (sem dados)
- Achievement unlock animation com confetti (opcional)
- Sound effects integration (já tem soundEnabled no settings)

#### 4.3 Background Patterns
- Noise texture sutil
- Vignette effect no main content

---

## Arquivos a Modificar

### Modificações em Arquivos Existentes

1. **`tailwind.config.js`** - Expandir design tokens (cores, tipografia, sombras, espaçamento)
2. **`src/styles/globals.css`** - Adicionar keyframes, gradientes, glassmorphism, elevations
3. **`src/App.tsx`** - Aplicar componentes premium, melhorar header/tabs, redesenhar footer
4. **`src/pages/TimerPage.tsx`** - Select customizado, Card glass, animações
5. **`src/pages/StatsPage.tsx`** - Cards premium, substituir emojis, count-up animation
6. **`src/pages/SettingsPage.tsx`** - Switch toggles, Modal confirmação
7. **`src/components/timer/TimerDisplay.tsx`** - Card premium, tipografia responsiva, glow
8. **`src/components/timer/PhaseIndicator.tsx`** - Badge premium, substituir emojis, animações
9. **`src/components/timer/TimerControls.tsx`** - Button premium, ripple, tooltips

### Novos Arquivos a Criar

**Design System (src/components/shared/):**
- `Button.tsx` - Sistema de botões premium
- `Card.tsx` - Cards com variantes
- `Badge.tsx` - Badges sofisticados
- `Container.tsx` - Container responsivo
- `Select.tsx` - Select customizado
- `Switch.tsx` - Toggle switch
- `Modal.tsx` - Modal premium
- `Input.tsx` - Input customizado
- `Progress.tsx` - Barras de progresso
- `Tooltip.tsx` - Tooltips
- `IconButton.tsx` - Botões com ícone
- `Skeleton.tsx` - Loading skeletons
- `Stack.tsx` / `Grid.tsx` - Layout helpers
- `Toast.tsx` - Notificações

**Hooks:**
- `src/hooks/useToast.ts`

**Utils:**
- `src/utils/phaseIcons.ts` - Mapeamento emojis → lucide-react

**Documentação:**
- `src/components/shared/README.md` - Docs do design system

---

## Valores Concretos e Especificações

### Paleta de Cores Expandida

```javascript
colors: {
  primary: {
    DEFAULT: '#7aa2f7',
    light: '#89b4fa',
    lighter: '#a9cbfe',
    dark: '#6b92e7',
    glow: 'rgba(122, 162, 247, 0.15)',
  },
  accent: {
    DEFAULT: '#bb9af7',
    light: '#c9adfa',
    dark: '#ac87f4',
    glow: 'rgba(187, 154, 247, 0.15)',
  },
  // Similar para success, warning, error
}
```

### Sombras Premium

```javascript
boxShadow: {
  'elevation-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
  'elevation-2': '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
  'elevation-3': '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
  'glow-primary': '0 0 24px rgba(122,162,247,0.3), 0 0 48px rgba(122,162,247,0.15)',
  'glow-accent': '0 0 24px rgba(187,154,247,0.3), 0 0 48px rgba(187,154,247,0.15)',
}
```

### Tipografia Responsiva

```javascript
fontSize: {
  'timer-sm': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }],
  'timer-md': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }],
  'timer-lg': ['6rem', { lineHeight: '1', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }],
}
```

### Mapeamento de Ícones

```typescript
// src/utils/phaseIcons.ts
import { Target, Coffee, Moon } from 'lucide-react';

export const PHASE_ICONS = {
  FOCUS: Target,
  SHORT_BREAK: Coffee,
  LONG_BREAK: Moon,
} as const;
```

---

## Considerações Importantes

### Compatibilidade
- **NÃO modificar**: Zustand stores, domain logic (TimerEngine, ScoreEngine), database/SQL
- **Manter**: Toda lógica de negócio existente intacta
- **Foco**: Apenas camada visual/UI

### Performance
- Usar `transform` e `opacity` para animações (GPU-accelerated)
- Respeitar `prefers-reduced-motion`
- React.memo em componentes reutilizáveis
- Monitorar bundle size

### Acessibilidade
- Manter/melhorar `:focus-visible` states
- Adicionar ARIA labels onde necessário
- Keyboard navigation em Select, Modal, Tooltips
- Garantir contraste WCAG AA (4.5:1)
- Testar com screen reader

### Responsividade
- Mobile first approach
- Touch targets mínimos 44x44px em mobile
- Font scaling sem quebrar layout
- Testar em: xs (375px), md (768px), xl (1280px)

---

## Verificação (Como Testar)

### Visual
1. **Executar aplicação**: `npm run tauri:dev`
2. **Verificar componentes**: Todos os botões, cards, badges devem ter novo visual premium
3. **Testar animações**: Hover effects, transições, ripple effects
4. **Validar responsividade**: Redimensionar janela de 375px até 1920px

### Funcional
1. **Timer**: Iniciar, pausar, pular fase, reset - tudo deve funcionar identicamente
2. **Stats**: Carregar, exportar CSV, achievements desbloqueados
3. **Settings**: Toggles, reset data com confirmação
4. **Navegação**: Tabs, keyboard shortcuts (Space, R, S)

### Acessibilidade
1. **Navegação por teclado**: Tab através de todos os elementos
2. **Screen reader**: Testar com NVDA/VoiceOver
3. **Contraste**: Verificar texto legível em todos os backgrounds

### Performance
1. **Animações**: 60 FPS em todas as transições
2. **Bundle size**: Verificar com `npm run build` - deve ser < 500KB gzipped
3. **Lighthouse**: Score > 90 em Performance e Accessibility

### Testes Automatizados
```bash
npm run test        # Executar testes unitários
npm run test:ui     # Interface visual de testes
```

---

## Cronograma Estimado

- **FASE 1 (Fundações)**: 8-11h → 1-2 dias
- **FASE 2 (Refatoração de Páginas)**: 15-20h → 2-3 dias
- **FASE 3 (Componentes Avançados)**: 7-10h → 1-2 dias
- **FASE 4 (Polimentos)**: 5-7h → 1 dia

**Total**: 35-48 horas → **5-7 dias de trabalho dedicado**

---

## Métricas de Sucesso

✅ Interface visivelmente mais premium e moderna
✅ Hierarquia visual clara
✅ Animações fluidas (60 FPS)
✅ Consistência em todos os elementos
✅ 0 warnings de acessibilidade
✅ Bundle size < 500KB (gzipped)
✅ Performance Lighthouse > 90
✅ Responsivo em todos os breakpoints
✅ Funcionalidade 100% preservada
