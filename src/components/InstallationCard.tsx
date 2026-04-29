import React from 'react';
import { motion } from 'framer-motion';
import { Fuel, ChevronRight, Monitor, MapPin as MapIcon } from 'lucide-react';
import { Installation } from '../types';
import { calculateHealthScore, getAlertStatus } from '../lib/healthScore';
import { cn } from '../lib/utils';

interface InstallationCardProps {
  inst: Installation;
  index: number;
  allMaxSell: number;
  onSelect: (inst: Installation) => void;
  onFetchRealTimeData: (inst: Installation) => void;
}

const InstallationCard: React.FC<InstallationCardProps> = ({ 
  inst, 
  index, 
  allMaxSell, 
  onSelect, 
  onFetchRealTimeData 
}) => {
  const health = calculateHealthScore(inst);
  const alertStatus = getAlertStatus(inst);

  const getAlertConfig = () => {
    switch (alertStatus) {
      case 'critical': return { dot: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]', border: 'border-rose-200' };
      case 'warning': return { dot: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]', border: 'border-amber-200' };
      default: return { dot: 'bg-emerald-500 shadow-[0_0_8px_#10b981]', border: 'border-emerald-200' };
    }
  };

  const alertConfig = getAlertConfig();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      onClick={() => onSelect(inst)}
      className={cn(
        "rounded-xl border transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-full min-h-[220px] bg-white shadow-sm hover:shadow-md",
        alertStatus === 'critical' ? 'border-rose-200 bg-rose-50/30' :
        alertStatus === 'warning' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200 hover:border-blue-200'
      )}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-3">
             <div className="flex flex-col gap-1">
               <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">{inst.pbl}</span>
               <div className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", alertConfig.dot, alertStatus !== 'ok' && 'animate-pulse')} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{alertStatus === 'ok' ? 'Regolare' : alertStatus === 'warning' ? 'Avviso' : 'Critico'}</span>
               </div>
             </div>
             <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: '#2563eb', color: '#fff' }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onFetchRealTimeData(inst);
              }}
              className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-slate-400 border border-gray-200 shadow-sm transition-all"
              title="Tempo Reale"
            >
              <Monitor className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight truncate">{inst.city}</h3>
            <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1 mt-1">
              <MapIcon className="w-2.5 h-2.5" /> {inst.address}
            </p>
          </div>
          
          <div className="space-y-3 mt-auto pt-3 border-t border-gray-50">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                <span>EBITDA</span>
                <span className={inst.ebitda < 0 ? 'text-rose-500' : 'text-blue-600'}>{inst.ebitda.toLocaleString('it-IT')}€</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(5, (inst.ebitda / 200000) * 100))}%` }}
                  className={cn("h-full", inst.ebitda < 0 ? "bg-rose-500" : "bg-blue-600")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                <span>VOLUME</span>
                <span className="text-blue-600">{Math.round(inst.sell).toLocaleString('it-IT')}L</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (inst.sell / allMaxSell) * 100)}%` }}
                  className="h-full bg-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center group-hover:bg-blue-600 transition-colors duration-300">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-white/90 transition-colors">Dettagli Impianto</span>
          <ChevronRight className="w-4 h-4 text-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(InstallationCard);
