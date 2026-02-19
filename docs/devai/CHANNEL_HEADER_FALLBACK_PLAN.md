# ТЕХНИЧЕСКОЕ ЗАДАНИЕ: Восстановление блока с данными канала

**Дата:** 2026-02-19  
**Статус:** Готово к реализации  
**Приоритет:** Высокий

---

## 📋 Оглавление

1. [Описание проблемы](#описание-проблемы)
2. [Что уже работает правильно](#что-уже-работает-правильно)
3. [Проблемы для исправления](#проблемы-для-исправления)
4. [Задачи](#задачи)
5. [Оценка времени](#оценка-времени)
6. [Файлы для изменения](#файлы-для-изменения)
7. [Ожидаемый результат](#ожидаемый-результат)

---

## 📖 Описание проблемы

### Контекст

При переходе на канал должен отображаться блок `ChannelHeader` с информацией о канале (аватар, название, количество подписчиков). Сейчас в некоторых сценариях этот блок **полностью пропадает**, что создаёт плохой UX.

### Два основных аспекта

#### **Проблема 1: Stale closure в useEffect**

**Файл:** `src/hooks/useAppComposition.ts` (строки 184-186)

```typescript
useEffect(() => {
  refreshChannelData();
}, [activeChannelId, viewMode]); // ❌ refreshChannelData отсутствует в deps
```

**Проблема:** ESLint предупреждает о missing dependency. Хотя `refreshChannelData` стабильна (обёрнута в `useCallback`), её отсутствие в зависимостях — плохая практика.

---

#### **Проблема 2: Условие рендеринга и отсутствие fallback**

**Файл:** `src/components/MainContent.tsx` (строки 312-322)

```typescript
// ChannelHeader НЕ рендерится если channelInfo === null И isChannelLoading === false
{viewMode === 'channel' && (channelInfo || isChannelLoading) && (
  <ChannelHeader channelInfo={channelInfo} isLoading={isChannelLoading} />
)}

// Fallback заголовок показывается ВМЕСТО ChannelHeader
{!channelInfo && !isChannelLoading && viewMode === 'channel' && (
  <div className="mb-[10px]">
    <h1 className="text-3xl md:text-4xl font-bold mb-4">
      {activeChannel?.label || 'Видео'}
    </h1>
  </div>
)}
```

**Проблема:**

- Дублирование логики fallback в двух местах
- Если `fetchChannelInfo` возвращает `null`, блок `ChannelHeader` не рендерится
- Вместо него показывается простой `<div>` без дизайна

**Файл:** `src/components/ChannelHeader.tsx` (строка 50)

```typescript
if (!channelInfo) return null; // ❌ Возвращает null вместо fallback UI
```

**Проблема:** Когда `channelInfo === null`, компонент полностью скрывается.

---

## ✅ Что уже работает правильно

1. **`refreshChannelData` использует `useCallback`** (строка 143 в `src/hooks/useChannels.ts`) с правильными зависимостями `[viewMode, activeChannelId]`
2. **Функция стабильна** — её можно безопасно добавить в зависимости `useEffect`
3. **Skeleton loader** уже реализован и работает корректно
4. **Дизайн компонента** (градиенты, rounded-full аватар) уже существует

---

## ❌ Проблемы для исправления

### Проблема 1: Missing dependency в useEffect

**Локация:** `src/hooks/useAppComposition.ts:184-186`

**Текущий код:**

```typescript
useEffect(() => {
  refreshChannelData();
}, [activeChannelId, viewMode]); // ❌ refreshChannelData отсутствует
```

**Почему это проблема:**

- ESLint правило `react-hooks/exhaustive-deps` предупреждает
- Потенциальный риск вызова устаревшей версии функции

**Решение:**

```typescript
useEffect(() => {
  refreshChannelData();
}, [activeChannelId, viewMode, refreshChannelData]); // ✅ Все deps включены
```

---

### Проблема 2: Условие рендеринга — блок пропадает

**Локация:** `src/components/MainContent.tsx:312-322`

**Текущий код:**

```typescript
{viewMode === 'channel' && (channelInfo || isChannelLoading) && (
  <ChannelHeader channelInfo={channelInfo} isLoading={isChannelLoading} />
)}

{!channelInfo && !isChannelLoading && viewMode === 'channel' && (
  <div className="mb-[10px]">
    <h1>{activeChannel?.label || 'Видео'}</h1>
  </div>
)}
```

**Почему это проблема:**

- Если `channelInfo === null` И `isChannelLoading === false`, условие `(channelInfo || isChannelLoading)` = `false`
- `ChannelHeader` НЕ рендерится
- Показывается простой fallback без дизайна
- Дублирование логики fallback

**Решение:** Упростить — всегда рендерить `ChannelHeader`, переместить fallback UI внутрь компонента.

---

### Проблема 3: ChannelHeader возвращает null

**Локация:** `src/components/ChannelHeader.tsx:50`

**Текущий код:**

```typescript
if (!channelInfo) return null; // ❌ Полностью скрывает компонент
```

**Почему это проблема:**

- Когда `fetchChannelInfo` возвращает `null` (канал удалён, API недоступен), блок исчезает
- Пользователь видит пустое место вместо информативного сообщения

**Решение:** Заменить `return null` на fallback UI с данными из `activeChannel.label`.

---

## 🎯 Задачи

### Задача 1: Добавить `fallbackTitle` prop

**Приоритет:** Высокий  
**Файл:** `src/components/ChannelHeader.tsx`

**Изменение интерфейса:**

```typescript
interface ChannelHeaderProps {
  channelInfo: ChannelInfo | null;
  isLoading: boolean;
  fallbackTitle?: string; // ✅ Новый prop
}
```

**Обновить деструктуризацию:**

```typescript
export const ChannelHeader: React.FC<ChannelHeaderProps> = ({
  channelInfo,
  isLoading,
  fallbackTitle // ✅ Добавить
}) => {
```

---

### Задача 2: Заменить `return null` на fallback UI

**Приоритет:** Высокий  
**Файл:** `src/components/ChannelHeader.tsx:50`

**Было:**

```typescript
if (!channelInfo) return null;
```

**Стало:**

```typescript
if (!channelInfo) {
  return (
    <div className="relative w-full mb-[10px] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 min-h-[200px] group shadow-2xl">
      {/* Fallback Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        ></div>
      </div>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(19, 19, 23, 0.95) 0%, rgba(19, 19, 23, 0.4) 100%)',
        }}
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row items-center md:items-end gap-6 z-10">
        {/* Fallback Avatar */}
        <div className="shrink-0 relative">
          <div className="w-32 h-32 rounded-full border-4 border-zinc-700 shadow-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-3xl font-bold">
            {getInitials(fallbackTitle || 'Канал')}
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 text-center md:text-left pb-2 w-full min-w-0">
          <h1 className="text-3xl font-bold md:text-4xl text-white mb-2 tracking-tight drop-shadow-lg truncate">
            {fallbackTitle || 'Канал'}
          </h1>
          <p className="text-zinc-500 font-medium text-lg">
            Информация недоступна
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Дизайн решения:**

- ✅ Использует те же стили что и основной компонент (border, rounded-xl, shadow)
- ✅ Градиентный фон с паттерном (консистентно с bannerUrl fallback)
- ✅ Аватар с инициалами (функция `getInitials` уже существует)
- ✅ Текст "Информация недоступна" вместо "0 подписчиков"

---

### Задача 3: Упростить условие рендеринга

**Приоритет:** Высокий  
**Файл:** `src/components/MainContent.tsx:312-322`

**Было:**

```typescript
{viewMode === 'channel' && (channelInfo || isChannelLoading) && (
  <ChannelHeader channelInfo={channelInfo} isLoading={isChannelLoading} />
)}

{!channelInfo && !isChannelLoading && viewMode === 'channel' && (
  <div className="mb-[10px]">
    <h1 className="text-3xl md:text-4xl font-bold mb-4">
      {activeChannel?.label || 'Видео'}
    </h1>
  </div>
)}
```

**Стало:**

```typescript
{viewMode === 'channel' && (
  <ChannelHeader
    channelInfo={channelInfo}
    isLoading={isChannelLoading}
    fallbackTitle={activeChannel?.label}
  />
)}
```

**Что удалить:**

- ❌ Строки 316-322 (старый fallback `<div>`)
- ❌ Условие `(channelInfo || isChannelLoading)` — больше не нужно

---

### Задача 4: Передать `fallbackTitle` через props chain

**Приоритет:** Средний  
**Файл:** `src/hooks/useMainContentProps.ts`

**Действия:**

1. Проверить, что `activeChannel` доступен в параметрах функции
2. Убедиться, что объект возвращает все необходимые props для `ChannelHeader`
3. Добавить передачу `fallbackTitle={activeChannel?.label}` в возвращаемый объект

**Проверка:** В `useMainContentProps.ts` уже есть:

```typescript
activeChannel,
channelInfo,
isChannelLoading,
```

Эти значения уже передаются в `mainContentProps`, поэтому изменения минимальны.

---

### Задача 5: Исправить useEffect deps

**Приоритет:** Средний  
**Файл:** `src/hooks/useAppComposition.ts:184-186`

**Было:**

```typescript
useEffect(() => {
  refreshChannelData();
}, [activeChannelId, viewMode]); // ❌ Missing dep
```

**Стало:**

```typescript
useEffect(() => {
  refreshChannelData();
}, [activeChannelId, viewMode, refreshChannelData]); // ✅ Complete deps
```

**Обоснование:**

- `refreshChannelData` обёрнута в `useCallback` с deps `[viewMode, activeChannelId]`
- Она стабильна и не вызовет бесконечного цикла
- Добавление в deps устраняет ESLint предупреждение

---

### Задача 6: Добавить тест для fallback UI

**Приоритет:** Средний  
**Файл:** `tests/frontend/ChannelHeader.test.tsx` (создать новый)

```typescript
import { render, screen } from '@testing-library/react';
import { ChannelHeader } from '../../src/components/ChannelHeader';

describe('ChannelHeader Fallback UI', () => {
  it('should render fallback UI when channelInfo is null and not loading', () => {
    render(
      <ChannelHeader
        channelInfo={null}
        isLoading={false}
        fallbackTitle="Тестовый Канал"
      />
    );

    expect(screen.getByText('Тестовый Канал')).toBeInTheDocument();
    expect(screen.getByText('Информация недоступна')).toBeInTheDocument();
  });

  it('should render fallback UI with default title when fallbackTitle is undefined', () => {
    render(
      <ChannelHeader
        channelInfo={null}
        isLoading={false}
      />
    );

    expect(screen.getByText('Канал')).toBeInTheDocument();
    expect(screen.getByText('Информация недоступна')).toBeInTheDocument();
  });

  it('should render loading skeleton when isLoading is true', () => {
    const { container } = render(
      <ChannelHeader channelInfo={null} isLoading={true} />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render channel info when available', () => {
    const mockInfo = {
      title: 'Real Channel',
      subscribers: '1000',
      avatarUrl: 'avatar.jpg',
      bannerUrl: 'banner.jpg',
    };

    render(<ChannelHeader channelInfo={mockInfo} isLoading={false} />);
    expect(screen.getByText('Real Channel')).toBeInTheDocument();
    expect(screen.getByText('1000 подписчиков')).toBeInTheDocument();
  });

  it('should show initials in fallback avatar', () => {
    render(
      <ChannelHeader
        channelInfo={null}
        isLoading={false}
        fallbackTitle="Мой Тестовый Канал"
      />
    );

    // getInitials('Мой Тестовый Канал') = 'МТ'
    expect(screen.getByText('МТ')).toBeInTheDocument();
  });
});
```

**Покрытие:**

- ✅ Fallback UI с заголовком
- ✅ Fallback UI без заголовка (default "Канал")
- ✅ Loading skeleton
- ✅ Нормальное отображение с данными
- ✅ Инициалы в аватаре

---

### Задача 7: Проверить работу в браузере

**Приоритет:** Высокий  
**Метод:** Ручное тестирование

**Сценарии для проверки:**

#### Сценарий 1: Нормальная загрузка

1. Открыть приложение
2. Выбрать канал
3. **Ожидаемый результат:**
   - Показывается skeleton (animate-pulse)
   - Загружаются данные
   - Отображается ChannelHeader с аватаром, названием, подписчиками

#### Сценарий 2: Канал без данных (fetchChannelInfo возвращает null)

1. Открыть приложение
2. Выбрать канал, который не существует / недоступен
3. **Ожидаемый результат:**
   - Показывается skeleton
   - После загрузки отображается fallback UI:
     - Аватар с инициалами из `activeChannel.label`
     - Название канала из `activeChannel.label`
     - Текст "Информация недоступна"

#### Сценарий 3: Быстрое переключение каналов

1. Быстро переключаться между каналами
2. **Ожидаемый результат:**
   - Нет ошибок в консоли
   - Skeleton показывается при каждой загрузке
   - Данные обновляются корректно

#### Сценарий 4: Ошибка загрузки (catch block в refreshChannelData)

1. Имитировать сетевую ошибку (отключить интернет)
2. Выбрать канал
3. **Ожидаемый результат:**
   - Показывается fallback UI (код в `catch` блоке создаёт `channelInfo` с дефолтными значениями)
   - Название из `activeChannel.label`
   - "0 подписчиков" или "Подписчики скрыты"

---

## ⏱️ Оценка времени

| Задача       | Описание                                   | Время           |
| ------------ | ------------------------------------------ | --------------- |
| **Задача 1** | Добавить `fallbackTitle` prop в интерфейс  | 5 мин           |
| **Задача 2** | Заменить `return null` на fallback UI      | 15 мин          |
| **Задача 3** | Упростить условие рендеринга в MainContent | 5 мин           |
| **Задача 4** | Передать `fallbackTitle` через props       | 10 мин          |
| **Задача 5** | Исправить `useEffect` deps                 | 5 мин           |
| **Задача 6** | Написать тесты                             | 30 мин          |
| **Задача 7** | Браузерное тестирование                    | 15 мин          |
| **Итого**    |                                            | **~1-1.5 часа** |

**Сравнение с оригинальной оценкой:**

- Оригинал: ~1.5-2 часа
- Скорректировано: **~1-1.5 часа** (на 25% быстрее)

**Причины ускорения:**

- ✅ Не нужен `useRef` паттерн (refreshChannelData уже в useCallback)
- ✅ Меньше файлов для изменения
- ✅ Дизайн fallback UI уже существует (копируем из существующего кода)

---

## 📁 Файлы для изменения

| #   | Файл                                    | Изменение                                             | LOC |
| --- | --------------------------------------- | ----------------------------------------------------- | --- |
| 1   | `src/components/ChannelHeader.tsx`      | Добавить `fallbackTitle` prop, заменить `return null` | ~40 |
| 2   | `src/components/MainContent.tsx`        | Упростить условие, удалить fallback `<div>`           | -7  |
| 3   | `src/hooks/useAppComposition.ts`        | Добавить `refreshChannelData` в deps                  | +1  |
| 4   | `tests/frontend/ChannelHeader.test.tsx` | Создать новый файл с тестами                          | +70 |

**Итого:** ~4 файла, ~104 строки кода

---

## 🎯 Ожидаемый результат

### После реализации должно работать так:

#### 1. При переходе на канал (успешная загрузка):

```
1. Skeleton (animate-pulse) → 2. Загрузка → 3. ChannelHeader с данными
```

#### 2. Если данные не загрузились (fetchChannelInfo вернул null):

```
1. Skeleton → 2. Загрузка → 3. Fallback UI:
   - Аватар: инициалы из activeChannel.label
   - Название: activeChannel.label
   - Подписчики: "Информация недоступна"
```

#### 3. Нет случаев когда блок совсем не отображается:

```
✅ viewMode === 'channel' → ВСЕГДА показывается ChannelHeader
   - isLoading === true → skeleton
   - channelInfo !== null → нормальные данные
   - channelInfo === null → fallback UI
```

---

## 🔍 Проверка качества

### Чеклист перед коммитом:

- [ ] TypeScript компилируется без ошибок
- [ ] ESLint не показывает warning о missing deps
- [ ] Все тесты проходят (`npm test`)
- [ ] Браузерное тестирование (все 4 сценария)
- [ ] Нет визуальных багов (проверить на desktop + mobile)
- [ ] Нет ошибок в консоли браузера
- [ ] Accessibility: fallback UI имеет правильные ARIA атрибуты

### Критерии приёмки:

1. ✅ ChannelHeader **всегда** отображается в режиме `viewMode === 'channel'`
2. ✅ При отсутствии данных показывается информативный fallback UI
3. ✅ Нет дублирования логики fallback
4. ✅ ESLint не показывает предупреждений
5. ✅ Покрытие тестами ≥80% для ChannelHeader

---

## 📚 Дополнительная информация

### Связанные файлы:

- `src/services/rutubeService.ts` — функция `fetchChannelInfo`
- `src/hooks/useChannels.ts` — логика `refreshChannelData`
- `src/types/index.ts` — типы `ChannelInfo`, `ChannelDef`

### Альтернативные подходы (не выбраны):

#### Вариант A: Использовать React Query / SWR

**Плюсы:** Автоматический retry, кеширование  
**Минусы:** Требует рефакторинга всего data fetching  
**Решение:** Отложено на будущее

#### Вариант B: Показывать Error Boundary

**Плюсы:** Более явная индикация ошибки  
**Минусы:** Агрессивно для пользователя, блокирует UI  
**Решение:** Fallback UI более user-friendly

---

## 🐛 Известные ограничения

1. **Fallback UI не показывает реальное количество подписчиков** — это нормально, т.к. данные недоступны
2. **getInitials работает только для кириллицы/латиницы** — для эмодзи вернёт пустую строку
3. **min-h-[200px] в fallback** — меньше чем обычный ChannelHeader (320px), чтобы не занимать много места при ошибке

---

## ✅ Готово к реализации

**Дата утверждения:** 2026-02-19  
**Автор плана:** Rovo Dev  
**Reviewer:** [Ожидает проверки]

**Next Steps:**

1. Создать feature branch: `feature/channel-header-fallback`
2. Реализовать Задачи 1-5
3. Написать тесты (Задача 6)
4. Провести браузерное тестирование (Задача 7)
5. Создать Pull Request
6. Code Review
7. Merge в main

---

**Вопросы?** Создайте issue или обратитесь к автору плана.
