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
      <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 min-w-[200px]">
        <p className="font-extrabold text-slate-800 mb-3 ml-1">{formatMonth(label)}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4 text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="font-bold text-slate-600">{entry.name}</span>
              </div>
              <span className="font-extrabold text-slate-900">{Math.round(entry.value).toLocaleString('it-IT')} L</span>
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

  const validMonthsSet = new Set(data.filter(d => !d.prodotto?.toLowerCase().includes('gpl')).map(d => d.mese));
  const validData = data.filter(d => validMonthsSet.has(d.mese));

  const dataByProduct = validData.reduce((acc, curr) => {
    const prod = curr.prodotto || 'Altro';
    if (!acc[prod]) acc[prod] = [];
    acc[prod].push(curr);
    return acc;
  }, {} as Record<string, RealTimeData[]>);

  Object.keys(dataByProduct).forEach(product => {
    dataByProduct[product].sort((a, b) => Number(a.mese) - Number(b.mese));
  });

  const getProductColor = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes('benzina') || name.includes('sspb')) return '#2563eb'; // blue-600
    if (name.includes('diesel') || name.includes('gasolio')) return '#64748b'; // slate-500
    if (name.includes('supreme')) return '#0ea5e9'; // sky-500
    if (name.includes('gpl') || name.includes('lpg')) return '#f43f5e'; // rose-500
    return '#94a3b8';
  };

  const products = Object.keys(dataByProduct).sort();

  const dataWithoutGPL = validData.filter(d => !d.prodotto?.toLowerCase().includes('gpl'));
  const totalSellin = dataWithoutGPL.reduce((acc, curr) => acc + curr.sellin, 0);
  const totalSellinPY = dataWithoutGPL.reduce((acc, curr) => acc + curr.sellinPY, 0);
  const deltaPercentage = totalSellinPY > 0 
    ? ((totalSellin - totalSellinPY) / totalSellinPY) * 100 
    : 0;

  const months = Array.from(validMonthsSet).sort((a, b) => Number(a) - Number(b));
  const totalDataByMonth = months.map(mese => {
    const monthData = validData.filter(d => d.mese === mese);
    return {
      mese,
      sellin: monthData.reduce((acc, curr) => acc + curr.sellin, 0),
      sellinPY: monthData.reduce((acc, curr) => acc + curr.sellinPY, 0)
    };
  });

  const dataWithoutGPLList = validData.filter(d => !d.prodotto?.toLowerCase().includes('gpl'));
  const totalSelf = dataWithoutGPLList.reduce((acc, curr) => acc + (curr.self || 0), 0);
  const totalServito = dataWithoutGPLList.reduce((acc, curr) => acc + (curr.servito || 0), 0);
  const mixData = [
    { name: 'Self Service', value: totalSelf, color: '#64748b' },
    { name: 'Servito', value: totalServito, color: '#2563eb' }
  ];
  const totalMix = totalSelf + totalServito;
  const servitoPercentage = totalMix > 0 ? (totalServito / totalMix) * 100 : 0;

  const totalSupreme = dataWithoutGPLList
    .filter(d => d.prodotto.toLowerCase().includes('supreme') || d.prodotto.toLowerCase().includes('sv-'))
    .reduce((acc, curr) => acc + curr.sellin, 0);
  const totalStandard = dataWithoutGPLList
    .filter(d => !d.prodotto.toLowerCase().includes('supreme') && !d.prodotto.toLowerCase().includes('sv-'))
    .reduce((acc, curr) => acc + curr.sellin, 0);

  const radarData = [
    { subject: 'Standard', A: totalStandard, fullMark: Math.max(totalStandard, totalSupreme) * 1.5 },
    { subject: 'Supreme', A: totalSupreme, fullMark: Math.max(totalStandard, totalSupreme) * 1.5 }
  ];

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
        transition={{ duration: 0.3 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-white w-full max-w-5xl md:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-200"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">Dashboard Tempo Reale</h3>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-1">{plant.city} - PBL: <span className="text-blue-600 font-bold">{plant.pbl}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-gray-50/50 font-sans text-slate-700 custom-scrollbar"
        >
          {loading ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-6 max-w-sm mx-auto w-full px-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-2 shadow-xl border border-gray-100">
                <Database className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <div className="w-full space-y-3">
                <div className="flex justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                  <span>Sincronizzazione Dati...</span>
                  <span className="text-blue-600">{syncProgress}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden border border-gray-300/20">
                  <motion.div
                    className="h-full bg-blue-600 relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${syncProgress}%` }}
                    transition={{ type: "tween", ease: "linear", duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          ) : data.length > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'VOLUME YTD ATTUALE', value: totalSellin, trend: deltaPercentage >= 0, color: 'text-slate-800' },
                  { label: 'VOLUME YTD PRECEDENTE', value: totalSellinPY, trend: null, color: 'text-slate-500' },
                  { label: 'VARIAZIONE % YOY', value: deltaPercentage, trend: deltaPercentage >= 0, isPerc: true }
                ].map((kpi, i) => (
                  <div key={kpi.label} className={cn("p-6 bg-white rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md", kpi.trend === true ? "border-l-4 border-l-emerald-500" : kpi.trend === false ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-slate-400")}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{kpi.label}</p>
                    <p className={cn(
                      "text-3xl font-extrabold tracking-tight",
                      kpi.isPerc ? (kpi.trend ? "text-emerald-600" : "text-rose-600") : kpi.color
                    )}>
                      {kpi.isPerc ? `${kpi.value > 0 ? '+' : ''}${kpi.value.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : Math.round(kpi.value).toLocaleString('it-IT')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Trend Chart */}
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4 mb-8 border-b border-gray-50 pb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase">Trend Volumi Globale</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Confronto Annuale Mensile</p>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={totalDataByMonth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="mese" fontSize={11} fontWeight="600" tick={{ fill: '#64748b' }} axisLine={{stroke: '#e2e8f0'}} tickLine={false} dy={10} tickFormatter={formatMonth} />
                      <YAxis fontSize={11} fontWeight="600" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toLocaleString('it-IT')}k`} dx={-10} />
                      <ReTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Legend verticalAlign="top" height={50} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color:'#64748b', paddingBottom: '20px' }} />
                      <Bar dataKey="sellin" name="ANNO CORRENTE" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
                      <Bar dataKey="sellinPY" name="ANNO PRECEDENTE" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Analytics Button */}
              <button
                onClick={() => setShowAnalytics(true)}
                className="w-full py-5 rounded-xl border border-blue-600/20 bg-blue-600 text-white hover:bg-blue-700 font-extrabold uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all"
              >
                <BarChart2 className="w-5 h-5" />
                Apri Analisi Avanzata
              </button>

              {/* Product Charts */}
              <div className="grid grid-cols-1 gap-8">
                {products.map(productName => (
                  <div key={productName} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
                       <div className="w-2 h-6 rounded-full" style={{ backgroundColor: getProductColor(productName) }} />
                       <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">{productName}</h4>
                    </div>
                    
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={dataByProduct[productName]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`color${productName.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={getProductColor(productName)} stopOpacity={0.2}/>
                              <stop offset="95%" stopColor={getProductColor(productName)} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="mese" fontSize={11} fontWeight="600" tick={{ fill: '#64748b' }} axisLine={{stroke: '#e2e8f0'}} tickLine={false} dy={10} tickFormatter={formatMonth} />
                          <YAxis fontSize={11} fontWeight="600" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toLocaleString('it-IT')}k`} dx={-10} />
                          <ReTooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }} />
                          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }} />
                          <Area type="monotone" dataKey="sellin" name="ANNO CORRENTE" stroke={getProductColor(productName)} fillOpacity={1} fill={`url(#color${productName.replace(/\s/g, '')})`} strokeWidth={3} activeDot={{ r: 6, fill: getProductColor(productName), stroke: '#fff', strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="sellinPY" name="ANNO PRECEDENTE" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
                <X className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <p className="text-slate-800 font-extrabold text-lg uppercase tracking-tight">Dati Non Trovati</p>
                <p className="text-slate-500 text-sm max-w-xs">{error || "Sincronizzazione fallita o dati assenti per questo PBL."}</p>
              </div>
            </div>
          )}
        </motion.div>

        <div className="p-6 border-t border-gray-100 bg-white flex justify-end">
          <button 
            onClick={onClose}
            className="w-full md:w-auto px-10 bg-gray-50 text-slate-500 hover:bg-gray-100 font-bold uppercase tracking-widest text-xs py-4 rounded-lg border border-gray-200 transition-all"
          >
            Chiudi Sessione
          </button>
        </div>

        <AnimatePresence>
            {showAnalytics && (
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 z-30 bg-white flex flex-col overflow-hidden"
              >
                {/* Analytics Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                      <BarChart2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">Analisi Avanzata</h3>
                      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-1">{plant.city} — Dettaglio Statistiche</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAnalytics(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-gray-50 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* MIX */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                      <div className="border-b border-gray-50 pb-4 mb-6">
                        <h4 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase">Mix Erogazione</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Distribuzione Self vs Servito</p>
                      </div>
                      <div className="flex-1 min-h-[300px] relative">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie data={mixData} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={90} outerRadius={120} paddingAngle={4} dataKey="value" stroke="#fff" strokeWidth={2}>
                              {mixData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                            </Pie>
                            <ReTooltip formatter={(val: number) => `${Math.round(val).toLocaleString('it-IT')} L`} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontBold: 'bold', color: '#64748b', textTransform: 'uppercase' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                          <p className="text-3xl font-extrabold text-slate-800 tracking-tighter">{servitoPercentage.toFixed(1)}%</p>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Share Servito</p>
                        </div>
                      </div>
                    </div>

                    {/* RADAR */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                      <div className="border-b border-gray-50 pb-4 mb-6">
                        <h4 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase">Premium Index</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Standard vs Supreme</p>
                      </div>
                      <div className="flex-1 min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height={300}>
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                            <Radar name="Volume" dataKey="A" stroke="#2563eb" strokeWidth={3} fill="#2563eb" fillOpacity={0.2} />
                            <ReTooltip formatter={(val: number) => `${Math.round(val).toLocaleString('it-IT')} L`} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* HEATMAP */}
                  <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-50 pb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                        <Droplets className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase">Intensità Mensile</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Mappa Termica Volumi (Ex GPL)</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {statsByMonth.map((stat, i) => {
                        const intensity = Math.max(0.1, stat.volume / maxHeatmapVol);
                        return (
                          <div key={i} className="relative border border-gray-100 rounded-xl p-5 bg-white shadow-sm transition-transform hover:scale-105">
                            <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ backgroundColor: '#2563eb', opacity: intensity * 0.15 }} />
                            <div className="relative z-10 flex flex-col items-center text-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-gray-50 pb-1 w-full">{stat.mese}</p>
                              <p className="text-xl font-extrabold tracking-tight text-slate-800">{(stat.volume / 1000).toFixed(1)}k</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* MoM DELTA */}
                  <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-50 pb-4">
                      <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                        <Activity className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase">Delta Mensile</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Variazione Mese su Mese</p>
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsByMonth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="mese" fontSize={11} fontWeight="600" tick={{ fill: '#64748b' }} axisLine={{stroke: '#e2e8f0'}} tickLine={false} dy={10} />
                          <YAxis fontSize={11} fontWeight="600" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toLocaleString('it-IT')}k`} dx={-10} />
                          <ReTooltip cursor={{ fill: '#f8fafc' }} formatter={(val: number) => `${Math.round(val).toLocaleString('it-IT')} L`} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontBold: 'bold', color: '#64748b', textTransform: 'uppercase' }} />
                          <Bar dataKey="diffPos" name="CRESCITA" stackId="stack" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                          <Bar dataKey="diffNeg" name="FLESSIONE" stackId="stack" fill="#f43f5e" radius={[0, 0, 4, 4]} barSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-white flex justify-end">
                  <button onClick={() => setShowAnalytics(false)} className="px-10 bg-blue-600 text-white hover:bg-blue-700 font-bold uppercase tracking-widest text-xs py-4 rounded-lg shadow-lg transition-all">
                    Torna Indietro
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
