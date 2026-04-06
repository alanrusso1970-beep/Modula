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
    Supreme: { id: 'Supreme', volume: 0, color: '#3b82f6' },
    Altro: { id: 'Altro', volume: 0, color: '#94a3b8' }
  };

  const seenTanks = new Set<string>();
  installation.rows.forEach(row => {
    const tankId = row["ID Serbatoio"];
    if (tankId && !seenTanks.has(tankId)) {
      seenTanks.add(tankId);
      const vol = parseFloat(row["Volume Serbatoio"]?.replace(',', '.') || '0');
      const product = row["Prodotto Serbatoio"] || 'N/D';
      const volume = isNaN(vol) ? 0 : vol;

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
    { name: 'Sell_IN', value: installation.sell, color: '#3b82f6', unit: 'L' },
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

  const [showQR, setShowQR] = useState(false);
  const appBaseUrl = window.location.origin + window.location.pathname;
  const deepLinkUrl = `${appBaseUrl}?pbl=${installation.pbl}`;
  const addressQuery = encodeURIComponent(`${installation.address}, ${installation.city}, ${installation.province}`);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] md:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
      >
        <div style={{ position: 'fixed', left: 0, top: 0, visibility: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
          <Plant2D installation={installation} onCapture={handleCapture} />
        </div>

        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-10 h-10 md:w-12 md:h-12 vivid-gradient rounded-xl flex items-center justify-center shadow-md">
              <Fuel className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">{installation.city}</h3>
                <span className="bg-slate-100 text-slate-600 text-[9px] md:text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-200">
                  PBL: {installation.pbl} <CopyButton text={installation.pbl} field="pbl" />
                </span>
                {hasExpiredAssets && (
                  <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse border border-red-200 ml-1">
                    ⚠️ Verifica Scaduta
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-[10px] md:text-xs font-medium flex items-center gap-1.5">
                <MapIcon className="w-2.5 h-2.5 md:w-3 h-3 text-blue-500" /> {installation.address}, {installation.cap} ({installation.province})
                {weather && <span className="ml-2 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 text-[10px] font-bold shadow-sm">{weather}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleDownloadPDF} disabled={isGeneratingPDF}
              className={cn(
                "px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_4px_0_0_#10b981] active:shadow-none active:translate-y-1",
                isGeneratingPDF ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
              )}
            >
              <FileDown className={cn("w-3 h-3 md:w-4 md:h-4", isGeneratingPDF && "animate-bounce")} />
              <span className="hidden sm:inline">{isGeneratingPDF ? 'Generazione...' : 'Report PDF'}</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShow3D(!show3D)}
              className={cn(
                "px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 active:shadow-none active:translate-y-1",
                show3D ? "vivid-gradient text-white shadow-[0_2px_0_0_#4f46e5]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {show3D ? <List className="w-3 h-3" /> : <Box className="w-3 h-3" />}
              <span className="hidden sm:inline">{show3D ? "Dati" : "3D"}</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowQR(!showQR)}
              className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-all",
                showQR ? "bg-slate-800 text-white shadow-md shadow-slate-800/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <QrCode className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
            <motion.button whileHover={{ rotate: 90, scale: 1.1 }} onClick={onClose} className="p-2 md:p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {showQR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="absolute top-20 right-4 md:top-24 md:right-8 bg-white p-5 rounded-2xl shadow-2xl border border-slate-100 z-[4000] flex flex-col items-center gap-3"
          >
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Naviga all'impianto</p>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(deepLinkUrl)}`} alt="QR Code" className="w-32 h-32 rounded-lg" />
            <button onClick={() => handleCopy(deepLinkUrl, 'qr-link')} className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors py-1">
              {copiedField === 'qr-link' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} copia link
            </button>
          </motion.div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50">
          <AnimatePresence mode="wait">
            {show3D ? (
              <motion.div key="3d" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
                <React.Suspense fallback={<div className="w-full h-[400px] bg-slate-100 animate-pulse rounded-[2rem] flex items-center justify-center text-slate-400 font-bold">Caricamento Vista 3D...</div>}>
                  <Plant3D installation={installation} />
                </React.Suspense>
              </motion.div>
            ) : (
              <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">

                {/* Data Sections */}
                <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm">
                  <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3"><TrendingUp className="w-6 h-6 text-blue-600" /> Performance & Capacità</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                      {performanceStats.map((item) => (
                        <div key={item.name} className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative overflow-hidden group transition-all">
                          <div className="flex justify-between items-start mb-2"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.name} 2025</p></div>
                          <p className="text-2xl font-mono font-bold relative z-10" style={{ color: item.color }}>{item.name === 'EBITDA' ? item.value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : `${Math.round(item.value).toLocaleString('it-IT')} ${item.unit}`}</p>
                          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent group-hover:via-blue-300 transition-all"></div>
                        </div>
                      ))}
                      {onOpenRealTimeDashboard && (
                        <button onClick={() => onOpenRealTimeDashboard(installation)} className="w-full mt-2 p-4 rounded-xl vivid-gradient text-white flex items-center justify-between group shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all">
                          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Activity className="w-4 h-4 text-white" /></div><div className="text-left"><p className="text-xs font-black uppercase tracking-wider">Vendite Live</p><p className="text-[9px] font-medium text-blue-100 mt-0.5">Dati aggiornati MESE/MESE</p></div></div>
                          <ChevronRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                    <div className="lg:col-span-2"><div className="h-[260px] bg-slate-50 rounded-xl p-4 border border-slate-200"><ResponsiveContainer width="100%" height="100%"><BarChart data={tankData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="id" fontSize={11} tick={{ fill: '#64748b' }} /><YAxis fontSize={11} tick={{ fill: '#64748b' }} /><ReTooltip /><Bar dataKey="volume" radius={[4, 4, 0, 0]} barSize={32}>{tankData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-3"><Info className="w-6 h-6 text-blue-600" /> Informazioni Generali</h4>
                    <div className="bg-slate-50 rounded-xl p-4 md:p-6 space-y-3 border border-slate-200 shadow-sm">
                      {[ { label: 'Gestore', value: installation.manager }, { label: 'Contratto Terreno', value: installation.contract }, { label: 'Contratto Gestore', value: installation.moso }, { label: 'Misura di Elettronico', value: installation.tls } ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</span><span className="text-sm font-black text-slate-900 flex items-center">{item.value || 'N/D'} {item.value && <CopyButton text={item.value} field={item.label} />}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-3"><Phone className="w-6 h-6 text-blue-600" /> Contatti</h4>
                    <div className="bg-white rounded-xl p-4 space-y-3 border border-slate-200 shadow-sm">
                       <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"><MapIcon className="w-4 h-4 text-emerald-600" /><div className="flex flex-col"><span className="text-sm font-bold text-slate-800">{installation.city}</span><a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-emerald-600 uppercase">📍 Google Maps</a></div></div>
                       <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"><Phone className="w-4 h-4 text-blue-600" /><div className="flex-1 flex justify-between items-center">{installation.phone ? <div className="flex items-center"><a href={`tel:${installation.phone}`} className="text-sm font-bold text-blue-600 underline">{installation.phone}</a><CopyButton text={installation.phone} field="phone" /></div> : <span className="text-sm">N/D</span>}{waLink && <a href={waLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-green-50 text-green-600 rounded text-[10px] font-black uppercase">WhatsApp</a>}</div></div>
                       <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"><Mail className="w-4 h-4 text-blue-600" />{installation.email ? <a href={`mailto:${installation.email}`} className="text-sm font-bold text-blue-600 underline">{installation.email}</a> : <span className="text-sm">N/D</span>}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-black text-slate-900 flex items-center gap-3"><Database className="w-6 h-6 text-blue-600" /> Dotazione Asset</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase"><tr><th className="px-4 py-3 font-bold">Tipo</th><th className="px-4 py-3 font-bold">Prodotto</th><th className="px-4 py-3 font-bold">Capacità</th><th className="px-4 py-3 font-bold">Erogatore</th><th className="px-4 py-3 font-bold">Modello</th><th className="px-4 py-3 font-bold">Ultima Verifica</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {installation.rows.map((row, i) => {
                          const expired = isExpired(row["Ultima Verifica Erogatore"]);
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-4 py-3">Serbatoio {row["ID Serbatoio"]}</td>
                              <td className="px-4 py-3">{row["Prodotto Serbatoio"]}</td>
                              <td className="px-4 py-3">{row["Volume Serbatoio"]} Kl</td>
                              <td className="px-4 py-3">{row["ID Erogatore"]}</td>
                              <td className="px-4 py-3 text-[10px]">{row["Modello Erogatore"]}</td>
                              <td className={cn("px-4 py-3 font-bold", expired && "text-red-500")}>{row["Ultima Verifica Erogatore"] || '-'} {expired && "(⚠️)"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(DetailModal);
