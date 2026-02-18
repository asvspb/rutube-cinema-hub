# Промпт: Реализация кнопок навигации (Каналы и Плейлисты)

> Единый документ, описывающий конечное желаемое состояние кнопок навигации после всех итераций реструктуризации.

---

## 1. Краткое описание

Кнопки навигации (Каналы и Плейлисты) должны иметь:

- Компактный вид с текстом при отсутствии наведения
- Плавное появление иконок слева (6 точек) и справа (3 точки) при hover
- Динамическое расширение padding под иконки только при наведении
- Симметричное позиционирование иконок относительно текста
- Возможность drag-and-drop без визуальных эффектов масштабирования

---

## 2. Структура кнопки

### 2.1 HTML-структура

```tsx
<div className="group/channel relative h-full flex items-center">
  <button
    onClick={() => handleSelect(id)}
    className={`
      relative
      flex items-center justify-center
      h-10 rounded-lg text-sm font-bold whitespace-nowrap
      transition-all duration-300 ease-out select-none
      cursor-pointer
      ${
        isActive
          ? 'bg-[#cdab8f] text-[#000917] shadow-lg shadow-[#cdab8f]/20 px-4 group-hover/channel:pl-10 group-hover/channel:pr-10'
          : 'bg-zinc-800 text-zinc-400 px-4 hover:bg-[#cdab8f] hover:text-[#000917] hover:pl-10 hover:pr-10'
      }
    `}
  >
    {/* --- ЛЕВАЯ ИКОНКА (Drag Handle / 6 точек) --- */}
    <div
      className={`
      absolute left-1 top-1/2 -translate-y-1/2
      w-6 h-6 flex items-center justify-center
      transition-all duration-200
      opacity-0 scale-75 group-hover/channel:opacity-60 group-hover/channel:scale-100
    `}
    >
      <GripVertical className={`w-3.5 h-3.5 ${isActive ? 'text-[#000917]' : 'text-zinc-500'}`} />
    </div>

    {/* --- ТЕКСТ КНОПКИ --- */}
    <span className="z-10 truncate max-w-[120px] px-2">{label}</span>

    {/* --- ПРАВАЯ ИКОНКА (Меню / 3 точки) --- */}
    <div
      role="button"
      tabIndex={0}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => {
        e.stopPropagation();
        handleMenuTrigger(e);
      }}
      onKeyDown={e => e.key === 'Enter' && handleMenuTrigger(e as unknown as React.MouseEvent)}
      className={`
        absolute right-0.5 top-1/2 -translate-y-1/2
        w-4 h-4 flex items-center justify-center
        rounded-full hover:bg-black/10 transition-all duration-200
        cursor-pointer z-20
        focus:outline-none
        opacity-0 scale-75 group-hover/channel:opacity-100 group-hover/channel:scale-100
      `}
      aria-label="Меню"
      aria-haspopup="menu"
    >
      <MoreVertical className={`w-3 h-3 ${isActive ? 'text-[#000917]' : 'text-inherit'}`} />
    </div>
  </button>
</div>
```

---

## 3. Спецификация состояний

### 3.1 Состояния кнопки

| Состояние              | Фон                  | Цвет текста          | Padding                            |
| ---------------------- | -------------------- | -------------------- | ---------------------------------- |
| Неактивное (без hover) | `#27272a` (zinc-800) | `#a1a1aa` (zinc-400) | `px-4` (16px) — компактный         |
| Неактивное (hover)     | `#cdab8f`            | `#000917`            | `pl-10 pr-10` (40px) — расширяется |
| Активное (без hover)   | `#cdab8f`            | `#000917`            | `px-4` (16px) — компактный         |
| Активное (hover)       | `#cdab8f`            | `#000917`            | `pl-10 pr-10` (40px) — расширяется |

### 3.2 Левая иконка (6 точек / GripVertical)

| Свойство                  | Значение                                   |
| ------------------------- | ------------------------------------------ |
| Позиция                   | `absolute left-1 top-1/2 -translate-y-1/2` |
| Размер контейнера         | `24px × 24px` (w-6 h-6)                    |
| Размер иконки             | `14px` (w-3.5 h-3.5)                       |
| Visibility (по умолчанию) | `opacity-0 scale-75` — скрыта              |
| Visibility (при hover)    | `opacity-60 scale-100` — менее заметная    |
| Transition                | `all 200ms`                                |

### 3.3 Правая иконка (3 точки / MoreVertical)

| Свойство                  | Значение                                      |
| ------------------------- | --------------------------------------------- |
| Позиция                   | `absolute right-0.5 top-1/2 -translate-y-1/2` |
| Размер контейнера         | `16px × 16px` (w-4 h-4)                       |
| Размер иконки             | `12px` (w-3 h-3)                              |
| Z-index                   | `20`                                          |
| Visibility (по умолчанию) | `opacity-0 scale-75` — скрыта                 |
| Visibility (при hover)    | `opacity-100 scale-100` — полностью видимая   |
| Hover background          | `bg-black/10 rounded-full`                    |
| Focus                     | `outline-none` — без обводки                  |
| Transition                | `all 200ms`                                   |

### 3.4 Текст кнопки

| Свойство  | Значение             |
| --------- | -------------------- |
| Z-index   | `10`                 |
| Max-width | `120px` с truncate   |
| Padding   | `px-2` (8px отступы) |

---

## 4. Логика работы

### 4.1 Видимость иконок

**Обе иконки видны ТОЛЬКО при наведении мышью:**

```tsx
// Левая иконка (6 точек) — менее заметная
'opacity-0 scale-75 group-hover/channel:opacity-60 group-hover/channel:scale-100';

// Правая иконка (3 точки) — полностью видимая
'opacity-0 scale-75 group-hover/channel:opacity-100 group-hover/channel:scale-100';
```

### 4.2 Динамическое расширение padding

```tsx
// Без hover — компактная кнопка
'px-4'; // 16px

// При hover — расширение под иконки
'hover:pl-10 hover:pr-10'; // 40px
// или для активного состояния
'px-4 group-hover/channel:pl-10 group-hover/channel:pr-10';
```

### 4.3 Структура кнопки

```
БЕЗ HOVER (компактный):
┌────────────────┐
│    Текст       │
└────────────────┘

ПРИ HOVER (расширенный):
┌──────────────────────────┐
│ [≡]    Текст    [⋮]      │
│  ↑      ↑        ↑       │
│ left-1  px-2   right-0.5 │
└──────────────────────────┘
```

---

---

## 6. Особенности для Плейлистов (CategoryFilter)

Для кнопок плейлистов применяются те же принципы с отличиями в цветовой схеме:

| Свойство       | Каналы              | Плейлисты           |
| -------------- | ------------------- | ------------------- |
| Активный фон   | `#cdab8f` (бежевый) | `#0047b9` (синий)   |
| Активный текст | `#000917`           | `#ffffff`           |
| Hover эффект   | `hover:bg-black/10` | `hover:bg-white/20` |

---

## 7. Критические требования

### 7.1 Обязательно

- ✅ Иконки видны ТОЛЬКО при hover
- ✅ Без hover — компактная кнопка, только текст
- ✅ При hover — плавное расширение и появление иконок
- ✅ 6 точек менее заметны (opacity-60)
- ✅ 3 точки полностью видимы (opacity-100)
- ✅ Симметричные отступы от иконок до текста
- ✅ Круг меню не наезжает на текст
- ✅ Нет обводки при фокусе на кнопке меню

### 7.2 Запрещено

- ❌ Резервирование места под иконки в неактивном состоянии
- ❌ Отображение иконок без наведения мыши
- ❌ Эффект масштабирования при перетаскивании (whileDrag)
- ❌ Обводка (focus:ring) на кнопке меню
- ❌ Наложение круглого блока меню на текст

---

## 9. Цветовая палитра

### Каналы

| Название      | HEX       | Использование            |
| ------------- | --------- | ------------------------ |
| Accent beige  | `#cdab8f` | Активный канал, hover    |
| Text active   | `#000917` | Текст активного канала   |
| Inactive bg   | `#27272a` | Фон неактивного канала   |
| Inactive text | `#a1a1aa` | Текст неактивного канала |

### Плейлисты

| Название      | HEX       | Использование               |
| ------------- | --------- | --------------------------- |
| Active bg     | `#0047b9` | Активный плейлист           |
| Active text   | `#ffffff` | Текст активного плейлиста   |
| Inactive bg   | `#27272a` | Фон неактивного плейлиста   |
| Inactive text | `#a1a1aa` | Текст неактивного плейлиста |

---

## 10. Чек-лист реализации

- [ ] Компактная кнопка с текстом при отсутствии hover
- [ ] Динамическое расширение padding при hover (px-4 → pl-10 pr-10)
- [ ] Левая иконка появляется при hover (opacity-60, w-6 h-6)
- [ ] Правая иконка появляется при hover (opacity-100, w-4 h-4)
- [ ] Симметричные отступы: left-1 / px-2 / right-0.5
- [ ] Нет обводки при фокусе на кнопке меню
- [ ] Применено к обоим компонентам: ChannelList и CategoryFilter

---

_Документ создан на основе истории реструктуризации кнопок навигации._
