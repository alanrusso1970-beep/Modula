// src/hooks/useGeocoding.ts
import { useState, useEffect } from 'react';
import { Installation, InstallationRow } from '../types';
import { provinceMap, preMapped } from '../lib/constants';

interface DataState {
  allRows: InstallationRow[];
  uniqueInstallations: Installation[];
}

export function useGeocoding(
  isLoggedIn: boolean, 
  data: DataState | null, 
  setData: React.Dispatch<React.SetStateAction<DataState | null>>
) {
  const [geocodingStatus, setGeocodingStatus] = useState<{ current: number, total: number } | null>(null);

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

      for (let index = 0; index < missingProvinces.length; index++) {
        const provAbbr = missingProvinces[index];
        setGeocodingStatus({ current: index + 1, total: missingProvinces.length });
        
        let coords: { lat: number, lng: number } | null = null;

        // Check pre-mapped first
        if (preMapped[provAbbr as keyof typeof preMapped]) {
          coords = preMapped[provAbbr as keyof typeof preMapped];
        } else {
          let success = false;
          let retries = 0;
          const maxRetries = 2;

          while (!success && retries < maxRetries) {
            try {
              // Wait between requests to respect Nominatim usage policy
              await new Promise(r => setTimeout(r, 1500));

              const fullProv = provinceMap[provAbbr as keyof typeof provinceMap] || provAbbr;
              const query = `${fullProv}, Italy`;
              const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000);
              
              const res = await fetch(url, { 
                signal: controller.signal,
                headers: { 'User-Agent': 'FuelCarePlus/1.0' }
              });
              clearTimeout(timeoutId);
              
              if (res.status === 429) {
                await new Promise(r => setTimeout(r, 10000));
                retries++;
                continue;
              }

              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              
              const results = await res.json();
              if (results && results[0]) {
                coords = { 
                  lat: parseFloat(results[0].lat), 
                  lng: parseFloat(results[0].lon) 
                };
              }
              success = true;
            } catch (e) {
              retries++;
              await new Promise(r => setTimeout(r, 2000 * retries));
            }
          }
        }

        if (coords) {
          cache[provAbbr] = coords;
          localStorage.setItem(cacheKey, JSON.stringify(cache));
          hasNewData = true;

          for (let i = 0; i < installations.length; i++) {
            if (installations[i].province === provAbbr) {
              installations[i] = { ...installations[i], ...coords };
            }
          }
        }
      }

      if (hasNewData) {
        setData(prev => prev ? { ...prev, uniqueInstallations: [...installations] } : null);
      }
      setGeocodingStatus(null);
    };

    if (isLoggedIn && data) {
      geocodeAll();
    }
  }, [isLoggedIn, !!data]); // Dependency relies on '!!data' rather than 'data' object reference to avoid re-triggering unnecessarily

  return geocodingStatus;
}
