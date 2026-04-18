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
      whileHover={{ y: -5, scale: 1.02, filter: 'brightness(1.1)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onSelect(inst)}
      className={cn(
        "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-full min-h-[160px] glass-morphism premium-shadow",
        alertStatus === 'critical' ? 'border-rose-500/30 ring-1 ring-rose-500/20' :
        alertStatus === 'warning' ? 'border-amber-500/30 ring-1 ring-amber-500/20' : 'border-white/5 hover:border-white/10'
      )}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-1.5">
            <span className="bg-slate-800 text-slate-400 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border border-slate-700/50 shadow-inner">
              PBL: <span className="text-slate-200 font-mono">{inst.pbl}</span>
            </span>
            <span title={health.label} className={cn("w-1.5 h-1.5 rounded-full inline-block shadow-[0_0_5px_currentColor]", alertConfig.dot, alertStatus !== 'ok' && 'animate-pulse')} style={{ color: health.color }} />
          </div>
          <div className="flex gap-1.5">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onFetchRealTimeData(inst);
              }}
              className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all border border-emerald-500/20 shadow-lg"
              title="Vendite Live"
            >
              <Monitor className="w-4 h-4" />
            </motion.button>
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-all border border-white/5 shadow-inner">
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
            </div>
          </div>
        </div>
        <h3 className="text-[13px] font-black text-slate-200 mb-0.5 tracking-widest uppercase truncate border-b border-slate-800/50 pb-1">{inst.city}</h3>
        <p className="text-[9px] text-slate-500 mb-2 font-mono uppercase truncate pt-1">{inst.address}</p>
        
        <div className="space-y-2 mt-auto">
          <div className="flex flex-col border-t border-slate-800/50 pt-2 border-b border-slate-800/50 pb-1">
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">VOLUME_ANNO_{new Date().getFullYear() - 1}</p>
            <p className="text-xl font-mono font-black text-blue-400 drop-shadow-[0_0_3px_rgba(59,130,246,0.3)] tracking-tight leading-none text-left">
              {inst.sell.toLocaleString('it-IT', { maximumFractionDigits: 0 })} L
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(InstallationCard);
