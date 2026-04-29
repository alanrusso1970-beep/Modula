import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertTriangle, AlertCircle, ChevronRight, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Installation } from '../types';
import { getAlertStatus, calculateHealthScore } from '../lib/healthScore';
import { cn } from '../lib/utils';

interface AlertsCenterProps {
  show: boolean;
  onClose: () => void;
  installations: Installation[];
  onSelectInstallation: (inst: Installation) => void;
}

const AlertsCenter: React.FC<AlertsCenterProps> = ({ show, onClose, installations, onSelectInstallation }) => {
  const alerts = useMemo(() => {
    return installations
      .map(inst => ({
        inst,
        status: getAlertStatus(inst),
        health: calculateHealthScore(inst)
      }))
      .filter(a => a.status !== 'ok')
      .sort((a, b) => {
        if (a.status === 'critical' && b.status === 'warning') return -1;
        if (a.status === 'warning' && b.status === 'critical') return 1;
        return a.health.score - b.health.score;
      });
  }, [installations]);

  const criticalCount = alerts.filter(a => a.status === 'critical').length;
  const warningCount = alerts.filter(a => a.status === 'warning').length;

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[6000]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[6001] flex flex-col border-l border-gray-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800 uppercase tracking-tight">Centro Allerte</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gestione Anomalie e Scadenze</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 custom-scrollbar">
              {/* Summary Pills */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">Critiche</span>
                  </div>
                  <p className="text-2xl font-black text-rose-700">{criticalCount}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Avvisi</span>
                  </div>
                  <p className="text-2xl font-black text-amber-700">{warningCount}</p>
                </div>
              </div>

              {/* Alert List */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> FEED EVENTI ATTIVI
                </h3>
                
                {alerts.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-slate-800 font-extrabold uppercase tracking-tight">Nessuna Allerta</p>
                    <p className="text-slate-400 text-xs mt-2 font-medium">Tutti i sistemi operano entro i parametri nominali.</p>
                  </div>
                ) : (
                  alerts.map(({ inst, status, health }, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={inst.pbl}
                      onClick={() => onSelectInstallation(inst)}
                      className={cn(
                        "group p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 bg-white hover:shadow-md",
                        status === 'critical' ? 'border-rose-100 hover:border-rose-200' : 'border-amber-100 hover:border-amber-200'
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                        status === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                      )}>
                        {status === 'critical' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-extrabold text-slate-800 uppercase truncate pr-2">{inst.city}</h4>
                          <span className={cn(
                            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border",
                            status === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          )}>
                            {status}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mb-2 font-mono">{inst.pbl}</p>
                        
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-500 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
                            {health.reasons[0] || 'Anomalia rilevata nei parametri di verifica.'}
                          </p>
                          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-blue-600 group-hover:text-blue-700">
                            <span>Vedi Dettagli</span>
                            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-white">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-gray-50 text-slate-500 hover:bg-gray-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-gray-200"
              >
                Chiudi Centro Allerte
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AlertsCenter;
