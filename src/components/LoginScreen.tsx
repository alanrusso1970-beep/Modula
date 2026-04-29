import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, Lock, User, ArrowRight, ShieldCheck, Loader2, Sparkles, Globe, Zap, Play } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (username === 'toil' && password === 'toil') {
        onLogin();
      } else {
        setError('Accesso Negato. Verifica le tue credenziali.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden font-sans selection:bg-blue-500/30 selection:text-white">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            x: [0, -40, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[150px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_20px_100px_rgba(0,0,0,0.5)] overflow-hidden relative z-10"
      >
        {/* Left Side: Visual Hero */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600/20 to-transparent relative overflow-hidden border-r border-white/5">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Fuel className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black text-white tracking-tighter">MODULA</span>
            </div>
            
            <div className="space-y-6">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-black text-white leading-tight"
              >
                L'Intelligenza <br />
                <span className="text-blue-400">per i tuoi Asset.</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-slate-400 leading-relaxed max-w-sm"
              >
                Monitoraggio in tempo reale e analisi
              </motion.p>
            </div>
          </div>

          {/* Visual Content (Video/Image Placeholder) */}
          <div className="relative z-10 w-full h-[280px] mt-8 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group group">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              {/* Note to User: Replace this img with a <video> tag if you have the MP4 file */}
              <img 
                src="/assets/esso_comet.png" 
                alt="Esso Comet Transformation"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/90 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Play className="w-3 h-3 fill-current" /> Cinematic Protocol
                </p>
                <p className="text-sm font-bold text-white uppercase tracking-tight">NANO BANANA: Comet-to-Family</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Decorative shapes */}
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-16 bg-white/10 lg:bg-transparent">
          <div className="max-w-sm mx-auto flex flex-col h-full justify-center">
            <div className="mb-10 text-center lg:text-left">
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">Accesso Sistema</h1>
              <p className="text-slate-400 font-medium text-sm">Inserisci le tue credenziali per iniziare la sessione di monitoraggio.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account ID</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chiave d'Accesso</label>
                  <button type="button" className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors">Recupera</button>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-600"
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3"
                  >
                    <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0" />
                    <p className="text-xs font-bold text-rose-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-5 font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Autenticazione...
                  </>
                ) : (
                  <>
                    Entra nel Sistema
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>

              <div className="flex items-center gap-4 py-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">Protezione Crittografica</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="flex justify-center gap-4 opacity-50">
                <div className="flex items-center gap-2 text-slate-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Protocollo V2.4</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Footer info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center space-y-2 pointer-events-none"
      >
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.4em]">Powered by Modula AI Core &bull; 2026</p>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
