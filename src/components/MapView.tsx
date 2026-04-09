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
    <div className="absolute inset-0 bg-slate-100 overflow-hidden">
      <MapContainer 
        center={initialCenter} 
        zoom={initialZoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapUpdater center={initialCenter} zoom={initialZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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
                  <h3 className="font-bold text-slate-900 text-sm">{inst.city}</h3>
                  <p className="text-[10px] text-slate-500 mb-2">PBL: {inst.pbl}</p>
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">EBITDA:</span>
                      <span className={inst.ebitda < 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {inst.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onProceed(inst.province)}
                    className="w-full py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Vedi Provincia {inst.province}
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
          className="bg-white p-5 rounded-2xl min-w-[260px] border border-slate-200 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <MapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Network Status</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {installationsWithCoords.length} <span className="text-sm font-bold text-slate-400">/ {installations.length}</span>
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

      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (userLocation) {
              // Note: this should really re-center the MapContainer, using useMap inside a component is better
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

export default React.memo(MapView);
