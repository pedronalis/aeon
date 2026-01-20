# Sistema de Quests

O Pomodore inclui um sistema robusto de quests diárias e semanais que recompensam consistência e engajamento.

## Visão Geral

- **Quests Diárias**: Resetam todo dia, fornecem XP bônus
- **Quests Semanais**: Resetam toda segunda-feira, fornecem maior XP bônus
- **Auto-geração**: Quests são criadas automaticamente quando necessário
- **Integração**: Progresso atualizado automaticamente ao completar focos

## Quests Diárias

### 1. Ritual Diário
- **Objetivo**: Complete 3 focos hoje
- **XP Recompensa**: 30 XP

### 2. Maratonista
- **Objetivo**: Acumule 100 minutos de foco hoje
- **XP Recompensa**: 40 XP

### 3. Madrugador
- **Objetivo**: Complete um foco antes das 9h
- **XP Recompensa**: 25 XP

## Quests Semanais

### 1. Guerreiro da Semana
- **Objetivo**: Complete 20 focos esta semana
- **XP Recompensa**: 100 XP

### 2. Semana Perfeita
- **Objetivo**: Complete pelo menos 1 foco em cada dia da semana (7 dias únicos)
- **XP Recompensa**: 150 XP

## Arquitetura

### Domain Layer
- `QuestEngine.generateDailyQuests()`
- `QuestEngine.generateWeeklyQuests()`  
- `QuestEngine.getWeekStart()`
- `QuestEngine.isEarlyBirdFocus()`

### Store Layer
- `useQuestsStore.loadQuests()`
- `useQuestsStore.updateQuestProgress()`
- `useQuestsStore.updatePerfectWeekProgress()`

### Integração Automática
Quando um foco é completado:
1. daily_3_focuses: +1
2. daily_100_minutes: +minutos
3. daily_early_bird: +1 (se antes das 9h)
4. weekly_20_focuses: +1
5. weekly_perfect_week: recalcula dias únicos

## XP Rewards

### Por Dia (máximo)
95 XP com todas as 3 quests diárias completas

### Por Semana (máximo)  
250 XP com as 2 quests semanais completas

### Total Semanal
Até 915 XP (95×7 + 250 weekly)
