import React, { useState, useMemo, useEffect } from 'react';
import { X, RotateCcw, Save, Calculator, FlaskConical, ListVideo, Lock, Info, Database } from 'lucide-react';
import { RatingSettings, RutubeVideo } from '../types';
import { DEFAULT_RATING_SETTINGS, formatViews } from '../services/rutubeService';

interface FormulaSettingsModalProps {
  settings: RatingSettings;
  videos?: RutubeVideo[];
  onClose: () => void;
  onSave: (newSettings: RatingSettings) => void;
}

const MOCK_GLOBAL_STATS = {
  min: 0,
  max: 15400000,
  avg: 452000,
  median: 125000,
  count: 85400
};

export const FormulaSettingsModal: React.FC<FormulaSettingsModalProps> = ({ settings, videos = [], onClose, onSave }) => {
  // Merge with defaults to ensure new fields are present even if localStorage has old data
  const [tempSettings, setTempSettings] = useState<RatingSettings>({
    ...DEFAULT_RATING_SETTINGS,
    ...settings
  });

  const [activeStatsTab, setActiveStatsTab] = useState<'playlist' | 'global'>('playlist');

  // Calculate Statistics
  const playlistStats = useMemo(() => {
    if (!videos || videos.length === 0) return null;

    // Filter out potential bad data
    const views = videos.map(v => v.views).filter(v => typeof v === 'number' && !isNaN(v));
    if (views.length === 0) return null;

    views.sort((a, b) => a - b);

    const min = views[0];
    const max = views[views.length - 1];
    const total = views.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / views.length);

    // Median
    const mid = Math.floor(views.length / 2);
    const median = views.length % 2 !== 0 
      ? views[mid] 
      : Math.round((views[mid - 1] + views[mid]) / 2);

    return { min, max, avg, median, count: views.length };
  }, [videos]);

  const currentStats = activeStatsTab === 'playlist' ? playlistStats : MOCK_GLOBAL_STATS;

  // Sync settings with stats if flags are enabled on mount or when stats change
  // We only sync with PLAYLIST stats automatically on mount/update to preserve existing behavior?
  // Or should we sync with whatever is active? 
  // Let's sync with playlistStats primarily to keep it stable, unless user explicitly interacts.
  useEffect(() => {
    if (playlistStats) {
      setTempSettings(prev => {
        let next = { ...prev };
        let changed = false;
        // Only update if the values differ, to prevent loops
        if (prev.useMedianForLow && prev.thresholdLow !== playlistStats.median) {
            next.thresholdLow = playlistStats.median;
            changed = true;
        }
        if (prev.useAverageForHigh && prev.thresholdHigh !== playlistStats.avg) {
            next.thresholdHigh = playlistStats.avg;
            changed = true;
        }
        return changed ? next : prev;
      });
    }
  }, [playlistStats]);

  const handleChange = (key: keyof RatingSettings, value: string | boolean) => {
    if (typeof value === 'boolean') {
       // Special handling for the stats flags
       // When clicking the checkbox, we use the CURRENTLY VISIBLE stats
       if (key === 'useMedianForLow' && value === true && currentStats) {
          setTempSettings(prev => ({ ...prev, [key]: value, thresholdLow: currentStats.median }));
          return;
       }
       if (key === 'useAverageForHigh' && value === true && currentStats) {
          setTempSettings(prev => ({ ...prev, [key]: value, thresholdHigh: currentStats.avg }));
          return;
       }

       setTempSettings(prev => ({ ...prev, [key]: value }));
       return;
    }
    const numValue = parseFloat(value);
    setTempSettings(prev => ({
      ...prev,
      [key]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleReset = () => {
    setTempSettings(DEFAULT_RATING_SETTINGS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(tempSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-500" />
            Формула Рейтинга
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          
          {/* Statistics Block */}
          {/* Always show if we have playlist stats OR if we are in global mode (global always exists) */}
          {(playlistStats || activeStatsTab === 'global') && (
            <div className="mb-6 bg-zinc-800/30 rounded-xl border border-zinc-800 p-4">
              
              {/* Stats Tabs */}
              <div className="flex items-center gap-2 mb-4">
                
                {/* Playlist Tab Button */}
                {activeStatsTab === 'playlist' ? (
                  <button
                    type="button"
                    onClick={() => setActiveStatsTab('playlist')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  >
                    <ListVideo className="w-4 h-4" />
                    Статистика текущего плейлиста
                  </button>
                ) : (
                  <div className="relative group/tooltip">
                    <button
                      type="button"
                      onClick={() => setActiveStatsTab('playlist')}
                      disabled={!playlistStats}
                      className={`flex items-center justify-center w-9 h-9 rounded-lg border border-zinc-800 transition-colors ${!playlistStats ? 'opacity-50 cursor-not-allowed bg-zinc-900 text-zinc-600' : 'bg-zinc-800/30 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    >
                      <ListVideo className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                      Статистика текущего плейлиста
                    </div>
                  </div>
                )}

                {/* Global Tab Button */}
                {activeStatsTab === 'global' ? (
                  <button
                    type="button"
                    onClick={() => setActiveStatsTab('global')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  >
                    <Database className="w-4 h-4" />
                    Статистика по всей базе
                  </button>
                ) : (
                  <div className="relative group/tooltip">
                    <button
                      type="button"
                      onClick={() => setActiveStatsTab('global')}
                      className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800/30 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <Database className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                      Статистика по всей базе
                    </div>
                  </div>
                )}
              </div>

              {currentStats && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700/50">
                      <div className="text-xs text-zinc-500 mb-1">Медиана (Типичный)</div>
                      <div className="text-xl font-bold text-white font-mono">{formatViews(currentStats.median)}</div>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700/50">
                      <div className="text-xs text-zinc-500 mb-1">Среднее (Mean)</div>
                      <div className="text-xl font-bold text-blue-400 font-mono">{formatViews(currentStats.avg)}</div>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700/50">
                       <div className="text-xs text-zinc-500 mb-1">Максимум</div>
                       <div className="text-lg font-medium text-zinc-300 font-mono">{formatViews(currentStats.max)}</div>
                    </div>
                     <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700/50">
                       <div className="text-xs text-zinc-500 mb-1">Всего видео</div>
                       <div className="text-lg font-medium text-zinc-300 font-mono">{currentStats.count.toLocaleString()}</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 text-center">
                    Используйте медиану {activeStatsTab === 'global' ? 'базы' : 'плейлиста'} как ориентир для настройки порога "7.0 баллов"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Strategy Toggle */}
          <div className="mb-6 bg-zinc-800/50 p-3 rounded-lg flex items-center justify-between border border-zinc-700">
             <div className="flex items-center gap-3">
               <div className={`p-2 rounded-lg ${tempSettings.useExperimentalStrategy ? 'bg-purple-600' : 'bg-zinc-700'}`}>
                 <FlaskConical className="w-5 h-5 text-white" />
               </div>
               <div>
                 <p className="text-sm font-medium text-white">Экспериментальная формула</p>
                 <p className="text-xs text-zinc-400">Рейтинг зависит от порогов просмотров</p>
               </div>
             </div>
             
             <button
               type="button"
               onClick={() => handleChange('useExperimentalStrategy', !tempSettings.useExperimentalStrategy)}
               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tempSettings.useExperimentalStrategy ? 'bg-purple-600' : 'bg-zinc-600'}`}
             >
               <span
                 className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tempSettings.useExperimentalStrategy ? 'translate-x-6' : 'translate-x-1'}`}
               />
             </button>
          </div>

          {!tempSettings.useExperimentalStrategy ? (
            /* Standard Rating Section */
            <div className="mb-8 animate-in fade-in duration-300">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 border-l-2 border-blue-500 pl-3">
                Стандартный Рейтинг (Динамика)
              </h3>
              
              <div className="bg-zinc-800/50 p-4 rounded-lg text-xs font-mono text-zinc-400 mb-4">
                Rating = Base + (log10(Views / AgeInDays) * LogScale)
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="flex justify-between text-sm text-zinc-400 mb-1.5">
                    <span>Базовый рейтинг (Base)</span>
                    <span className="text-white font-bold">{tempSettings.ratingBase}</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" max="10" step="0.5"
                    value={tempSettings.ratingBase}
                    onChange={(e) => handleChange('ratingBase', e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                    <strong>Стартовая точка.</strong> Это оценка, которую получает видео "по умолчанию", пока не наберет дополнительных баллов за активность. 
                    Например, если выставить 5.0, то даже самое непопулярное видео не будет иметь рейтинг ниже 5.
                  </p>
                </div>

                <div>
                  <label className="flex justify-between text-sm text-zinc-400 mb-1.5">
                    <span>Множитель логарифма (LogScale)</span>
                    <span className="text-white font-bold">{tempSettings.ratingLogScale}</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.1" max="5" step="0.1"
                    value={tempSettings.ratingLogScale}
                    onChange={(e) => handleChange('ratingLogScale', e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                    <strong>Чувствительность к просмотрам.</strong>
                    <br />
                    • Высокое значение: Рейтинг быстро растет даже при небольшом увеличении просмотров.
                    <br />
                    • Низкое значение: Требуется огромное количество просмотров, чтобы поднять рейтинг выше базового.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Experimental Rating Section */
             <div className="mb-8 animate-in fade-in duration-300">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 border-l-2 border-purple-500 pl-3">
                Настройка точек
              </h3>
              <div className="bg-zinc-800/50 p-4 rounded-lg text-xs font-mono text-zinc-400 mb-4">
                Рейтинг рассчитывается линейно между двумя точками просмотров.
              </div>
              
              <div className="space-y-6">
                
                {/* Low Threshold Control */}
                <div className="p-4 bg-zinc-800/20 rounded-lg border border-zinc-800/50">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-sm font-semibold text-purple-400">Точка 1 (Низ)</span>
                     <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-white transition-colors select-none">
                         <input 
                           type="checkbox"
                           checked={!!tempSettings.useMedianForLow}
                           onChange={(e) => handleChange('useMedianForLow', e.target.checked)}
                           className="w-3.5 h-3.5 accent-purple-500 rounded bg-zinc-800 border-zinc-700"
                         />
                         <span>Медиана</span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="flex justify-between text-xs text-zinc-400 mb-1.5">
                      <span>Целевой рейтинг</span>
                      <span className="text-white font-bold">{tempSettings.targetRatingLow ?? 7.0}</span>
                    </label>
                    <input 
                      type="range" 
                      min="1" max="9.9" step="0.1"
                      value={tempSettings.targetRatingLow ?? 7.0}
                      onChange={(e) => handleChange('targetRatingLow', e.target.value)}
                      className="w-full accent-purple-600 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs text-zinc-500 mb-1">Количество просмотров</label>
                    <input 
                      type="number" 
                      value={tempSettings.thresholdLow}
                      onChange={(e) => handleChange('thresholdLow', e.target.value)}
                      disabled={!!tempSettings.useMedianForLow}
                      className={`
                        w-full border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors
                        ${tempSettings.useMedianForLow 
                          ? 'bg-zinc-800/50 border-zinc-800 text-zinc-500 cursor-not-allowed' 
                          : 'bg-zinc-800 border-zinc-700 focus:border-purple-500'
                        }
                      `}
                    />
                    {tempSettings.useMedianForLow && <Lock className="absolute right-3 top-8 w-4 h-4 text-zinc-600" />}
                  </div>
                </div>

                {/* High Threshold Control */}
                <div className="p-4 bg-zinc-800/20 rounded-lg border border-zinc-800/50">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-sm font-semibold text-purple-400">Точка 2 (Верх)</span>
                     <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-white transition-colors select-none">
                         <input 
                           type="checkbox"
                           checked={!!tempSettings.useAverageForHigh}
                           onChange={(e) => handleChange('useAverageForHigh', e.target.checked)}
                           className="w-3.5 h-3.5 accent-purple-500 rounded bg-zinc-800 border-zinc-700"
                         />
                         <span>Среднее</span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="flex justify-between text-xs text-zinc-400 mb-1.5">
                      <span>Целевой рейтинг</span>
                      <span className="text-white font-bold">{tempSettings.targetRatingHigh ?? 9.0}</span>
                    </label>
                    <input 
                      type="range" 
                      min="5" max="10" step="0.1"
                      value={tempSettings.targetRatingHigh ?? 9.0}
                      onChange={(e) => handleChange('targetRatingHigh', e.target.value)}
                      className="w-full accent-purple-600 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                   <div className="relative">
                    <label className="block text-xs text-zinc-500 mb-1">Количество просмотров</label>
                    <input 
                      type="number" 
                      value={tempSettings.thresholdHigh}
                      onChange={(e) => handleChange('thresholdHigh', e.target.value)}
                      disabled={!!tempSettings.useAverageForHigh}
                      className={`
                        w-full border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors
                        ${tempSettings.useAverageForHigh 
                          ? 'bg-zinc-800/50 border-zinc-800 text-zinc-500 cursor-not-allowed' 
                          : 'bg-zinc-800 border-zinc-700 focus:border-purple-500'
                        }
                      `}
                    />
                    {tempSettings.useAverageForHigh && <Lock className="absolute right-3 top-8 w-4 h-4 text-zinc-600" />}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Gravity Section (Common) */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 border-l-2 border-orange-500 pl-3">
              Гравитация (Тренды)
            </h3>
            <div className="bg-zinc-800/50 p-4 rounded-lg text-xs font-mono text-zinc-400 mb-4">
              Gravity = Views / (AgeHours + Offset) ^ Power
            </div>
            
            <div className="space-y-6">
               <div>
                <label className="flex justify-between text-sm text-zinc-400 mb-1.5">
                  <span>Смещение времени (Offset)</span>
                  <span className="text-white">{tempSettings.gravityHourOffset} ч.</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="24" step="0.5"
                  value={tempSettings.gravityHourOffset}
                  onChange={(e) => handleChange('gravityHourOffset', e.target.value)}
                  className="w-full accent-orange-600 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                   Добавляется к возрасту видео. Предотвращает ситуацию, когда только что вышедшее видео с 1 просмотром получает бесконечно огромный рейтинг.
                </p>
              </div>

              <div>
                <label className="flex justify-between text-sm text-zinc-400 mb-1.5">
                  <span>Сила затухания (Power)</span>
                  <span className="text-white">{tempSettings.gravityPower}</span>
                </label>
                <input 
                  type="range" 
                  min="0.5" max="3" step="0.1"
                  value={tempSettings.gravityPower}
                  onChange={(e) => handleChange('gravityPower', e.target.value)}
                  className="w-full accent-orange-600 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                   Скорость "остывания". Чем выше значение, тем быстрее видео теряет позицию в трендах со временем.
                </p>
              </div>
            </div>
          </div>

        </form>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-900">
           <button 
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Сбросить
            </button>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Сохранить
              </button>
            </div>
        </div>
      </div>
      
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};