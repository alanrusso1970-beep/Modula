import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, X, Database, AlertTriangle, Clock } from 'lucide-react';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ReTooltip, 
  Legend, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid,
  Sector
} from 'recharts';
import { Installation } from '../types';
import { COLORS } from '../lib/constants';
import { cn } from '../lib/utils';
import { getAlertStatus, isExpiringSoon, isExpiredDate } from '../lib/healthScore';

const AnyPie = Pie as any;

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold">{payload.name}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value} Impianti`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)`}
      </text>
    </g>
  );
};

interface AnalyzerDashboardProps {
  show: boolean;
  onClose: () => void;
  filteredInstallations: Installation[];
  contractData: { name: string; value: number }[];
  activePieIndex: number;
  setActivePieIndex: (index: number) => void;
}

const AnalyzerDashboard: React.FC<AnalyzerDashboardProps> = ({
  show, onClose, filteredInstallations, contractData, activePieIndex, setActivePieIndex
}) => {
  const totalEbitda = useMemo(() => filteredInstallations.reduce((s, i) => s + i.ebitda, 0), [filteredInstallations]);
  const totalSell = useMemo(() => filteredInstallations.reduce((s, i) => s + i.sell, 0), [filteredInstallations]);
  const negCount = useMemo(() => filteredInstallations.filter(i => i.ebitda < 0).length, [filteredInstallations]);
  const criticalCount = useMemo(() => filteredInstallations.filter(i => getAlertStatus(i) === 'critical').length, [filteredInstallations]);
  const top5 = useMemo(() => [...filteredInstallations].sort((a, b) => b.sell - a.sell).slice(0, 5), [filteredInstallations]);
  const bottom5 = useMemo(() => [...filteredInstallations].sort((a, b) => a.sell - b.sell).slice(0, 5), [filteredInstallations]);
  const expiringSoon = useMemo(() => filteredInstallations.filter(i =>
    i.rows.some(r => isExpiringSoon(r['Ultima Verifica Erogatore']) || isExpiredDate(r['Ultima Verifica Erogatore']))
  ).slice(0, 8), [filteredInstallations]);

  const rankingData = useMemo(() => [
    ...top5.map(i => ({ name: i.city.substring(0, 10), value: i.sell, isTop: true })),
    ...bottom5.filter(i => !top5.find(t => t.pbl === i.pbl)).map(i => ({ name: i.city.substring(0, 10), value: i.sell, isTop: false }))
  ], [top5, bottom5]);

  return (
    <div className={cn("fixed inset-0 z-[3000] flex items-center justify-center p-0 md:p-4 transition-all duration-500", show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: show ? 1 : 0 }}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl" 
        onClick={onClose} 
      />
      <motion.div
        initial={{ scale: 0.98, y: 20, opacity: 0, filter: 'blur(10px)' }}
        animate={show ? { scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' } : { scale: 0.98, y: 20, opacity: 0, filter: 'blur(10px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-slate-950/80 w-full max-w-6xl md:rounded-2xl shadow-2xl p-6 md:p-8 space-y-8 max-h-[95vh] overflow-y-auto border border-white/10 glass-morphism premium-shadow custom-scrollbar"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900/50 border border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-blue-500/5" />
              <TrendingUp className="w-6 h-6 text-blue-400 relative z-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-100 tracking-[0.1em] uppercase">SYSTEM_ANALYZER</h3>
              <p className="text-slate-400 text-[10px] font-mono tracking-widest uppercase mt-1">{filteredInstallations.length} NODES_ONLINE · GLOBAL_DASHBOARD</p>
            </div>
          </div>
          <motion.button whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-xl transition-all shadow-lg">
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* KPI Row */}
        <motion.div 
          initial="hidden"
          animate={show ? "show" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'EBITDA_GLOBAL', formatted: totalEbitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }), color: totalEbitda < 0 ? '#ef4444' : '#10b981' },
            { label: 'VOL_SELL_IN', formatted: `${Math.round(totalSell).toLocaleString('it-IT')} L`, color: '#3b82f6' },
            { label: 'NODES_LOSS', formatted: `${negCount}`, color: '#ef4444' },
            { label: 'NODES_CRITICAL', formatted: `${criticalCount}`, color: '#f59e0b' },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} 
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0 }
              }}
              className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-xl relative overflow-hidden group transition-all hover:bg-white/10 backdrop-blur-md">
              <div className="absolute top-0 right-0 w-8 h-8 bg-white/5 rounded-bl-2xl" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 relative z-10">{kpi.label}</p>
              <p className="text-xl font-mono font-black tracking-tight drop-shadow-[0_0_8px_currentColor] relative z-10" style={{ color: kpi.color }}>{kpi.formatted}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 drop-shadow-sm">Contract_Distribution</h4>
            <div className="h-[280px] w-full bg-slate-900 rounded-sm p-4 border border-slate-800 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <AnyPie activeIndex={activePieIndex} activeShape={renderActiveShape} data={contractData}
                    cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value"
                    stroke="none"
                    onMouseEnter={(_: any, index: number) => setActivePieIndex(index)}>
                    {contractData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="cursor-pointer" />
                    ))}
                  </AnyPie>
                  <ReTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', color: '#f1f5f9', fontFamily: 'monospace' }} itemStyle={{ fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top/Bottom 5 */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 drop-shadow-sm">NODE_VOL_RANKING</h4>
            <div className="h-[280px] bg-slate-900 rounded-sm p-4 border border-slate-800 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={rankingData} margin={{ left: 5, right: 15, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                  <XAxis type="number" fontSize={9} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: '#64748b' }} axisLine={{stroke: '#334155'}} tickLine={false} />
                  <YAxis type="category" dataKey="name" fontSize={9} width={65} tick={{ fill: '#94a3b8', fontWeight: 700, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <ReTooltip formatter={(v: number) => Math.round(v).toLocaleString('it-IT') + ' L'} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', color: '#f1f5f9' }} />
                  <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={12}>
                    {rankingData.map((item, idx) => (
                      <Cell key={idx} fill={item.isTop ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Expiry Timeline */}
        {expiringSoon.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">
              <Clock className="w-3.5 h-3.5" /> SYSTEM_CHECK_EXPIRED_OR_IMMINENT ({expiringSoon.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {expiringSoon.map(inst => {
                const expired = inst.rows.some(r => isExpiredDate(r['Ultima Verifica Erogatore']));
                return (
                  <div key={inst.pbl} className={cn("rounded-sm p-3 border flex items-center gap-2 shadow-inner", expired ? "bg-rose-500/10 border-rose-500/30" : "bg-amber-500/10 border-amber-500/30")}>
                    <AlertTriangle className={cn("w-4 h-4 shrink-0", expired ? "text-rose-500 animate-pulse" : "text-amber-500")} />
                    <div className="min-w-0">
                      <p className="font-bold font-mono text-[10px] uppercase text-slate-200 truncate">{inst.city}</p>
                      <p className={cn("text-[9px] font-black uppercase tracking-widest", expired ? "text-rose-500" : "text-amber-500")}>
                        {expired ? 'EXPIRED' : 'WARNING'} · {inst.province}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-sm text-slate-200 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[inset_0_0_30px_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500/10 border border-blue-500/30 rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] md:text-[11px] font-bold uppercase tracking-widest mb-1">NETWORK_GLOBAL_EBITDA</p>
              <p className={cn("text-3xl md:text-4xl font-mono font-black tracking-tight", totalEbitda < 0 ? "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]")}>
                {totalEbitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="h-12 w-[1px] bg-slate-700 hidden md:block"></div>
          <div className="flex items-center gap-4 md:gap-6 text-right">
            <div>
              <p className="text-slate-500 text-[10px] md:text-[11px] font-bold uppercase tracking-widest mb-1">NETWORK_GLOBAL_SELL_IN</p>
              <p className="text-3xl md:text-4xl font-mono font-black tracking-tight text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                {Math.round(totalSell).toLocaleString('it-IT')} <span className="text-lg opacity-60">L</span>
              </p>
            </div>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500/10 border border-blue-500/30 rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Database className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
            </div>
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold py-4 rounded-sm transition-all border border-slate-700 text-[10px] uppercase tracking-widest shadow-[inset_0_0_10px_rgba(255,255,255,0.02)] active:scale-[0.98] flex items-center justify-center gap-2">
          <X className="w-4 h-4" /> CLOSE_ANALYZER_MODULE
        </motion.button>
      </motion.div>
    </div>
  );
};

export default React.memo(AnalyzerDashboard);
