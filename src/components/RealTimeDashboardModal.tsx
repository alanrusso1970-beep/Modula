import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, X, Activity, Droplets, Database } from 'lucide-react';
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
  Line
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

  // Group data by product and sort by month
  const dataByProduct = data.reduce((acc, curr) => {
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
    return '#64748b'; // slate-500 (Grigio defualt)
  };

  const products = Object.keys(dataByProduct).sort();

  // Calculate Total Sellin and Total SellinPY
  const totalSellin = data.reduce((acc, curr) => acc + curr.sellin, 0);
  const totalSellinPY = data.reduce((acc, curr) => acc + curr.sellinPY, 0);
  const deltaPercentage = totalSellinPY > 0 
    ? ((totalSellin - totalSellinPY) / totalSellinPY) * 100 
    : 0;

  // Calculate total by month for unified chart
  const months = [...new Set(data.map(d => d.mese))].sort();
  const totalDataByMonth = months.map(mese => {
    const monthData = data.filter(d => d.mese === mese);
    return {
      mese,
      sellin: monthData.reduce((acc, curr) => acc + curr.sellin, 0),
      sellinPY: monthData.reduce((acc, curr) => acc + curr.sellinPY, 0)
    };
  });

  if (!plant) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white px-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 vivid-gradient rounded-xl flex items-center justify-center shadow-lg">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Dati in Tempo Reale</h3>
              <p className="text-slate-500 text-xs font-medium">{plant.city} - PBL: {plant.pbl}</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ rotate: 90, scale: 1.1 }}
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-slate-500" />
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
          {loading ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-6 max-w-sm mx-auto w-full px-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-2 shadow-inner border border-blue-100">
                <Database className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
              <div className="w-full space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  <span>Sincronizzazione Google Drive</span>
                  <span className="text-blue-600">{syncProgress}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 relative overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: `${syncProgress}%` }}
                    transition={{ type: "tween", ease: "linear", duration: 0.3 }}
                  >
                    <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-[shimmer_2s_infinite]" />
                  </motion.div>
                </div>
              </div>
            </div>
          ) : data.length > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-500/30 text-white relative overflow-hidden group border border-blue-400/50">
                  <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Activity className="w-32 h-32" /></div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-blue-100 mb-2 relative z-10">Totale Anno in Corso</p>
                  <p className="text-4xl md:text-5xl font-black font-mono tracking-tight relative z-10 drop-shadow-sm">{Math.round(totalSellin).toLocaleString('it-IT')}</p>
                  <p className="text-sm font-medium text-blue-100 mt-2 relative z-10">Variazione rispetto all'anno precedente</p>
                </div>
                <div className="bg-gradient-to-br from-slate-500 to-slate-600 p-6 rounded-3xl shadow-lg shadow-slate-500/30 text-white relative overflow-hidden group border border-slate-400/50">
                  <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Activity className="w-32 h-32" /></div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-100 mb-2 relative z-10">Totale Anno Precedente</p>
                  <p className="text-4xl md:text-5xl font-black font-mono tracking-tight relative z-10 drop-shadow-sm">{Math.round(totalSellinPY).toLocaleString('it-IT')}</p>
                  <p className="text-sm font-medium text-slate-100 mt-2 relative z-10">Stesso periodo</p>
                </div>
                <div className={cn("p-6 rounded-3xl shadow-lg text-white relative overflow-hidden group border", deltaPercentage >= 0 ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30 border-emerald-400/50" : "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30 border-red-400/50")}>
                  <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Activity className="w-32 h-32" /></div>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-2 relative z-10 opacity-90">Delta % (Anno Su Anno)</p>
                  <div className="flex items-baseline gap-2 relative z-10 drop-shadow-sm">
                    <p className="text-4xl md:text-5xl font-black font-mono tracking-tight">
                      {deltaPercentage > 0 ? '+' : ''}{deltaPercentage.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                    </p>
                  </div>
                  <p className="text-sm font-medium mt-2 relative z-10 opacity-90">Trend di crescita</p>
                </div>
              </div>

              {/* Total Unified Chart */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-10 overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 vivid-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">Volume Globale (Tutti i Prodotti)</h4>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">Storicizzazione Mensile: Anno in Corso contro Anno Precedente</p>
                  </div>
                </div>
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={totalDataByMonth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mese" fontSize={11} fontWeight="bold" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} tickFormatter={formatMonth} />
                      <YAxis fontSize={11} fontWeight="bold" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toLocaleString('it-IT')}k`} dx={-10} />
                      <ReTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Legend verticalAlign="top" height={50} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }} />
                      <Bar dataKey="sellin" name="Totale Anno Corrente" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                      <Bar dataKey="sellinPY" name="Totale Anno Precedente" fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charts by Product */}
              <div className="grid grid-cols-1 gap-8">
                {products.map(productName => (
                  <div key={productName} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-6 rounded-full" style={{ backgroundColor: getProductColor(productName) }} />
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{productName}</h4>
                      </div>
                      {/* VENDOR PERFORMANCE Removed and Chart Legend moved to recharts */}
                    </div>
                    
                    <div className="h-[320px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dataByProduct[productName]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`color${productName.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={getProductColor(productName)} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={getProductColor(productName)} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="mese" 
                            fontSize={11}
                            fontWeight="bold"
                            tick={{ fill: '#94a3b8' }}
                            axisLine={false}
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
                          <ReTooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 'bold' }} />
                          <Area 
                            type="monotone" 
                            dataKey="sellin" 
                            name="Anno Corrente"
                            stroke={getProductColor(productName)} 
                            fillOpacity={1} 
                            fill={`url(#color${productName.replace(/\s/g, '')})`} 
                            strokeWidth={4} 
                            activeDot={{ r: 8, fill: getProductColor(productName), stroke: '#fff', strokeWidth: 2 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="sellinPY" 
                            name="Anno Precedente"
                            stroke="#cbd5e1" 
                            strokeWidth={3} 
                            strokeDasharray="5 5"
                            dot={false}
                            activeDot={{ r: 6, fill: '#cbd5e1' }} 
                          />
                        </AreaChart>
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
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Chiudi Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(RealTimeDashboardModal);
