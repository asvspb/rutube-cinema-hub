import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  MoreVertical,
  RefreshCw,
  Trash2,
  Pencil,
  Save,
  ChevronLeft,
  GripVertical,
  Sparkles,
} from 'lucide-react';
import { Reorder } from 'framer-motion';
import { CategoryDef } from '../types';

interface CategoryFilterProps {
  categories: CategoryDef[];
  activeCategory: CategoryDef | null;
  currentLoadedCount: number;
  onSelect: (category: CategoryDef) => void;
  onAddClick: () => void;
  onRemove: (category: CategoryDef) => void;
  onRename: (category: CategoryDef, newName: string) => void;
  onRefresh: (fetchAll?: boolean) => void;
  onReorder: (newOrder: CategoryDef[]) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  currentLoadedCount,
  onSelect,
  onAddClick,
  onRemove,
  onRename,
  onRefresh,
  onReorder,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMenuTrigger = (e: React.MouseEvent, category: CategoryDef) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();

    const MENU_WIDTH = 256;
    let left = rect.left + rect.width / 2 - MENU_WIDTH / 2;
    const top = rect.bottom + 8;

    const padding = 16;
    if (left < padding) {
      left = padding;
    } else if (left + MENU_WIDTH > window.innerWidth - padding) {
      left = window.innerWidth - MENU_WIDTH - padding;
    }

    setMenuPosition({ top, left });
    setActiveMenuId(category.id);
    setEditName(category.label);
    setIsEditing(false);
  };

  const closeMenu = () => {
    setActiveMenuId(null);
    setMenuPosition(null);
    setIsEditing(false);
  };

  const activeMenuCategory = categories.find(c => c.id === activeMenuId);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleScroll = (event: Event) => {
      // Ignore scroll events that happen inside the menu itself
      // (e.g. long input values can cause the input to scroll horizontally on focus/typing).
      const target = event.target;
      if (target && menuRef.current && menuRef.current.contains(target as Node)) {
        return;
      }
      closeMenu();
    };

    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, { capture: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [activeMenuId]);

  const handleSaveRename = () => {
    if (activeMenuCategory && editName.trim()) {
      onRename(activeMenuCategory, editName.trim());
      closeMenu();
    }
  };

  const getCountDisplay = (category: CategoryDef) => {
    const isActive = activeCategory?.id === category.id;
    const total = category.itemCount;

    if (total !== undefined && total > 0) {
      if (isActive && currentLoadedCount > 0) {
        return `${currentLoadedCount}/${total} видео`;
      }
      return `${total} видео`;
    }

    if (isActive && currentLoadedCount > 0) {
      return `${currentLoadedCount} видео`;
    }

    return null;
  };

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide pl-1 group">
        <Reorder.Group axis="x" values={categories} onReorder={onReorder} className="flex gap-2">
          {categories.map(cat => {
            const isActive = activeCategory?.id === cat.id;
            const isMenuOpen = activeMenuId === cat.id;

            return (
              <Reorder.Item key={cat.id} value={cat} className="relative shrink-0">
                <div className="group/item relative h-full flex items-center">
                  <button
                    onClick={() => onSelect(cat)}
                    title={cat.label}
                    className={`
                      relative
                      flex items-center justify-center
                      h-10 rounded-lg text-sm font-bold whitespace-nowrap
                      transition-all duration-300 ease-out select-none
                      cursor-pointer
                      max-w-[min(420px,80vw)]
                      ${
                        isActive
                          ? 'bg-[#0047b9] text-white shadow-lg shadow-blue-900/20 px-4 group-hover/item:pl-10 group-hover/item:pr-10'
                          : 'bg-zinc-800 text-zinc-400 px-4 hover:bg-zinc-700 hover:text-white hover:pl-10 hover:pr-10'
                      }
                    `}
                  >
                    {/* --- ЛЕВАЯ ИКОНКА (Drag Handle / 6 точек) --- */}
                    <div
                      className={`
                      absolute left-1 top-1/2 -translate-y-1/2
                      w-6 h-6 flex items-center justify-center
                      transition-all duration-200
                      opacity-0 scale-75 group-hover/item:opacity-60 group-hover/item:scale-100
                    `}
                    >
                      <GripVertical
                        className={`w-3.5 h-3.5 ${isActive ? 'text-white/70' : 'text-zinc-500'}`}
                      />
                    </div>

                    {/* --- ТЕКСТ КНОПКИ --- */}
                    <span className="z-10 truncate max-w-[120px] px-2">{cat.label}</span>

                    {/* --- ПРАВАЯ ИКОНКА (Меню / 3 точки) --- */}
                    <div
                      role="button"
                      tabIndex={0}
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => handleMenuTrigger(e, cat)}
                      onKeyDown={e =>
                        e.key === 'Enter' &&
                        handleMenuTrigger(e as unknown as React.MouseEvent, cat)
                      }
                      className={`
                        absolute right-0.5 top-1/2 -translate-y-1/2
                        w-4 h-4 flex items-center justify-center
                        rounded-full hover:bg-white/20 transition-all duration-200
                        cursor-pointer z-20
                        focus:outline-none
                        opacity-0 scale-75 group-hover/item:opacity-100 group-hover/item:scale-100
                      `}
                      aria-label="Меню"
                      aria-haspopup="menu"
                    >
                      <MoreVertical
                        className={`w-3 h-3 ${isActive ? 'text-white' : 'text-inherit'}`}
                      />
                    </div>
                  </button>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>

        <button
          onClick={onAddClick}
          className="
            flex items-center justify-center shrink-0
            px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
            bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 border-dashed
            hover:bg-zinc-700 hover:text-white hover:border-zinc-600
            opacity-0 group-hover:opacity-100
          "
          title="Добавить плейлист"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {activeMenuId &&
        activeMenuCategory &&
        menuPosition &&
        createPortal(
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div
              ref={menuRef}
              className="absolute bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150 origin-top w-64"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
              }}
            >
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {isEditing && (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="mr-1 text-zinc-400 hover:text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    <h2 className="text-white font-medium truncate text-xs uppercase tracking-wider text-zinc-500">
                      {isEditing ? 'Переименовать' : 'Действия'}
                    </h2>
                  </div>

                  {!isEditing && (
                    <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded ml-auto">
                      {getCountDisplay(activeMenuCategory)}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-1.5 bg-zinc-900">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        onRefresh(true);
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 text-zinc-400" />
                      <span>Весь плейлист</span>
                    </button>

                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-zinc-400" />
                      <span>Переименовать</span>
                    </button>

                    <div className="h-px bg-zinc-800 my-1.5 mx-1" />
                    <button
                      onClick={() => {
                        onRemove(activeMenuCategory);
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 flex items-center gap-3 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Удалить</span>
                    </button>
                  </>
                ) : (
                  <div className="p-2 flex flex-col gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveRename()}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="Название"
                    />
                    <button
                      onClick={handleSaveRename}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Сохранить
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
