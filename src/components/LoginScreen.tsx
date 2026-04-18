import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Factory, ChevronRight, Activity, Map as MapIcon, Database, Terminal, Cpu } from 'lucide-react';
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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 overflow-hidden bg-slate-950 font-mono">
      {/* Industrial Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Heavy Vignette & Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/80 to-slate-950" />
      
      {/* Warning/Neon glow */}
      <div className="absolute top-0 right-[20%] w-[600px] h-[300px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-[10%] w-[500px] h-[300px] bg-blue-500/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Floating Status UI Background Elements */}
      <div className="absolute top-6 left-6 text-slate-600 text-[10px] tracking-widest hidden md:block">
        <p>SYS_STATUS: ONLINE</p>
        <p>NODE: MOD-CTRL-01</p>
        <p>UPLINK: ESTABLISHED</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', damping: 25 }}
        className="bg-slate-900 border border-slate-700/50 p-8 md:p-12 w-full max-w-[440px] relative z-10 shadow-2xl flex flex-col"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(51, 65, 85, 0.5), inset 0 1px 0 0 rgba(148, 163, 184, 0.1)'
        }}
      >
        {/* Top Warning Strip */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
        
        {/* Screw Details */}
        <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-slate-700 shadow-inner" />
        <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-slate-700 shadow-inner" />
        <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-slate-700 shadow-inner" />
        <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-slate-700 shadow-inner" />

        <div className="flex flex-col items-center text-center mb-10 mt-2">
          <div className="w-16 h-16 bg-slate-800 border-2 border-slate-700 rounded-lg flex items-center justify-center mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/10" />
            <Factory className="w-8 h-8 text-blue-400 relative z-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-100 tracking-[0.2em] mb-1">MODULA</h2>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-slate-400 text-[10px] uppercase tracking-[0.15em]">Central Control System</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-3 h-3" />
                Auth Token
              </label>
              {error && <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest animate-pulse">Access Denied</span>}
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="INPUT ACCESS KEY"
                className={cn(
                  "w-full px-5 py-4 bg-slate-950 border outline-none transition-all text-sm font-bold tracking-[0.2em] text-slate-200 placeholder-slate-700",
                  error ? "border-rose-500/50" : "border-slate-800 focus:border-blue-500/50"
                )}
              />
            </div>
          </div>
          
          <button 
            onClick={handleLogin}
            className="w-full relative overflow-hidden group bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold py-4 transition-colors flex items-center justify-center gap-3 text-xs tracking-widest uppercase"
          >
            <div className="absolute inset-0 w-0 bg-blue-600 transition-all duration-[250ms] ease-out group-hover:w-full" />
            <span className="relative z-10 flex items-center gap-2 group-hover:text-white">
              Initialize Session
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex justify-between px-2">
          <div className="flex flex-col items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Telemetry</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Process</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Database className="w-4 h-4 text-amber-500" />
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Storage</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(LoginScreen);
