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

  // Calculate the center
  let initialCenter: [number, number] = [41.9028, 12.4964]; // Default to Rome
  let initialZoom = 6;

  const installationsWithCoords = filteredMapInstallations.filter(inst => inst.lat && inst.lng);
  if (installationsWithCoords.length > 0) {
    const avgLat = installationsWithCoords.reduce((sum, inst) => sum + (inst.lat || 0), 0) / installationsWithCoords.length;
    const avgLng = installationsWithCoords.reduce((sum, inst) => sum + (inst.lng || 0), 0) / installationsWithCoords.length;
    initialCenter = [avgLat, avgLng];
    initialZoom = mapSearch ? 10 : (installationsWithCoords.length < 5 ? 9 : 7);
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

      {/* Search Input on Map */}
      <div className="absolute top-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 z-[1000]">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Cerca città o PBL..."
            value={mapSearch}
            onChange={(e) => setMapSearch(e.target.value)}
            className="w-full bg-white/90 backdrop-blur-md border border-slate-200 px-6 py-4 rounded-2xl text-slate-900 font-bold shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (userLocation) {
              initialCenter = [userLocation.lat, userLocation.lng];
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
