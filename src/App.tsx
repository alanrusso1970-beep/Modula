import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fuel, 
  Map as MapIcon, 
  List, 
  Search, 
  ChevronRight, 
  LogOut, 
  Download,
  PieChart,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Monitor,
  Bot,
  Bell
} from 'lucide-react';
import { fetchInstallations } from './services/dataService';
import { Installation, InstallationRow, RealTimeData } from './types';
import { cn } from './lib/utils';
import { Skeleton } from './components/Skeleton';
import { SearchableSelect } from './components/SearchableSelect';
import { MultiSelectSearchable } from './components/MultiSelectSearchable';
import { COLORS } from './lib/constants';
import { handleExportModulaReport, handleExportCSVData } from './lib/exportUtils';
import { useGeocoding } from './hooks/useGeocoding';
import { calculateHealthScore, getAlertStatus } from './lib/healthScore';
import InstallationCard from './components/InstallationCard';


// Lazy load components
const LoginScreen = lazy(() => import('./components/LoginScreen'));
const MapView = lazy(() => import('./components/MapView'));
const DetailModal = lazy(() => import('./components/DetailModal'));
const ExcelConverter = lazy(() => import('./components/ExcelConverter'));
const RealTimeDashboardModal = lazy(() => import('./components/RealTimeDashboardModal'));
const AnalyzerDashboard = lazy(() => import('./components/AnalyzerDashboard'));
const AIAssistant = lazy(() => import('./components/AIAssistant'));
const AlertsCenter = lazy(() => import('./components/AlertsCenter'));

const GAS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbykayQoMqHfvrni5p-l443HINtk1WxL4sPEExpxjB_HeTaDENMXuui58kYXzmmZXtc3/exec";



// --- Main App Component ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<'map' | 'list' | 'converter'>('map');
  const [data, setData] = useState<{ allRows: InstallationRow[], uniqueInstallations: Installation[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedInspectionYear, setSelectedInspectionYear] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'city' | 'ebitda-desc' | 'ebitda-asc'>('city');
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [deepLinkPbl, setDeepLinkPbl] = useState<string | null>(null);

  const geocodingStatus = useGeocoding(isLoggedIn, data, setData);

  // --- Real-Time Dashboard State ---
  const [showRealTimePopup, setShowRealTimePopup] = useState(false);
  const [isFetchingRealTime, setIsFetchingRealTime] = useState(false);
  const [realTimeData, setRealTimeData] = useState<RealTimeData[]>([]);
  const [realTimePlant, setRealTimePlant] = useState<Installation | null>(null);
  const [realTimeError, setRealTimeError] = useState<string | null>(null);

  const fetchRealTimeData = async (plant: Installation) => {
    setRealTimePlant(plant);
    setShowRealTimePopup(true);
    setIsFetchingRealTime(true);
    setRealTimeData([]);
    setRealTimeError(null);

    try {
      const response = await fetch(GAS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ action: 'read', pbl: plant.pbl }),
      });

      const result = await response.json();
      if (result.success) {
        setRealTimeData(result.data);
      } else {
        setRealTimeError(result.message || "Errore sconosciuto dal server.");
      }
    } catch (error) {
      setRealTimeError("Impossibile connettersi al server. Verifica la tua connessione.");
    } finally {
      setIsFetchingRealTime(false);
    }
  };

  useEffect(() => {
    const logged = sessionStorage.getItem('isLoggedIn') === 'true';
    if (logged) setIsLoggedIn(true);
    // Deep link: ?pbl=XXXXX
    const params = new URLSearchParams(window.location.search);
    const pblParam = params.get('pbl');
    if (pblParam) setDeepLinkPbl(pblParam);

    fetchInstallations().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  // Open modal from deep link once data is loaded
  useEffect(() => {
    if (deepLinkPbl && data) {
      const inst = data.uniqueInstallations.find(i => i.pbl === deepLinkPbl);
      if (inst) {
        setSelectedInstallation(inst);
        setDeepLinkPbl(null);
      }
    }
  }, [deepLinkPbl, data]);

  const handleLogin = () => {
    sessionStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  const handleExport = async () => handleExportModulaReport(data);

  const handleExportCSV = async () => handleExportCSVData(data);

  const filteredInstallations = useMemo(() => {
    if (!data) return [];
    
    const filtered = data.uniqueInstallations.filter(inst => {
      const matchesSearch = inst.city.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           inst.pbl.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProvince = selectedProvinces.length === 0 || selectedProvinces.includes(inst.province);
      const matchesRegion = selectedRegions.length === 0 || selectedRegions.includes(inst.region);
      const matchesType = selectedType === '' || inst.contract === selectedType;
      const matchesStatus = selectedStatus === '' || inst.moso === selectedStatus;
      
      const instYears = inst.rows.map(r => r["Ultima Verifica Erogatore"]?.split('/').pop() || r["Ultima Verifica Erogatore"]?.split('-')[0]).filter(y => y && y.length === 4);
      const matchesYear = selectedInspectionYear === '' || instYears.includes(selectedInspectionYear);

      return matchesSearch && matchesProvince && matchesRegion && matchesType && matchesStatus && matchesYear;
    });

    const sorted = [...filtered];
    if (sortBy === 'ebitda-desc') {
      sorted.sort((a, b) => b.ebitda - a.ebitda);
    } else if (sortBy === 'ebitda-asc') {
      sorted.sort((a, b) => a.ebitda - b.ebitda);
    } else {
      sorted.sort((a, b) => a.city.localeCompare(b.city));
    }
    
    return sorted;
  }, [data, searchQuery, selectedProvinces, selectedRegions, selectedType, selectedStatus, selectedInspectionYear, sortBy]);

  const provinces = useMemo(() => [...new Set(data?.uniqueInstallations.map(i => i.province) || [])].sort(), [data]);
  const regions = useMemo(() => [...new Set(data?.uniqueInstallations.map(i => i.region) || [])].filter(Boolean).sort(), [data]);
  const types = useMemo(() => [...new Set(data?.uniqueInstallations.map(i => i.contract) || [])].filter(Boolean).sort(), [data]);
  const statuses = useMemo(() => [...new Set(data?.uniqueInstallations.map(i => i.moso) || [])].filter(Boolean).sort(), [data]);
  const inspectionYears = useMemo(() => [...new Set((data?.uniqueInstallations || []).flatMap(i => 
    i.rows.map(r => r["Ultima Verifica Erogatore"]?.split('/').pop() || r["Ultima Verifica Erogatore"]?.split('-')[0]).filter(y => y && y.length === 4)
  ))].sort((a, b) => b.localeCompare(a)), [data]);

  const contractData = useMemo(() => Object.entries(
    filteredInstallations.reduce((acc, inst) => {
      const c = inst.contract || 'N/D';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })), [filteredInstallations]);



  const allMaxSell = useMemo(() => Math.max(...(data?.uniqueInstallations.map(i => i.sell) || [1]), 1), [data]);

  const alertCount = useMemo(() => {
    if (!data) return 0;
    return data.uniqueInstallations.filter(i => getAlertStatus(i) !== 'ok').length;
  }, [data]);


  if (!isLoggedIn) {
    return (
      <Suspense fallback={<div className="h-screen w-screen bg-slate-100 animate-pulse" />}>
        <LoginScreen onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden liquid-bg">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="vivid-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <header className="glass-morphism sticky top-0 z-[2000] px-4 xl:px-6 py-3 flex flex-col gap-3 shadow-xl shadow-slate-200/20">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3 shrink-0">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-10 h-10 vivid-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <Fuel className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">MODULA</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sistema Attivo</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2 relative z-[4000] flex-1 lg:justify-center overflow-visible w-full max-w-full lg:w-auto">
          {loading ? (
            <>
              <Skeleton className="flex-1 min-w-[200px] h-[42px] rounded-xl" />
              <Skeleton className="w-[180px] h-[42px] rounded-xl" />
              <Skeleton className="w-[180px] h-[42px] rounded-xl" />
              <Skeleton className="w-[100px] h-[42px] rounded-xl" />
              <Skeleton className="w-[42px] h-[42px] rounded-xl" />
            </>
          ) : (
            <>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cerca città o PBL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-sm text-slate-700 h-[42px] shadow-sm"
                />
              </div>
              
              <div className="w-[180px] shrink-0">
                <MultiSelectSearchable
                  options={provinces}
                  value={selectedProvinces}
                  onChange={setSelectedProvinces}
                  placeholder="Provincia"
                  className="w-full"
                  compact
                />
              </div>

              <div className="w-[180px] shrink-0">
                <MultiSelectSearchable
                  options={regions}
                  value={selectedRegions}
                  onChange={setSelectedRegions}
                  placeholder="Regione"
                  className="w-full"
                  compact
                />
              </div>

              <div className="w-[180px] shrink-0">
                <SearchableSelect
                  options={[
                    "A-Z",
                    "EBITDA (Alto)",
                    "EBITDA (Basso)"
                  ]}
                  value={
                    sortBy === 'city' ? 'A-Z' : 
                    sortBy === 'ebitda-desc' ? 'EBITDA (Alto)' : 
                    'EBITDA (Basso)'
                  }
                  onChange={(val) => {
                    if (val === 'A-Z') setSortBy('city');
                    else if (val === 'EBITDA (Alto)') setSortBy('ebitda-desc');
                    else setSortBy('ebitda-asc');
                  }}
                  placeholder="Ordina per..."
                  className="w-full"
                  compact
                />
              </div>

              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(
                  "px-4 py-2.5 rounded-xl border transition-all font-medium text-sm flex items-center justify-center gap-2 h-[42px] active:shadow-none active:translate-y-1",
                  showAdvancedFilters ? "bg-blue-600 text-white border-blue-600 shadow-[0_4px_0_0_#2563eb]" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-[0_4px_0_0_#cbd5e1]"
                )}
              >
                <Filter className="w-4 h-4" />
                Filtri
              </button>

              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedProvinces([]);
                  setSelectedRegions([]);
                  setSelectedType('');
                  setSelectedStatus('');
                  setSelectedInspectionYear('');
                }}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all font-medium text-sm flex items-center justify-center gap-2 h-[42px] shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1"
                title="Reset filtri"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setView('converter')}
              disabled={loading}
              className={cn(
                "px-3 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-xs active:shadow-none active:translate-y-1",
                view === 'converter' ? "bg-amber-500 text-white shadow-[0_4px_0_0_#d97706]" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-[0_4px_0_0_#cbd5e1]",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Convertitore</span>
            </button>

            <div className="flex bg-white/50 p-1 rounded-xl border border-white/50 shadow-sm hidden sm:flex">
              <button
                onClick={() => setView('map')}
                disabled={loading}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:shadow-none active:translate-y-1",
                  view === 'map' ? "bg-white text-blue-600 shadow-[0_4px_0_0_#cbd5e1]" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-[0_4px_0_0_transparent]",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Map
              </button>
              <button
                onClick={() => setView('list')}
                disabled={loading}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:shadow-none active:translate-y-1",
                  view === 'list' ? "bg-white text-blue-600 shadow-[0_4px_0_0_#cbd5e1]" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-[0_4px_0_0_transparent]",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>
            
            <button 
              onClick={() => setShowDashboard(!showDashboard)}
              disabled={loading}
              className={cn(
                "px-3 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-xs active:shadow-none active:translate-y-1",
                showDashboard ? "bg-blue-600 text-white shadow-[0_4px_0_0_#2563eb]" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-[0_4px_0_0_#cbd5e1]",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            {/* Alerts Bell */}
            <button
              onClick={() => setShowAlerts(true)}
              disabled={loading}
              className={cn(
                "relative p-2 rounded-xl transition-all border shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1",
                alertCount > 0 ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50",
                loading && "opacity-50 cursor-not-allowed"
              )}
              title="Centro Allerte"
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none px-0.5">
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </button>
            <div className="w-[1px] h-5 bg-slate-200 mx-0.5"></div>
            <button 
              onClick={handleLogout}
              className="p-2 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-slate-200 shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 flex items-center justify-center gap-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div 
              key="advanced-filters"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative z-[3000]"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200/50">
                <SearchableSelect
                  label="Terreno"
                  options={types}
                  value={selectedType}
                  onChange={setSelectedType}
                  placeholder="Tutti i tipi"
                  compact
                />
                
                <SearchableSelect
                  label="Tipo Contratto Gestore"
                  options={statuses}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  placeholder="Tutti"
                  compact
                />

                <SearchableSelect
                  label="Ultima verifica Biennale"
                  options={inspectionYears}
                  value={selectedInspectionYear}
                  onChange={setSelectedInspectionYear}
                  placeholder="Tutti gli anni"
                  compact
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <Suspense fallback={<div className="p-8"><Skeleton className="w-full h-full rounded-2xl" /></div>}>
          <AnimatePresence mode="wait">
            {loading ? (
            <motion.div 
              key="loading-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 space-y-8 max-w-7xl mx-auto w-full h-full overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {[...Array(10)].map((_, i) => (
                  <div key={`skeleton-${i}`} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[160px]">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="w-12 h-4" />
                        <Skeleton className="w-6 h-6" />
                      </div>
                      <Skeleton className="w-3/4 h-5" />
                      <Skeleton className="w-1/2 h-3" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="w-full h-8" />
                      <Skeleton className="w-full h-8" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : view === 'map' ? (
            <motion.div 
              key="map"
              initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ 
                duration: 0.6, 
                ease: [0.16, 1, 0.3, 1]
              }}
              className="h-full"
            >
              <MapView 
                installations={filteredInstallations} 
                onProceed={(province) => {
                  if (province && !selectedProvinces.includes(province)) {
                    setSelectedProvinces([...selectedProvinces, province]);
                  }
                  setView('list');
                }} 
                onResetProvince={() => setSelectedProvinces([])}
                geocodingStatus={geocodingStatus}
              />
            </motion.div>
          ) : view === 'converter' ? (
            <motion.div 
              key="converter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto"
            >
              <ExcelConverter />
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.16, 1, 0.3, 1]
              }}
              className="p-8 space-y-8 max-w-7xl mx-auto w-full overflow-y-auto h-full scroll-smooth"
            >
              <motion.div 
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05
                    }
                  }
                }}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3"
              >
                {filteredInstallations.map((inst, index) => (
                  <InstallationCard 
                    key={`${inst.pbl}-${index}`}
                    inst={inst}
                    index={index}
                    allMaxSell={allMaxSell}
                    onSelect={setSelectedInstallation}
                    onFetchRealTimeData={fetchRealTimeData}
                  />
                ))}
              </motion.div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 mt-8">
                <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-mono font-bold text-blue-600 mb-1">{filteredInstallations.length}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Impianti</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-mono font-bold text-indigo-600 mb-1">
                      {filteredInstallations.reduce((acc, i) => acc + i.rows.filter(r => r["ID Serbatoio"] && r["ID Serbatoio"] !== "-").length, 0)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Serbatoi</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-mono font-bold text-violet-600 mb-1">
                      {filteredInstallations.reduce((acc, i) => acc + i.rows.filter(r => r["ID Erogatore"] && r["ID Erogatore"] !== "-").length, 0)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Erogatori</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExport}
                    className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_0_0_#2563eb] active:shadow-none active:translate-y-1 transition-all text-sm"
                  >
                    <Download className="w-4 h-4" /> Report DOC
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExportCSV}
                    className="flex-1 md:flex-none bg-white hover:bg-slate-50 text-slate-700 font-medium px-6 py-3 rounded-xl flex items-center justify-center gap-2 border border-slate-200 shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 transition-all text-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export CSV
                  </motion.button>
                </div>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </main>

      <AnimatePresence>
        {selectedInstallation && (
          <Suspense fallback={null}>
            <DetailModal 
              key="detail-modal"
              installation={selectedInstallation} 
              onClose={() => setSelectedInstallation(null)}
              onOpenRealTimeDashboard={(plant) => {
                setSelectedInstallation(null);
                fetchRealTimeData(plant);
              }}
            />
          </Suspense>
        )}
        {showRealTimePopup && (
          <Suspense fallback={null}>
            <RealTimeDashboardModal
              key="realtime-modal"
              plant={realTimePlant}
              data={realTimeData}
              loading={isFetchingRealTime}
              error={realTimeError}
              onClose={() => setShowRealTimePopup(false)}
            />
          </Suspense>
        )}
        <Suspense fallback={null}>
          <AnalyzerDashboard 
            show={showDashboard}
            onClose={() => setShowDashboard(false)}
            filteredInstallations={filteredInstallations}
            contractData={contractData}
            activePieIndex={activePieIndex}
            setActivePieIndex={setActivePieIndex}
          />
        </Suspense>
      </AnimatePresence>

      {/* Alerts Center Panel */}
      <Suspense fallback={null}>
        <AlertsCenter
          show={showAlerts}
          onClose={() => setShowAlerts(false)}
          installations={data?.uniqueInstallations || []}
          onSelectInstallation={(inst) => {
            setShowAlerts(false);
            setSelectedInstallation(inst);
          }}
        />
      </Suspense>

      {/* AI Assistant FAB */}
      {isLoggedIn && !loading && (
        <Suspense fallback={null}>
          <AIAssistant installations={data?.uniqueInstallations || []} />
        </Suspense>
      )}
    </div>
  );
}
