// src/lib/exportUtils.ts
import { Installation, InstallationRow } from '../types';

export const handleExportModulaReport = async (data: { uniqueInstallations: Installation[] } | null) => {
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

  const escapeHtml = (unsafe: string | number | undefined | null): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const htmlContent = `
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
          <p>Data Generazione: ${escapeHtml(new Date().toLocaleString('it-IT'))}</p>
          <p>Totale Impianti: <strong>${data.uniqueInstallations.length}</strong></p>

          <div class="summary-box">
            <h3>1) Suddivisione per Provincia</h3>
            <table>
              <thead>
                <tr><th>Provincia</th><th>Conteggio Impianti</th></tr>
              </thead>
              <tbody>
                ${Object.entries(provinceCounts).sort((a, b) => b[1] - a[1]).map(([p, count]) => `
                  <tr><td>${escapeHtml(p)}</td><td>${count}</td></tr>
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
                  <tr><td>${escapeHtml(m)}</td><td>${count}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        ${data.uniqueInstallations.map(inst => `
          <div class="page-break">
            <h2>Dettaglio Impianto: ${escapeHtml(inst.city)}</h2>
            
            <div class="grid">
              <div class="grid-row">
                <div class="grid-cell"><span class="label">PBL:</span> ${escapeHtml(inst.pbl)}</div>
                <div class="grid-cell"><span class="label">Città:</span> ${escapeHtml(inst.city)} (${escapeHtml(inst.province)})</div>
              </div>
              <div class="grid-row">
                <div class="grid-cell"><span class="label">Indirizzo:</span> ${escapeHtml(inst.address)}, ${escapeHtml(inst.cap)}</div>
                <div class="grid-cell"><span class="label">Gestore:</span> ${escapeHtml(inst.manager)}</div>
              </div>
              <div class="grid-row">
                <div class="grid-cell"><span class="label">Email:</span> ${escapeHtml(inst.email)}</div>
                <div class="grid-cell"><span class="label">Telefono:</span> ${escapeHtml(inst.phone)}</div>
              </div>
              <div class="grid-row">
                <div class="grid-cell"><span class="label">Contratto:</span> ${escapeHtml(inst.contract)}</div>
                <div class="grid-cell"><span class="label">MachCode:</span> ${escapeHtml(inst.moso)}</div>
              </div>
              <div class="grid-row">
                <div class="grid-cell"><span class="label">TLS:</span> ${escapeHtml(inst.tls)}</div>
                <div class="grid-cell"><span class="label">EBITDA 2025:</span> <span style="color: ${inst.ebitda < 0 ? '#ef4444' : '#10b981'}">${escapeHtml(inst.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }))}</span></div>
              </div>
              <div class="grid-row">
                <div class="grid-cell"><span class="label">Sell_IN 2025:</span> ${escapeHtml(Math.round(inst.sell).toLocaleString('it-IT'))} L</div>
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
                    <td>${escapeHtml(r["ID Serbatoio"]) || '-'}</td>
                    <td>${escapeHtml(r["Prodotto Serbatoio"]) || '-'}</td>
                    <td>${escapeHtml(r["Volume Serbatoio"]) || '-'}</td>
                    <td>${escapeHtml(r["ID Erogatore"]) || '-'}</td>
                    <td>${escapeHtml(r["Tipo Erogatore"]) || '-'}</td>
                    <td>${escapeHtml(r["Modello Erogatore"]) || '-'}</td>
                    <td>${escapeHtml(r["Pistole Erogatore"]) || '-'}</td>
                    <td>${escapeHtml(r["Ultima Verifica Erogatore"]) || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      </body>
    </html>
  `;

  try {
    const { saveAs } = await import('file-saver');
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    saveAs(blob, `Report_MODULA_${new Date().toISOString().slice(0, 10)}.doc`);
  } catch (error) {
    console.error("Export fallito: ", error);
  }
};

import Papa from 'papaparse';

export const handleExportCSVData = async (data: { allRows: InstallationRow[] } | null) => {
  if (!data) return;
  try {
    const csv = Papa.unparse(data.allRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const { saveAs } = await import('file-saver');
    saveAs(blob, `Dati_MODULA_${new Date().toISOString().slice(0, 10)}.csv`);
  } catch (error) {
    console.error("Export CSV fallito: ", error);
  }
};
