import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Monitor } from 'lucide-react';
import { Installation } from '../types';
import { cn } from '../lib/utils';
import { calculateHealthScore } from '../lib/healthScore';

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
  const health = calculateHealthScore(inst, allMaxSell);
  const alertStatus = health.status;
  const alertConfig = {
    critical: { dot: 'bg-red-500', label: '🔴', ring: 'ring-red-200' },
    warning: { dot: 'bg-amber-400', label: '🟡', ring: 'ring-amber-200' },
    ok: { dot: 'bg-emerald-400', label: '🟢', ring: 'ring-emerald-200' },
  }[alertStatus];

  return (
    <motion.div 
      layout
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -2, scale: 1.01 }}
      onClick={() => onSelect(inst)}
      className={cn(
        "bg-white p-3 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-full min-h-[160px]",
        alertStatus === 'critical' ? 'border-red-200 ring-1 ring-red-100' :
        alertStatus === 'warning' ? 'border-amber-200' : 'border-slate-200'
      )}
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-1.5">
            <span className="bg-slate-100 text-slate-600 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border border-slate-200">
              PBL: {inst.pbl}
            </span>
            <span title={health.label} className={cn("w-2 h-2 rounded-full inline-block", alertConfig.dot, alertStatus !== 'ok' && 'animate-pulse')} />
          </div>
          <div className="flex gap-1.5">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onFetchRealTimeData(inst);
              }}
              className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100 shadow-[0_2px_0_0_#10b981] active:shadow-none active:translate-y-1"
              title="Vendite Live"
            >
              <Monitor className="w-3.5 h-3.5" />
            </motion.button>
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors border border-slate-200 group-hover:border-blue-600">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-0.5 tracking-tight truncate">{inst.city}</h3>
        <p className="text-[10px] text-slate-500 mb-2 font-medium truncate">{inst.address}</p>
        
        <div className="space-y-1.5">
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">EBITDA 2025</p>
            <p className={cn("text-sm font-mono font-bold", inst.ebitda < 0 ? "text-red-600" : "text-emerald-600")}>
              {inst.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Salute</p>
              <span className="text-[8px] font-black" style={{ color: health.color }}>{health.score}/100</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${health.score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.03 }}
                className="h-full rounded-full"
                style={{ backgroundColor: health.color }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(InstallationCard);
