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
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[4001] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  totalAlerts > 0 ? "bg-red-100" : "bg-emerald-100"
                )}>
                  <Bell className={cn("w-5 h-5", totalAlerts > 0 ? "text-red-600" : "text-emerald-600")} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Centro Allerte</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {totalAlerts === 0 ? 'Tutto in regola ✅' : `${totalAlerts} situazioni da gestire`}
                  </p>
                </div>
              </div>
              <button onClick={onClose}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

              {/* KPI Row */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Critici (Scaduti)', value: critical.length, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                  { label: 'Scadenza Prox', value: warning.length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                ].map(kpi => (
                  <div key={kpi.label} className={cn('rounded-xl p-3 border text-center', kpi.bg, kpi.border)}>
                    <p className={cn('text-2xl font-black', kpi.color)}>{kpi.value}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Critical Section */}
              {critical.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Critici — Azione immediata
                  </h3>
                  <div className="space-y-2">
                    {critical.map(inst => (
                      <div key={inst.pbl}
                        className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{inst.city}</p>
                          <p className="text-[10px] text-red-600 font-bold">
                            Verifica scaduta
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {inst.phone && (
                            <button onClick={() => openWhatsApp(inst)}
                              className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                              title="Notifica su WhatsApp">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => { onSelectInstallation(inst); onClose(); }}
                            className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors">
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
                  <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Attenzione
                  </h3>
                  <div className="space-y-2">
                    {warning.map(inst => (
                      <div key={inst.pbl}
                        className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{inst.city}</p>
                          <p className="text-[10px] text-amber-700 font-bold">
                            Verifica biennale in scadenza proxy
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {inst.phone && (
                            <button onClick={() => openWhatsApp(inst)}
                              className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                              title="Notifica su WhatsApp">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => { onSelectInstallation(inst); onClose(); }}
                            className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white hover:bg-amber-600 transition-colors">
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
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-slate-700 font-bold text-center">Nessuna allerta attiva!</p>
                  <p className="text-slate-400 text-sm text-center">Tutti gli impianti sono in regola.</p>
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
