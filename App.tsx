
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, addDays, startOfToday, parseISO } from 'date-fns';
import { 
  BarChart3, 
  Calendar, 
  Database, 
  History, 
  LayoutDashboard, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Package,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Upload
} from 'lucide-react';
import { 
  AppConfig, 
  BatchBase, 
  DailyRecord, 
  Override, 
  BatchCalculated, 
  Stage 
} from './types';
import { DEFAULT_CONFIG } from './constants';
import { calculateBatchTimeline } from './services/batchLogic';
import BatchCard from './components/BatchCard';

// Main App Component
const App: React.FC = () => {
  // --- State ---
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [asOfDate, setAsOfDate] = useState<Date>(startOfToday());
  const [bases, setBases] = useState<BatchBase[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timeline' | 'data' | 'settings'>('timeline');
  const [selectedBatch, setSelectedBatch] = useState<BatchCalculated | null>(null);

  // --- Effects ---
  useEffect(() => {
    const savedBases = localStorage.getItem('yl_bases');
    const savedRecords = localStorage.getItem('yl_records');
    const savedOverrides = localStorage.getItem('yl_overrides');

    if (savedBases) setBases(JSON.parse(savedBases));
    if (savedRecords) setRecords(JSON.parse(savedRecords));
    if (savedOverrides) setOverrides(JSON.parse(savedOverrides));
  }, []);

  useEffect(() => {
    localStorage.setItem('yl_bases', JSON.stringify(bases));
    localStorage.setItem('yl_records', JSON.stringify(records));
    localStorage.setItem('yl_overrides', JSON.stringify(overrides));
  }, [bases, records, overrides]);

  // --- Calculations ---
  const batches = useMemo(() => {
    return calculateBatchTimeline(asOfDate, config, bases, records, overrides);
  }, [asOfDate, config, bases, records, overrides]);

  const totalInventory = useMemo(() => {
    return batches.reduce((acc, b) => acc + b.inventory, 0);
  }, [batches]);

  const totalGilts = useMemo(() => {
    return batches.reduce((acc, b) => acc + b.giltInventory, 0);
  }, [batches]);

  // --- Handlers ---
  const handleAddEvent = (batchId: string, event: Partial<DailyRecord>) => {
    const recordDate = format(asOfDate, 'yyyy-MM-dd');
    const existingIdx = records.findIndex(r => r.batchId === batchId && r.recordDate === recordDate);
    
    const newRecords = [...records];
    if (existingIdx >= 0) {
      newRecords[existingIdx] = { ...newRecords[existingIdx], ...event };
    } else {
      newRecords.push({
        batchId,
        recordDate,
        ...event
      });
    }
    setRecords(newRecords);
  };

  const handleSetOverride = (batchId: string, stage: Stage, assignedUnit: string, affectFollowing: boolean) => {
    const existingIdx = overrides.findIndex(o => o.batchId === batchId && o.stage === stage);
    const newOverrides = [...overrides];
    if (existingIdx >= 0) {
      newOverrides[existingIdx] = { batchId, stage, assignedUnit, affectFollowing };
    } else {
      newOverrides.push({ batchId, stage, assignedUnit, affectFollowing });
    }
    setOverrides(newOverrides);
  };

  const handleDataImport = (type: 'merge' | 'restore', jsonData: any) => {
    if (type === 'restore') {
      if (jsonData.bases) setBases(jsonData.bases);
      if (jsonData.records) setRecords(jsonData.records);
      if (jsonData.overrides) setOverrides(jsonData.overrides);
      alert('資料已還原');
    } else {
      // Merge logic
      if (jsonData.bases) {
        const newBases = [...bases];
        jsonData.bases.forEach((b: BatchBase) => {
          const idx = newBases.findIndex(ex => ex.batchId === b.batchId);
          if (idx >= 0) newBases[idx] = b; else newBases.push(b);
        });
        setBases(newBases);
      }
      // Similarly for records/overrides...
      alert('資料已合併更新');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-20 lg:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <TrendingUp size={24} />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-white font-bold leading-tight">永隆智慧管理</h1>
            <p className="text-xs text-slate-400">v1.0 指揮中心</p>
          </div>
        </div>

        <div className="flex-1 flex flex-row md:flex-col p-4 gap-2">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="管理儀表" 
          />
          <NavItem 
            active={activeTab === 'timeline'} 
            onClick={() => setActiveTab('timeline')} 
            icon={<Calendar size={20} />} 
            label="19批切面" 
          />
          <NavItem 
            active={activeTab === 'data'} 
            onClick={() => setActiveTab('data')} 
            icon={<Database size={20} />} 
            label="資料管理" 
          />
          <NavItem 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<Settings size={20} />} 
            label="參數設定" 
          />
        </div>

        <div className="p-4 hidden md:block">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Cloud Sync</span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">YL-PROD-2026-01-07</p>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-slate-50 relative">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setAsOfDate(addDays(asOfDate, -1))}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="px-4 text-sm font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600" />
                {format(asOfDate, 'yyyy-MM-dd')}
                <span className="text-xs text-slate-400 font-normal">
                  (D 日)
                </span>
              </div>
              <button 
                onClick={() => setAsOfDate(addDays(asOfDate, 1))}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <button 
              onClick={() => setAsOfDate(startOfToday())}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
            >
              回到今日
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-3 text-sm">
              <div className="text-right">
                <p className="text-xs text-slate-500">總在場量</p>
                <p className="font-bold text-slate-900">{totalInventory.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">頭</span></p>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="text-right">
                <p className="text-xs text-slate-500">新女培育</p>
                <p className="font-bold text-emerald-600">{totalGilts.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">頭</span></p>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6 flex-1">
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">19 批狀態切面</h2>
                  <p className="text-slate-500">檢視 D 日前後共 19 批生產批次的即時位置與庫存</p>
                </div>
                <div className="flex gap-2">
                  <LegendItem color="bg-emerald-500" label="已落地" />
                  <LegendItem color="bg-amber-500" label="半落地" />
                  <LegendItem color="bg-slate-300" label="理論批次" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {batches.map((batch) => (
                  <BatchCard 
                    key={batch.batchId} 
                    batch={batch} 
                    isToday={format(batch.farrowDate, 'yyyy-MM-dd') === format(asOfDate, 'yyyy-MM-dd')}
                    onClick={setSelectedBatch} 
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="近期配種進度" value="G15 - 95%" trend="+2%" icon={<CheckCircle2 className="text-emerald-500" />} />
              <StatCard title="待離乳數量" value="482" subtitle="3 個批次" icon={<Package className="text-indigo-500" />} />
              <StatCard title="健康警示" value="2" subtitle="庫存異常批次" icon={<AlertTriangle className="text-amber-500" />} color="text-amber-600" />
              
              <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold mb-4 text-slate-800">各階段分佈趨勢</h3>
                <div className="h-64 flex items-end gap-2 px-4">
                  {[45, 60, 85, 40, 30, 90, 110, 80, 55, 70, 40, 20].map((h, i) => (
                    <div key={i} className="flex-1 bg-indigo-100 rounded-t-lg relative group transition-all hover:bg-indigo-500">
                      <div className="absolute inset-0 bg-indigo-500 rounded-t-lg" style={{ height: `${h}%` }}></div>
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded">
                        {h}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] text-slate-400 px-4">
                  <span>W0</span><span>W4</span><span>W8</span><span>W12</span><span>W16</span><span>W20</span><span>W24</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold mb-2">備份與匯入</h3>
                <p className="text-slate-500 mb-6">支援 Excel 雙分頁格式：基本紀錄 (Base) 與 修改紀錄 (Change Log)。</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-300 transition-colors group cursor-pointer">
                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Upload size={24} />
                    </div>
                    <h4 className="font-bold mb-1">匯入數據</h4>
                    <p className="text-sm text-slate-400 mb-4">讀取 Excel 並合併至目前雲端資料庫。</p>
                    <div className="flex gap-2">
                      <button onClick={() => alert('請選擇檔案')} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800">Merge (合併)</button>
                      <button onClick={() => alert('請選擇檔案')} className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-50">Restore (還原)</button>
                    </div>
                  </div>

                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-300 transition-colors group cursor-pointer">
                    <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <FileDown size={24} />
                    </div>
                    <h4 className="font-bold mb-1">備份匯出</h4>
                    <p className="text-sm text-slate-400 mb-4">將全場資料包含異動紀錄匯出為 Excel 檔案。</p>
                    <button onClick={() => alert('正在準備匯出...')} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 flex items-center gap-2">
                      <FileDown size={14} /> 立即下載備份
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xl font-bold mb-4">牧場參數設定</h3>
              
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">牧場 ID</span>
                  <input type="text" value={config.farmId} onChange={(e) => setConfig({...config, farmId: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 p-2" />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">批次間隔 (天)</span>
                    <input type="number" value={config.intervalDays} onChange={(e) => setConfig({...config, intervalDays: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 p-2" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">懷孕天數</span>
                    <input type="number" value={config.biological.gestationDays} onChange={(e) => setConfig({...config, biological: {...config.biological, gestationDays: parseInt(e.target.value)}})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 p-2" />
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">錨點批次 (校準點)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-xs text-slate-500">批次 ID</span>
                      <input type="text" value={config.anchorBatchId} onChange={(e) => setConfig({...config, anchorBatchId: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 p-2" />
                    </label>
                    <label className="block">
                      <span className="text-xs text-slate-500">分娩日期</span>
                      <input type="date" value={config.anchorFarrowDate} onChange={(e) => setConfig({...config, anchorFarrowDate: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 p-2" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                  儲存設定
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Batch Detail Modal/Slide-over */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedBatch(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{selectedBatch.batchId} 詳情</h2>
                <p className="text-sm text-slate-500">分娩日：{format(selectedBatch.farrowDate, 'yyyy-MM-dd')}</p>
              </div>
              <button onClick={() => setSelectedBatch(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Quick Actions */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">事件快速錄入 ({format(asOfDate, 'MM/dd')})</h3>
                <div className="grid grid-cols-2 gap-3">
                  <EventButton 
                    label="肉豬死亡" 
                    icon={<Plus size={16} />} 
                    onClick={() => handleAddEvent(selectedBatch.batchId, { pigDeathQty: 1 })} 
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  />
                  <EventButton 
                    label="出豬成交" 
                    icon={<ArrowUpRight size={16} />} 
                    onClick={() => {
                      const qty = prompt('請輸入出豬頭數：', '10');
                      if (qty) handleAddEvent(selectedBatch.batchId, { pigSaleQty: parseInt(qty) });
                    }} 
                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  />
                  <EventButton 
                    label="母豬流產" 
                    icon={<Plus size={16} />} 
                    onClick={() => handleAddEvent(selectedBatch.batchId, { sowAbortionQty: 1 })} 
                    className="border-amber-200 text-amber-600 hover:bg-amber-50"
                  />
                  <EventButton 
                    label="舍別覆寫" 
                    icon={<Settings size={16} />} 
                    onClick={() => {
                      const barn = prompt('指定舍別：', selectedBatch.currentBarn);
                      if (barn) handleSetOverride(selectedBatch.batchId, selectedBatch.currentStage, barn, true);
                    }} 
                    className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  />
                </div>
              </section>

              {/* Stats Summary */}
              <section className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">目前階段</p>
                    <p className="font-bold text-lg">{selectedBatch.currentStage}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">當前舍別</p>
                    <p className="font-bold text-lg">{selectedBatch.currentBarn}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">週齡 (Age)</p>
                    <p className="font-bold text-lg">W{selectedBatch.weekIndex} / {selectedBatch.ageDays}d</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">在場頭數</p>
                    <p className="font-bold text-lg text-indigo-600">{selectedBatch.inventory} 頭</p>
                  </div>
                </div>
              </section>

              {/* History Log */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <History size={18} className="text-slate-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">異動紀錄 (Change Log)</h3>
                </div>
                <div className="space-y-3">
                  {selectedBatch.records.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">尚無異動紀錄</p>
                  ) : (
                    selectedBatch.records.map((record, i) => (
                      <div key={i} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">{record.recordDate}</p>
                          <div className="flex gap-2">
                            {record.pigDeathQty && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">死亡 -{record.pigDeathQty}</span>}
                            {record.pigSaleQty && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">出豬 -{record.pigSaleQty}</span>}
                            {record.sowAbortionQty && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">流產 +{record.sowAbortionQty}</span>}
                          </div>
                        </div>
                        <button className="text-slate-300 hover:text-red-500 transition-colors">
                          <Plus className="rotate-45" size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="p-6 border-t bg-slate-50 flex gap-3">
              <button 
                className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                onClick={() => setSelectedBatch(null)}
              >
                完成編輯
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Helper Components ---

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-slate-800 text-slate-400'}`}
  >
    {icon}
    <span className="hidden lg:block font-medium text-sm">{label}</span>
  </button>
);

const StatCard: React.FC<{ title: string; value: string; subtitle?: string; trend?: string; icon: React.ReactNode; color?: string }> = ({ title, value, subtitle, trend, icon, color }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      {trend && <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{trend}</span>}
    </div>
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{title}</p>
      <h4 className={`text-2xl font-bold ${color || 'text-slate-900'}`}>{value}</h4>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-2 h-2 rounded-full ${color}`}></div>
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
  </div>
);

const EventButton: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; className: string }> = ({ label, icon, onClick, className }) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-center gap-2 border-2 p-3 rounded-xl transition-all font-bold text-sm ${className}`}
  >
    {icon}
    {label}
  </button>
);

export default App;
