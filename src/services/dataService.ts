import Papa from 'papaparse';
import { Installation, InstallationRow } from '../types';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGAIOTTCMyL8dewD_W3nKSr0HgJbqEYffhgMOA6HSwGXevQBi87KLTxpVLdg9bSw/pub?output=csv";

// Simple in-memory cache
let cachedData: { allRows: InstallationRow[], uniqueInstallations: Installation[] } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Robust numeric parser for Italian formatting.
 * Treats '.' as thousands separator and ',' as decimal separator.
 */
export function parseNumericValue(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  
  const str = String(val).trim();
  if (!str) return 0;

  // Remove everything except digits, comma, dot, and minus
  let clean = str.replace(/[^\d,.-]/g, '');

  if (clean.includes(',')) {
    // Standard Italian format: 1.200,50 or 1200,50
    // Remove dots, replace comma with dot for JS parseFloat
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else {
    // No comma. User says dot is thousands separator.
    // 1.200 -> 1200
    // 12.000 -> 12000
    clean = clean.replace(/\./g, '');
  }

  const result = parseFloat(clean);
  return isNaN(result) ? 0 : result;
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
              ebitda: parseNumericValue(first.EBITDA2025),
              sell: parseNumericValue(first.Sell2025),
              revenue: parseNumericValue(first.Sell2025),
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
