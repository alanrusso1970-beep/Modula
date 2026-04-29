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

const GAS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwaxTXHi4RXmgdTWMMWPnABqnxroWRbYNv6BsWWz73bvxeV_g56R7_yiZFbdl_WjOLa/exec";

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
      addLog("Backend: Elaborazione completata!", "success");
      addLog(`Spreadsheet creato: ${response.spreadsheetUrl}`, "success");
      response.csvFiles.forEach((f: string) => addLog(`CSV salvato: ${f}`, "success"));
      setResult({ url: response.spreadsheetUrl, csvs: response.csvFiles });
      setIsProcessing(false);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#2563eb', '#3b82f6']
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
    addLog("Inizio scansione foglio di calcolo...", "info");

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          setProgress(30);
          addLog(`Workbook letto correttamente. Fogli trovati: ${workbook.SheetNames.join(', ')}`, "info");

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

          if (window.google && window.google.script && window.google.script.run) {
            window.google.script.run
              .withSuccessHandler(handleSuccess)
              .withFailureHandler((err: any) => {
                handleError(`Errore Google Script: ${err.message || err.toString()}`);
              })
              .processExcelData(extractedData);
          }
          else if (GAS_SCRIPT_URL && !GAS_SCRIPT_URL.includes("YOUR_GOOGLE_SCRIPT")) {
            try {
              addLog("Connessione API esterna in corso...", "info");
              const response = await fetch(GAS_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                  'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(extractedData),
              });

              if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
              }

              const resText = await response.text();
              try {
                const resJson = JSON.parse(resText);
                handleSuccess(resJson);
              } catch (e) {
                addLog("Risposta ricevuta, ma il formato non è JSON.", "warning");
                addLog("Chiusura forzata con successo...", "info");
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
            setTimeout(() => {
              addLog("Integrazione simulata (URL script non configurato).", "warning");
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
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">Convertitore Dati</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Excel verso Cloud — Protocollo Modula</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 bg-gray-50/30">
          {/* File Input */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Caricamento Sorgente</label>
            <div className="relative group">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={cn(
                "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all bg-white shadow-sm",
                file ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              )}>
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 border shadow-sm",
                  file ? "bg-emerald-100 text-emerald-600 border-emerald-200" : "bg-gray-50 text-slate-300 border-gray-100"
                )}>
                  <FileText className="w-10 h-10" />
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="text-emerald-700 font-extrabold text-base tracking-tight">{file.name}</p>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-2">{((file.size / 1024) / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-slate-600 font-extrabold text-sm uppercase tracking-widest">Trascina il file qui o clicca</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">XLSX, XLS · MAX 20MB</p>
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
                "w-full sm:w-auto px-16 py-5 rounded-xl font-extrabold uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 border shadow-lg",
                !file || isProcessing
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Elaborazione in corso...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Avvia Conversione
                </>
              )}
            </motion.button>

            {/* Progress Bar */}
            <AnimatePresence>
              {(isProcessing || progress > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="w-full space-y-4 mt-6"
                >
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    <span>Integrità Caricamento</span>
                    <span className="text-blue-600 font-extrabold">{progress}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden border border-gray-100">
                    <motion.div
                      className="h-full bg-blue-600 relative overflow-hidden"
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
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Log di Sistema</h4>
              <span className="text-[10px] font-bold text-slate-300 font-mono">SESSIONE: {instanceId}</span>
            </div>
            <div className="bg-white rounded-2xl p-6 h-56 overflow-y-auto font-mono text-[11px] border border-gray-200 shadow-inner custom-scrollbar relative">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Database className="w-16 h-16 text-blue-600" />
              </div>
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
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
                      className="flex gap-4 border-l-2 border-transparent hover:border-gray-100 pl-2 transition-colors"
                    >
                      <span className="text-slate-400 whitespace-nowrap shrink-0">{log.timestamp}</span>
                      <span className={cn(
                        "break-all leading-relaxed",
                        log.type === 'error' ? "text-rose-600 font-bold" :
                          log.type === 'success' ? "text-emerald-600 font-bold" :
                            log.type === 'warning' ? "text-amber-600" :
                              "text-slate-500"
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
                className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm mt-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0 border border-emerald-200 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-emerald-800 font-extrabold text-[13px] tracking-widest uppercase">Operazione Completata</h4>
                      <p className="text-emerald-600/70 text-[10px] font-bold mt-1 uppercase tracking-tight">I dati sono stati estratti e caricati su Drive.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 bg-white border border-emerald-200 rounded-lg text-emerald-700 text-xs font-bold uppercase tracking-widest hover:bg-emerald-50 transition-all group shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Apri Foglio
                        </span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-100/50 border border-emerald-200 rounded-lg text-emerald-700 text-[10px] font-bold uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        CSV salvati nella cartella root
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
                className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex items-start gap-4 shadow-sm mt-4"
              >
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 flex-shrink-0 border border-rose-200 shadow-sm">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-rose-800 font-extrabold text-[13px] tracking-widest uppercase">Errore di Processo</h4>
                  <p className="text-rose-600 text-[10px] font-bold mt-1 uppercase tracking-tight">{error}</p>
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
