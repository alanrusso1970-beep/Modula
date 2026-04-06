// src/lib/aiAnalysis.ts
import { Installation } from '../types';
import { calculateHealthScore, isExpiredDate, isExpiringSoon } from './healthScore';

export interface AIAnalysisResult {
  summary: string;
  recommendations: string[];
  riskLevel: 'bassissimo' | 'basso' | 'medio' | 'alto' | 'critico';
  opportunities: string[];
}

export function generatePlantAnalysis(inst: Installation, maxSell: number): AIAnalysisResult {
  const health = calculateHealthScore(inst, maxSell);
  const recommendations: string[] = [];
  const opportunities: string[] = [];
  const expiredCount = inst.rows.filter(r => isExpiredDate(r['Ultima Verifica Erogatore'])).length;
  const expiringSoonCount = inst.rows.filter(r => isExpiringSoon(r['Ultima Verifica Erogatore'])).length;

  let summary = '';
  let riskLevel: AIAnalysisResult['riskLevel'] = 'basso';

  // 1. Analyze EBITDA
  if (inst.ebitda > 80000) {
    summary = `L'impianto di ${inst.city} è una "Top Star" del network con una redditività d'eccellenza. `;
    opportunities.push("Valutare upgrade premium dei servizi non-oil per massimizzare il traffico alto.");
  } else if (inst.ebitda > 0) {
    summary = `L'operatività a ${inst.city} è stabile e profittevole, con margini di crescita legati all'efficienza operativa. `;
  } else {
    summary = `L'impianto a ${inst.city} presenta una situazione finanziaria sotto pressione con EBITDA negativo. `;
    riskLevel = 'alto';
    recommendations.push("Revisione urgente dei costi fissi e rinegoziazione contratti.");
  }

  // 2. Analyze Technical Expiries
  if (expiredCount > 0) {
    summary += `Si riscontrano gravi criticità tecniche: ${expiredCount} erogatori hanno la verifica scaduta. `;
    riskLevel = 'critico';
    recommendations.push("Programmare immediatamente la verifica metrologica per evitare sanzioni e fermo impianto.");
  } else if (expiringSoonCount > 0) {
    summary += `Monitoraggio necessario: ${expiringSoonCount} asset sono in scadenza nei prossimi 3 mesi. `;
    if ((riskLevel as string) !== 'critico' && (riskLevel as string) !== 'alto') {
      riskLevel = 'medio';
    }
    recommendations.push("Anticipare le manutenzioni programmate per il prossimo trimestre.");
  } else {
    summary += "La dotazione tecnica è pienamente in regola con le normative vigenti. ";
  }

  // 3. Analyze Sales Volumes
  const sellRatio = inst.sell / maxSell;
  if (sellRatio > 0.8) {
    summary += "I volumi di erogato sono ai massimi storici della flotta.";
  } else if (sellRatio < 0.2) {
    summary += "I volumi risultano sensibilmente inferiori alla media regionale.";
    opportunities.push("Campagne marketing locale o loyalty card per recuperare volumi nel breve periodo.");
  }

  // Final Polish
  if (health.score >= 80 && riskLevel === 'basso') riskLevel = 'bassissimo';

  return {
    summary,
    recommendations,
    riskLevel,
    opportunities
  };
}
