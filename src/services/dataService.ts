import Papa from 'papaparse';
import { Installation, InstallationRow } from '../types';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGAIOTTCMyL8dewD_W3nKSr0HgJbqEYffhgMOA6HSwGXevQBi87KLTxpVLdg9bSw/pub?output=csv";

// Simple in-memory cache
let cachedData: { allRows: InstallationRow[], uniqueInstallations: Installation[] } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function parseMonetaryValue(val: string | undefined): number {
  if (!val) return 0;
  // Handle both "1.200,50" and "1200.50" formats, plus currency symbols
  const clean = val.replace(/[^\d,.-]/g, '');
  if (clean.includes(',') && clean.includes('.')) {
    // Standard European format: 1.200,50
    return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
  }
  if (clean.includes(',')) {
    // Simple European format: 1200,50
    return parseFloat(clean.replace(',', '.'));
  }
  return parseFloat(clean) || 0;
}

export async function fetchInstallations(forceRefresh = false): Promise<{ allRows: InstallationRow[], uniqueInstallations: Installation[] }> {
  const now = Date.now();
  if (!forceRefresh && cachedData && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedData;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const response = await fetch(`${CSV_URL}&t=${now}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Errore caricamento dati: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    if (!text || text.length < 10) {
      throw new Error("I dati ricevuti dal server sono vuoti o non validi.");
    }

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          const allRows = results.data as InstallationRow[];
          const pblMap = new Map<string, InstallationRow[]>();

          allRows.forEach(row => {
            if (!pblMap.has(row.PBL)) {
              pblMap.set(row.PBL, []);
            }
            pblMap.get(row.PBL)!.push(row);
          });

          const uniqueInstallations: Installation[] = Array.from(pblMap.entries()).map(([pbl, rows]) => {
            const first = rows[0];
            return {
              pbl,
              city: first.Città || '',
              province: first.Provincia || '',
              region: first.Regione || '',
              address: first.Indirizzo || '',
              cap: first.CAP || '',
              ebitda: parseMonetaryValue(first.EBITDA2025),
              sell: parseMonetaryValue(first.Sell2025),
              revenue: parseMonetaryValue(first.Sell2025), // Map sell to revenue for compatibility with MapView UI
              manager: first.Gestore || '',
              email: first.Email || '',
              phone: first.Telefono || '',
              contract: first.Contratto || '',
              moso: first.MoSo || '',
              tls: first.TLS || '',
              rows
            };
          });

          cachedData = { allRows, uniqueInstallations };
          lastFetchTime = now;
          resolve(cachedData);
        },
        error: (error: any) => reject(error)
      });
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Fetch error:", error);
    throw new Error(error.name === 'AbortError' ? "Tempo di risposta scaduto (connessione lenta)." : error.message);
  }
}
