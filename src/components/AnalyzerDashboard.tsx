import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, X, Database } from 'lucide-react';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ReTooltip, 
  Legend, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Sector
} from 'recharts';
import { Installation } from '../types';
import { COLORS } from '../lib/constants';
import { cn } from '../lib/utils';

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
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="font-bold text-sm">{`${value} Impianti`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
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
  show,
  onClose,
  filteredInstallations,
  contractData,
  activePieIndex,
  setActivePieIndex
}) => {
  return (
    <div className={cn("fixed inset-0 z-[3000] flex items-center justify-center p-4 transition-all duration-300", show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={false}
        animate={show ? { scale: 1, y: 0, opacity: 1 } : { scale: 0.95, y: 20, opacity: 0 }}
        className="relative bg-white w-full max-w-6xl rounded-2xl shadow-2xl p-6 md:p-8 space-y-8 max-h-[90vh] overflow-y-auto border border-slate-200"
      >
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Analitica</h3>
                <p className="text-slate-500 text-sm font-medium">Panoramica globale del network MODULA</p>
              </div>
            </div>
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.1 }}
              onClick={onClose} 
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Distribuzione Contratti</h4>
              <div className="h-[350px] w-full bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <AnyPie
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      data={contractData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      onMouseEnter={(_: any, index: number) => setActivePieIndex(index)}
                    >
                      {contractData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity" />
                      ))}
                    </AnyPie>
                    <ReTooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px', fontSize: '12px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} 
                      formatter={(value: string) => <span className="text-slate-700 ml-1">{value}</span>}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Trend EBITDA & SELL_IN</h4>
              <div className="h-[350px] w-full bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredInstallations} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="city"
                      hide={filteredInstallations.length > 15}
                      fontSize={11}
                      fontWeight="bold"
                      tick={{ fill: '#94a3b8' }}
                    />
                    <YAxis
                      fontSize={11}
                      fontWeight="bold"
                      tick={{ fill: '#94a3b8' }}
                      tickFormatter={(value) => `${(value / 1000).toLocaleString('it-IT', { maximumFractionDigits: 0 })}k`}
                    />
                    <ReTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 min-w-[200px]">
                              <p className="font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">{label}</p>
                              <div className="space-y-2">
                                {payload.map((entry: any, index: number) => (
                                  <div key={`${entry.name}-${index}`} className="flex justify-between items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      <span className="font-medium text-slate-500">{entry.name === 'ebitda' ? 'EBITDA' : 'SELL_IN'}</span>
                                    </div>
                                    <span className={cn("font-bold", entry.name === 'ebitda' && entry.value < 0 ? "text-red-600" : "text-slate-900")}>
                                      {entry.name === 'ebitda'
                                        ? entry.value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                                        : `${Math.round(entry.value).toLocaleString('it-IT')} L`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', fontWeight: '500' }}
                      formatter={(value) => <span className="text-slate-700 ml-1">{value.toUpperCase()}</span>}
                    />
                    <Line 
                      type="monotone"
                      dataKey="ebitda" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' } as any} 
                      activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' } as any}
                      name="ebitda"
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sell" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' } as any} 
                      activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' } as any}
                      name="sell_in"
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 md:p-8 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <p className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Totale EBITDA Network</p>
                <p className={cn("text-3xl md:text-4xl font-black tracking-tight", filteredInstallations.reduce((acc, i) => acc + i.ebitda, 0) < 0 ? "text-red-300" : "text-white")}>
                  {filteredInstallations.reduce((acc, i) => acc + i.ebitda, 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
            <div className="h-12 w-[1px] bg-white/20 hidden md:block"></div>
            <div className="flex items-center gap-4 md:gap-6 text-right">
              <div>
                <p className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Volume SELL_IN Totale</p>
                <p className="text-3xl md:text-4xl font-black tracking-tight">
                  {Math.round(filteredInstallations.reduce((acc, i) => acc + i.sell, 0)).toLocaleString('it-IT')} <span className="text-lg opacity-60">L</span>
                </p>
              </div>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-all border border-slate-200 text-sm shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Chiudi Dashboard
          </motion.button>
      </motion.div>
    </div>
  );
};

export default React.memo(AnalyzerDashboard);
