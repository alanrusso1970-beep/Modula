import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon, Navigation } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Installation } from '../types';

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
    // Force a resize check to ensure the map fills the container correctly
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

  // Calculate the center
  let initialCenter: [number, number] = [41.9028, 12.4964]; // Default to Rome
  let initialZoom = 6;

  const installationsWithCoords = installations.filter(inst => inst.lat && inst.lng);
  
  // Track positions to handle overlaps
  const usedPositions = new Set<string>();

  return (
    <div className="absolute inset-0 bg-slate-950 overflow-hidden">
      <MapContainer 
        center={initialCenter} 
        zoom={initialZoom} 
        style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}
        zoomControl={false}
      >
        <MapUpdater center={initialCenter} zoom={initialZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>La tua posizione</Popup>
          </Marker>
        )}

        {installationsWithCoords.map((inst) => {
          let pos: [number, number] = [inst.lat!, inst.lng!];
          const posKey = `${pos[0].toFixed(4)},${pos[1].toFixed(4)}`;
          
          // Slight offset for overlapping markers
          if (usedPositions.has(posKey)) {
            pos = [pos[0] + (Math.random() - 0.5) * 0.002, pos[1] + (Math.random() - 0.5) * 0.002];
          }
          usedPositions.add(posKey);

          return (
            <Marker 
              key={inst.pbl} 
              position={pos}
              eventHandlers={{
                click: () => {} 
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-slate-100 font-mono tracking-widest text-xs border-b border-slate-700 pb-2 mb-2 uppercase">{inst.city}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mb-2">TARGET_ID: {inst.pbl}</p>
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-500 uppercase">EBITDA_EST:</span>
                      <span className={inst.ebitda < 0 ? 'text-rose-500 font-black drop-shadow-[0_0_2px_rgba(244,63,94,0.5)]' : 'text-emerald-400 font-black drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]'}>
                        {inst.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onProceed(inst.province)}
                    className="w-full py-2 border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:text-blue-300 text-[10px] uppercase font-black tracking-widest rounded-sm hover:bg-blue-500/20 transition-colors shadow-[0_0_5px_rgba(59,130,246,0.1)] active:scale-95"
                  >
                    ACCESS_PROVINCE_{inst.province}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Info Card */}
      <div className="absolute bottom-6 left-6 z-[1000] hidden sm:block">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 backdrop-blur-md p-5 rounded-sm min-w-[260px] border border-slate-700 shadow-[0_5px_30px_rgba(0,0,0,0.5)] shadow-inner"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-sm border border-blue-500/30 flex items-center justify-center shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]">
              <MapIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">GLOBAL_NETWORK_MAP</p>
              <p className="text-2xl font-mono font-black text-slate-100 tracking-tight">
                {installationsWithCoords.length} <span className="text-sm font-bold text-slate-600">/ {installations.length}</span>
              </p>
            </div>
          </div>
          
          {geocodingStatus && (
            <div className="mt-5 pt-4 border-t border-slate-800">
              <div className="flex justify-between text-[9px] font-bold font-mono text-blue-400 mb-2 tracking-widest drop-shadow-[0_0_5px_rgba(59,130,246,0.3)]">
                <span>SYSTEM_GIS_MAPPING</span>
                <span>{Math.round((geocodingStatus.current / geocodingStatus.total) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-sm h-1 border border-slate-800 overflow-hidden">
                <motion.div 
                  className="bg-blue-500 h-full rounded-sm shadow-[0_0_10px_rgba(59,130,246,1)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(geocodingStatus.current / geocodingStatus.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (userLocation) {
              // Note: this should really re-center the MapContainer, using useMap inside a component is better
            }
          }}
          className="bg-slate-900 p-4 rounded-sm text-slate-400 hover:text-blue-400 transition-all shadow-[inset_0_0_10px_rgba(255,255,255,0.02)] active:shadow-none border border-slate-700 flex items-center justify-center gap-2"
        >
          <Navigation className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
};

export default React.memo(MapView);
