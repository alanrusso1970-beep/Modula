import React, { useState, useEffect, useRef } from 'react';
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
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import domtoimage from 'dom-to-image-more';
import { pdf } from '@react-pdf/renderer';
import { InstallationPDF } from './components/InstallationPDF';
import { fetchInstallations } from './services/dataService';
import { Installation, InstallationRow } from './types';
import { cn } from './lib/utils';
import Plant3D from './components/Plant3D';
import { SearchableSelect } from './components/SearchableSelect';
import { Skeleton } from './components/Skeleton';
import Plant2D from './components/Plant2D';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Sector } from 'recharts';

const AnyPie = Pie as any;

import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- Login Screen ---
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
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

// --- Map Component ---
const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    // Force a resize check to ensure the map fills the container correctly
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [center, zoom, map]);
  return null;
};

const MapView = ({ installations, onProceed, onResetProvince, geocodingStatus }: { 
  installations: Installation[], 
  onProceed: (province?: string) => void,
  onResetProvince: () => void,
  geocodingStatus: { current: number, total: number } | null
}) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapSearch, setMapSearch] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => console.log("Geolocation failed")
      );
    }
  }, []);

  // Filter installations based on map search
  const filteredMapInstallations = installations.filter(inst => 
    inst.city.toLowerCase().includes(mapSearch.toLowerCase()) || 
    inst.province.toLowerCase().includes(mapSearch.toLowerCase()) ||
    inst.pbl.toLowerCase().includes(mapSearch.toLowerCase())
  );

  // Calculate the center of all installations with coordinates
  const installationsWithCoords = filteredMapInstallations.filter(inst => inst.lat && inst.lng);
  
  let initialCenter: [number, number] = [41.9028, 12.4964]; // Default to Rome
  let initialZoom = 6;

  if (installationsWithCoords.length > 0) {
    const avgLat = installationsWithCoords.reduce((sum, inst) => sum + (inst.lat || 0), 0) / installationsWithCoords.length;
    const avgLng = installationsWithCoords.reduce((sum, inst) => sum + (inst.lng || 0), 0) / installationsWithCoords.length;
    initialCenter = [avgLat, avgLng];
    
    // Adjust zoom based on search or number of installations
    if (mapSearch) {
      initialZoom = 10;
    } else if (installationsWithCoords.length < 5) {
      initialZoom = 9;
    } else {
      initialZoom = 7;
    }
  } else if (userLocation) {
    initialCenter = [userLocation.lat, userLocation.lng];
    initialZoom = 10;
  }

  // Group installations by province for the map
  const provinceGroups = filteredMapInstallations.reduce((acc, inst) => {
    if (inst.lat && inst.lng) {
      const key = inst.province;
      if (!acc[key]) {
        acc[key] = {
          province: inst.province,
          lat: inst.lat,
          lng: inst.lng,
          count: 0,
          installations: []
        };
      }
      acc[key].count++;
      acc[key].installations.push(inst);
    }
    return acc;
  }, {} as Record<string, { province: string, lat: number, lng: number, count: number, installations: Installation[] }>);

  const createClusterIcon = (count: number) => {
    return L.divIcon({
      html: `<div class="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold border-2 border-white shadow-lg text-lg">${count}</div>`,
      className: 'custom-cluster-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  return (
    <div className="absolute inset-0 bg-slate-100 overflow-hidden">
      <MapContainer 
        center={initialCenter} 
        zoom={initialZoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapUpdater center={initialCenter} zoom={initialZoom} />
        <TileLayer
          attribution='&copy; Google'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0','mt1','mt2','mt3']}
        />
        
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>La tua posizione</Popup>
          </Marker>
        )}

        {Object.values(provinceGroups).map(group => (
          <Marker 
            key={group.province} 
            position={[group.lat, group.lng]}
            icon={createClusterIcon(group.count)}
            eventHandlers={{
              click: () => onProceed(group.province)
            }}
          />
        ))}
      </MapContainer>

      {/* Floating Info Card */}
      <div className="absolute bottom-6 left-6 z-[1000] hidden sm:block">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-2xl min-w-[260px] border border-slate-200 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <MapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Network Status</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {installations.filter(i => i.lat && i.lng).length} <span className="text-sm font-bold text-slate-400">/ {installations.length}</span>
              </p>
            </div>
          </div>
          
          {geocodingStatus && (
            <div className="mt-5">
              <div className="flex justify-between text-[10px] font-bold text-blue-600 mb-1.5 tracking-widest">
                <span>MAPPATURA ASSET</span>
                <span>{Math.round((geocodingStatus.current / geocodingStatus.total) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  className="bg-blue-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(geocodingStatus.current / geocodingStatus.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* User Location Button */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (userLocation) {
              // Map re-centering logic
            }
          }}
          className="bg-white p-4 rounded-2xl text-slate-600 hover:text-blue-600 transition-all shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 border border-slate-200 flex items-center justify-center gap-2"
        >
          <Navigation className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
};

// --- Installation Detail Modal ---
const isOlderThanTwoYears = (dateStr?: string) => {
  if (!dateStr || dateStr === '-' || dateStr === 'N/D') return false;
  
  let year, month, day;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    }
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    }
  }

  if (year && month !== undefined && day) {
    const date = new Date(year, month, day);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return date < twoYearsAgo;
  }
  
  return false;
};

const formatMonthYear = (dateStr?: string) => {
  if (!dateStr || dateStr === '-' || dateStr === 'N/D') return dateStr || '-';
  
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`;
    }
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
};

const DetailModal = ({ 
  installation, 
  onClose, 
  chart1Image, 
  chart2Image,
  chart1Ref,
  chart2Ref
}: { 
  installation: Installation, 
  onClose: () => void, 
  chart1Image: string | null, 
  chart2Image: string | null,
  chart1Ref: React.RefObject<HTMLDivElement>,
  chart2Ref: React.RefObject<HTMLDivElement>
}) => {
  const [show3D, setShow3D] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [planImage, setPlanImage] = useState<string | null>(null);
  const planImageRef = useRef<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleCapture = (dataUrl: string) => {
    if (dataUrl && dataUrl.length > 5000) {
      setPlanImage(dataUrl);
      planImageRef.current = dataUrl;
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    // Ensure we have the plan image before generating
    if (!planImageRef.current) {
      // Wait up to 10 seconds for the plan image to be captured
      let attempts = 0;
      while (!planImageRef.current && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }

    try {
      const blob = await pdf(
        <InstallationPDF 
          installation={installation} 
          planImage={planImageRef.current} 
        />
      ).toBlob();
      
      saveAs(blob, `Report_${installation.city}_${installation.pbl}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const tankData: { id: string, volume: number, product: string, color: string, category: string }[] = [];
  const seenTanks = new Set<string>();
  
  const totals = {
    benzina: 0,
    gasolio: 0,
    supreme: 0
  };

  installation.rows.forEach(row => {
    const tankId = row["ID Serbatoio"];
    if (tankId && !seenTanks.has(tankId)) {
      seenTanks.add(tankId);
      const vol = parseFloat(row["Volume Serbatoio"]?.replace(',', '.') || '0');
      const product = row["Prodotto Serbatoio"] || 'N/D';
      const volume = isNaN(vol) ? 0 : vol;
      
      let color = '#94a3b8'; // Default slate
      let category = 'Altro';

      if (product.toLowerCase().includes('sspb') || product.toLowerCase().includes('benzina')) {
        color = '#10b981'; // Verde
        category = 'Benzina';
        totals.benzina += volume;
      } else if (product.toLowerCase().includes('gas') || product.toLowerCase().includes('gasolio')) {
        color = '#f59e0b'; // Arancione
        category = 'Gasolio';
        totals.gasolio += volume;
      } else if (product.toLowerCase().includes('supreme')) {
        color = '#3b82f6'; // Blu
        category = 'Supreme';
        totals.supreme += volume;
      }

      tankData.push({
        id: tankId,
        volume,
        product,
        color,
        category
      });
    }
  });

  const performanceStats = [
    { name: 'EBITDA', value: installation.ebitda, color: installation.ebitda < 0 ? '#ef4444' : '#10b981', unit: '€' },
    { name: 'Sell_IN', value: installation.sell, color: '#3b82f6', unit: 'L' },
  ];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative bg-white w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] md:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Hidden 2D Plan Capture - Using visibility: hidden instead of far off-screen to ensure rendering */}
        <div style={{ position: 'fixed', left: 0, top: 0, visibility: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
          <Plant2D installation={installation} onCapture={handleCapture} />
        </div>

        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-10 h-10 md:w-12 md:h-12 vivid-gradient rounded-xl flex items-center justify-center shadow-md">
              <Fuel className="w-5 h-5 md:w-6 md:h-6" stroke="url(#vivid-icon-gradient)" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">{installation.city}</h3>
                <span className="bg-slate-100 text-slate-600 text-[9px] md:text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-200">PBL: {installation.pbl}</span>
              </div>
              <p className="text-slate-500 text-[10px] md:text-xs font-medium flex items-center gap-1.5">
                <MapIcon className="w-2.5 h-2.5 md:w-3 h-3" stroke="url(#vivid-icon-gradient)" /> {installation.address}, {installation.cap} ({installation.province})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className={cn(
                "px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_4px_0_0_#10b981] active:shadow-none active:translate-y-1",
                isGeneratingPDF 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none translate-y-1" 
                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
              )}
            >
              <FileDown className={cn("w-3 h-3 md:w-4 md:h-4", isGeneratingPDF && "animate-bounce")} stroke="url(#vivid-icon-gradient)" />
              <span className="hidden sm:inline">{isGeneratingPDF ? 'Generazione...' : 'Report PDF'}</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShow3D(!show3D)}
              className={cn(
                "px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 active:shadow-none active:translate-y-1",
                show3D ? "vivid-gradient text-white shadow-[0_2px_0_0_#4f46e5]" : "bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-[0_2px_0_0_#cbd5e1]"
              )}
            >
              {show3D ? <List className="w-3 h-3" /> : <Box className="w-3 h-3" stroke="url(#vivid-icon-gradient)" />}
              <span className="hidden sm:inline">{show3D ? "Dati" : "3D"}</span>
            </motion.button>
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.1 }}
              onClick={onClose} 
              className="p-2 md:p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 flex items-center justify-center"
            >
              <X className="w-6 h-6 md:w-8 md:h-8 hidden" stroke="url(#vivid-icon-gradient)" />
            </motion.button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50">
          <AnimatePresence mode="wait">
            {show3D ? (
              <motion.div 
                key="3d"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                <Plant3D installation={installation} />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Complessità Asset</p>
                    <p className="text-2xl font-mono font-bold text-slate-900">Alta</p>
                    <p className="text-xs text-slate-500 mt-1">Basata su numero di serbatoi ed erogatori.</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Serbatoi Rilevati</p>
                    <p className="text-2xl font-mono font-bold text-slate-900">{tankData.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Visualizzati nel modello interrato.</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Erogatori Rilevati</p>
                    <p className="text-2xl font-mono font-bold text-slate-900">
                      {new Set(installation.rows.map(r => r["ID Erogatore"]).filter(id => id && id !== "-")).size}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Visualizzati sotto la tettoia.</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="data"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm">
                  <h4 className="text-lg font-black text-slate-900 mb-6 md:mb-8 flex items-center gap-3">
                    <TrendingUp className="w-6 h-6" stroke="url(#vivid-icon-gradient)" /> Performance & Capacità
                  </h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                    {/* EBITDA & Sell_IN Column */}
                    <div className="lg:col-span-1 space-y-4 md:space-y-6">
                      {performanceStats.map((item) => (
                        <div key={item.name} className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{item.name} 2025</p>
                          <p className="text-2xl md:text-3xl font-mono font-bold tracking-tight" style={{ color: item.color }}>
                            {item.name === 'EBITDA' 
                              ? item.value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                              : `${Math.round(item.value).toLocaleString('it-IT')} ${item.unit}`}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Tanks Column */}
                    <div className="lg:col-span-2 space-y-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Capacità Serbatoi (Kl)</p>
                      <div className="h-[260px] w-full bg-slate-50 rounded-xl p-4 md:p-6 border border-slate-200 shadow-sm">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={tankData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="id" 
                              fontSize={11} 
                              fontWeight="bold" 
                              tickLine={false} 
                              axisLine={false}
                              tick={{ fill: '#64748b' }}
                            />
                            <YAxis 
                              fontSize={11} 
                              fontWeight="bold" 
                              tickLine={false} 
                              axisLine={false}
                              tick={{ fill: '#64748b' }}
                            />
                            <ReTooltip 
                              cursor={{ fill: '#f1f5f9', radius: 8 }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 min-w-[180px]">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Serbatoio {data.id}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.category}</p>
                                        <p className="text-xs text-slate-700 font-bold truncate max-w-[140px]">{data.product}</p>
                                        <div className="pt-3 border-t border-slate-100 mt-2">
                                          <p className="text-xl font-mono font-bold" style={{ color: data.color }}>
                                            {(data.volume).toLocaleString('it-IT', { maximumFractionDigits: 0 })} <span className="text-[10px] opacity-70">Kl</span>
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar 
                              dataKey="volume" 
                              radius={[4, 4, 0, 0]} 
                              barSize={32}
                            >
                              {tankData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Legend with Summations */}
                      <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6">
                        <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Benzina</span>
                          </div>
                          <p className="text-sm md:text-lg font-mono font-bold text-slate-900">{(totals.benzina).toLocaleString('it-IT', { maximumFractionDigits: 0 })} Kl</p>
                        </div>
                        <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gasolio</span>
                          </div>
                          <p className="text-sm md:text-lg font-mono font-bold text-slate-900">{(totals.gasolio).toLocaleString('it-IT', { maximumFractionDigits: 0 })} Kl</p>
                        </div>
                        <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supreme</span>
                          </div>
                          <p className="text-sm md:text-lg font-mono font-bold text-slate-900">{(totals.supreme).toLocaleString('it-IT', { maximumFractionDigits: 0 })} Kl</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
                      <Info className="w-6 h-6" stroke="url(#vivid-icon-gradient)" /> Informazioni Generali
                    </h4>
                    <div className="bg-slate-50 rounded-xl p-4 md:p-6 space-y-3 border border-slate-200 shadow-sm">
                      {[
                        { label: 'Gestore', value: installation.manager },
                        { label: 'Contratto Terreno', value: installation.contract },
                        { label: 'Contratto Gestore', value: installation.moso },
                        { label: 'TLS', value: installation.tls }
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                          <span className="text-sm font-black text-slate-900">{item.value || 'N/D'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
                      <Phone className="w-6 h-6" stroke="url(#vivid-icon-gradient)" /> Contatti & Supporto
                    </h4>
                    <div className="bg-slate-50 rounded-xl p-4 md:p-6 space-y-3 border border-slate-200 shadow-sm">
                      {installation.phone && installation.phone !== 'N/D' && installation.phone !== '-' ? (
                        <a href={`tel:${installation.phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <Phone className="w-4 h-4" stroke="url(#vivid-icon-gradient)" />
                          </div>
                          <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{installation.phone}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm opacity-60">
                          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                            <Phone className="w-4 h-4" stroke="url(#vivid-icon-gradient)" />
                          </div>
                          <span className="text-sm font-bold text-slate-500">N/D</span>
                        </div>
                      )}
                      {installation.email && installation.email !== 'N/D' && installation.email !== '-' ? (
                        <a href={`mailto:${installation.email}`} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <Mail className="w-4 h-4" stroke="url(#vivid-icon-gradient)" />
                          </div>
                          <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors truncate">{installation.email}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm opacity-60">
                          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                            <Mail className="w-4 h-4" stroke="url(#vivid-icon-gradient)" />
                          </div>
                          <span className="text-sm font-bold text-slate-500">N/D</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <Database className="w-6 h-6" stroke="url(#vivid-icon-gradient)" /> Dotazione Asset Completa
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">ID Serb.</th>
                          <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Prodotto</th>
                          <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Volume</th>
                          <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Erogatore</th>
                          <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Modello Erog.</th>
                          <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Pistole</th>
                          <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Ultima Verifica</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {installation.rows.map((row, idx) => {
                          const isOldInspection = isOlderThanTwoYears(row["Ultima Verifica Erogatore"]);
                          return (
                          <tr key={`${row["ID Serbatoio"]}-${row["Matricola Erogatore"]}-${idx}`} className={cn("transition-colors", isOldInspection ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50")}>
                            <td className="px-3 py-2 font-mono text-slate-700">{row["ID Serbatoio"] || '-'}</td>
                            <td className="px-3 py-2 font-medium text-slate-700">
                              <div className="flex items-center gap-1.5">
                                {row["Prodotto Serbatoio"] && row["Prodotto Serbatoio"] !== "-" && (
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    row["Prodotto Serbatoio"].toLowerCase().includes('benzina') ? 'bg-emerald-500' :
                                    row["Prodotto Serbatoio"].toLowerCase().includes('gasolio') ? 'bg-amber-500' :
                                    row["Prodotto Serbatoio"].toLowerCase().includes('supreme') ? 'bg-blue-500' : 'bg-slate-300'
                                  )}></div>
                                )}
                                {row["Prodotto Serbatoio"] || '-'}
                              </div>
                            </td>
                            <td className="px-3 py-2 font-mono text-blue-600">{row["Volume Serbatoio"] || '-'}</td>
                            <td className="px-3 py-2 font-medium text-slate-600">{row["Tipo Erogatore"] || '-'}</td>
                            <td className="px-3 py-2 font-medium text-slate-700">{row["Modello Erogatore"] || '-'}</td>
                            <td className="px-3 py-2 font-mono text-slate-600">{row["Pistole Erogatore"] || '-'}</td>
                            <td className={cn("px-3 py-2 font-medium whitespace-nowrap", isOldInspection ? "text-red-600 font-bold" : "text-slate-600")}>
                              {formatMonthYear(row["Ultima Verifica Erogatore"])}
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      <div className="p-4 md:p-6 border-t border-slate-200 bg-slate-50 flex gap-4 rounded-b-2xl">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${installation.address}, ${installation.city}`)}`, '_blank')}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_0_#2563eb] active:shadow-none active:translate-y-1 text-sm"
          >
             <MapIcon className="w-4 h-4" stroke="url(#vivid-icon-gradient)" /> Maps
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl transition-all border border-slate-200 shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" stroke="url(#vivid-icon-gradient)" /> Exit
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

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
  const [view, setView] = useState<'map' | 'list'>('map');
  const [data, setData] = useState<{ allRows: InstallationRow[], uniqueInstallations: Installation[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedInspectionYear, setSelectedInspectionYear] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'city' | 'ebitda-desc' | 'ebitda-asc'>('city');
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const chart1Ref = useRef<HTMLDivElement>(null);
  const chart2Ref = useRef<HTMLDivElement>(null);
  const [chart1Image, setChart1Image] = useState<string | null>(null);
  const [chart2Image, setChart2Image] = useState<string | null>(null);

  const handleDownloadPDF = async () => {
    // Capture charts
    try {
      if (chart1Ref.current) {
        const dataUrl1 = await domtoimage.toPng(chart1Ref.current, { bgcolor: '#ffffff' });
        setChart1Image(dataUrl1);
      }
      if (chart2Ref.current) {
        const dataUrl2 = await domtoimage.toPng(chart2Ref.current, { bgcolor: '#ffffff' });
        setChart2Image(dataUrl2);
      }
    } catch (e) {
      console.error('Error capturing charts', e);
    }
  };
  const [showDashboard, setShowDashboard] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState<{ current: number, total: number } | null>(null);
  const [activePieIndex, setActivePieIndex] = useState(0);

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

  const handleExport = () => {
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

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    saveAs(blob, `Report_MODULA_${new Date().toISOString().slice(0, 10)}.doc`);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const csv = Papa.unparse(data.allRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Dati_MODULA_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;
  
  const provinces = [...new Set(data?.uniqueInstallations.map(i => i.province) || [])].sort();
  const types = [...new Set(data?.uniqueInstallations.map(i => i.contract) || [])].filter(Boolean).sort();
  const statuses = [...new Set(data?.uniqueInstallations.map(i => i.moso) || [])].filter(Boolean).sort();
  const inspectionYears = [...new Set((data?.uniqueInstallations || []).flatMap(i => 
    i.rows.map(r => r["Ultima Verifica Erogatore"]?.split('/').pop() || r["Ultima Verifica Erogatore"]?.split('-')[0]).filter(y => y && y.length === 4)
  ))].sort((a, b) => b.localeCompare(a));

  const filteredInstallations = data?.uniqueInstallations.filter(inst => {
    const matchesSearch = inst.city.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inst.pbl.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvince = selectedProvince === '' || inst.province === selectedProvince;
    const matchesType = selectedType === '' || inst.contract === selectedType;
    const matchesStatus = selectedStatus === '' || inst.moso === selectedStatus;
    
    const instYears = inst.rows.map(r => r["Ultima Verifica Erogatore"]?.split('/').pop() || r["Ultima Verifica Erogatore"]?.split('-')[0]).filter(y => y && y.length === 4);
    const matchesYear = selectedInspectionYear === '' || instYears.includes(selectedInspectionYear);

    return matchesSearch && matchesProvince && matchesType && matchesStatus && matchesYear;
  }) || [];

  if (sortBy === 'ebitda-desc') {
    filteredInstallations.sort((a, b) => b.ebitda - a.ebitda);
  } else if (sortBy === 'ebitda-asc') {
    filteredInstallations.sort((a, b) => a.ebitda - b.ebitda);
  } else {
    filteredInstallations.sort((a, b) => a.city.localeCompare(b.city));
  }

  const contractData = Object.entries(
    filteredInstallations.reduce((acc, inst) => {
      const c = inst.contract || 'N/D';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const maxEbitda = Math.max(...filteredInstallations.map(i => i.ebitda), 1);
  const maxSell = Math.max(...filteredInstallations.map(i => i.sell), 1);

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
      <header className="glass-morphism sticky top-0 z-[2000] px-6 py-4 flex flex-col gap-4 shadow-2xl shadow-slate-200/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white/50 p-1 rounded-xl border border-white/50 shadow-sm">
              <button
                onClick={() => setView('map')}
                disabled={loading}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 active:shadow-none active:translate-y-1",
                  view === 'map' ? "bg-white text-blue-600 shadow-[0_4px_0_0_#cbd5e1]" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-[0_4px_0_0_transparent]",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Mappa</span>
              </button>
              <button
                onClick={() => setView('list')}
                disabled={loading}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 active:shadow-none active:translate-y-1",
                  view === 'list' ? "bg-white text-blue-600 shadow-[0_4px_0_0_#cbd5e1]" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-[0_4px_0_0_transparent]",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>
            
            <button 
              onClick={() => setShowDashboard(!showDashboard)}
              disabled={loading}
              className={cn(
                "px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-sm active:shadow-none active:translate-y-1",
                showDashboard ? "bg-blue-600 text-white shadow-[0_4px_0_0_#2563eb]" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-[0_4px_0_0_#cbd5e1]",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
            <button 
              onClick={handleLogout}
              className="p-2 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-slate-200 shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 flex items-center justify-center gap-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 relative z-[4000]">
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
              
              <div className="w-[180px]">
                <SearchableSelect
                  options={provinces}
                  value={selectedProvince}
                  onChange={setSelectedProvince}
                  placeholder="Provincia"
                  className="w-full"
                  compact
                />
              </div>

              <div className="w-[180px]">
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
                              alert(`Apertura file Excel condiviso per ${inst.city} (PBL: ${inst.pbl})`);
                            }}
                            className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-500 hover:text-white transition-all border border-slate-200 shadow-[0_2px_0_0_#cbd5e1] active:shadow-none active:translate-y-1"
                            title="Aggiorna dati in tempo reale"
                          >
                            <Monitor className="w-3 h-3 hidden" />
                          </motion.button>
                          <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors border border-slate-200 group-hover:border-blue-600">
                            <ChevronRight className="w-3 h-3" />
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
      </main>

      <AnimatePresence>
        {selectedInstallation && (
          <DetailModal 
            key="detail-modal"
            installation={selectedInstallation} 
            onClose={() => setSelectedInstallation(null)}
            chart1Image={chart1Image}
            chart2Image={chart2Image}
            chart1Ref={chart1Ref}
            chart2Ref={chart2Ref}
          />
        )}
        <div key="dashboard-modal" className={cn("fixed inset-0 z-[3000] flex items-center justify-center p-4 transition-all duration-300", showDashboard ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={() => setShowDashboard(false)}
          />
          <motion.div 
            initial={false}
            animate={showDashboard ? { scale: 1, y: 0, opacity: 1 } : { scale: 0.95, y: 20, opacity: 0 }}
            className="relative bg-white w-full max-w-6xl rounded-2xl shadow-2xl p-6 md:p-8 space-y-8 max-h-[90vh] overflow-y-auto border border-slate-200"
          >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Analitica</h3>
                    <p className="text-slate-500 text-sm font-medium">Panoramica globale del network MODULA</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  onClick={() => setShowDashboard(false)} 
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 flex items-center justify-center"
                >
                  <X className="w-6 h-6 text-slate-400 hidden" />
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Distribuzione Contratti</h4>
                  <div ref={chart1Ref} className="h-[350px] w-full bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <AnyPie
                          activeIndex={activePieIndex}
                          activeShape={renderActiveShape}
                          data={contractData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                          onMouseEnter={(_: any, index: number) => setActivePieIndex(index)}
                        >
                          {contractData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity" />
                          ))}
                        </AnyPie>
                        <ReTooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px', fontSize: '12px' }}
                          itemStyle={{ fontWeight: 'bold' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36} 
                          iconType="circle" 
                          wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} 
                          formatter={(value) => <span className="text-slate-700 ml-1">{value}</span>}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Trend EBITDA & SELL_IN</h4>
                  <div ref={chart2Ref} className="h-[350px] w-full bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={filteredInstallations} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="city" 
                          hide={filteredInstallations.length > 15}
                          fontSize={11}
                          fontWeight="bold"
                          tick={{ fill: '#94a3b8' }}
                        />
                        <YAxis 
                          fontSize={11}
                          fontWeight="bold"
                          tick={{ fill: '#94a3b8' }}
                          tickFormatter={(value) => `${(value / 1000).toLocaleString('it-IT', { maximumFractionDigits: 0 })}k`}
                        />
                        <ReTooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 min-w-[200px]">
                                  <p className="font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">{label}</p>
                                  <div className="space-y-2">
                                    {payload.map((entry: any, index: number) => (
                                      <div key={`${entry.name}-${index}`} className="flex justify-between items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                          <span className="font-medium text-slate-500">{entry.name === 'ebitda' ? 'EBITDA' : 'SELL_IN'}</span>
                                        </div>
                                        <span className={cn("font-bold", entry.name === 'ebitda' && entry.value < 0 ? "text-red-600" : "text-slate-900")}>
                                          {entry.name === 'ebitda' 
                                            ? entry.value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                                            : `${Math.round(entry.value).toLocaleString('it-IT')} L`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          iconType="circle" 
                          wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} 
                          formatter={(value) => <span className="text-slate-700 ml-1">{value.toUpperCase()}</span>}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="ebitda" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                          activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
                          name="ebitda"
                          animationDuration={1500}
                          animationEasing="ease-in-out"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sell" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                          activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
                          name="sell_in"
                          animationDuration={1500}
                          animationEasing="ease-in-out"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 md:p-8 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Totale EBITDA Network</p>
                    <p className={cn("text-3xl md:text-4xl font-black tracking-tight", filteredInstallations.reduce((acc, i) => acc + i.ebitda, 0) < 0 ? "text-red-300" : "text-white")}>
                      {filteredInstallations.reduce((acc, i) => acc + i.ebitda, 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <div className="h-12 w-[1px] bg-white/20 hidden md:block"></div>
                <div className="flex items-center gap-4 md:gap-6 text-right">
                  <div>
                    <p className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Volume SELL_IN Totale</p>
                    <p className="text-3xl md:text-4xl font-black tracking-tight">
                      {Math.round(filteredInstallations.reduce((acc, i) => acc + i.sell, 0)).toLocaleString('it-IT')} <span className="text-lg opacity-60">L</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <Database className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDashboard(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-all border border-slate-200 text-sm shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Chiudi Dashboard
              </motion.button>
            </motion.div>
          </div>
      </AnimatePresence>
    </div>
  );
}
