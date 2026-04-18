import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Play, CheckCircle2, AlertCircle, Loader2, ExternalLink, FileText, ChevronRight, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';

// Declare google for TypeScript
declare global {
  interface Window {
    google: any;
  }
}

// TO THE USER: After deploying the backend.gs as a Web App in Google Apps Script, 
// copy the "Web App URL" and paste it here.
const GAS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxH2e9uh_DrzmBv7sfuwfN0drXedcpHtq3YFPWlKpA2F-3gn7EbvfBR9nfxzX7ksSfG/exec";

interface LogMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
}

const ExcelConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [result, setResult] = useState<{ url: string; csvs: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const instanceId = useMemo(() => Math.random().toString(36).slice(2, 8).toUpperCase(), []);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text: string, type: LogMessage['type'] = 'info') => {
    const newLog: LogMessage = {
      id: Math.random().toString(36).slice(2, 11),
      text,
      type,
      timestamp: new Date().toLocaleTimeString('it-IT')
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Security & Validation
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        setError("Formato file non valido. Carica un file .xlsx o .xls");
        addLog("Errore: Formato file non supportato", "error");
        return;
      }

      if (selectedFile.size > 20 * 1024 * 1024) {
        setError("File troppo grande. Massimo 20MB consentiti.");
        addLog("Errore: Dimensioni file eccedono 20MB", "error");
        return;
      }

      setFile(selectedFile);
      setResult(null);
      setError(null);
      addLog(`File selezionato: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`, "info");
    }
  };

  const handleSuccess = (response: any) => {
    if (response.success) {
      setProgress(100);
      addLog("Backend GAS: Elaborazione completata!", "success");
      addLog(`Spreadsheet creato: ${response.spreadsheetUrl}`, "success");
      response.csvFiles.forEach((f: string) => addLog(`CSV salvato: ${f}`, "success"));
      setResult({ url: response.spreadsheetUrl, csvs: response.csvFiles });
      setIsProcessing(false);

      // Celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#6366f1']
      });
    } else {
      handleError(response.message);
    }
  };

  const startConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setResult(null);
    setError(null);
    setLogs([]);
    addLog("Inizio scansione workbook...", "info");

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          setProgress(30);
          addLog(`Workbook letto. Fogli trovati: ${workbook.SheetNames.join(', ')}`, "info");

          const targetSheets = ["DATI_YTD", "DatiLPG"];
          const extractedData: Record<string, any[][]> = {};

          for (const sheetName of targetSheets) {
            if (workbook.SheetNames.includes(sheetName)) {
              addLog(`Estrazione dati da: ${sheetName}`, "info");
              const worksheet = workbook.Sheets[sheetName];
              const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
              extractedData[sheetName] = json as any[][];
            } else {
              throw new Error(`Foglio obbligatorio "${sheetName}" non trovato nel file Excel.`);
            }
          }

          setProgress(60);
          addLog("Dati estratti. Invio al backend Google Drive...", "info");

          // Modalità 1: Google Apps Script Native (quando l'app è ospitata su Google)
          if (window.google && window.google.script && window.google.script.run) {
            window.google.script.run
              .withSuccessHandler(handleSuccess)
              .withFailureHandler((err: any) => {
                handleError(`Errore GAS: ${err.message || err.toString()}`);
              })
              .processExcelData(extractedData);
          }
          // Modalità 2: API HTTP (quando l'app è su Cloudflare o locale)
          else if (GAS_SCRIPT_URL && !GAS_SCRIPT_URL.includes("YOUR_GOOGLE_SCRIPT")) {
            try {
              addLog("Connessione API esterna in corso...", "info");
              const response = await fetch(GAS_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors', // Changed from 'no-cors' to 'cors' to handle response
                headers: {
                  'Content-Type': 'text/plain;charset=utf-8', // Using text/plain to avoid CORS preflight issues with GAS
                },
                body: JSON.stringify(extractedData),
              });

              if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
              }

              const resText = await response.text();
              try {
                const resJson = JSON.parse(resText);
                handleSuccess(resJson);
              } catch (e) {
                // If it's not JSON, it might be a redirect or error page
                addLog("Risposta ricevuta, ma il formato non è JSON. Controlla i permessi dello script.", "warning");
                addLog("Tentativo di chiusura forzata con successo...", "info");
                setTimeout(() => {
                  setIsProcessing(false);
                  setProgress(100);
                }, 2000);
              }

            } catch (err: any) {
              handleError(`Errore API: ${err.message}`);
            }
          }
          else {
            // Mock response for local development
            setTimeout(() => {
              addLog("MOCK: Integrazione simulata (Script URL non configurato).", "warning");
              handleSuccess({
                success: true,
                spreadsheetUrl: "https://docs.google.com/spreadsheets/d/mock-id",
                csvFiles: ["DATI_YTD_mock.csv", "DatiLPG_mock.csv"]
              });
            }, 2000);
          }
        } catch (err: any) {
          handleError(err.message || "Errore durante la lettura del file.");
        }
      };

      reader.onerror = () => handleError("Errore nel caricamento del file.");
      reader.readAsArrayBuffer(file);

    } catch (err: any) {
      handleError(err.message || "Si è verificato un errore imprevisto.");
    }
  };

  const handleError = (msg: string) => {
    addLog(msg, "error");
    setError(msg);
    setIsProcessing(false);
    setProgress(0);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(20px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="bg-slate-950/60 rounded-3xl border border-white/10 shadow-2xl overflow-hidden glass-morphism premium-shadow"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-transparent shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-500/10 border border-white/10 rounded-xl flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-widest">DATA_CONVERTER</h2>
              <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-1">EXCEL_TO_CLOUD_PROTOCOL_V.1.0</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* File Input */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 opacity-60">UPLOAD_SOURCE</label>
            <div className="relative group">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={cn(
                "border border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all bg-white/5 shadow-2xl backdrop-blur-md border-white/10",
                file ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "hover:border-blue-500/40 hover:bg-white/10"
              )}>
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 border shadow-lg backdrop-blur-md",
                  file ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-slate-600 border-white/5"
                )}>
                  <FileText className="w-10 h-10" />
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="text-emerald-400 font-mono font-bold text-base tracking-tight">{file.name}</p>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-2">{((file.size / 1024) / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">Drag and drop file or click</p>
                    <p className="text-slate-600 text-[10px] font-mono uppercase tracking-widest mt-2">XLSX, XLS · MAX 20MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startConversion}
              disabled={!file || isProcessing}
              className={cn(
                "w-full sm:w-auto px-16 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 border shadow-2xl glass-card premium-shadow",
                !file || isProcessing
                  ? "opacity-50 cursor-not-allowed border-white/5"
                  : "bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  PROCESSING_PROTOCOL...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  INITIATE_UPGRADE
                </>
              )}
            </motion.button>

            {/* Progress Bar */}
            <AnimatePresence>
              {(isProcessing || progress > 0) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full space-y-4 mt-6"
                >
                  <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">
                    <span>UPLOAD_INTEGRITY</span>
                    <span className="text-blue-400 drop-shadow-[0_0_5px_currentColor]">{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      className="h-full bg-blue-500 relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                    >
                      <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Logs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Log di Sistema</h4>
              <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {instanceId}</span>
            </div>
            <div className="bg-slate-900/40 rounded-2xl p-6 h-56 overflow-y-auto font-mono text-[11px] border border-white/5 shadow-inner backdrop-blur-md custom-scrollbar relative">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Database className="w-16 h-16 text-blue-500" />
              </div>
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-2 opacity-50">
                  <Loader2 className="w-5 h-5 animate-pulse" />
                  <p className="italic">In attesa di attività...</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {logs.map((log) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={log.id}
                      className="flex gap-4 border-l-2 border-transparent hover:border-slate-700 pl-2 transition-colors"
                    >
                      <span className="text-slate-600 whitespace-nowrap shrink-0">{log.timestamp}</span>
                      <span className={cn(
                        "break-all leading-relaxed",
                        log.type === 'error' ? "text-rose-400 font-bold" :
                          log.type === 'success' ? "text-emerald-400 font-bold" :
                            log.type === 'warning' ? "text-amber-400" :
                              "text-slate-400"
                      )}>
                        {log.text}
                      </span>
                    </motion.div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Results Area */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/5 border border-emerald-500/30 rounded-sm p-6 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] mt-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-sm flex items-center justify-center text-emerald-400 flex-shrink-0 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-emerald-400 font-black text-[13px] tracking-widest uppercase drop-shadow-sm">SYSTEM_TASK_COMPLETE</h4>
                      <p className="text-emerald-500/70 text-[10px] font-mono mt-1">DATA_EXTRACTED_AND_UPLOADED_TO_DRIVE.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 bg-slate-900 border border-emerald-500/50 rounded-sm text-emerald-400 text-xs font-bold uppercase tracking-widest hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all group"
                      >
                        <span className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          ACCESS_SHEET
                        </span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 border border-emerald-500/20 rounded-sm text-emerald-500 text-[10px] font-mono uppercase">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        CSV_SAVED_IN_ROOT_DIRECTORY
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-rose-500/10 border border-rose-500/30 rounded-sm p-6 flex items-start gap-4 shadow-[inset_0_0_20px_rgba(244,63,94,0.1)] mt-4"
              >
                <div className="w-10 h-10 bg-rose-500/20 rounded-sm flex items-center justify-center text-rose-500 flex-shrink-0 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-rose-500 font-black text-[13px] tracking-widest uppercase drop-shadow-[0_0_5px_rgba(244,63,94,0.3)]">CRITICAL_PROCESS_ERROR</h4>
                  <p className="text-rose-400/80 text-[10px] font-mono mt-1">{"> "} {error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ExcelConverter;
