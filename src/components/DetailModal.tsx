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
    Supreme: { id: 'Supreme', volume: 0, color: '#3b82f6' },
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
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-0 md:p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(20px)', y: 20 }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
        exit={{ opacity: 0, scale: 0.98, filter: 'blur(20px)', y: 20 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-slate-950/80 w-full max-w-6xl h-full md:h-auto md:max-h-[95vh] md:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10 glass-morphism premium-shadow"
      >
        <div style={{ position: 'fixed', left: 0, top: 0, visibility: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
          <Plant2D installation={installation} onCapture={handleCapture} />
        </div>

        <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 border-2 border-slate-700 rounded-sm flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/10" />
              <Fuel className="w-5 h-5 md:w-6 md:h-6 text-blue-400 relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-lg md:text-xl font-black text-slate-100 tracking-[0.1em]">{installation.city}</h3>
                <span className="bg-slate-800 text-slate-400 text-[9px] md:text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm border border-slate-700/50 shadow-inner">
                  PBL: <span className="text-slate-200">{installation.pbl}</span> <CopyButton text={installation.pbl} field="pbl" />
                </span>
                {hasExpiredAssets && (
                  <span className="bg-rose-500/10 text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 animate-pulse border border-rose-500/50 ml-1 uppercase tracking-widest">
                    ⚠️ ALERT: EXP
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-[10px] md:text-xs font-mono uppercase flex items-center gap-1.5">
                <MapIcon className="w-2.5 h-2.5 md:w-3 h-3 text-blue-500" /> {installation.address}, {installation.cap} ({installation.province})
                {weather && <span className="ml-2 bg-slate-950 text-slate-400 px-2 py-0.5 rounded-sm border border-slate-800 text-[10px] font-bold shadow-inner">{weather}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleDownloadPDF} disabled={isGeneratingPDF}
              className={cn(
                "px-3 md:px-6 py-2 md:py-3 rounded-sm font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 border active:shadow-none active:translate-y-1",
                isGeneratingPDF ? "bg-slate-800 text-slate-600 border-slate-700" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/20 shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]"
              )}
            >
              <FileDown className={cn("w-3 h-3 md:w-4 md:h-4", isGeneratingPDF && "animate-bounce")} />
              <span className="hidden sm:inline">{isGeneratingPDF ? 'Generating...' : 'Export_PDF'}</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShow3D(!show3D)}
              className={cn(
                "px-3 md:px-4 py-1.5 md:py-2 rounded-sm font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-1.5 border active:shadow-none active:translate-y-1",
                show3D ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]" : "bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-500 shadow-inner"
              )}
            >
              {show3D ? <List className="w-3 h-3" /> : <Box className="w-3 h-3" />}
              <span className="hidden sm:inline">{show3D ? "DATA" : "VIEW_3D"}</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowQR(!showQR)}
              className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-sm flex items-center justify-center transition-all border",
                showQR ? "bg-slate-200 text-slate-900 border-slate-300 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-500 shadow-inner"
              )}
            >
              <QrCode className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
            <motion.button whileHover={{ rotate: 90, scale: 1.1 }} onClick={onClose} className="p-2 md:p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/30 rounded-sm transition-all shadow-[inset_0_0_8px_rgba(244,63,94,0.2)]">
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {showQR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="absolute top-20 right-4 md:top-24 md:right-8 bg-slate-900 p-5 rounded-sm shadow-2xl border border-slate-700 z-[4000] flex flex-col items-center gap-3"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NAV_LINK</p>
            <div className="bg-white p-2 rounded-sm"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(deepLinkUrl)}`} alt="QR Code" className="w-32 h-32" /></div>
            <button onClick={() => handleCopy(deepLinkUrl, 'qr-link')} className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors py-1 uppercase tracking-widest bg-blue-900/20 border border-blue-500/30 rounded-sm">
              {copiedField === 'qr-link' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} COPY LINK
            </button>
          </motion.div>
        )}

        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-transparent font-mono text-slate-300 custom-scrollbar"
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
                <React.Suspense fallback={<div className="w-full h-[400px] bg-white/5 animate-slow-pulse rounded-2xl flex items-center justify-center text-slate-500 font-bold border border-white/5">Caricamento Vista 3D...</div>}>
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
                  className="bg-slate-900/50 rounded-2xl p-4 md:p-6 border border-white/5 shadow-xl backdrop-blur-md"
                >
                  <h4 className="text-[14px] font-black tracking-[0.2em] text-slate-200 uppercase mb-6 flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-blue-500" /> SYS_PERFORMANCE
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                      {performanceStats.map((item) => (
                        <div key={item.name} className="bg-slate-950 p-5 rounded-sm border border-slate-800 relative overflow-hidden group transition-all shadow-inner">
                          <div className="flex justify-between items-start mb-2"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.name}_ACTUAL</p></div>
                          <p className="text-2xl font-mono font-black relative z-10" style={{ color: item.color, textShadow: `0 0 8px ${item.color}40` }}>{item.name === 'EBITDA' ? item.value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : `${Math.round(item.value).toLocaleString('it-IT')} ${item.unit}`}</p>
                          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-blue-500 to-transparent group-hover:via-blue-400 opacity-50 transition-all"></div>
                        </div>
                      ))}
                      {onOpenRealTimeDashboard && (
                        <button onClick={() => onOpenRealTimeDashboard(installation)} className="w-full mt-2 p-4 rounded-sm bg-slate-800 border border-blue-500/30 hover:border-blue-400 text-blue-400 flex items-center justify-between group shadow-[inset_0_0_15px_rgba(59,130,246,0.1)] active:scale-[0.98] transition-all">
                          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-sm bg-blue-500/10 flex items-center justify-center border border-blue-500/50"><Activity className="w-4 h-4 text-blue-400" /></div><div className="text-left text-slate-200"><p className="text-[11px] font-black uppercase tracking-widest drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">LIVE_TELEMETRY</p><p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">MoM Synchronized</p></div></div>
                          <ChevronRight className="w-5 h-5 text-blue-500 group-hover:text-blue-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                    <div className="lg:col-span-2"><div className="h-[260px] bg-slate-950 rounded-sm p-4 border border-slate-800 shadow-inner"><ResponsiveContainer width="100%" height="100%"><BarChart data={tankData} margin={{ top: 20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" /><XAxis dataKey="id" fontSize={10} tick={{ fill: '#64748b' }} axisLine={{stroke: '#334155'}} tickLine={false} /><YAxis fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} /><ReTooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', color: '#f1f5f9'}} itemStyle={{color: '#f1f5f9'}} /><Bar dataKey="volume" radius={[2, 2, 0, 0]} barSize={40}>{tankData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div></div>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    className="space-y-6"
                  >
                    <h4 className="text-[14px] font-black tracking-[0.2em] text-slate-200 uppercase flex items-center gap-3"><Info className="w-6 h-6 text-blue-500" /> NODE_INFO</h4>
                    <div className="bg-slate-900/40 rounded-2xl p-4 md:p-6 space-y-3 border border-white/5 shadow-md backdrop-blur-sm">
                      {[ { label: 'Gestore', value: installation.manager }, { label: 'Contratto Terreno', value: installation.contract }, { label: 'Contratto Gestore', value: installation.moso }, { label: 'Misura di Elettronico', value: installation.tls } ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-white/5 shadow-inner transition-colors hover:bg-white/5"><span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span><span className="text-sm font-black text-slate-300 flex items-center">{item.value || 'N/D'} {item.value && <CopyButton text={item.value} field={item.label} />}</span></div>
                      ))}
                    </div>
                  </motion.div>
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    className="space-y-6"
                  >
                    <h4 className="text-[14px] font-black tracking-[0.2em] text-slate-200 uppercase flex items-center gap-3"><Phone className="w-6 h-6 text-blue-500" /> CONTACTS</h4>
                    <div className="bg-slate-900/40 rounded-2xl p-4 space-y-3 border border-white/5 shadow-md backdrop-blur-sm">
                       <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-xl shadow-inner border border-white/5"><MapIcon className="w-4 h-4 text-emerald-500" /><div className="flex flex-col"><span className="text-xs font-bold text-slate-300 uppercase">{installation.city}</span><a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest mt-1">📍 Google Maps</a></div></div>
                       <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-xl shadow-inner border border-white/5"><Phone className="w-4 h-4 text-blue-500" /><div className="flex-1 flex justify-between items-center">{installation.phone ? <div className="flex items-center"><a href={`tel:${installation.phone}`} className="text-sm font-bold text-blue-400 hover:text-blue-300 underline">{installation.phone}</a><CopyButton text={installation.phone} field="phone" /></div> : <span className="text-sm">N/D</span>}{waLink && <a href={waLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">WhatsApp</a>}</div></div>
                       <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-xl shadow-inner border border-white/5"><Mail className="w-4 h-4 text-blue-500" />{installation.email ? <a href={`mailto:${installation.email}`} className="text-sm font-bold text-blue-400 hover:text-blue-300 underline">{installation.email}</a> : <span className="text-sm">N/D</span>}</div>
                    </div>
                  </motion.div>
                </div>

                <motion.div 
                  variants={{
                    hidden: { opacity: 0, scale: 0.98 },
                    show: { opacity: 1, scale: 1 }
                  }}
                  className="space-y-6"
                >
                  <h4 className="text-[14px] font-black tracking-[0.2em] text-slate-200 uppercase flex items-center gap-3"><Database className="w-6 h-6 text-blue-500" /> STORAGE_ASSETS</h4>
                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/40 shadow-xl backdrop-blur-md">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-950/80 text-slate-500 uppercase tracking-widest text-[9px]"><tr><th className="px-5 py-4 font-black">Tipo</th><th className="px-5 py-4 font-black">Prodotto</th><th className="px-5 py-4 font-black">Capacità</th><th className="px-5 py-4 font-black">Erogatore</th><th className="px-5 py-4 font-black">Modello</th><th className="px-5 py-4 font-black">Ultima Verifica</th></tr></thead>
                      <tbody className="divide-y divide-white/5">
                        {installation.rows.map((row, i) => {
                          const expired = isExpired(row["Ultima Verifica Erogatore"]);
                          return (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="px-5 py-4 font-bold text-slate-300">Serbatoio {row["ID Serbatoio"]}</td>
                              <td className="px-5 py-4 text-slate-400">{row["Prodotto Serbatoio"]}</td>
                              <td className="px-5 py-4 text-slate-400">{row["Volume Serbatoio"]} Kl</td>
                              <td className="px-5 py-4 text-slate-400">{row["ID Erogatore"]}</td>
                              <td className="px-5 py-4 text-[10px] text-slate-500 uppercase">{row["Modello Erogatore"]}</td>
                              <td className={cn("px-5 py-4 font-bold font-mono tracking-widest", expired ? "text-rose-500" : "text-emerald-500")}>{row["Ultima Verifica Erogatore"] || '-'} {expired && "(⚠️ EXP)"}</td>
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
