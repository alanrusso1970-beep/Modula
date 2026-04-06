import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Fuel, TrendingUp, TrendingDown, AlertTriangle, MapPin, Sparkles } from 'lucide-react';
import { Installation } from '../types';
import { cn } from '../lib/utils';
import { getAlertStatus, isExpiredDate } from '../lib/healthScore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface AIAssistantProps {
  installations: Installation[];
}

// ─── Local NLP engine ────────────────────────────────────────────────────────

function parseQuery(query: string, installations: Installation[]): string {
  const q = query.toLowerCase().trim();

  // ── EBITDA negativo ──
  if ((q.includes('ebitda') && (q.includes('negativo') || q.includes('negat') || q.includes('perdita'))) ||
      q.includes('perdono') || q.includes('in perdita')) {
    const neg = installations.filter(i => i.ebitda < 0);
    if (neg.length === 0) return '✅ Ottima notizia! Nessun impianto ha EBITDA negativo al momento.';
    const list = neg.slice(0, 8).map(i =>
      `• **${i.city}** (${i.province}) — ${i.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}`
    ).join('\n');
    return `🔴 **${neg.length} impianti con EBITDA negativo:**\n${list}${neg.length > 8 ? `\n…e altri ${neg.length - 8}` : ''}`;
  }

  // ── Scadenze / verifiche ──
  if (q.includes('scadut') || q.includes('verifica') || q.includes('scadenza') || q.includes('biennale')) {
    const expired = installations.filter(i => i.rows.some(r => isExpiredDate(r['Ultima Verifica Erogatore'])));
    if (expired.length === 0) return '✅ Tutte le verifiche biennali sono in regola!';
    const list = expired.slice(0, 8).map(i => `• **${i.city}** (${i.province})`).join('\n');
    return `⚠️ **${expired.length} impianti con verifiche scadute:**\n${list}${expired.length > 8 ? `\n…e altri ${expired.length - 8}` : ''}`;
  }

  // ── Critici ──
  if (q.includes('critic') || q.includes('emergenza') || q.includes('urgente') || q.includes('problema')) {
    const crit = installations.filter(i => getAlertStatus(i) === 'critical');
    if (crit.length === 0) return '✅ Nessun impianto in stato critico!';
    const list = crit.slice(0, 8).map(i =>
      `• **${i.city}** (${i.province}) — EBITDA: ${i.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}`
    ).join('\n');
    return `🚨 **${crit.length} impianti CRITICI (verifica scaduta + EBITDA negativo):**\n${list}`;
  }

  // ── Top per EBITDA ──
  if ((q.includes('top') || q.includes('migliori') || q.includes('meglio') || q.includes('performan')) &&
      !q.includes('peg')) {
    const n = q.match(/\d+/)?.[0] ? parseInt(q.match(/\d+/)![0]) : 5;
    const top = [...installations].sort((a, b) => b.ebitda - a.ebitda).slice(0, Math.min(n, 10));
    const list = top.map((i, idx) =>
      `${idx + 1}. **${i.city}** (${i.province}) — ${i.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}`
    ).join('\n');
    return `🏆 **Top ${top.length} impianti per EBITDA:**\n${list}`;
  }

  // ── Bottom per EBITDA ──
  if (q.includes('peggiori') || q.includes('peg') || q.includes('bottom') || q.includes('rischio')) {
    const n = q.match(/\d+/)?.[0] ? parseInt(q.match(/\d+/)![0]) : 5;
    const bottom = [...installations].sort((a, b) => a.ebitda - b.ebitda).slice(0, Math.min(n, 10));
    const list = bottom.map((i, idx) =>
      `${idx + 1}. **${i.city}** (${i.province}) — ${i.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}`
    ).join('\n');
    return `📉 **Bottom ${bottom.length} impianti per EBITDA:**\n${list}`;
  }

  // ── Cerca per provincia ──
  const provinceMatch = q.match(/\b([a-z]{2})\b/);
  if (provinceMatch || q.includes('sicilia') || q.includes('lombardia') || q.includes('campania') ||
      q.includes('lazio') || q.includes('piemonte') || q.includes('veneto') || q.includes('toscana')) {
    // Region/province search
    const regionKeywords: Record<string, string[]> = {
      'sicilia': ['CT', 'PA', 'ME', 'SR', 'RG', 'EN', 'CL', 'AG', 'TP'],
      'lombardia': ['MI', 'BS', 'BG', 'MB', 'MN', 'CR', 'LO', 'PV', 'SO', 'CO', 'VA', 'LC'],
      'campania': ['NA', 'SA', 'CE', 'AV', 'BN'],
      'lazio': ['RM', 'LT', 'FR', 'RI', 'VT'],
      'piemonte': ['TO', 'CN', 'AT', 'AL', 'BI', 'NO', 'VC', 'VB'],
      'veneto': ['VE', 'VR', 'VI', 'TV', 'PD', 'RO', 'BL'],
      'toscana': ['FI', 'SI', 'AR', 'PI', 'LU', 'MS', 'PT', 'PO', 'GR', 'LI'],
    };
    let filtered = installations;
    for (const [region, provs] of Object.entries(regionKeywords)) {
      if (q.includes(region)) {
        filtered = installations.filter(i => provs.includes(i.province));
        if (filtered.length === 0) return `ℹ️ Nessun impianto trovato per la regione **${region.charAt(0).toUpperCase() + region.slice(1)}**.`;
        const totEbitda = filtered.reduce((s, i) => s + i.ebitda, 0);
        const negCount = filtered.filter(i => i.ebitda < 0).length;
        return `📍 **${region.charAt(0).toUpperCase() + region.slice(1)}**: ${filtered.length} impianti\n` +
          `EBITDA totale: **${totEbitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}**\n` +
          `Impianti in perdita: **${negCount}**\n\n` +
          filtered.slice(0, 6).map(i => `• ${i.city} — ${i.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}`).join('\n');
      }
    }
  }

  // ── Statistiche generali ──
  if (q.includes('totale') || q.includes('quanti') || q.includes('riepilogo') || q.includes('sommario') || q.includes('statistiche') || q.includes('kpi')) {
    const totalEbitda = installations.reduce((s, i) => s + i.ebitda, 0);
    const totalSell = installations.reduce((s, i) => s + i.sell, 0);
    const negCount = installations.filter(i => i.ebitda < 0).length;
    const critCount = installations.filter(i => getAlertStatus(i) === 'critical').length;
    return `📊 **Riepilogo Portfolio MODULA**\n` +
      `• Impianti totali: **${installations.length}**\n` +
      `• EBITDA totale 2025: **${totalEbitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}**\n` +
      `• Volume Sell-in totale: **${Math.round(totalSell).toLocaleString('it-IT')} L**\n` +
      `• In perdita: **${negCount}** (${Math.round(negCount / installations.length * 100)}%)\n` +
      `• Stato CRITICO: **${critCount}**`;
  }

  // ── Volume vendite ──
  if (q.includes('volume') || q.includes('sell') || q.includes('litri') || q.includes('vendite')) {
    const top = [...installations].sort((a, b) => b.sell - a.sell).slice(0, 5);
    const list = top.map((i, idx) =>
      `${idx + 1}. **${i.city}** — ${Math.round(i.sell).toLocaleString('it-IT')} L`
    ).join('\n');
    return `⛽ **Top 5 impianti per Volume Vendite:**\n${list}`;
  }

  // ── Default help ──
  return `🤖 Non ho capito la domanda. Prova con:\n` +
    `• *"Impianti con EBITDA negativo"*\n` +
    `• *"Top 5 impianti"*\n` +
    `• *"Impianti in Sicilia"*\n` +
    `• *"Verifiche scadute"*\n` +
    `• *"Riepilogo statistiche"*`;
}

// ─── Component ──────────────────────────────────────────────────────────────

const QUICK_QUESTIONS = [
  'Top 5 impianti per EBITDA',
  'Verifiche scadute',
  'Impianti critici',
  'Riepilogo statistiche',
];

const AIAssistant: React.FC<AIAssistantProps> = ({ installations }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: '👋 Ciao! Sono **MODULA AI**. Chiedimi qualcosa sul tuo portfolio impianti.\n\nEsempio: *"Impianti con EBITDA negativo in Sicilia"*',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const answer = parseQuery(text, installations);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: answer, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  }, [installations]);

  // Render markdown-like bold text
  const renderText = (text: string) =>
    text.split('\n').map((line, i) => (
      <p key={i} className={cn('leading-relaxed', i > 0 && 'mt-1')}>
        {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-bold">{part}</strong> : part
        )}
      </p>
    ));

  return (
    <>
      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-[5000] w-14 h-14 rounded-2xl vivid-gradient shadow-xl shadow-blue-500/30 flex items-center justify-center text-white"
        title="Chiedi a MODULA AI"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-6 h-6" /></motion.div>
            : <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Bot className="w-6 h-6" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-[4999] w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            style={{ maxHeight: '520px' }}
          >
            {/* Header */}
            <div className="vivid-gradient p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm tracking-tight">MODULA AI</p>
                <p className="text-white/70 text-[10px] font-medium">Assistente Portfolio Impianti</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/70 text-[10px] font-bold">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg vivid-gradient flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    'px-3 py-2 rounded-xl text-xs max-w-[85%]',
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
                  )}>
                    {renderText(msg.text)}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
                  <div className="w-7 h-7 rounded-lg vivid-gradient flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl rounded-tl-none shadow-sm flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400"
                        animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick questions */}
            <div className="px-3 py-2 flex gap-1.5 flex-wrap border-t border-slate-100 bg-white">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 rounded-lg transition-colors">
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-100 bg-white flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Fai una domanda..."
                className="flex-1 text-xs px-3 py-2 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 border border-transparent focus:border-blue-300 font-medium text-slate-700"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl vivid-gradient flex items-center justify-center text-white disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
