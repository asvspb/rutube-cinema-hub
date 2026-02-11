
import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Loader2, Sparkles, Check, AlertCircle, Database, LayoutGrid, Download, List, Trophy, Archive, Save, ExternalLink } from 'lucide-react';
import { MovieRatingData, BatchItem } from '../../types';
import { searchMovieRatings, analyzeBatchWithAgent } from '../../services/llmService';
import { RatingChart } from './RatingChart';
import { TOP_250_MOVIES, TOP_IMDB_MOVIES } from '../../services/top250Data';

interface KinoRateModalProps {
  initialQuery?: string;
  contextKey?: string | null;
  onClose: () => void;
  onSaveMetadata?: (data: MovieRatingData[], contextKey?: string) => void;
}

type TabMode = 'single' | 'batch' | 'top250' | 'top900';

export const KinoRateModal: React.FC<KinoRateModalProps> = ({ initialQuery, contextKey, onClose, onSaveMetadata }) => {
  const [mode, setMode] = useState<TabMode>('single');
  
  // Single Mode State
  const [singleQuery, setSingleQuery] = useState(initialQuery || '');
  const [singleResult, setSingleResult] = useState<MovieRatingData | null>(null);
  const [isSingleLoading, setIsSingleLoading] = useState(false);
  const [isManuallySaved, setIsManuallySaved] = useState(false);

  // Batch Mode State
  const [batchInput, setBatchInput] = useState('');
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  // Top Lists State
  const [listSearch, setListSearch] = useState('');
  const [listPage, setListPage] = useState(1);
  const ITEMS_PER_LIST_PAGE = 50;

  // Auto-search on mount if query provided
  useEffect(() => {
    if (initialQuery) {
      handleSingleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSingleSearch = async (query: string = singleQuery) => {
    if (!query.trim()) return;
    setIsSingleLoading(true);
    setSingleResult(null);
    setIsManuallySaved(false);
    try {
      const result = await searchMovieRatings(query);
      setSingleResult(result);
      if (result && onSaveMetadata) {
        // Automatically try to save using the context if available
        onSaveMetadata([result], contextKey || undefined);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSingleLoading(false);
    }
  };

  const handleManualSave = () => {
    if (singleResult && onSaveMetadata && contextKey) {
        onSaveMetadata([singleResult], contextKey);
        setIsManuallySaved(true);
        setTimeout(() => setIsManuallySaved(false), 2000);
    }
  };

  // Batch Processing Logic
  const handleStartBatch = async () => {
    const lines = batchInput.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return;

    const newQueue: BatchItem[] = lines.map((line, i) => ({
      id: `item-${Date.now()}-${i}`,
      query: line.trim(),
      status: 'pending'
    }));

    setBatchQueue(newQueue);
    setIsBatchProcessing(true);
    setProcessedCount(0);
    setBatchInput(''); 

    // Process in chunks of 5
    const CHUNK_SIZE = 5;
    for (let i = 0; i < newQueue.length; i += CHUNK_SIZE) {
      const chunk = newQueue.slice(i, i + CHUNK_SIZE);
      
      setBatchQueue(prev => prev.map(item => 
        chunk.find(c => c.id === item.id) ? { ...item, status: 'processing' } : item
      ));

      try {
        const queries = chunk.map(c => c.query);
        const results = await analyzeBatchWithAgent(queries);
        
        if (results.length > 0 && onSaveMetadata) {
            onSaveMetadata(results);
        }

        // Update results
        setBatchQueue(prev => prev.map(item => {
           const chunkIndex = chunk.findIndex(c => c.id === item.id);
           if (chunkIndex !== -1 && results[chunkIndex]) {
             return { ...item, status: 'success', result: results[chunkIndex] };
           }
           if (chunkIndex !== -1 && !results[chunkIndex]) {
              return { ...item, status: 'error' };
           }
           return item;
        }));
        
        setProcessedCount(prev => prev + chunk.length);

      } catch (e) {
        setBatchQueue(prev => prev.map(item => 
            chunk.find(c => c.id === item.id) ? { ...item, status: 'error' } : item
        ));
      }
      
      await new Promise(r => setTimeout(r, 1000));
    }

    setIsBatchProcessing(false);
  };

  const exportCSV = () => {
    const headers = ['Query', 'Title', 'Original Title', 'Year', 'KP Rating', 'KP Votes', 'IMDb Rating', 'Awards'];
    const rows = batchQueue.map(item => [
      item.query,
      item.result?.title || '',
      item.result?.originalTitle || '',
      item.result?.year || '',
      item.result?.kpRating || 0,
      item.result?.kpVotes || '',
      item.result?.imdbRating || 0,
      item.result?.awards ? item.result.awards.join('; ') : ''
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'kinorate_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Logic for Top Lists
  const getTopListData = useMemo(() => {
    const base =
      mode === 'top900'
        ? TOP_IMDB_MOVIES
        : TOP_250_MOVIES;

    let data = [...base];
    
    if (mode === 'top250') {
        data.sort((a, b) => (b.currentRating || 0) - (a.currentRating || 0));
        data = data.slice(0, 250);
    } else if (mode === 'top900') {
        data.sort((a, b) => (b.currentRating || 0) - (a.currentRating || 0));
        data = data.slice(0, 1000);
    }
    
    if (listSearch) {
        const q = listSearch.toLowerCase();
        data = data.filter(m => m.title.toLowerCase().includes(q));
    }
    
    return data;
  }, [mode, listSearch]);

  const displayedListItems = useMemo(() => {
      const start = (listPage - 1) * ITEMS_PER_LIST_PAGE;
      return getTopListData.slice(start, start + ITEMS_PER_LIST_PAGE);
  }, [getTopListData, listPage]);

  const totalListPages = Math.ceil(getTopListData.length / ITEMS_PER_LIST_PAGE);

  useEffect(() => {
      setListPage(1);
  }, [mode, listSearch]);

  const handleListItemClick = (movie: any) => {
      setMode('single');
      setSingleQuery(movie.title);
      handleSingleSearch(movie.title);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0f1012] rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-[#0f1012]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">KinoRate AI</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setMode('single')}
            className={`flex-1 min-w-[120px] py-3 text-sm font-medium transition-colors border-b-2 ${mode === 'single' ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              Поиск фильма
            </div>
          </button>
          <button 
            onClick={() => setMode('batch')}
            className={`flex-1 min-w-[140px] py-3 text-sm font-medium transition-colors border-b-2 ${mode === 'batch' ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
             <div className="flex items-center justify-center gap-2">
              <Database className="w-4 h-4" />
              Пакетная проверка
            </div>
          </button>
          <button 
            onClick={() => setMode('top250')}
            className={`flex-1 min-w-[120px] py-3 text-sm font-medium transition-colors border-b-2 ${mode === 'top250' ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
             <div className="flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Топ 250 (2025)
            </div>
          </button>
          <button 
            onClick={() => setMode('top900')}
            className={`flex-1 min-w-[130px] py-3 text-sm font-medium transition-colors border-b-2 ${mode === 'top900' ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
             <div className="flex items-center justify-center gap-2">
              <Archive className="w-4 h-4" />
              Топ-1000 (Архив IMDB)
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#0f1012] p-6">
          
          {mode === 'single' ? (
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 mb-8">
                <input
                  type="text"
                  value={singleQuery}
                  onChange={(e) => setSingleQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSingleSearch()}
                  placeholder="Введите название фильма..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  autoFocus
                />
                <button
                  onClick={() => handleSingleSearch()}
                  disabled={isSingleLoading || !singleQuery.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                >
                  {isSingleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  Найти
                </button>
              </div>

              {isSingleLoading ? (
                 <div className="flex flex-col items-center justify-center py-12 text-zinc-500 animate-pulse">
                    <Sparkles className="w-12 h-12 mb-4 text-blue-500/50" />
                    <p>Анализируем базы данных...</p>
                 </div>
              ) : singleResult ? (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl relative">
                      
                      {contextKey && (
                        <button
                            onClick={handleManualSave}
                            className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg
                                ${isManuallySaved 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-blue-600/80 hover:bg-blue-600 text-white'
                                }
                            `}
                        >
                            {isManuallySaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                            {isManuallySaved ? 'Сохранено!' : 'Применить к видео'}
                        </button>
                      )}

                      {/* Result Header */}
                      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start">
                         {/* Placeholder Poster */}
                         <div className="w-32 h-48 bg-zinc-800 rounded-lg shrink-0 overflow-hidden shadow-lg mx-auto md:mx-0">
                            <img 
                              src={`https://picsum.photos/seed/${singleResult.originalTitle}/200/300`} 
                              alt="Poster" 
                              className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                            />
                         </div>

                         <div className="flex-1 text-center md:text-left pt-2">
                            <h2 className="text-2xl font-bold text-white mb-1">{singleResult.title}</h2>
                            <p className="text-zinc-400 text-lg mb-4">{singleResult.originalTitle} ({singleResult.year})</p>
                            
                            <p className="text-zinc-300 leading-relaxed mb-6 text-sm">
                              {singleResult.description}
                            </p>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                               <div className="flex items-center gap-3 bg-[#f60]/10 border border-[#f60]/30 px-4 py-2 rounded-xl">
                                  <div className="text-[#f60] font-bold text-xl">{singleResult.kpRating}</div>
                                  <div className="text-xs text-zinc-400 text-left">
                                    <div className="font-bold text-zinc-300">Кинопоиск</div>
                                    <div>{singleResult.kpVotes} голосов</div>
                                  </div>
                               </div>

                               <div className="flex items-center gap-3 bg-[#f5c518]/10 border border-[#f5c518]/30 px-4 py-2 rounded-xl">
                                  <div className="text-[#f5c518] font-bold text-xl">{singleResult.imdbRating}</div>
                                  <div className="text-xs text-zinc-400 text-left">
                                    <div className="font-bold text-zinc-300">IMDb</div>
                                    <div>International</div>
                                  </div>
                               </div>
                            </div>
                            
                            {/* Awards Section in Result */}
                            {singleResult.awards && singleResult.awards.length > 0 && (
                                <div className="mt-6 flex flex-wrap gap-2 justify-center md:justify-start">
                                    {singleResult.awards.map((award, i) => (
                                        <div key={i} className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-[10px] text-yellow-200 flex items-center gap-1">
                                            <Trophy className="w-3 h-3" />
                                            {award}
                                        </div>
                                    ))}
                                </div>
                            )}
                         </div>
                      </div>

                      {/* Chart Area */}
                      <div className="bg-black/20 p-6 border-t border-zinc-800">
                         <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Сравнение рейтингов</h3>
                         <RatingChart data={singleResult} />
                      </div>
                      
                      {/* Sources */}
                      {singleResult.sources && singleResult.sources.length > 0 && (
                        <div className="p-4 bg-zinc-950/50 border-t border-zinc-900 text-xs text-zinc-600 truncate">
                          Источники: {singleResult.sources.map(s => new URL(s).hostname).join(', ')}
                        </div>
                      )}
                    </div>
                 </div>
              ) : (
                <div className="text-center py-12 text-zinc-600">
                   <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-20" />
                   <p>Введите название фильма для поиска рейтингов</p>
                </div>
              )}
            </div>
          ) : (mode === 'batch') ? (
            <div className="h-full flex flex-col">
               {!isBatchProcessing && batchQueue.length === 0 ? (
                 <div className="flex-1 flex flex-col gap-4">
                    <p className="text-zinc-400 text-sm">Вставьте список фильмов (каждый с новой строки) для массовой проверки.</p>
                    <textarea
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder={"Побег из Шоушенка\nКрестный отец\nТемный рыцарь\n..."}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleStartBatch}
                        disabled={!batchInput.trim()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                         <Database className="w-5 h-5" />
                         Обработать список
                      </button>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                       <div className="text-sm text-zinc-400">
                          Обработано: <span className="text-white font-bold">{processedCount}</span> из {batchQueue.length}
                       </div>
                       {!isBatchProcessing && (
                         <div className="flex gap-2">
                            <button onClick={exportCSV} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium flex items-center gap-2">
                               <Download className="w-4 h-4" />
                               CSV
                            </button>
                            <button onClick={() => setBatchQueue([])} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium">
                               Очистить
                            </button>
                         </div>
                       )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-zinc-800 rounded-full mb-6 overflow-hidden">
                       <div 
                         className="h-full bg-blue-500 transition-all duration-300"
                         style={{ width: `${(processedCount / batchQueue.length) * 100}%` }}
                       />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                       {batchQueue.map((item) => (
                          <div key={item.id} className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex items-center gap-4">
                             <div className="w-6 shrink-0 flex justify-center">
                                {item.status === 'pending' && <div className="w-2 h-2 rounded-full bg-zinc-700" />}
                                {item.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                                {item.status === 'success' && <Check className="w-4 h-4 text-green-500" />}
                                {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                             </div>
                             
                             <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">{item.query}</div>
                                {item.result && (
                                   <div className="text-xs text-zinc-500 truncate">
                                      {item.result.title} ({item.result.year})
                                   </div>
                                )}
                             </div>

                             {item.result && (
                                <div className="flex gap-3 text-xs font-mono">
                                   <div className="flex flex-col items-end">
                                      <span className="text-[#f60] font-bold">{item.result.kpRating}</span>
                                      <span className="text-zinc-600">KP</span>
                                   </div>
                                   <div className="flex flex-col items-end">
                                      <span className="text-[#f5c518] font-bold">{item.result.imdbRating}</span>
                                      <span className="text-zinc-600">IMDb</span>
                                   </div>
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          ) : (
            /* Top Lists View (Shared logic for Top 250 and Top 900) */
            <div className="h-full flex flex-col">
                <div className="mb-4 flex gap-2">
                    <input 
                       type="text" 
                       placeholder="Поиск по списку..." 
                       value={listSearch}
                       onChange={(e) => setListSearch(e.target.value)}
                       className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-zinc-800 text-zinc-200 font-medium">
                                <tr>
                                    <th className="px-4 py-3">#</th>
                                    <th className="px-4 py-3">Название</th>
                                    <th className="px-4 py-3">Год</th>
                                    <th className="px-4 py-3 text-right">Рейтинг</th>
                                    <th className="px-4 py-3">Награды</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {displayedListItems.map((movie, idx) => {
                                    const oscarAwards = movie.awards.filter(a => a.type === 'Oscar');
                                    const hasOscar = oscarAwards.length > 0;
                                    const isOscarWinner = oscarAwards.some(a => a.status === 'Won');
                                    const isOscarNominee = !isOscarWinner && oscarAwards.some(a => a.status === 'Nominated' || a.status === 'Nominee' || !a.status);
                                    
                                    return (
                                        <tr 
                                          key={movie.id} 
                                          onClick={() => handleListItemClick(movie)}
                                          className="hover:bg-zinc-800/50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-3 font-mono text-zinc-500 w-12">
                                                {(listPage - 1) * ITEMS_PER_LIST_PAGE + idx + 1}
                                            </td>
                                            <td className="px-4 py-3 text-white">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="font-medium truncate">{movie.title}</div>
                                                    {mode === 'top250' ? (
                                                      <a
                                                        href={movie.imdbUrl || `https://www.imdb.com/title/tt${movie.id}/`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-200 transition-colors"
                                                        title="Открыть IMDb"
                                                      >
                                                        IMDb
                                                        <ExternalLink className="w-3 h-3" />
                                                      </a>
                                                    ) : (
                                                      <a
                                                        href={movie.top250Url || `http://top250.info/movie/?${movie.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-200 transition-colors"
                                                        title="Открыть на top250.info"
                                                      >
                                                        top250
                                                        <ExternalLink className="w-3 h-3" />
                                                      </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-zinc-500 w-20">
                                                {movie.year || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-[#f5c518]">
                                                {movie.currentRating || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {hasOscar && (
                                                    <div
                                                      className="flex items-center"
                                                      title={isOscarWinner ? 'Оскар: победитель' : isOscarNominee ? 'Оскар: номинант' : 'Оскар'}
                                                    >
                                                        <Trophy
                                                          className={`w-4 h-4 ${isOscarWinner ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-400 fill-zinc-400'}`}
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {displayedListItems.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                            Ничего не найдено
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalListPages > 1 && (
                    <div className="flex justify-between items-center mt-4 text-xs text-zinc-500">
                        <button 
                           onClick={() => setListPage(p => Math.max(1, p - 1))}
                           disabled={listPage === 1}
                           className="px-3 py-1.5 bg-zinc-800 rounded disabled:opacity-50 hover:text-white"
                        >
                            Назад
                        </button>
                        <span>Страница {listPage} из {totalListPages}</span>
                        <button 
                           onClick={() => setListPage(p => Math.min(totalListPages, p + 1))}
                           disabled={listPage === totalListPages}
                           className="px-3 py-1.5 bg-zinc-800 rounded disabled:opacity-50 hover:text-white"
                        >
                            Вперед
                        </button>
                    </div>
                )}
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
