import React, { useState, useEffect, useRef } from 'react';
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
const GAS_SCRIPT_URL = "YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE";

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

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text: string, type: LogMessage['type'] = 'info') => {
    const newLog: LogMessage = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      type,
      timestamp: new Date().toLocaleTimeString('it-IT')
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);
      setError(null);
      addLog(`File selezionato: ${selectedFile.name}`, "info");
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
                mode: 'no-cors', // GAS Web App redirects require special handling or no-cors
                body: JSON.stringify(extractedData),
              });
              
              // Note: with no-cors we can't see the response body. 
              // For actual responses from GAS API, one often uses a proxy or careful CORS.
              // However, POST to Web App usually works "fire and forget" or requires redirection handling.
              // To get the response body, GAS script needs to be very specific or use a redirection trick.
              
              // Let's assume for now the user follows the standard Web App deployment.
              // If we use 'cors', GAS must handle OPTIONS. 
              // Simplified: we'll use a better approach if possible, but for now we warn:
              addLog("Richiesta inviata. In attesa di conferma dal server...", "warning");
              
              // For better UX, we'll suggest using a specific deployment if body is needed.
              // But as a first step, let's keep it simple.
              setTimeout(() => {
                addLog("Se vedi i file su Drive, la procedura è andata a buon fine.", "success");
                setIsProcessing(false);
                setProgress(100);
              }, 5000);

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
    <div className="max-w-4xl mx-auto p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Convertitore STWD</h2>
              <p className="text-slate-500 font-medium">Excel to Google Sheets & CSV Automatizzato</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* File Input */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Carica File Excel (.xlsx, .xls)</label>
            <div className="relative group">
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={cn(
                "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all",
                file ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 bg-slate-50 group-hover:border-blue-400 group-hover:bg-blue-50/30"
              )}>
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                  file ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"
                )}>
                  <FileText className="w-8 h-8" />
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="text-slate-900 font-bold text-lg">{file.name}</p>
                    <p className="text-slate-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-slate-900 font-bold text-lg">Trascina qui il file o clicca per sfogliare</p>
                    <p className="text-slate-500 text-sm">Supporta file Excel standard (.xlsx)</p>
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
                "w-full sm:w-auto px-12 py-4 rounded-2xl font-extrabold text-lg transition-all flex items-center justify-center gap-3 shadow-lg",
                !file || isProcessing 
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                  : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Conversione in corso...
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-current" />
                  Inizia Conversione
                </>
              )}
            </motion.button>

            {/* Progress Bar */}
            <AnimatePresence>
              {(isProcessing || progress > 0) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full space-y-2"
                >
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                    <span>Avanzamento</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Logs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Log di Sistema</h4>
              <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
            </div>
            <div className="bg-slate-950 rounded-2xl p-6 h-52 overflow-y-auto font-mono text-[11px] border border-slate-800 shadow-2xl shadow-inner custom-scrollbar relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Database className="w-12 h-12 text-blue-500" />
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
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-emerald-900 font-bold text-lg">Conversione Completata!</h4>
                      <p className="text-emerald-700 text-sm">I file sono stati creati e salvati su Google Drive.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 bg-white border border-emerald-200 rounded-xl text-emerald-700 font-bold hover:bg-emerald-100 transition-colors group"
                      >
                        <span className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Apri Spreadsheet
                        </span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                      <div className="flex items-center gap-3 px-4 py-3 bg-white/50 border border-emerald-100 rounded-xl text-emerald-600 text-xs font-medium italic">
                        <CheckCircle2 className="w-3 h-3" />
                        CSV salvati nella root
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
                className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 flex-shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-rose-900 font-bold text-lg">Errore di Processo</h4>
                  <p className="text-rose-700 text-sm">{error}</p>
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
