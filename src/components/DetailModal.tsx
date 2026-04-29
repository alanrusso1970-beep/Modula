import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fuel, 
  Map as MapIcon, 
  List, 
  TrendingUp, 
  Box, 
  Phone, 
  Mail, 
  Info, 
  Database,
  FileDown,
  X,
  Activity,
  QrCode,
  Copy,
  Check,
  ChevronRight,
  Zap,
  RefreshCcw
} from 'lucide-react';

import { saveAs } from 'file-saver';
import { Installation } from '../types';
import { cn } from '../lib/utils';
import { parseNumericValue } from '../services/dataService';
import Plant2D from './Plant2D';

const Plant3D = React.lazy(() => import('./Plant3D'));
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface DetailModalProps {
  installation: Installation;
  onClose: () => void;
  onOpenRealTimeDashboard?: (plant: Installation) => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ 
  installation, 
  onClose,
  onOpenRealTimeDashboard
}) => {
  const [show3D, setShow3D] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const planImageRef = useRef<string | null>(null);

  const handleCapture = (dataUrl: string) => {
    if (dataUrl && dataUrl.length > 5000) {
      planImageRef.current = dataUrl;
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    if (!planImageRef.current) {
      let attempts = 0;
      while (!planImageRef.current && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }

    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { InstallationPDF } = await import('./InstallationPDF');
      const blob = await pdf(
        <InstallationPDF 
          installation={installation} 
          planImage={planImageRef.current} 
        />
      ).toBlob();
      saveAs(blob, `Report_${installation.city}_${installation.pbl}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const productDataMap: Record<string, { id: string, volume: number, color: string }> = {
    Benzina: { id: 'Benzina', volume: 0, color: '#10b981' },
    Gasolio: { id: 'Gasolio', volume: 0, color: '#f59e0b' },
    Supreme: { id: 'Supreme', volume: 0, color: '#2563eb' },
    Altro: { id: 'Altro', volume: 0, color: '#94a3b8' }
  };

  const seenTanks = new Set<string>();
  installation.rows.forEach(row => {
    const tankId = row["ID Serbatoio"];
    if (tankId && !seenTanks.has(tankId)) {
      seenTanks.add(tankId);
      const rawVol = row["Volume Serbatoio"];
      const volume = parseNumericValue(rawVol);
      const product = row["Prodotto Serbatoio"] || 'N/D';

      if (product.toLowerCase().includes('sspb') || product.toLowerCase().includes('benzina')) {
        productDataMap.Benzina.volume += volume;
      } else if (product.toLowerCase().includes('gas') || product.toLowerCase().includes('gasolio')) {
        productDataMap.Gasolio.volume += volume;
      } else if (product.toLowerCase().includes('supreme')) {
        productDataMap.Supreme.volume += volume;
      } else {
        productDataMap.Altro.volume += volume;
      }
    }
  });

  const tankData = Object.values(productDataMap).filter(d => d.volume > 0);

  const isExpired = (dateString?: string) => {
    if (!dateString) return false;
    let parts = dateString.split(/[-/]/);
    if (parts.length !== 3) return false;
    let year, month, day;
    if (parts[0].length === 4) {
      year = parseInt(parts[0]); month = parseInt(parts[1]) - 1; day = parseInt(parts[2]);
    } else {
      day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]);
    }
    const d = new Date(year, month, day);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    return diffMonths > 24;
  };

  const performanceStats = [
    { name: 'EBITDA', value: installation.ebitda, color: installation.ebitda < 0 ? '#ef4444' : '#10b981', unit: '€' },
    { name: 'Vendite', value: installation.sell, color: '#2563eb', unit: 'L' },
  ];

  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return null;
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('3') && clean.length >= 9) clean = '39' + clean;
    if (!clean.startsWith('393') && !clean.startsWith('39') && clean.startsWith('0')) return null; 
    return `https://wa.me/${clean}`;
  };

  const waLink = getWhatsAppLink(installation.phone);
  const hasExpiredAssets = installation.rows.some(row => isExpired(row["Ultima Verifica Erogatore"]));

  const [weather, setWeather] = useState<string | null>(null);
  React.useEffect(() => {
    fetch(`https://wttr.in/${encodeURIComponent(installation.city)}?format=1`)
      .then(res => res.text())
      .then(data => {
        if (data && !data.includes('Unknown') && !data.includes('error') && data.length < 20) {
          setWeather(data.trim());
        }
      })
      .catch(() => {});
  }, [installation.city]);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, field }: { text: string, field: string }) => (
    <button 
      onClick={(e) => { e.stopPropagation(); handleCopy(text, field); }}
      className="ml-2 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors inline-flex align-middle"
    >
      {copiedField === field ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );

  const [showQR] = useState(false);
  const appBaseUrl = window.location.origin + window.location.pathname;
  const deepLinkUrl = `${appBaseUrl}?pbl=${installation.pbl}`;
  const addressQuery = encodeURIComponent(`${installation.address}, ${installation.city}, ${installation.province}`);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-0 md:p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-white w-full max-w-6xl h-full md:h-auto md:max-h-[92vh] md:rounded-xl overflow-hidden flex flex-col shadow-2xl border border-gray-200"
      >
        <div style={{ position: 'fixed', left: 0, top: 0, visibility: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
          <Plant2D installation={installation} onCapture={handleCapture} />
        </div>

        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden shadow-md">
              <Fuel className="w-5 h-5 md:w-6 md:h-6 text-white relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight uppercase">{installation.city}</h3>
                <span className="bg-gray-100 text-slate-500 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-200">
                  PBL: <span className="text-blue-600">{installation.pbl}</span> <CopyButton text={installation.pbl} field="pbl" />
                </span>
                {hasExpiredAssets && (
                  <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-rose-100 uppercase tracking-wider">
                    ⚠️ ALERT SCADENZA
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase flex items-center gap-1.5">
                <MapIcon className="w-2.5 h-2.5 md:w-3 h-3 text-blue-600" /> {installation.address}, {installation.cap} ({installation.province})
                {weather && <span className="ml-2 text-slate-500 font-bold">{weather}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleDownloadPDF} disabled={isGeneratingPDF}
              className={cn(
                "px-3 md:px-6 py-2 md:py-3 rounded-md font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm",
                isGeneratingPDF ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              )}
            >
              <FileDown className={cn("w-3 h-3 md:w-4 md:h-4", isGeneratingPDF && "animate-bounce")} />
              <span className="hidden sm:inline">{isGeneratingPDF ? 'Esportazione...' : 'Esporta PDF'}</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShow3D(!show3D)}
              className={cn(
                "px-3 md:px-4 py-2 rounded-md font-bold text-[9px] md:text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 border shadow-sm",
                show3D ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 hover:text-slate-800 border-gray-200"
              )}
            >
              {show3D ? <List className="w-3 h-3" /> : <Box className="w-3 h-3" />}
              <span className="hidden sm:inline">{show3D ? "DATI" : "VISTA 3D"}</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} onClick={onClose} className="p-2 md:p-3 text-slate-400 hover:text-rose-500 transition-all">
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-gray-50/50 font-sans text-slate-700 custom-scrollbar"
        >
          <AnimatePresence mode="wait">
            {show3D ? (
              <motion.div 
                key="3d" 
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }} 
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
                exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }} 
                className="space-y-8"
              >
                <React.Suspense fallback={<div className="w-full h-[400px] bg-white animate-slow-pulse rounded-2xl flex items-center justify-center text-slate-500 font-bold border border-gray-200 shadow-sm">Caricamento Vista 3D...</div>}>
                  <Plant3D installation={installation} />
                </React.Suspense>
              </motion.div>
            ) : (
              <motion.div 
                key="data" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                className="space-y-10"
              >
                {/* Data Sections */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm"
                >
                  <h4 className="text-[14px] font-extrabold tracking-tight text-slate-800 uppercase mb-6 flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-blue-600" /> PRESTAZIONI SISTEMA
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                      {performanceStats.map((item) => (
                        <div key={item.name} className="bg-gray-50 p-5 rounded-lg border border-gray-100 relative overflow-hidden group transition-all shadow-inner">
                          <div className="flex justify-between items-start mb-2"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.name.toUpperCase()} ATTUALE</p></div>
                          <p className="text-2xl font-bold relative z-10" style={{ color: item.color }}>{item.name === 'EBITDA' ? item.value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : `${Math.round(item.value).toLocaleString('it-IT')} ${item.unit}`}</p>
                          <div className="absolute inset-y-0 left-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-all"></div>
                        </div>
                      ))}
                      {onOpenRealTimeDashboard && (
                        <button onClick={() => onOpenRealTimeDashboard(installation)} className="w-full mt-2 p-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-between group shadow-md transition-all">
                          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center"><Activity className="w-4 h-4 text-white" /></div><div className="text-left"><p className="text-[11px] font-extrabold uppercase tracking-wider">TELEMETRIA LIVE</p><p className="text-[9px] font-medium text-white/70 mt-1 uppercase">Sincronizzazione Tempo Reale</p></div></div>
                          <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                    <div className="lg:col-span-2"><div className="h-[260px] bg-gray-50 rounded-lg p-4 border border-gray-100 shadow-inner"><ResponsiveContainer width="100%" height="100%"><BarChart data={tankData} margin={{ top: 20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="id" fontSize={10} tick={{ fill: '#64748b' }} axisLine={{stroke: '#cbd5e1'}} tickLine={false} /><YAxis fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} /><ReTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b'}} itemStyle={{color: '#1e293b'}} /><Bar dataKey="volume" radius={[4, 4, 0, 0]} barSize={40}>{tankData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div></div>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="space-y-6"
                  >
                    <h4 className="text-[14px] font-extrabold tracking-tight text-slate-800 uppercase flex items-center gap-3"><Info className="w-6 h-6 text-blue-600" /> INFORMAZIONI IMPIANTO</h4>
                    <div className="bg-white rounded-xl p-4 md:p-6 space-y-3 border border-gray-200 shadow-sm">
                      {[ { label: 'Gestore', value: installation.manager }, { label: 'Contratto Terreno', value: installation.contract }, { label: 'Contratto Gestore', value: installation.moso }, { label: 'Sonda Elettronica', value: installation.tls } ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 transition-colors hover:bg-gray-100/50"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span><span className="text-sm font-bold text-slate-700 flex items-center">{item.value || 'N/D'} {item.value && <CopyButton text={item.value} field={item.label} />}</span></div>
                      ))}
                    </div>
                  </motion.div>
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="space-y-6"
                  >
                    <h4 className="text-[14px] font-extrabold tracking-tight text-slate-800 uppercase flex items-center gap-3"><Phone className="w-6 h-6 text-blue-600" /> CONTATTI E POSIZIONE</h4>
                    <div className="bg-white rounded-xl p-4 space-y-3 border border-gray-200 shadow-sm">
                       <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"><MapIcon className="w-4 h-4 text-blue-600" /><div className="flex flex-col"><span className="text-xs font-bold text-slate-700 uppercase">{installation.city}</span><a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] font-extrabold text-blue-600 hover:underline uppercase tracking-widest mt-1">📍 Apri in Google Maps</a></div></div>
                       <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"><Phone className="w-4 h-4 text-blue-600" /><div className="flex-1 flex justify-between items-center">{installation.phone ? <div className="flex items-center"><a href={`tel:${installation.phone}`} className="text-sm font-bold text-slate-700 hover:text-blue-600">{installation.phone}</a><CopyButton text={installation.phone} field="phone" /></div> : <span className="text-sm text-slate-400">N/D</span>}{waLink && <a href={waLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all">WhatsApp</a>}</div></div>
                       <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"><Mail className="w-4 h-4 text-blue-600" />{installation.email ? <a href={`mailto:${installation.email}`} className="text-sm font-bold text-slate-700 hover:text-blue-600">{installation.email}</a> : <span className="text-sm text-slate-400">N/D</span>}</div>
                    </div>
                  </motion.div>
                </div>

                <motion.div 
                  variants={{ hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } }}
                  className="space-y-6"
                >
                  <h4 className="text-[14px] font-extrabold tracking-tight text-slate-800 uppercase flex items-center gap-3"><Database className="w-6 h-6 text-blue-600" /> ASSET DI STOCCAGGIO</h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-gray-50 text-slate-400 uppercase tracking-wider text-[9px]"><tr><th className="px-5 py-4 font-bold">Tipo</th><th className="px-5 py-4 font-bold">Prodotto</th><th className="px-5 py-4 font-bold">Capacità</th><th className="px-5 py-4 font-bold">Erogatore</th><th className="px-5 py-4 font-bold">Modello</th><th className="px-5 py-4 font-bold">Verifica</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {installation.rows.map((row, i) => {
                          const expired = isExpired(row["Ultima Verifica Erogatore"]);
                          return (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-4 font-bold text-slate-700">Serbatoio {row["ID Serbatoio"]}</td>
                              <td className="px-5 py-4 text-slate-500">{row["Prodotto Serbatoio"]}</td>
                              <td className="px-5 py-4 text-slate-500">{row["Volume Serbatoio"]} Kl</td>
                              <td className="px-5 py-4 text-slate-500">{row["ID Erogatore"]}</td>
                              <td className="px-5 py-4 text-[10px] text-slate-400 uppercase">{row["Modello Erogatore"]}</td>
                              <td className={cn("px-5 py-4 font-bold", expired ? "text-rose-500" : "text-emerald-600")}>{row["Ultima Verifica Erogatore"] || '-'} {expired && "(SCADUTO)"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default React.memo(DetailModal);
