import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fuel, 
  Map as MapIcon, 
  List, 
  Search, 
  ChevronRight, 
  LogOut, 
  ArrowLeft,
  Settings,
  TrendingUp,
  Droplets,
  Box,
  Database,
  Download,
  PieChart,
  X,
  Navigation,
  Phone,
  Mail,
  Info,
  FileText,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  FileDown,
  Monitor
} from 'lucide-react';
import { fetchInstallations } from './services/dataService';
import { Installation, InstallationRow, RealTimeData } from './types';
import { cn } from './lib/utils';
import { Skeleton } from './components/Skeleton';
import { SearchableSelect } from './components/SearchableSelect';
import { COLORS, provinceMap, preMapped } from './lib/constants';
import { Sector } from 'recharts';


// Lazy load components
const LoginScreen = lazy(() => import('./components/LoginScreen'));
const MapView = lazy(() => import('./components/MapView'));
const DetailModal = lazy(() => import('./components/DetailModal'));
const ExcelConverter = lazy(() => import('./components/ExcelConverter'));
const RealTimeDashboardModal = lazy(() => import('./components/RealTimeDashboardModal'));
const AnalyzerDashboard = lazy(() => import('./components/AnalyzerDashboard'));

const GAS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbykayQoMqHfvrni5p-l443HINtk1WxL4sPEExpxjB_HeTaDENMXuui58kYXzmmZXtc3/exec";

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="font-bold text-sm">{`${value} Impianti`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
        {`(${(percent * 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)`}
      </text>
    </g>
  );
};

// --- Main App Component ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<'map' | 'list' | 'converter'>('map');
  const [data, setData] = useState<{ allRows: InstallationRow[], uniqueInstallations: Installation[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedInspectionYear, setSelectedInspectionYear] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'city' | 'ebitda-desc' | 'ebitda-asc'>('city');
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState<{ current: number, total: number } | null>(null);
  const [activePieIndex, setActivePieIndex] = useState(0);

  // --- Real-Time Dashboard State ---
  const [showRealTimePopup, setShowRealTimePopup] = useState(false);
  const [isFetchingRealTime, setIsFetchingRealTime] = useState(false);
  const [realTimeData, setRealTimeData] = useState<RealTimeData[]>([]);
  const [realTimePlant, setRealTimePlant] = useState<Installation | null>(null);
  const [realTimeError, setRealTimeError] = useState<string | null>(null);

  const fetchRealTimeData = async (plant: Installation) => {
    setRealTimePlant(plant);
    setShowRealTimePopup(true);
    setIsFetchingRealTime(true);
    setRealTimeData([]);
    setRealTimeError(null);

    try {
      const response = await fetch(GAS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ action: 'read', pbl: plant.pbl }),
      });

      const result = await response.json();
      if (result.success) {
        setRealTimeData(result.data);
      } else {
        setRealTimeError(result.message || "Errore sconosciuto dal server.");
      }
    } catch (error) {
      setRealTimeError("Impossibile connettersi al server. Verifica la tua connessione.");
    } finally {
      setIsFetchingRealTime(false);
    }
  };

  useEffect(() => {
    const logged = sessionStorage.getItem('isLoggedIn') === 'true';
    if (logged) setIsLoggedIn(true);

    fetchInstallations().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const geocodeAll = async () => {
      if (!data) return;
      
      const cacheKey = 'province_coords_cache';
      const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      
      const installations = [...data.uniqueInstallations];
      
      // Identify unique provinces that need geocoding
      const provincesToGeocode = Array.from(new Set(installations.map(i => i.province)));
      let hasNewData = false;

      // Apply cached coordinates to all installations
      for (let i = 0; i < installations.length; i++) {
        const provKey = installations[i].province;
        if (!installations[i].lat && cache[provKey]) {
          installations[i] = { ...installations[i], ...cache[provKey] };
          hasNewData = true;
        }
      }

      if (hasNewData) {
        setData(prev => prev ? { ...prev, uniqueInstallations: [...installations] } : null);
      }

      const missingProvinces = provincesToGeocode.filter(prov => !cache[prov]);
      if (missingProvinces.length === 0) {
        setGeocodingStatus(null);
        return;
      }

      setGeocodingStatus({ current: 0, total: missingProvinces.length });
      const userEmail = 'alan.russo.1970@gmail.com';

      const provinceMap: Record<string, string> = {
        'AG': 'Agrigento', 'AL': 'Alessandria', 'AN': 'Ancona', 'AO': 'Aosta', 'AR': 'Arezzo', 'AP': 'Ascoli Piceno', 'AT': 'Asti', 'AV': 'Avellino', 'BA': 'Bari', 'BT': 'Barletta-Andria-Trani', 'BL': 'Belluno', 'BN': 'Benevento', 'BG': 'Bergamo', 'BI': 'Biella', 'BO': 'Bologna', 'BZ': 'Bolzano', 'BS': 'Brescia', 'BR': 'Brindisi', 'CA': 'Cagliari', 'CL': 'Caltanissetta', 'CB': 'Campobasso', 'CE': 'Caserta', 'CT': 'Catania', 'CZ': 'Catanzaro', 'CH': 'Chieti', 'CO': 'Como', 'CS': 'Cosenza', 'CR': 'Cremona', 'KR': 'Crotone', 'CN': 'Cuneo', 'EN': 'Enna', 'FM': 'Fermo', 'FE': 'Ferrara', 'FI': 'Firenze', 'FG': 'Foggia', 'FC': 'Forlì-Cesena', 'FR': 'Frosinone', 'GE': 'Genova', 'GO': 'Gorizia', 'GR': 'Grosseto', 'IM': 'Imperia', 'IS': 'Isernia', 'SP': 'La Spezia', 'AQ': 'L\'Aquila', 'LT': 'Latina', 'LE': 'Lecce', 'LC': 'Lecco', 'LI': 'Livorno', 'LO': 'Lodi', 'LU': 'Lucca', 'MC': 'Macerata', 'MN': 'Mantova', 'MS': 'Massa-Carrara', 'MT': 'Matera', 'ME': 'Messina', 'MI': 'Milano', 'MO': 'Modena', 'MB': 'Monza e della Brianza', 'NA': 'Napoli', 'NO': 'Novara', 'NU': 'Nuoro', 'OR': 'Oristano', 'PD': 'Padova', 'PA': 'Palermo', 'PR': 'Parma', 'PV': 'Pavia', 'PG': 'Perugia', 'PU': 'Pesaro e Urbino', 'PE': 'Pescara', 'PC': 'Piacenza', 'PI': 'Pisa', 'PT': 'Pistoia', 'PN': 'Pordenone', 'PZ': 'Potenza', 'PO': 'Prato', 'RG': 'Ragusa', 'RA': 'Ravenna', 'RC': 'Reggio Calabria', 'RE': 'Reggio Emilia', 'RI': 'Rieti', 'RN': 'Rimini', 'RM': 'Roma', 'RO': 'Rovigo', 'SA': 'Salerno', 'SS': 'Sassari', 'SV': 'Savona', 'SI': 'Siena', 'SR': 'Siracusa', 'SO': 'Sondrio', 'SU': 'Sud Sardegna', 'TA': 'Taranto', 'TE': 'Teramo', 'TR': 'Terni', 'TO': 'Torino', 'TP': 'Trapani', 'TN': 'Trento', 'TV': 'Treviso', 'TS': 'Trieste', 'UD': 'Udine', 'VA': 'Varese', 'VE': 'Venezia', 'VB': 'Verbano-Cusio-Ossola', 'VC': 'Vercelli', 'VR': 'Verona', 'VV': 'Vibo Valentia', 'VI': 'Vicenza', 'VT': 'Viterbo'
      };

      // Pre-mapped provinces
      const preMapped: Record<string, { lat: number, lng: number }> = {
        'CT': { lat: 37.5079, lng: 15.0830 },
        'PA': { lat: 38.1157, lng: 13.3615 },
        'ME': { lat: 38.1938, lng: 15.5540 },
        'SR': { lat: 37.0755, lng: 15.2866 },
        'RG': { lat: 36.9269, lng: 14.7255 },
        'EN': { lat: 37.5670, lng: 14.2754 },
        'CL': { lat: 37.4903, lng: 14.0622 },
        'AG': { lat: 37.3107, lng: 13.5846 },
        'TP': { lat: 38.0176, lng: 12.5372 }
      };

      for (let index = 0; index < missingProvinces.length; index++) {
        const provAbbr = missingProvinces[index];
        setGeocodingStatus({ current: index + 1, total: missingProvinces.length });
        
        // Check pre-mapped first
        if (preMapped[provAbbr]) {
          const coords = preMapped[provAbbr];
          cache[provAbbr] = coords;
          localStorage.setItem(cacheKey, JSON.stringify(cache));
          for (let i = 0; i < installations.length; i++) {
            if (installations[i].province === provAbbr) {
              installations[i] = { ...installations[i], ...coords };
            }
          }
          setData(prev => prev ? { ...prev, uniqueInstallations: [...installations] } : null);
          continue;
        }

        let success = false;
        let retries = 0;
        const maxRetries = 3;

        while (!success && retries < maxRetries) {
          try {
            await new Promise(r => setTimeout(r, 3000));

            const fullProv = provinceMap[provAbbr] || provAbbr;
            const query = `${fullProv}, Italy`;

            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const res = await fetch(url, { 
              signal: controller.signal,
              headers: { 'User-Agent': 'AssetOilApp/1.0' }
            });
            clearTimeout(timeoutId);
            
            if (res.status === 429) {
              await new Promise(r => setTimeout(r, 30000));
              retries++;
              continue;
            }

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const results = await res.json();
            
            if (results && results[0]) {
              const coords = { 
                lat: parseFloat(results[0].lat), 
                lng: parseFloat(results[0].lon) 
              };
              
              cache[provAbbr] = coords;
              localStorage.setItem(cacheKey, JSON.stringify(cache));

              for (let i = 0; i < installations.length; i++) {
                if (installations[i].province === provAbbr) {
                  installations[i] = { ...installations[i], ...coords };
                }
              }
              
              setData(prev => prev ? { ...prev, uniqueInstallations: [...installations] } : null);
            }
            success = true;
          } catch (e) {
            console.error(`Geocoding error for ${provAbbr}:`, e);
            retries++;
            await new Promise(r => setTimeout(r, 5000 * retries));
          }
        }
      }
      setGeocodingStatus(null);
    };

    if (isLoggedIn && data) {
      geocodeAll();
    }
  }, [isLoggedIn, !!data]);

  const handleLogin = () => {
    sessionStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  const handleExport = async () => {
    if (!data) return;
    
    // Calculate Summary Data
    const provinceCounts = data.uniqueInstallations.reduce((acc, inst) => {
      const p = inst.province || 'N/D';
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mosoCounts = data.uniqueInstallations.reduce((acc, inst) => {
      const m = inst.moso || 'N/D';
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; }
            .page-break { page-break-after: always; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; background: #fff; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 12px; }
            th { background-color: #f8fafc; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
            h1 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 30px; }
            h2 { color: #2563eb; margin-top: 30px; border-left: 4px solid #2563eb; padding-left: 15px; }
            h3 { color: #475569; margin-top: 20px; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .summary-box { background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .grid { display: table; width: 100%; }
            .grid-row { display: table-row; }
            .grid-cell { display: table-cell; padding: 5px; }
            .label { font-weight: bold; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="page-break">
            <h1>Report MODULA - Riepilogo Generale</h1>
            <p>Data Generazione: ${new Date().toLocaleString('it-IT')}</p>
            <p>Totale Impianti: <strong>${data.uniqueInstallations.length}</strong></p>

            <div class="summary-box">
              <h3>1) Suddivisione per Provincia</h3>
              <table>
                <thead>
                  <tr><th>Provincia</th><th>Conteggio Impianti</th></tr>
                </thead>
                <tbody>
                  ${Object.entries(provinceCounts).sort((a, b) => b[1] - a[1]).map(([p, count]) => `
                    <tr><td>${p}</td><td>${count}</td></tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="summary-box">
              <h3>2) Suddivisione per MachCode</h3>
              <table>
                <thead>
                  <tr><th>MachCode</th><th>Conteggio Impianti</th></tr>
                </thead>
                <tbody>
                  ${Object.entries(mosoCounts).sort((a, b) => b[1] - a[1]).map(([m, count]) => `
                    <tr><td>${m}</td><td>${count}</td></tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          ${data.uniqueInstallations.map(inst => `
            <div class="page-break">
              <h2>Dettaglio Impianto: ${inst.city}</h2>
              
              <div class="grid">
                <div class="grid-row">
                  <div class="grid-cell"><span class="label">PBL:</span> ${inst.pbl}</div>
                  <div class="grid-cell"><span class="label">Città:</span> ${inst.city} (${inst.province})</div>
                </div>
                <div class="grid-row">
                  <div class="grid-cell"><span class="label">Indirizzo:</span> ${inst.address}, ${inst.cap}</div>
                  <div class="grid-cell"><span class="label">Gestore:</span> ${inst.manager}</div>
                </div>
                <div class="grid-row">
                  <div class="grid-cell"><span class="label">Email:</span> ${inst.email}</div>
                  <div class="grid-cell"><span class="label">Telefono:</span> ${inst.phone}</div>
                </div>
                <div class="grid-row">
                  <div class="grid-cell"><span class="label">Contratto:</span> ${inst.contract}</div>
                  <div class="grid-cell"><span class="label">MachCode:</span> ${inst.moso}</div>
                </div>
                <div class="grid-row">
                  <div class="grid-cell"><span class="label">TLS:</span> ${inst.tls}</div>
                  <div class="grid-cell"><span class="label">EBITDA 2025:</span> <span style="color: ${inst.ebitda < 0 ? '#ef4444' : '#10b981'}">${inst.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span></div>
                </div>
                <div class="grid-row">
                  <div class="grid-cell"><span class="label">Sell_IN 2025:</span> ${Math.round(inst.sell).toLocaleString('it-IT')} L</div>
                </div>
              </div>

              <h3>Dotazione Tecnica (Serbatoi ed Erogatori)</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID Serb.</th>
                    <th>Prodotto</th>
                    <th>Volume</th>
                    <th>ID Erog.</th>
                    <th>Tipo</th>
                    <th>Modello</th>
                    <th>Pistole</th>
                    <th>Ultima Verifica</th>
                  </tr>
                </thead>
                <tbody>
                  ${inst.rows.map(r => `
                    <tr>
                      <td>${r["ID Serbatoio"] || '-'}</td>
                      <td>${r["Prodotto Serbatoio"] || '-'}</td>
                      <td>${r["Volume Serbatoio"] || '-'}</td>
                      <td>${r["ID Erogatore"] || '-'}</td>
                      <td>${r["Tipo Erogatore"] || '-'}</td>
                      <td>${r["Modello Erogatore"] || '-'}</td>
                      <td>${r["Pistole Erogatore"] || '-'}</td>
                      <td>${r["Ultima Verifica Erogatore"] || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    const { saveAs } = await import('file-saver');
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    saveAs(blob, `Report_MODULA_${new Date().toISOString().slice(0, 10)}.doc`);
  };

  const handleExportCSV = async () => {
    if (!data) return;
    const Papa = (await import('papaparse')).default;
    const csv = Papa.unparse(data.allRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const { saveAs } = await import('file-saver');
    saveAs(blob, `Dati_MODULA_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const filteredInstallations = useMemo(() => {
    if (!data) return [];
    
    const filtered = data.uniqueInstallations.filter(inst => {
      const matchesSearch = inst.city.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           inst.pbl.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProvince = selectedProvince === '' || inst.province === selectedProvince;
      const matchesRegion = selectedRegion === '' || inst.region === selectedRegion;
      const matchesType = selectedType === '' || inst.contract === selectedType;
      const matchesStatus = selectedStatus === '' || inst.moso === selectedStatus;
      
      const instYears = inst.rows.map(r => r["Ultima Verifica Erogatore"]?.split('/').pop() || r["Ultima Verifica Erogatore"]?.split('-')[0]).filter(y => y && y.length === 4);
      const matchesYear = selectedInspectionYear === '' || instYears.includes(selectedInspectionYear);

      return matchesSearch && matchesProvince && matchesRegion && matchesType && matchesStatus && matchesYear;
    });

    const sorted = [...filtered];
    if (sortBy === 'ebitda-desc') {
      sorted.sort((a, b) => b.ebitda - a.ebitda);
    } else if (sortBy === 'ebitda-asc') {
      sorted.sort((a, b) => a.ebitda - b.ebitda);
    } else {
      sorted.sort((a, b) => a.city.localeCompare(b.city));
    }
    
    return sorted;
  }, [data, searchQuery, selectedProvince, selectedRegion, selectedType, selectedStatus, selectedInspectionYear, sortBy]);

  const provinces = useMemo(() => [...new Set(data?.uniqueInstallations.map(i => i.province) || [])].sort(), [data]);
  const regions = useMemo(() => [...new Set(data?.uniqueInstallations.map(i => i.region) || [])].filter(Boolean).sort(), [data]);
  const types = useMemo(() => [...new Set(data?.uniqueInstallations.map(i => i.contract) || [])].filter(Boolean).sort(), [data]);
  const statuses = useMemo(() => [...new Set(data?.uniqueInstallations.map(i => i.moso) || [])].filter(Boolean).sort(), [data]);
  const inspectionYears = useMemo(() => [...new Set((data?.uniqueInstallations || []).flatMap(i => 
    i.rows.map(r => r["Ultima Verifica Erogatore"]?.split('/').pop() || r["Ultima Verifica Erogatore"]?.split('-')[0]).filter(y => y && y.length === 4)
  ))].sort((a, b) => b.localeCompare(a)), [data]);

  const contractData = useMemo(() => Object.entries(
    filteredInstallations.reduce((acc, inst) => {
      const c = inst.contract || 'N/D';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })), [filteredInstallations]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const maxEbitda = useMemo(() => Math.max(...filteredInstallations.map(i => i.ebitda), 1), [filteredInstallations]);
  const maxSell = useMemo(() => Math.max(...filteredInstallations.map(i => i.sell), 1), [filteredInstallations]);

  if (!isLoggedIn) {
    return (
      <Suspense fallback={<div className="h-screen w-screen bg-slate-100 animate-pulse" />}>
        <LoginScreen onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden liquid-bg">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="vivid-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <header className="glass-morphism sticky top-0 z-[2000] px-4 xl:px-6 py-3 flex flex-col gap-3 shadow-xl shadow-slate-200/20">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3 shrink-0">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-10 h-10 vivid-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <Fuel className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">MODULA</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sistema Attivo</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2 relative z-[4000] flex-1 lg:justify-center overflow-visible w-full max-w-full lg:w-auto">
          {loading ? (
            <>
              <Skeleton className="flex-1 min-w-[200px] h-[42px] rounded-xl" />
              <Skeleton className="w-[180px] h-[42px] rounded-xl" />
              <Skeleton className="w-[180px] h-[42px] rounded-xl" />
              <Skeleton className="w-[100px] h-[42px] rounded-xl" />
              <Skeleton className="w-[42px] h-[42px] rounded-xl" />
            </>
          ) : (
            <>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cerca città o PBL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-sm text-slate-700 h-[42px] shadow-sm"
                />
              </div>
              
              <div className="w-[180px] shrink-0">
                <SearchableSelect
                  options={provinces}
                  value={selectedProvince}
                  onChange={setSelectedProvince}
                  placeholder="Provincia"
                  className="w-full"
                  compact
                />
              </div>

              <div className="w-[180px] shrink-0">
                <SearchableSelect
                  options={regions}
                  value={selectedRegion}
                  onChange={setSelectedRegion}
                  placeholder="Regione"
                  className="w-full"
                  compact
                />
              </div>

              <div className="w-[180px] shrink-0">
                <SearchableSelect
                  options={[
                    "A-Z",
                    "EBITDA (Alto)",
                    "EBITDA (Basso)"
                  ]}
                  value={
                    sortBy === 'city' ? 'A-Z' : 
                    sortBy === 'ebitda-desc' ? 'EBITDA (Alto)' : 
                    'EBITDA (Basso)'
                  }
                  onChange={(val) => {
                    if (val === 'A-Z') setSortBy('city');
                    else if (val === 'EBITDA (Alto)') setSortBy('ebitda-desc');
                    else setSortBy('ebitda-asc');
                  }}
                  placeholder="Ordina per..."
                  className="w-full"
                  compact
                />
              </div>

              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(
                  "px-4 py-2.5 rounded-xl border transition-all font-medium text-sm flex items-center justify-center gap-2 h-[42px] active:shadow-none active:translate-y-1",
                  showAdvancedFilters ? "bg-blue-600 text-white border-blue-600 shadow-[0_4px_0_0_#2563eb]" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-[0_4px_0_0_#cbd5e1]"
                )}
              >
                <Filter className="w-4 h-4" />
                Filtri
              </button>

              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedProvince('');
                  setSelectedRegion('');
                  setSelectedType('');
                  setSelectedStatus('');
                  setSelectedInspectionYear('');
                }}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all font-medium text-sm flex items-center justify-center gap-2 h-[42px] shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1"
                title="Reset filtri"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setView('converter')}
              disabled={loading}
              className={cn(
                "px-3 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-xs active:shadow-none active:translate-y-1",
                view === 'converter' ? "bg-amber-500 text-white shadow-[0_4px_0_0_#d97706]" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-[0_4px_0_0_#cbd5e1]",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Convertitore</span>
            </button>

            <div className="flex bg-white/50 p-1 rounded-xl border border-white/50 shadow-sm hidden sm:flex">
              <button
                onClick={() => setView('map')}
                disabled={loading}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:shadow-none active:translate-y-1",
                  view === 'map' ? "bg-white text-blue-600 shadow-[0_4px_0_0_#cbd5e1]" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-[0_4px_0_0_transparent]",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Map
              </button>
              <button
                onClick={() => setView('list')}
                disabled={loading}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:shadow-none active:translate-y-1",
                  view === 'list' ? "bg-white text-blue-600 shadow-[0_4px_0_0_#cbd5e1]" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-[0_4px_0_0_transparent]",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>
            
            <button 
              onClick={() => setShowDashboard(!showDashboard)}
              disabled={loading}
              className={cn(
                "px-3 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-xs active:shadow-none active:translate-y-1",
                showDashboard ? "bg-blue-600 text-white shadow-[0_4px_0_0_#2563eb]" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-[0_4px_0_0_#cbd5e1]",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="w-[1px] h-5 bg-slate-200 mx-0.5"></div>
            <button 
              onClick={handleLogout}
              className="p-2 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-slate-200 shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 flex items-center justify-center gap-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div 
              key="advanced-filters"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative z-[3000]"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200/50">
                <SearchableSelect
                  label="Terreno"
                  options={types}
                  value={selectedType}
                  onChange={setSelectedType}
                  placeholder="Tutti i tipi"
                  compact
                />
                
                <SearchableSelect
                  label="Tipo Contratto Gestore"
                  options={statuses}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  placeholder="Tutti"
                  compact
                />

                <SearchableSelect
                  label="Ultima verifica Biennale"
                  options={inspectionYears}
                  value={selectedInspectionYear}
                  onChange={setSelectedInspectionYear}
                  placeholder="Tutti gli anni"
                  compact
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <Suspense fallback={<div className="p-8"><Skeleton className="w-full h-full rounded-2xl" /></div>}>
          <AnimatePresence mode="wait">
            {loading ? (
            <motion.div 
              key="loading-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 space-y-8 max-w-7xl mx-auto w-full h-full overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {[...Array(10)].map((_, i) => (
                  <div key={`skeleton-${i}`} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[160px]">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="w-12 h-4" />
                        <Skeleton className="w-6 h-6" />
                      </div>
                      <Skeleton className="w-3/4 h-5" />
                      <Skeleton className="w-1/2 h-3" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="w-full h-8" />
                      <Skeleton className="w-full h-8" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : view === 'map' ? (
            <motion.div 
              key="map"
              initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ 
                duration: 0.6, 
                ease: [0.16, 1, 0.3, 1]
              }}
              className="h-full"
            >
              <MapView 
                installations={filteredInstallations} 
                onProceed={(province) => {
                  if (province) setSelectedProvince(province);
                  setView('list');
                }} 
                onResetProvince={() => setSelectedProvince('')}
                geocodingStatus={geocodingStatus}
              />
            </motion.div>
          ) : view === 'converter' ? (
            <motion.div 
              key="converter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto"
            >
              <ExcelConverter />
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.16, 1, 0.3, 1]
              }}
              className="p-8 space-y-8 max-w-7xl mx-auto w-full overflow-y-auto h-full scroll-smooth"
            >
              <motion.div 
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05
                    }
                  }
                }}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3"
              >
                {filteredInstallations.map((inst, index) => (
                  <motion.div 
                    layout
                    key={`${inst.pbl}-${index}`}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -2, scale: 1.01 }}
                    onClick={() => setSelectedInstallation(inst)}
                    className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-full min-h-[160px]"
                  >
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-slate-100 text-slate-600 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border border-slate-200">
                          PBL: {inst.pbl}
                        </span>
                        <div className="flex gap-2">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchRealTimeData(inst);
                            }}
                            className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100 shadow-[0_2px_0_0_#10b981] active:shadow-none active:translate-y-1"
                            title="Aggiorna dati in tempo reale"
                          >
                            <Monitor className="w-4 h-4" />
                          </motion.button>
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors border border-slate-200 group-hover:border-blue-600">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mb-0.5 tracking-tight truncate">{inst.city}</h3>
                      <p className="text-[10px] text-slate-500 mb-3 font-medium truncate">{inst.address}</p>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">EBITDA 2025</p>
                          <p className={cn("text-sm font-mono font-bold", inst.ebitda < 0 ? "text-red-600" : "text-emerald-600")}>
                            {inst.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Volume Vendite</p>
                          <p className="text-sm font-mono font-bold text-blue-600">
                            {Math.round(inst.sell).toLocaleString('it-IT')} L
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 mt-8">
                <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-mono font-bold text-blue-600 mb-1">{filteredInstallations.length}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Impianti</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-mono font-bold text-indigo-600 mb-1">
                      {filteredInstallations.reduce((acc, i) => acc + i.rows.filter(r => r["ID Serbatoio"] && r["ID Serbatoio"] !== "-").length, 0)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Serbatoi</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-mono font-bold text-violet-600 mb-1">
                      {filteredInstallations.reduce((acc, i) => acc + i.rows.filter(r => r["ID Erogatore"] && r["ID Erogatore"] !== "-").length, 0)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Erogatori</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExport}
                    className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_0_0_#2563eb] active:shadow-none active:translate-y-1 transition-all text-sm"
                  >
                    <Download className="w-4 h-4" /> Report DOC
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExportCSV}
                    className="flex-1 md:flex-none bg-white hover:bg-slate-50 text-slate-700 font-medium px-6 py-3 rounded-xl flex items-center justify-center gap-2 border border-slate-200 shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 transition-all text-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export CSV
                  </motion.button>
                </div>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </main>

      <AnimatePresence>
        {selectedInstallation && (
          <Suspense fallback={null}>
            <DetailModal 
              key="detail-modal"
              installation={selectedInstallation} 
              onClose={() => setSelectedInstallation(null)}
              onOpenRealTimeDashboard={(plant) => {
                setSelectedInstallation(null);
                fetchRealTimeData(plant);
              }}
            />
          </Suspense>
        )}
        {showRealTimePopup && (
          <Suspense fallback={null}>
            <RealTimeDashboardModal
              key="realtime-modal"
              plant={realTimePlant}
              data={realTimeData}
              loading={isFetchingRealTime}
              error={realTimeError}
              onClose={() => setShowRealTimePopup(false)}
            />
          </Suspense>
        )}
        <Suspense fallback={null}>
          <AnalyzerDashboard 
            show={showDashboard}
            onClose={() => setShowDashboard(false)}
            filteredInstallations={filteredInstallations}
            contractData={contractData}
            activePieIndex={activePieIndex}
            setActivePieIndex={setActivePieIndex}
          />
        </Suspense>
      </AnimatePresence>
    </div>
  );
}
