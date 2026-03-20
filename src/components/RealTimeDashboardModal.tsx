import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, X } from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip as ReTooltip, 
  Legend, 
  Line 
} from 'recharts';
import { Installation, RealTimeData } from '../types';

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
  // Group data by product
  const dataByProduct = data.reduce((acc, curr) => {
    const prod = curr.prodotto || 'Altro';
    if (!acc[prod]) acc[prod] = [];
    acc[prod].push(curr);
    return acc;
  }, {} as Record<string, RealTimeData[]>);

  const products = Object.keys(dataByProduct).sort();

  // Calculate percentage of "Servito" if data exists
  const totalSellin = data.reduce((acc, curr) => acc + curr.sellin, 0);
  const totalServito = data.reduce((acc, curr) => acc + curr.servito, 0);
  const servitoPercentage = totalSellin + totalServito > 0 
    ? (totalServito / (totalSellin + totalServito)) * 100 
    : 0;

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
            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold animate-pulse">Sincronizzazione con Google Drive...</p>
            </div>
          ) : data.length > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm shadow-blue-500/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Totale Sell-In (P)</p>
                  <p className="text-2xl font-black text-blue-600 font-mono">{Math.round(totalSellin).toLocaleString('it-IT')} L</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm shadow-indigo-500/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Totale Servito (R)</p>
                  <p className="text-2xl font-black text-indigo-600 font-mono">{Math.round(totalServito).toLocaleString('it-IT')} L</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm shadow-emerald-500/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">% Servito (R/(P+R))</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black text-emerald-600 font-mono">
                      {servitoPercentage.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                    </p>
                    <span className="text-[10px] font-bold text-slate-400">YTD</span>
                  </div>
                </div>
              </div>

              {/* Charts by Product */}
              <div className="grid grid-cols-1 gap-8">
                {products.map(productName => (
                  <div key={productName} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-6 bg-blue-500 rounded-full" />
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{productName}</h4>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
                        Vendor Performance
                      </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dataByProduct[productName]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="mese" 
                            fontSize={11}
                            fontWeight="bold"
                            tick={{ fill: '#94a3b8' }}
                          />
                          <YAxis 
                            fontSize={11}
                            fontWeight="bold"
                            tick={{ fill: '#94a3b8' }}
                            tickFormatter={(value) => `${(value / 1000).toLocaleString('it-IT')}k`}
                          />
                          <ReTooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 min-w-[180px]">
                                    <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-2">{label}</p>
                                    <div className="space-y-2">
                                      {payload.map((entry: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center gap-4 text-sm">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                            <span className="font-medium text-slate-500">{entry.name}</span>
                                          </div>
                                          <span className="font-bold text-slate-900">{Math.round(entry.value).toLocaleString('it-IT')} L</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend verticalAlign="top" height={36}/>
                          <Line 
                            type="monotone" 
                            dataKey="sellin" 
                            name="Sell-In (Corrente)"
                            stroke="#2563eb" 
                            strokeWidth={4} 
                            dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 8 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="sellinPY" 
                            name="Sell-In (Anno Prec.)"
                            stroke="#94a3b8" 
                            strokeWidth={2} 
                            strokeDasharray="5 5"
                            dot={{ r: 4, fill: '#94a3b8', strokeWidth: 2, stroke: '#fff' }} 
                          />
                        </LineChart>
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
