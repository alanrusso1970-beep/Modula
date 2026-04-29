import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon, Navigation } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Installation } from '../types';
import { cn } from '../lib/utils';


// Fix for default marker icon
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [center, zoom, map]);
  return null;
};

interface MapViewProps {
  installations: Installation[];
  onProceed: (province?: string) => void;
  onResetProvince: () => void;
  geocodingStatus: { current: number, total: number } | null;
}

const MapView: React.FC<MapViewProps> = ({ 
  installations, 
  onProceed, 
  onResetProvince, 
  geocodingStatus 
}) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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

  let initialCenter: [number, number] = [41.9028, 12.4964]; // Default to Rome
  let initialZoom = 6;

  const markerData = React.useMemo(() => {
    const validInsts = installations.filter(inst => inst.lat && inst.lng);
    const usedPositions = new Set<string>();
    
    return validInsts.map(inst => {
      let pos: [number, number] = [inst.lat!, inst.lng!];
      const posKey = `${pos[0].toFixed(4)},${pos[1].toFixed(4)}`;
      
      if (usedPositions.has(posKey)) {
        // Compute a deterministic offset based on the PBL length or char code to avoid randomness on every render,
        // or since it's memoized, random is fine because it runs once per installations change.
        pos = [pos[0] + (Math.random() - 0.5) * 0.002, pos[1] + (Math.random() - 0.5) * 0.002];
      }
      usedPositions.add(posKey);
      
      return { ...inst, computedPos: pos };
    });
  }, [installations]);

  return (
    <div className="absolute inset-0 bg-gray-50 overflow-hidden">
      <MapContainer 
        center={initialCenter} 
        zoom={initialZoom} 
        style={{ height: '100%', width: '100%', backgroundColor: '#f8fafc' }}
        zoomControl={false}
      >
        <MapUpdater center={initialCenter} zoom={initialZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>La tua posizione</Popup>
          </Marker>
        )}

        {markerData.map((inst) => (
            <Marker 
              key={inst.pbl} 
              position={inst.computedPos}
            >
              <Popup className="custom-popup">
                <div className="p-3 min-w-[220px]">
                  <h3 className="font-extrabold text-slate-800 text-sm border-b border-gray-100 pb-2 mb-2 uppercase tracking-tight">{inst.city}</h3>
                  <p className="text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-widest">ID NODO: <span className="text-blue-600">{inst.pbl}</span></p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-slate-500 font-medium uppercase text-[10px] tracking-wider">EBITDA Stimato:</span>
                      <span className={cn("font-black", inst.ebitda < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                        {inst.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onProceed(inst.province)}
                    className="w-full py-2.5 bg-blue-600 text-white text-[10px] uppercase font-extrabold tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10 active:scale-95"
                  >
                    Vedi Provincia {inst.province}
                  </button>
                </div>
              </Popup>
            </Marker>
        ))}
      </MapContainer>

      {/* Floating Info Card */}
      <div className="absolute bottom-8 left-8 z-[1000] hidden sm:block">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl min-w-[280px]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center shadow-sm">
              <MapIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Mappa Globale Nodi</p>
              <p className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {markerData.length} <span className="text-sm font-bold text-slate-300">/ {installations.length}</span>
              </p>
            </div>
          </div>
          
          {geocodingStatus && (
            <div className="mt-6 pt-5 border-t border-gray-50">
              <div className="flex justify-between text-[10px] font-extrabold text-blue-600 mb-2 tracking-widest uppercase">
                <span>Mapping GIS</span>
                <span>{Math.round((geocodingStatus.current / geocodingStatus.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-50">
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

      <div className="absolute bottom-8 right-8 z-[1000] flex flex-col gap-3">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white p-4 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-xl border border-gray-200 flex items-center justify-center gap-2"
        >
          <Navigation className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
};

export default React.memo(MapView);
