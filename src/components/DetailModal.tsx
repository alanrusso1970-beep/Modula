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
  X
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
import { InstallationPDF } from './InstallationPDF';
import { Installation } from '../types';
import { cn } from '../lib/utils';
import Plant3D from './Plant3D';
import Plant2D from './Plant2D';
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
}

const DetailModal: React.FC<DetailModalProps> = ({ 
  installation, 
  onClose
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
    
    // Ensure we have the plan image before generating
    if (!planImageRef.current) {
      let attempts = 0;
      while (!planImageRef.current && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }

    try {
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

  const tankData: any[] = [];
  const seenTanks = new Set<string>();
  const totals = { benzina: 0, gasolio: 0, supreme: 0 };

  installation.rows.forEach(row => {
    const tankId = row["ID Serbatoio"];
    if (tankId && !seenTanks.has(tankId)) {
      seenTanks.add(tankId);
      const vol = parseFloat(row["Volume Serbatoio"]?.replace(',', '.') || '0');
      const product = row["Prodotto Serbatoio"] || 'N/D';
      const volume = isNaN(vol) ? 0 : vol;
      
      let color = '#94a3b8';
      let category = 'Altro';

      if (product.toLowerCase().includes('sspb') || product.toLowerCase().includes('benzina')) {
        color = '#10b981'; category = 'Benzina'; totals.benzina += volume;
      } else if (product.toLowerCase().includes('gas') || product.toLowerCase().includes('gasolio')) {
        color = '#f59e0b'; category = 'Gasolio'; totals.gasolio += volume;
      } else if (product.toLowerCase().includes('supreme')) {
        color = '#3b82f6'; category = 'Supreme'; totals.supreme += volume;
      }

      tankData.push({ id: tankId, volume, product, color, category });
    }
  });

  const performanceStats = [
    { name: 'EBITDA', value: installation.ebitda, color: installation.ebitda < 0 ? '#ef4444' : '#10b981', unit: '€' },
    { name: 'Sell_IN', value: installation.sell, color: '#3b82f6', unit: 'L' },
  ];

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
                <span className="bg-slate-100 text-slate-600 text-[9px] md:text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-200">PBL: {installation.pbl}</span>
              </div>
              <p className="text-slate-500 text-[10px] md:text-xs font-medium flex items-center gap-1.5">
                <MapIcon className="w-2.5 h-2.5 md:w-3 h-3 text-blue-500" /> {installation.address}, {installation.cap} ({installation.province})
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
              whileHover={{ rotate: 90, scale: 1.1 }} onClick={onClose} 
              className="p-2 md:p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50">
          <AnimatePresence mode="wait">
            {show3D ? (
              <motion.div key="3d" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
                <Plant3D installation={installation} />
              </motion.div>
            ) : (
              <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm">
                  <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-blue-600" /> Performance & Capacità
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                      {performanceStats.map((item) => (
                        <div key={item.name} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{item.name} 2025</p>
                          <p className="text-2xl font-mono font-bold" style={{ color: item.color }}>
                            {item.name === 'EBITDA' ? item.value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : `${Math.round(item.value).toLocaleString('it-IT')} ${item.unit}`}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                      <div className="h-[260px] bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={tankData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="id" fontSize={11} tick={{ fill: '#64748b' }} />
                            <YAxis fontSize={11} tick={{ fill: '#64748b' }} />
                            <ReTooltip />
                            <Bar dataKey="volume" radius={[4, 4, 0, 0]} barSize={32}>
                              {tankData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
                      <Info className="w-6 h-6 text-blue-600" /> Informazioni Generali
                    </h4>
                    <div className="bg-slate-50 rounded-xl p-4 md:p-6 space-y-3 border border-slate-200 shadow-sm">
                      {[
                        { label: 'Gestore', value: installation.manager },
                        { label: 'Contratto Terreno', value: installation.contract },
                        { label: 'Contratto Gestore', value: installation.moso },
                        { label: 'TLS', value: installation.tls }
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                          <span className="text-sm font-black text-slate-900">{item.value || 'N/D'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
                      <Phone className="w-6 h-6 text-blue-600" /> Contatti
                    </h4>
                    <div className="bg-slate-50 rounded-xl p-4 md:p-6 space-y-3 border border-slate-200">
                       <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-bold text-slate-700">{installation.phone || 'N/D'}</span>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-bold text-slate-700">{installation.email || 'N/D'}</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <Database className="w-6 h-6 text-blue-600" /> Dotazione Asset
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-3 font-bold">Tipo</th>
                          <th className="px-4 py-3 font-bold">Prodotto</th>
                          <th className="px-4 py-3 font-bold">Capacità</th>
                          <th className="px-4 py-3 font-bold">Erogatore</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {installation.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium">Serbatoio {row["ID Serbatoio"]}</td>
                            <td className="px-4 py-3">{row["Prodotto Serbatoio"]}</td>
                            <td className="px-4 py-3">{row["Volume Serbatoio"]} Kl</td>
                            <td className="px-4 py-3">{row["ID Erogatore"]}</td>
                          </tr>
                        ))}
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
