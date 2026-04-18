import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, X, Activity, Droplets, Database, BarChart2 } from 'lucide-react';
import { 
  ResponsiveContainer, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip as ReTooltip, 
  Legend, 
  BarChart,
  Bar,
  AreaChart,
  Area,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Installation, RealTimeData } from '../types';
import { cn } from '../lib/utils';

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const formatMonth = (month: number | string) => {
  const m = Number(month);
  if (isNaN(m) || m < 1 || m > 12) return String(month);
  return MONTH_NAMES[m - 1];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-100 min-w-[200px]">
        <p className="font-bold text-slate-800 mb-3 ml-1">{formatMonth(label)}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4 text-sm bg-slate-50 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                <span className="font-bold text-slate-600">{entry.name}</span>
              </div>
              <span className="font-black text-slate-900">{Math.round(entry.value).toLocaleString('it-IT')} L</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface RealTimeDashboardModalProps {
  plant: Installation | null;
  data: RealTimeData[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

const RealTimeDashboardModal: React.FC<RealTimeDashboardModalProps> = ({ 
  plant, 
  data, 
  loading, 
  error,
  onClose 
}) => {
  const [syncProgress, setSyncProgress] = React.useState(0);
  const [showAnalytics, setShowAnalytics] = React.useState(false);

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      setSyncProgress(0);
      interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 95) return 95;
          return prev + Math.floor(Math.random() * 10) + 2;
        });
      }, 300);
    } else {
      setSyncProgress(100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Filter data to only include months present in DATI_YTD (non-GPL products)
  const validMonthsSet = new Set(data.filter(d => !d.prodotto?.toLowerCase().includes('gpl')).map(d => d.mese));
  const validData = data.filter(d => validMonthsSet.has(d.mese));

  // Group data by product and sort by month
  const dataByProduct = validData.reduce((acc, curr) => {
    const prod = curr.prodotto || 'Altro';
    if (!acc[prod]) acc[prod] = [];
    acc[prod].push(curr);
    return acc;
  }, {} as Record<string, RealTimeData[]>);

  // Sort each product's data by month
  Object.keys(dataByProduct).forEach(product => {
    dataByProduct[product].sort((a, b) => Number(a.mese) - Number(b.mese));
  });

  const getProductColor = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes('benzina') || name.includes('sspb')) return '#10b981'; // emerald-500 (Verde)
    if (name.includes('diesel') || name.includes('gasolio')) return '#f59e0b'; // amber-500 (Arancione)
    if (name.includes('supreme')) return '#3b82f6'; // blue-500 (Blu)
    if (name.includes('gpl') || name.includes('lpg')) return '#f43f5e'; // rose-500 (Rosso/Rosa)
    return '#64748b'; // slate-500 (Grigio defualt)
  };

  const products = Object.keys(dataByProduct).sort();

  // Calculate Total Sellin and Total SellinPY (excluding GPL)
  const dataWithoutGPL = validData.filter(d => !d.prodotto?.toLowerCase().includes('gpl'));
  const totalSellin = dataWithoutGPL.reduce((acc, curr) => acc + curr.sellin, 0);
  const totalSellinPY = dataWithoutGPL.reduce((acc, curr) => acc + curr.sellinPY, 0);
  const deltaPercentage = totalSellinPY > 0 
    ? ((totalSellin - totalSellinPY) / totalSellinPY) * 100 
    : 0;

  // Calculate total by month for unified chart (including GPL)
  const months = Array.from(validMonthsSet).sort((a, b) => Number(a) - Number(b));
  const totalDataByMonth = months.map(mese => {
    const monthData = validData.filter(d => d.mese === mese);
    return {
      mese,
      sellin: monthData.reduce((acc, curr) => acc + curr.sellin, 0),
      sellinPY: monthData.reduce((acc, curr) => acc + curr.sellinPY, 0)
    };
  });

  // Calculate Self vs Servito (excluding GPL typically)
  const dataWithoutGPLList = validData.filter(d => !d.prodotto?.toLowerCase().includes('gpl'));
  const totalSelf = dataWithoutGPLList.reduce((acc, curr) => acc + (curr.self || 0), 0);
  const totalServito = dataWithoutGPLList.reduce((acc, curr) => acc + (curr.servito || 0), 0);
  const mixData = [
    { name: 'Self Service', value: totalSelf, color: '#10b981' }, // Verde
    { name: 'Servito', value: totalServito, color: '#3b82f6' } // Blu
  ];
  const totalMix = totalSelf + totalServito;
  const servitoPercentage = totalMix > 0 ? (totalServito / totalMix) * 100 : 0;

  // Calculate Premiumization
  const totalSupreme = dataWithoutGPLList
    .filter(d => d.prodotto.toLowerCase().includes('supreme') || d.prodotto.toLowerCase().includes('sv-'))
    .reduce((acc, curr) => acc + curr.sellin, 0);
  const totalStandard = dataWithoutGPLList
    .filter(d => !d.prodotto.toLowerCase().includes('supreme') && !d.prodotto.toLowerCase().includes('sv-'))
    .reduce((acc, curr) => acc + curr.sellin, 0);

  const radarData = [
    { subject: 'Standard (Base)', A: totalStandard, fullMark: Math.max(totalStandard, totalSupreme) * 1.5 },
    { subject: 'Supreme', A: totalSupreme, fullMark: Math.max(totalStandard, totalSupreme) * 1.5 }
  ];

  // Waterfall/MoM and Heatmap
  let previousMonthVolume = 0;
  const decData = dataWithoutGPLList.filter(d => String(d.mese) === '12');
  const decPYVolume = decData.reduce((acc, curr) => acc + curr.sellinPY, 0);

  const statsByMonth = months.map((mese, index) => {
    const md = dataWithoutGPLList.filter(d => d.mese === mese);
    const vol = md.reduce((acc, curr) => acc + curr.sellin, 0);
    let diff = 0;
    if (index === 0) {
      if (decPYVolume > 0) {
        diff = vol - decPYVolume;
      }
    } else {
      diff = vol - previousMonthVolume;
    }
    previousMonthVolume = vol;
    return {
      mese: formatMonth(mese),
      volume: vol,
      diffPos: diff > 0 ? diff : 0,
      diffNeg: diff < 0 ? diff : 0,
    };
  });
  const maxHeatmapVol = Math.max(...statsByMonth.map(m => m.volume), 1);

  if (!plant) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-0 md:p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(20px)', y: 20 }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
        exit={{ opacity: 0, scale: 0.98, filter: 'blur(20px)', y: 20 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-slate-950/80 w-full max-w-5xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/10 glass-morphism premium-shadow"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-transparent sticky top-0 z-20 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900/50 border border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-blue-500/5" />
              <Monitor className="w-6 h-6 text-blue-400 relative z-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-100 tracking-[0.1em] uppercase">TELEMETRY_SYSTEM</h3>
              <p className="text-slate-400 text-[10px] font-mono tracking-widest uppercase mt-1">{plant.city} - PBL: <span className="text-slate-200 font-bold">{plant.pbl}</span></p>
            </div>
          </div>
          <motion.button 
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-xl transition-all shadow-lg"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-transparent font-mono text-slate-300 custom-scrollbar"
        >
          {loading ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-6 max-w-sm mx-auto w-full px-6">
              <div className="w-16 h-16 bg-white/5 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-2 shadow-xl backdrop-blur-md">
                <Database className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
              <div className="w-full space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  <span>Data Ingestion (G-Drive)</span>
                  <span className="text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">{syncProgress}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="h-full bg-blue-500 relative overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: `${syncProgress}%` }}
                    transition={{ type: "tween", ease: "linear", duration: 0.3 }}
                  >
                    <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shimmer" />
                  </motion.div>
                </div>
              </div>
            </div>
          ) : data.length > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'VOL_YTD_ACTUAL', value: totalSellin, py: false, trend: deltaPercentage >= 0 },
                  { label: 'VOL_YTD_PREVIOUS', value: totalSellinPY, py: true, trend: null },
                  { label: 'DELTA_%_YOY', value: deltaPercentage, py: false, trend: deltaPercentage >= 0, isPerc: true }
                ].map((kpi, i) => (
                  <motion.div 
                    key={kpi.label}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    className={cn(
                      "p-6 rounded-2xl relative overflow-hidden group border backdrop-blur-md transition-all hover:bg-white/5 shadow-xl glass-card",
                      kpi.trend === true ? "border-emerald-500/20" : kpi.trend === false ? "border-rose-500/20" : "border-white/5"
                    )}
                  >
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                      <Activity className={cn("w-32 h-32", kpi.trend === true ? "text-emerald-500" : kpi.trend === false ? "text-rose-500" : "text-white")} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 relative z-10">{kpi.label}</p>
                    <p className={cn(
                      "text-4xl font-black font-mono tracking-tight relative z-10",
                      kpi.trend === true ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                      kpi.trend === false ? "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "text-slate-100 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                    )}>
                      {kpi.isPerc ? `${kpi.value > 0 ? '+' : ''}${kpi.value.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : Math.round(kpi.value).toLocaleString('it-IT')}
                    </p>
                    <div className={cn(
                      "absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r",
                      kpi.trend === true ? "from-emerald-600 to-emerald-400" : 
                      kpi.trend === false ? "from-rose-600 to-rose-400" : "from-blue-600 to-blue-400"
                    )} />
                  </motion.div>
                ))}
              </div>

              {/* Total Unified Chart */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, scale: 0.98 },
                  show: { opacity: 1, scale: 1 }
                }}
                className="bg-slate-900/40 p-6 md:p-8 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md mb-10 overflow-hidden"
              >
                <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 border border-white/10 shadow-lg">
                    <Activity className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-100 tracking-widest uppercase">GLOBAL_VOL_TREND</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">MONTHLY_HISTORY: ACTUAL_VS_PREVIOUS</p>
                  </div>
                </div>
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={totalDataByMonth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="mese" fontSize={11} fontWeight="bold" tick={{ fill: '#64748b' }} axisLine={{stroke: '#334155'}} tickLine={false} dy={10} tickFormatter={formatMonth} />
                      <YAxis fontSize={11} fontWeight="bold" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toLocaleString('it-IT')}k`} dx={-10} />
                      <ReTooltip content={<CustomTooltip />} cursor={{ fill: '#0f172a' }} />
                      <Legend verticalAlign="top" height={50} iconType="square" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color:'#94a3b8', borderBottom: '1px solid #1e293b', paddingBottom: '20px' }} />
                      <Bar dataKey="sellin" name="ACTUAL_YEAR" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                      <Bar dataKey="sellinPY" name="PREVIOUS_YEAR" fill="#475569" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>


              {/* Analytics Suite Button */}
              <div className="mb-10 flex">
                <motion.button
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAnalytics(true)}
                  className="flex-1 py-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl backdrop-blur-md transition-all group"
                >
                  <BarChart2 className="w-5 h-5 group-hover:animate-pulse" />
                  OPEN_ANALYTICS_PANEL
                  <span className="text-[9px] text-indigo-500/60 font-mono ml-2">[ MIX · RADAR · HEATMAP · MoM ]</span>
                </motion.button>
              </div>

              {/* Charts by Product */}
              <div className="grid grid-cols-1 gap-8">
                {products.map(productName => (
                  <div key={productName} className="bg-slate-900 p-6 rounded-sm border border-slate-800 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 rounded-sm shadow-[0_0_5px_currentColor]" style={{ backgroundColor: getProductColor(productName), color: getProductColor(productName) }} />
                        <h4 className="text-[13px] font-black text-slate-200 uppercase tracking-widest">{productName}</h4>
                      </div>
                    </div>
                    
                    <div className="h-[320px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={dataByProduct[productName]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`color${productName.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={getProductColor(productName)} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={getProductColor(productName)} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis 
                            dataKey="mese" 
                            fontSize={11}
                            fontWeight="bold"
                            tick={{ fill: '#94a3b8' }}
                            axisLine={{stroke: '#334155'}}
                            tickLine={false}
                            dy={10}
                            tickFormatter={formatMonth}
                          />
                          <YAxis 
                            fontSize={11}
                            fontWeight="bold"
                            tick={{ fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `${(value / 1000).toLocaleString('it-IT')}k`}
                            dx={-10}
                          />
                          <ReTooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '5 5' }} />
                          <Legend verticalAlign="top" height={36} iconType="square" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                          <Area 
                            type="monotone" 
                            dataKey="sellin" 
                            name="ACTUAL_YEAR"
                            stroke={getProductColor(productName)} 
                            fillOpacity={1} 
                            fill={`url(#color${productName.replace(/\s/g, '')})`} 
                            strokeWidth={3} 
                            activeDot={{ r: 6, fill: getProductColor(productName), stroke: '#0f172a', strokeWidth: 2 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="sellinPY" 
                            name="PREVIOUS_YEAR"
                            stroke="#475569" 
                            strokeWidth={2} 
                            strokeDasharray="5 5"
                            dot={false}
                            activeDot={{ r: 4, fill: '#475569', stroke: '#0f172a', strokeWidth: 2 }} 
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <p className="text-slate-900 font-bold">Attenzione</p>
                <p className="text-slate-500 text-sm max-w-xs">{error || "Non abbiamo trovato dati YTD per questo PBL nell'ultimo export."}</p>
              </div>
            </div>
          )}
        </motion.div>

        <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="w-full md:w-auto px-10 border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-bold uppercase tracking-widest text-[10px] py-4 rounded-sm shadow-[inset_0_0_10px_rgba(255,255,255,0.02)] transition-all active:scale-[0.98]"
          >
            TERMINATE_SESSION
          </button>
        </div>

        <AnimatePresence>
            {showAnalytics && (
              <motion.div
                initial={{ opacity: 0, filter: 'blur(20px)', scale: 0.98 }}
                animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                exit={{ opacity: 0, filter: 'blur(20px)', scale: 0.98 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-2xl flex flex-col overflow-hidden md:rounded-2xl"
              >
                {/* Sub-header */}
                <div className="p-6 border-b border-white/5 bg-transparent flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 border border-white/10 rounded-xl flex items-center justify-center shadow-lg">
                      <BarChart2 className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-100 tracking-[0.1em] uppercase">ANALYTICS_PANEL</h3>
                      <p className="text-slate-400 text-[10px] font-mono tracking-widest uppercase mt-1">{plant.city} — ADVANCED_STATS</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAnalytics(false)}
                    className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-xl transition-all shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Sub-content */}
                <motion.div 
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar"
                >
                  {/* Row 1: MIX + RADAR */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* DISPENSING_MIX */}
                    <motion.div 
                      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                      className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden flex flex-col backdrop-blur-md"
                    >
                      <div className="border-b border-white/5 pb-4">
                        <h4 className="text-xl font-black text-slate-100 tracking-widest uppercase">DISPENSING_MIX</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">VOL_DISTRIBUTION (EX_GPL)</p>
                      </div>
                    <div className="flex-1 min-h-[250px] flex items-center justify-center relative mt-6">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={mixData} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={80} outerRadius={110} paddingAngle={3} dataKey="value" stroke="none">
                            {mixData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                          </Pie>
                          <ReTooltip formatter={(val: number) => `${Math.round(val).toLocaleString('it-IT')} L`} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', color: '#f1f5f9' }} itemStyle={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: '11px' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <p className="text-3xl font-black text-slate-100 tracking-tighter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{servitoPercentage.toFixed(1)}%</p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">SERVITO_SHARE</p>
                      </div>
                    </div>
                    </motion.div>

                  {/* PREMIUM_RADAR */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-sm shadow-xl border border-slate-700 relative overflow-hidden flex flex-col text-slate-200">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="border-b border-slate-800/50 pb-4 relative z-10">
                      <h4 className="text-xl font-black text-blue-400 tracking-widest uppercase drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">PREMIUM_RADAR</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">SUPREME_PRODUCTS_IDX (YTD)</p>
                    </div>
                    <div className="flex-1 min-h-[250px] w-full flex items-center justify-center mt-6 relative z-10">
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#334155" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                          <Radar name="Volume" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.3} />
                          <ReTooltip formatter={(val: number) => `${Math.round(val).toLocaleString('it-IT')} L`} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', color: '#fff' }} itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize:'12px', fontFamily:'monospace' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* THERMAL_MAP */}
                <div className="bg-slate-900 p-6 md:p-8 rounded-sm border border-slate-800 shadow-md overflow-hidden">
                  <div className="flex items-center gap-4 mb-8 border-b border-slate-800/50 pb-4">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-sm flex items-center justify-center shadow-inner border border-rose-500/30">
                      <Droplets className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-rose-500 tracking-widest uppercase drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">THERMAL_MAP</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">VOL_INTENSITY_MATRIX (EX_GPL)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {statsByMonth.map((stat, i) => {
                      const intensity = Math.max(0.1, stat.volume / maxHeatmapVol);
                      return (
                        <div key={i} className="group relative border border-slate-800 rounded-sm p-4 transition-all hover:scale-105 hover:z-10 bg-slate-950 shadow-inner">
                          <div className="absolute inset-0 rounded-sm transition-opacity duration-300 pointer-events-none" style={{ backgroundColor: '#f43f5e', opacity: intensity * 0.3 }} />
                          <div className="relative z-10 flex flex-col items-center text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1 w-full">{stat.mese}</p>
                            <p className="text-lg font-black tracking-tight text-slate-100 drop-shadow-[0_0_4px_rgba(244,63,94,0.5)]">{(stat.volume / 1000).toFixed(1)}k</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DELTA_MoM */}
                <div className="bg-slate-900 p-6 md:p-8 rounded-sm border border-slate-800 shadow-md overflow-hidden">
                  <div className="flex items-center gap-4 mb-8 border-b border-slate-800/50 pb-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-sm flex items-center justify-center shadow-inner border border-amber-500/30">
                      <Activity className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-amber-500 tracking-widest uppercase drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">DELTA_MoM</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">MONTH_OVER_MONTH_VARIATION (EX_GPL)</p>
                    </div>
                  </div>
                  <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsByMonth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="mese" fontSize={11} fontWeight="bold" tick={{ fill: '#64748b' }} axisLine={{stroke: '#334155'}} tickLine={false} dy={10} />
                        <YAxis fontSize={11} fontWeight="bold" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toLocaleString('it-IT')}k`} dx={-10} />
                        <ReTooltip cursor={{ fill: '#0f172a' }} formatter={(val: number) => `${Math.round(val).toLocaleString('it-IT')} L`} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', color: '#f1f5f9' }} itemStyle={{ color: '#f1f5f9' }} />
                        <Legend verticalAlign="top" height={36} iconType="square" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                        <Bar dataKey="diffPos" name="GAIN (vs PREV)" stackId="stack" fill="#10b981" radius={[2, 2, 0, 0]} barSize={24} />
                        <Bar dataKey="diffNeg" name="LOSS (vs PREV)" stackId="stack" fill="#ef4444" radius={[0, 0, 2, 2]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                </motion.div>

                {/* Sub-footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end">
                  <button
                    onClick={() => setShowAnalytics(false)}
                    className="px-10 border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 font-bold uppercase tracking-widest text-[10px] py-4 rounded-sm shadow-[inset_0_0_10px_rgba(99,102,241,0.1)] transition-all active:scale-[0.98]"
                  >
                    CLOSE_ANALYTICS
                  </button>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default React.memo(RealTimeDashboardModal);
