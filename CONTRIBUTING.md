# Contributing to Kino Club

> **Последнее обновление:** 2026-02-17

Спасибо за интерес к проекту **Kino Club**! Мы рады любому вкладу в развитие проекта.

---

## 📋 Оглавление

- [Кодекс поведения](#кодекс-поведения)
- [Как начать](#как-начать)
- [Процесс разработки](#процесс-разработки)
- [Стандарты кода](#стандарты-кода)
- [Тестирование](#тестирование)
- [Документация](#документация)
- [Коммит-конвенция](#коммит-конвенция)
- [Pull Request процесс](#pull-request-процесс)

---

## 🤝 Кодекс поведения

Этот проект следует принципам открытости и уважения. Мы ожидаем, что все участники будут:

- Уважительно относиться друг к другу
- Конструктивно критиковать код, а не людей
- Принимать обратную связь с благодарностью
- Фокусироваться на улучшении проекта

---

## 🚀 Как начать

### 1. Fork и клонирование

```bash
# Fork репозитория через GitHub UI
# Затем клонируйте ваш fork
git clone https://github.com/YOUR_USERNAME/rutube-cinema-hub.git
cd rutube-cinema-hub

# Добавьте upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/rutube-cinema-hub.git
```

### 2. Установка зависимостей

```bash
# Убедитесь, что используете правильную версию Node.js
nvm use  # Если используете nvm (версия указана в .nvmrc)

# Установите зависимости
npm install
```

### 3. Настройка окружения

```bash
# Скопируйте .env.example в .env
cp .env.example .env

# Отредактируйте .env и добавьте свои API ключи (если нужно)
# GEMINI_API_KEY=your_key_here
# MISTRAL_API_KEY=your_key_here
```

### 4. Запуск dev-сервера

```bash
# Запустите backend
node server/index.js

# В другом терминале запустите frontend
npm run dev

# Или используйте all-in-one скрипт
npm run dev:all
```

---

## 🔧 Процесс разработки

### Создание новой ветки

Всегда создавайте новую ветку от актуальной `main`:

```bash
# Обновите main
git checkout main
git pull upstream main

# Создайте feature ветку
git checkout -b feature/your-feature-name

# Или для исправления бага
git checkout -b fix/bug-description
```

### Именование веток

- `feature/` — новая функциональность
- `fix/` — исправление бага
- `refactor/` — рефакторинг кода
- `docs/` — изменения в документации
- `test/` — добавление или улучшение тестов
- `chore/` — обслуживание (dependencies, configs)

Примеры:

- `feature/add-video-quality-selector`
- `fix/circuit-breaker-timeout`
- `refactor/simplify-rutube-service`
- `docs/update-architecture-diagrams`

---

## 📝 Стандарты кода

### TypeScript

- ✅ **Используйте TypeScript** для всех новых файлов
- ✅ **Strict mode** — не отключайте `strict: true`
- ❌ **Избегайте `any`** — используйте `unknown` или правильные типы
- ✅ **Экспортируйте типы** — делайте типы переиспользуемыми

```typescript
// ❌ Плохо
function processData(data: any) {
  return data.value;
}

// ✅ Хорошо
interface DataItem {
  value: string;
  id: number;
}

function processData(data: DataItem): string {
  return data.value;
}
```

### React компоненты

- ✅ **Используйте функциональные компоненты** с хуками
- ✅ **React.FC** — явно типизируйте props
- ✅ **React.memo** — для компонентов с частыми ререндерами
- ✅ **Именуйте компоненты** — не используйте анонимные функции

```typescript
// ✅ Хорошо
import React from 'react';

interface VideoCardProps {
  video: RutubeVideo;
  onClick: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = React.memo(({ video, onClick }) => {
  return (
    <div onClick={onClick}>
      <h3>{video.title}</h3>
    </div>
  );
});

VideoCard.displayName = 'VideoCard';
```

### Хуки

- ✅ **Один хук = одна ответственность**
- ✅ **Префикс `use`** — все хуки начинаются с `use`
- ✅ **Возвращайте объект** — вместо массива (для именованных значений)
- ✅ **Документируйте** — добавляйте JSDoc комментарии

```typescript
/**
 * Hook for managing video filtering and sorting
 * @returns Object with filtered videos and filter controls
 */
export function useVideoFilters(videos: RutubeVideo[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');

  const filteredVideos = useMemo(() => {
    return videos
      .filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => sortVideos(a, b, sortBy));
  }, [videos, searchQuery, sortBy]);

  return {
    filteredVideos,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
  };
}
```

### Стилизация

- ✅ **TailwindCSS** — используйте утилитарные классы
- ✅ **Группировка классов** — логически группируйте классы
- ✅ **Адаптивность** — используйте responsive модификаторы

```tsx
<div
  className="
  flex flex-col gap-4
  p-4 rounded-lg
  bg-zinc-900 border border-zinc-800
  hover:bg-zinc-800 transition-colors
  md:flex-row md:gap-6
"
>
  {/* content */}
</div>
```

---

## 🧪 Тестирование

### Обязательные тесты

Для **каждого нового feature** добавьте тесты:

```bash
# Запустите все тесты
npm test

# Запустите в watch mode
npm run test:watch

# Проверьте покрытие
npm run test:coverage
```

### Unit тесты (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoCard } from './VideoCard';

describe('VideoCard', () => {
  it('should render video title', () => {
    const video = { id: '1', title: 'Test Video', thumbnail_url: '' };
    render(<VideoCard video={video} onClick={() => {}} />);

    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });
});
```

### Integration тесты

```typescript
import { describe, it, expect } from 'vitest';
import { fetchRutubeVideos } from './rutubeService';

describe('rutubeService', () => {
  it('should fetch videos from Rutube API', async () => {
    const videos = await fetchRutubeVideos('channel_id');

    expect(videos).toBeInstanceOf(Array);
    expect(videos.length).toBeGreaterThan(0);
  });
});
```

---

## 📚 Документация

### Когда обновлять документацию

Обновите документацию при:

- ✅ Добавлении новой функциональности
- ✅ Изменении API endpoints
- ✅ Архитектурных изменениях
- ✅ Изменении process разработки

### Какие файлы обновлять

| Изменение          | Документ                        |
| ------------------ | ------------------------------- |
| Новый компонент    | `docs/ARCHITECTURE.md`          |
| Новый хук          | `docs/STATE_MANAGEMENT.md`      |
| Новый API endpoint | `README.md` + создать ADR       |
| Оптимизация        | `docs/PERFORMANCE.md`           |
| Новые тесты        | `docs/TESTING_REPORT_STAGE5.md` |
| Изменение security | `docs/PROXY_SECURITY.md`        |

### JSDoc комментарии

Добавляйте JSDoc для:

- Всех экспортируемых функций
- Всех хуков
- Сложных утилит

```typescript
/**
 * Fetches videos from a Rutube channel using multiple fallback strategies
 * @param channelId - The Rutube channel identifier
 * @param options - Optional fetch configuration
 * @returns Promise resolving to array of RutubeVideo objects
 * @throws Error if all strategies fail
 */
export async function fetchChannelVideos(
  channelId: string,
  options?: FetchOptions
): Promise<RutubeVideo[]> {
  // implementation
}
```

---

## 💬 Коммит-конвенция

Используем [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Типы коммитов

- `feat:` — новая функциональность
- `fix:` — исправление бага
- `refactor:` — рефакторинг кода
- `test:` — добавление или изменение тестов
- `docs:` — изменения в документации
- `style:` — форматирование кода (без изменения логики)
- `chore:` — обслуживание (dependencies, configs)
- `perf:` — оптимизация производительности

### Примеры

```bash
feat(video-card): add lazy loading for thumbnails

Implemented lazy loading using native loading="lazy" attribute
to improve initial page load performance.

Closes #123

---

fix(circuit-breaker): prevent infinite retry loop

Added max retry limit to circuit breaker to prevent infinite
loops when service is completely down.

Fixes #456

---

refactor(hooks): extract useVideoFilters from useAppLogic

Separated video filtering logic into dedicated hook for better
reusability and testing.

---

docs(architecture): update component hierarchy diagram

Added new VideoModal component to architecture documentation
with updated Mermaid diagram.
```

---

## 🔀 Pull Request процесс

### 1. Перед созданием PR

Убедитесь, что:

```bash
# Код проходит линтинг
npm run lint

# Все тесты проходят
npm test

# Сборка успешна
npm run build

# Нет TypeScript ошибок
npm run typecheck
```

### 2. Создание PR

- ✅ **Используйте понятное название** — следуйте conventional commits
- ✅ **Заполните описание** — что, зачем, как
- ✅ **Добавьте screenshots** — для UI изменений
- ✅ **Линкуйте issues** — используйте `Closes #123` или `Fixes #456`

### Шаблон PR описания

```markdown
## Описание

Краткое описание изменений и их цель.

## Тип изменений

- [ ] Bug fix (исправление бага)
- [ ] New feature (новая функциональность)
- [ ] Breaking change (изменения, ломающие совместимость)
- [ ] Documentation update (обновление документации)

## Как было протестировано

Опишите, как вы тестировали изменения:

- Запустил unit тесты
- Вручную протестировал на localhost
- Проверил на разных разрешениях экрана

## Checklist

- [ ] Код следует стилю проекта
- [ ] Добавлены/обновлены тесты
- [ ] Все тесты проходят
- [ ] Обновлена документация
- [ ] Добавлены JSDoc комментарии
- [ ] Нет console.log в production коде
```

### 3. Code Review процесс

- 👀 **Ожидайте review** — минимум 1 одобрение
- 💬 **Отвечайте на комментарии** — конструктивно обсуждайте
- ✏️ **Вносите правки** — если требуется
- ✅ **Получите одобрение** — затем merge

### 4. После merge

```bash
# Обновите вашу локальную main
git checkout main
git pull upstream main

# Удалите feature ветку
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

---

## 🐛 Сообщение о багах

### Используйте GitHub Issues

Для сообщения о баге создайте Issue с:

1. **Описание бага** — что происходит
2. **Шаги для воспроизведения** — как повторить
3. **Ожидаемое поведение** — что должно быть
4. **Скриншоты** — если UI баг
5. **Окружение** — OS, браузер, Node.js версия

### Шаблон Bug Report

```markdown
**Описание бага**
Краткое описание проблемы.

**Шаги для воспроизведения**

1. Перейти на '...'
2. Кликнуть на '...'
3. Скроллить до '...'
4. Увидеть ошибку

**Ожидаемое поведение**
Описание того, что должно происходить.

**Скриншоты**
Если применимо, добавьте скриншоты.

**Окружение:**

- OS: [e.g. macOS 14, Ubuntu 22.04]
- Browser: [e.g. Chrome 120, Firefox 121]
- Node.js: [e.g. 18.19.0]

**Дополнительный контекст**
Любая дополнительная информация.
```

---

## 💡 Предложение новых фич

### Используйте GitHub Discussions или Issues

Для предложения новой функциональности:

1. **Поищите существующие** — возможно, уже обсуждается
2. **Создайте Discussion/Issue** — опишите идею
3. **Дождитесь feedback** — обсудите с мейнтейнерами
4. **Получите одобрение** — затем начинайте работу

### Шаблон Feature Request

```markdown
**Описание фичи**
Четкое описание того, что вы хотите добавить.

**Проблема, которую решает**
Какую проблему решает эта фича?

**Предлагаемое решение**
Как вы видите реализацию?

**Альтернативы**
Рассматривали ли другие подходы?

**Дополнительный контекст**
Примеры из других проектов, mockups, etc.
```

---

## 🎓 Полезные ресурсы

### Документация проекта

- [CODE_REVIEW.md](docs/CODE_REVIEW.md) — детальный код-ревью
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — архитектура проекта
- [STATE_MANAGEMENT.md](docs/STATE_MANAGEMENT.md) — управление состоянием
- [TYPE_SYSTEM.md](docs/TYPE_SYSTEM.md) — система типов
- [TESTING_REPORT_STAGE5.md](docs/TESTING_REPORT_STAGE5.md) — тестирование

### Технологии

- [React 18 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Vitest](https://vitest.dev/)
- [Zod](https://zod.dev/)

### Инструменты

- [Conventional Commits](https://www.conventionalcommits.org/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Docker Documentation](https://docs.docker.com/)

---

## 📞 Контакты

Если у вас есть вопросы:

- 💬 GitHub Discussions — для общих вопросов
- 🐛 GitHub Issues — для багов и фич
- 📧 Email — [контакт мейнтейнера]

---

## 🙏 Благодарности

Спасибо всем контрибьюторам, которые помогают улучшать проект!

---

**Happy coding! 🚀**
