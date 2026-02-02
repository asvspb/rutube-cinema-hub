
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, MoreVertical, RefreshCw, Trash2, Pencil, Save, ChevronLeft, GripVertical, Sparkles } from 'lucide-react';
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
  onRefresh: () => void;
  onReorder: (newOrder: CategoryDef[]) => void;
  onRefine?: (category: CategoryDef) => void; // New prop
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
  onRefine
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
    let left = rect.left + (rect.width / 2) - (MENU_WIDTH / 2);
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

    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', closeMenu, { capture: true }); 
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', closeMenu, { capture: true });
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
        <Reorder.Group 
          axis="x" 
          values={categories} 
          onReorder={onReorder} 
          className="flex gap-2"
        >
          {categories.map((cat) => {
            const isActive = activeCategory?.id === cat.id;
            const isMenuOpen = activeMenuId === cat.id;
            
            return (
              <Reorder.Item 
                key={cat.id} 
                value={cat}
                whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
                className="relative"
              >
                <div className="group/item relative">
                  <button
                    onClick={() => onSelect(cat)}
                    className={`
                      relative
                      px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-200
                      flex items-center justify-center cursor-grab active:cursor-grabbing select-none
                      ${isActive 
                        ? 'bg-[#0047b9] text-white shadow-lg shadow-blue-900/20 pr-9' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                      }
                    `}
                  >
                    <div className="overflow-hidden w-0 group-hover/item:w-5 transition-[width] duration-200 ease-out flex items-center">
                        <GripVertical className="w-3.5 h-3.5 text-zinc-600 mr-1.5" />
                    </div>
                    {cat.label}
                    
                    {isActive && (
                      <div
                        role="button"
                        onPointerDown={(e) => e.stopPropagation()} 
                        onClick={(e) => handleMenuTrigger(e, cat)}
                        className={`
                          absolute right-1 top-1/2 -translate-y-1/2 p-1 
                          hover:bg-white/20 rounded-full transition-all duration-200 cursor-pointer
                          ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}
                        `}
                      >
                        <MoreVertical className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
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

      {activeMenuId && activeMenuCategory && menuPosition && createPortal(
        <div className="fixed inset-0 z-50 pointer-events-none">
           <div 
             ref={menuRef}
             className="absolute bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150 origin-top w-64"
             style={{ 
               top: menuPosition.top, 
               left: menuPosition.left 
             }}
           >
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {isEditing && (
                      <button onClick={() => setIsEditing(false)} className="mr-1 text-zinc-400 hover:text-white">
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
                          onRefresh();
                          closeMenu();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 text-zinc-400" />
                        <span>Весь плейлист</span>
                      </button>

                      {onRefine && (
                        <button
                          onClick={() => {
                            onRefine(activeMenuCategory);
                            closeMenu();
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span>Уточнить рейтинг (База)</span>
                        </button>
                      )}

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
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
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
