import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Users, Activity, Filter, Download, PieChart as PieIcon, BarChart3, Database } from 'lucide-react';
import { Installation } from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';
import { cn } from '../lib/utils';

interface AnalyzerDashboardProps {
  show: boolean;
  onClose: () => void;
  filteredInstallations: Installation[];
  contractData: { name: string; value: number }[];
  activePieIndex: number;
  setActivePieIndex: (index: number) => void;
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const AnalyzerDashboard: React.FC<AnalyzerDashboardProps> = ({
  show,
  onClose,
  filteredInstallations,
  contractData,
  activePieIndex,
  setActivePieIndex
}) => {
  const totalEbitda = filteredInstallations.reduce((acc, curr) => acc + curr.ebitda, 0);
  const totalSell = filteredInstallations.reduce((acc, curr) => acc + curr.sell, 0);
  const avgHealth = filteredInstallations.length > 0 
    ? (filteredInstallations.reduce((acc, curr) => acc + (curr.rows[0]?.healthScore || 0), 0) / filteredInstallations.length) 
    : 0;

  const stats = [
    { label: 'EBITDA TOTALE', value: totalEbitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'VOLUME TOTALE', value: `${Math.round(totalSell).toLocaleString('it-IT')} L`, icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'NODI ATTIVI', value: filteredInstallations.length, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'SALUTE MEDIA', value: `${Math.round(avgHealth)}%`, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[5000]"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 h-[90vh] bg-white rounded-t-[2.5rem] shadow-2xl z-[5001] flex flex-col overflow-hidden border-t border-gray-100"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight uppercase">Analisi Globale</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Panoramica Prestazioni Sistema Modula</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-gray-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-gray-50/50 custom-scrollbar">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={stat.label}
                    className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn("p-3 rounded-xl transition-colors", stat.bg)}>
                        <stat.icon className={cn("w-6 h-6", stat.color)} />
                      </div>
                      <div className="bg-gray-100 text-[10px] font-black text-slate-400 px-2 py-0.5 rounded uppercase tracking-tighter">Live</div>
                    </div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={cn("text-2xl font-black tracking-tight", stat.color)}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contract Mix */}
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <PieIcon className="w-5 h-5 text-blue-600" />
                      <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Mix Contrattuale</h4>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={contractData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={8}
                          dataKey="value"
                          onMouseEnter={(_, index) => setActivePieIndex(index)}
                        >
                          {contractData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              stroke={activePieIndex === index ? '#2563eb' : 'none'}
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <ReTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* EBITDA Bar Chart */}
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Top 10 EBITDA</h4>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredInstallations.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="city" fontSize={10} fontWeight="700" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} fontWeight="700" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                        <ReTooltip 
                           cursor={{fill: '#f8fafc'}}
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                           formatter={(value: any) => [`${value.toLocaleString('it-IT')} €`, 'EBITDA']}
                        />
                        <Bar dataKey="ebitda" radius={[6, 6, 0, 0]} barSize={32}>
                          {filteredInstallations.slice(0, 10).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.ebitda >= 0 ? '#10b981' : '#f43f5e'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Distribution Map Summary / Table */}
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <Filter className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Dettaglio Impianti</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-slate-400 uppercase tracking-widest text-[9px] font-black">
                      <tr>
                        <th className="px-6 py-4">PBL</th>
                        <th className="px-6 py-4">Città</th>
                        <th className="px-6 py-4">Regione</th>
                        <th className="px-6 py-4 text-right">Volume</th>
                        <th className="px-6 py-4 text-right">EBITDA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredInstallations.slice(0, 15).map((inst, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-[11px] font-bold text-blue-600">{inst.pbl}</td>
                          <td className="px-6 py-4 font-extrabold text-slate-700">{inst.city}</td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{inst.region}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-600">{Math.round(inst.sell).toLocaleString('it-IT')} L</td>
                          <td className={cn("px-6 py-4 text-right font-black", inst.ebitda >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {inst.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredInstallations.length > 15 && (
                  <div className="p-4 bg-gray-50 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mostrando i primi 15 di {filteredInstallations.length} impianti</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-slate-600 hover:bg-gray-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-gray-200">
                <Download className="w-4 h-4" /> Esporta Report
              </button>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg"
              >
                Chiudi Analisi
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AnalyzerDashboard;
