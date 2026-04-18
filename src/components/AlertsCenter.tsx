import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertTriangle, Clock, MessageCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Installation } from '../types';
import { getAlertStatus, isExpiredDate, isExpiringSoon } from '../lib/healthScore';
import { cn } from '../lib/utils';

interface AlertsCenterProps {
  show: boolean;
  onClose: () => void;
  installations: Installation[];
  onSelectInstallation: (inst: Installation) => void;
}

const AlertsCenter: React.FC<AlertsCenterProps> = ({ show, onClose, installations, onSelectInstallation }) => {
  const critical = useMemo(() =>
    installations.filter(i => i.rows.some(r => isExpiredDate(r['Ultima Verifica Erogatore']))), [installations]);
  const warning = useMemo(() =>
    installations.filter(i => i.rows.some(r => isExpiringSoon(r['Ultima Verifica Erogatore']))), [installations]);

  const totalAlerts = critical.length + warning.length;

  const buildWhatsAppMessage = (inst: Installation): string => {
    const expiredRows = inst.rows.filter(r => isExpiredDate(r['Ultima Verifica Erogatore']));
    let msg = `🔔 *Notifica MODULA - Impianto ${inst.city}*\n\n`;
    msg += `Gentile ${inst.manager || 'Gestore'},\n\n`;
    if (expiredRows.length > 0) {
      msg += `⚠️ La verifica biennale dell'erogatore risulta SCADUTA.\n`;
      msg += `Ultima verifica registrata: ${expiredRows[0]?.['Ultima Verifica Erogatore'] || 'N/D'}\n\n`;
    }
    const expiringRows = inst.rows.filter(r => isExpiringSoon(r['Ultima Verifica Erogatore']));
    if (expiringRows.length > 0) {
      msg += `⚠️ La verifica biennale dell'erogatore risulta in SCADENZA.\n`;
      msg += `Ultima verifica registrata: ${expiringRows[0]?.['Ultima Verifica Erogatore'] || 'N/D'}\n\n`;
    }
    msg += `Si prega di contattare l'ufficio tecnico per regolarizzare la situazione.\n\nGrazie.\n_Sistema MODULA_`;
    return msg;
  };

  const openWhatsApp = (inst: Installation) => {
    if (!inst.phone) return;
    let clean = inst.phone.replace(/\D/g, '');
    if (clean.startsWith('3') && clean.length >= 9) clean = '39' + clean;
    if (!clean.startsWith('39')) return;
    const msg = buildWhatsAppMessage(inst);
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[4000]"
          />
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-950 border-l border-slate-800 z-[4001] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-sm flex items-center justify-center border",
                  totalAlerts > 0 ? "bg-rose-500/10 border-rose-500/30 shadow-[inset_0_0_8px_rgba(244,63,94,0.2)]" : "bg-emerald-500/10 border-emerald-500/30 shadow-[inset_0_0_8px_rgba(16,185,129,0.2)]"
                )}>
                  <Bell className={cn("w-5 h-5", totalAlerts > 0 ? "text-rose-500 animate-pulse" : "text-emerald-500")} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">ALERTS_CENTER</h2>
                  <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest mt-1">
                    {totalAlerts === 0 ? 'SYSTEM_CLEAR [OK]' : `${totalAlerts} ACTIVE_WARNINGS`}
                  </p>
                </div>
              </div>
              <button onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-sm transition-colors border border-slate-700 shadow-inner">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-industry">

              {/* KPI Row */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'CRITICAL (EXP)', value: critical.length, color: 'text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]', bg: 'bg-rose-500/5', border: 'border-rose-500/20' },
                  { label: 'WARNING (PROX)', value: warning.length, color: 'text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
                ].map(kpi => (
                  <div key={kpi.label} className={cn('rounded-sm p-3 border text-center shadow-inner', kpi.bg, kpi.border)}>
                    <p className={cn('text-2xl font-mono font-black', kpi.color)}>{kpi.value}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Critical Section */}
              {critical.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(244,63,94,0.3)]">
                    <AlertTriangle className="w-4 h-4" /> CRITICAL_NODES — ACTION_REQUIRED
                  </h3>
                  <div className="space-y-2">
                    {critical.map(inst => (
                      <div key={inst.pbl}
                        className="bg-slate-900 border border-rose-500/30 rounded-sm p-3 flex items-center gap-3 shadow-[inset_0_0_10px_rgba(244,63,94,0.05)]">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[11px] font-mono text-slate-200 truncate uppercase tracking-wider">{inst.city}</p>
                          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5">
                            {">> "}STATUS: EXPIRED
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {inst.phone && (
                            <button onClick={() => openWhatsApp(inst)}
                              className="w-8 h-8 rounded-sm bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                              title="SEND_WA_MESSAGE">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => { onSelectInstallation(inst); onClose(); }}
                            className="w-8 h-8 rounded-sm bg-slate-800 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-500/10 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning Section */}
              {warning.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">
                    <Clock className="w-4 h-4" /> WARNING_NODES — IMMINENT_EXPIRY
                  </h3>
                  <div className="space-y-2">
                    {warning.map(inst => (
                      <div key={inst.pbl}
                        className="bg-slate-900 border border-amber-500/30 rounded-sm p-3 flex items-center gap-3 shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[11px] font-mono text-slate-200 truncate uppercase tracking-wider">{inst.city}</p>
                          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-0.5">
                            {">> "}STATUS: PROX_WARNING
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {inst.phone && (
                            <button onClick={() => openWhatsApp(inst)}
                              className="w-8 h-8 rounded-sm bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                              title="SEND_WA_MESSAGE">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => { onSelectInstallation(inst); onClose(); }}
                            className="w-8 h-8 rounded-sm bg-slate-800 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-500/10 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All OK */}
              {totalAlerts === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-slate-100 font-black text-xs tracking-widest uppercase mt-4">NO_ACTIVE_ALERTS</p>
                  <p className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest text-center">ALL_SYSTEMS_NOMINAL</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AlertsCenter;
