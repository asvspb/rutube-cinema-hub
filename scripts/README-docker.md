# Docker Scripts Documentation

## 📦 Скрипты для управления Docker

### 1. `docker-rebuild-full.sh` — Полная очистка и пересборка

**Что делает:**

- Останавливает все контейнеры
- Удаляет контейнеры, сети и тома проекта
- Удаляет Docker образы проекта
- Очищает кэш Docker build
- (Опционально) Выполняет глубокую очистку всей Docker системы
- Проверяет наличие `.env` файла
- Собирает образы с `--no-cache`
- Запускает контейнеры

**Использование:**

```bash
# Полная пересборка с интерактивными подтверждениями
./scripts/docker-rebuild-full.sh

# Только очистка (без сборки и запуска)
./scripts/docker-rebuild-full.sh --skip-build
```

**Когда использовать:**

- Первое развертывание проекта
- Критические проблемы с Docker образами
- После крупных изменений в Dockerfile
- Для освобождения места на диске

---

### 2. `docker-rebuild-quick.sh` — Быстрая пересборка

**Что делает:**

- Останавливает контейнеры (`docker-compose down -v`)
- Удаляет только образы проекта
- Очищает кэш сборки
- Собирает с `--no-cache`
- Запускает контейнеры

**Использование:**

```bash
./scripts/docker-rebuild-quick.sh
```

**Когда использовать:**

- Обычная пересборка при разработке
- Когда изменения не применяются в контейнере
- Быстрое обновление после изменений в коде

---

### 3. npm скрипты

Доступны через `npm run`:

| Команда                       | Описание                                           |
| ----------------------------- | -------------------------------------------------- |
| `npm run docker:rebuild`      | Быстрая пересборка (как `docker-rebuild-quick.sh`) |
| `npm run docker:rebuild:full` | Полная очистка и пересборка                        |
| `npm run docker:clean`        | Только очистка (down + prune)                      |

---

## 🔧 Полезные Docker команды

```bash
# Статус контейнеров
docker-compose ps

# Просмотр логов
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Перезапуск контейнеров
docker-compose restart

# Остановка без удаления томов
docker-compose down

# Остановка с удалением томов
docker-compose down -v

# Пересборка без кэша
docker-compose build --no-cache

# Пересборка конкретного сервиса
docker-compose build --no-cache backend

# Вход в контейнер
docker-compose exec backend sh
docker-compose exec frontend sh

# Проверка占用 места
docker system df
```

---

## ⚠️ Важные замечания

1. **`.env` файл**: При полной очистке (full) скрипт проверит наличие `.env`. Если файла нет, он будет создан из `.env.example`.

2. **Данные томов**: `docker-compose down -v` удаляет все данные из томов, включая базы данных и кэш.

3. **Docker кэш**: Флаг `--no-cache` значительно увеличивает время сборки, но гарантирует использование последних версий зависимостей.

4. **Глубокая очистка**: Опция в `docker-rebuild-full.sh` удаляет ВСЕ неиспользуемые образы в системе, включая образы других проектов.

---

## 🐛 Решение проблем

### Контейнер не запускается

```bash
# Проверить логи
docker-compose logs backend

# Пересобрать без кэша
npm run docker:rebuild
```

### Изменения в коде не применяются

```bash
# Остановить и удалить тома
npm run docker:clean

# Пересобрать
npm run docker:rebuild
```

### Закончилось место на диске

```bash
# Полная очистка Docker
docker system prune -a --volumes

# Или через скрипт с глубокой очисткой
./scripts/docker-rebuild-full.sh
```

### Проблемы с сетью

```bash
# Удалить сети и пересоздать
docker-compose down --remove-orphans
docker network prune
docker-compose up -d
```
