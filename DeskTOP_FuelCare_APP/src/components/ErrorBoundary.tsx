// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // In un app SPA è utile ricaricare o resettare lo stato
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 md:p-10 rounded-2xl shadow-xl max-w-md w-full border border-red-100/50 flex flex-col items-center text-center space-y-6"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Qualcosa è andato storto</h2>
              <p className="text-sm text-slate-500 font-medium">
                Si è verificato un errore imprevisto durante l'esecuzione dell'interfaccia.
              </p>
            </div>
            
            {this.state.error && (
              <div className="w-full bg-slate-100 p-3 rounded-lg overflow-x-auto">
                <p className="text-[10px] text-slate-600 font-mono text-left whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Ricarica Applicazione
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
