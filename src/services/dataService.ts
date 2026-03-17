import Papa from 'papaparse';
import { Installation, InstallationRow } from '../types';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGAIOTTCMyL8dewD_W3nKSr0HgJbqEYffhgMOA6HSwGXevQBi87KLTxpVLdg9bSw/pub?output=csv";

export async function fetchInstallations(): Promise<{ allRows: InstallationRow[], uniqueInstallations: Installation[] }> {
  const response = await fetch(`${CSV_URL}&t=${Date.now()}`);
  const text = await response.text();

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
            address: first.Indirizzo || '',
            cap: first.CAP || '',
            ebitda: parseFloat(first.EBITDA2025?.replace(/\s/g, '').replace('€', '').replace(/\./g, '').replace(',', '.') || '0') || 0,
            sell: parseFloat(first.Sell2025?.replace(/\s/g, '').replace('€', '').replace(/\./g, '').replace(',', '.') || '0') || 0,
            manager: first.Gestore || '',
            email: first.Email || '',
            phone: first.Telefono || '',
            contract: first.Contratto || '',
            moso: first.MoSo || '',
            tls: first.TLS || '',
            rows
          };
        });

        resolve({ allRows, uniqueInstallations });
      },
      error: (error: any) => reject(error)
    });
  });
}
