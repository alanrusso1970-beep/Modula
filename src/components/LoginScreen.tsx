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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 overflow-hidden">
      {/* Video Background - Benzina/Carburante */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover opacity-80"
          poster="https://images.pexels.com/photos/3196039/pexels-photo-3196039.jpeg?auto=compress&cs=tinysrgb&w=1920"
        >
          <source src="https://player.vimeo.com/external/371842363.sd.mp4?s=d4f8c0e0a8b0e0f0c0d0e0f0c0d0e0f0c0d0e0f0&profile_id=164&oauth2_token_id=57447761" type="video/mp4" />
          <source src="https://videos.pexels.com/video-files/3196039/3196039-hd_1920_1080_25fps.mp4" type="video/mp4" />
          <source src="https://videos.pexels.com/video-files/2040097/2040097-hd_1920_1080_30fps.mp4" type="video/mp4" />
        </video>
      </div>
      
      {/* Overlay più leggero per migliorare la leggibilità mantenendo visibile il video */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Vibrant Background Blobs - Enhanced */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/30 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/30 blur-[120px] rounded-full animate-pulse delay-700" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/20 blur-[100px] rounded-full animate-pulse delay-1000" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl w-full max-w-md relative z-10 border border-white/20 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/40 border border-white/20"
          >
            <Fuel className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">MODULA</h2>
          <p className="text-white/80 mt-3 font-medium text-base drop-shadow">Gestione intelligente degli impianti.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Access Key</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className={cn(
                  "w-full px-6 py-4 rounded-xl border outline-none transition-all text-lg font-bold tracking-widest bg-white/10 text-white placeholder-white/40",
                  error ? "border-red-500 ring-2 ring-red-500/40" : "border-white/30 focus:bg-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
                )}
              />
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 6px 0 0 #1d4ed8" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl transition-all shadow-[0_4px_0_0_#2563eb] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2 text-base border border-white/20"
          >
            Accedi al Sistema
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-200 text-sm font-bold text-center bg-red-500/30 py-3 rounded-xl border border-red-400/30 backdrop-blur-sm"
            >
              Accesso negato. Riprova.
            </motion.p>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-white/20 flex justify-between px-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center border border-emerald-400/30">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Analisi</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border border-blue-400/30">
              <MapIcon className="w-5 h-5 text-blue-300" />
            </div>
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Mappe</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 backdrop-blur-sm flex items-center justify-center border border-purple-400/30">
              <Database className="w-5 h-5 text-purple-300" />
            </div>
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Asset</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(LoginScreen);
