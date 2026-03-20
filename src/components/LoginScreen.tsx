import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Fuel, ChevronRight, TrendingUp, Map as MapIcon, Database } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (password === 'toil') {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-[2000] flex items-center justify-center p-4 overflow-hidden liquid-bg">
      {/* Vibrant Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-400/20 blur-[120px] rounded-full animate-pulse delay-700" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-400/10 blur-[100px] rounded-full animate-pulse delay-1000" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="bg-white p-10 rounded-3xl w-full max-w-md relative z-10 border border-slate-200 shadow-xl"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20"
          >
            <Fuel className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">MODULA</h2>
          <p className="text-slate-500 mt-3 font-medium text-base">Gestione intelligente degli impianti.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Key</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className={cn(
                  "w-full px-6 py-4 rounded-xl border outline-none transition-all text-lg font-bold tracking-widest bg-slate-50",
                  error ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                )}
              />
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_4px_0_0_#2563eb] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2 text-base"
          >
            Accedi al Sistema
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-600 text-sm font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100"
            >
              Accesso negato. Riprova.
            </motion.p>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between px-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Analisi</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <MapIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mappe</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Asset</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(LoginScreen);
