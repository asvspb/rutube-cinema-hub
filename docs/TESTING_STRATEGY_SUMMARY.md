# 📋 Краткая справка по стратегии тестирования

## 📄 Основной документ

См. **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)** для полного плана

---

## 🎯 Быстрый старт

### Текущее состояние

- ✅ 107 тестов (101 passed, 6 failed)
- ⚠️ Общее покрытие: ~30%
- 🔴 Критичные пробелы: Services (40%), Hooks (33%), Components (5.5%)

### Первые шаги

1. **Исправить failing тесты** (Неделя 1)

   ```bash
   npx vitest run
   ```

2. **Покрыть критичные Services** (Недели 2-3)
   - `tests/frontend/rutubeService.test.ts` ⭐ ПРИОРИТЕТ
   - `tests/frontend/llmService.test.ts`

3. **Покрыть Core Hooks** (Недели 4-5)
   - `tests/frontend/useAppLogic.test.ts`
   - `tests/frontend/useChannels.test.ts`
   - `tests/frontend/useVideoLogic.test.ts`

---

## 📊 Целевые метрики

| Компонент     | Сейчас   | Цель     |
| ------------- | -------- | -------- |
| Services      | 40%      | 90%      |
| Hooks         | 33%      | 85%      |
| Components    | 5.5%     | 75%      |
| Server Routes | 60%      | 85%      |
| **Общее**     | **~30%** | **80%+** |

---

## 🚀 Приоритеты

### 🔴 HIGH (Недели 1-6)

1. Исправить failing тесты
2. `rutubeService.test.ts` (1123 строки!)
3. `llmService.test.ts`
4. Core Hooks (useAppLogic, useChannels, useVideoLogic)
5. Server Routes (AI, Health, Logs)

### 🟡 MEDIUM (Недели 7-12)

1. Модальные окна (9 компонентов)
2. Основные UI компоненты (8 компонентов)
3. Integration тесты

### 🟢 LOW (Недели 13-15)

1. Вспомогательные Hooks
2. E2E тесты (Playwright)

---

## 🛠️ Команды

```bash
# Запустить все тесты
npm test

# Frontend тесты с покрытием
npx vitest run --coverage

# Backend тесты
npm run test:api

# Watch mode (для разработки)
npx vitest

# Конкретный файл
npx vitest tests/frontend/useChannels.test.ts

# Посмотреть coverage отчет
open coverage/index.html
```

---

## 📋 Чеклист для нового теста

- [ ] Тест изолирован
- [ ] Используются моки для внешних зависимостей
- [ ] Cleanup выполняется (beforeEach/afterEach)
- [ ] Тестируются граничные случаи
- [ ] Тестируются ошибки
- [ ] Понятное название теста
- [ ] AAA паттерн (Arrange, Act, Assert)
- [ ] Тест проходит отдельно и в suite

---

## 🎓 Best Practices

### Naming

```typescript
// ❌ Плохо
it('test 1', () => {});

// ✅ Хорошо
it('should load videos when channel is selected', () => {});
```

### AAA Pattern

```typescript
it('should add channel', () => {
  // Arrange
  const channel = { id: '1', label: 'Test' };

  // Act
  const result = addChannel(channel);

  // Assert
  expect(result).toContain(channel);
});
```

### Изоляция

```typescript
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
```

---

## 📚 Ресурсы

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Полный план](./TESTING_STRATEGY.md)

---

## ✅ Критерии успеха MVP

- ✅ Все тесты зеленые (0 failed)
- ✅ Services покрытие > 85%
- ✅ Core Hooks покрытие > 85%
- ✅ Server Routes покрытие > 85%
- ✅ **Общее покрытие > 70%**

**Время реализации MVP:** 6 недель
