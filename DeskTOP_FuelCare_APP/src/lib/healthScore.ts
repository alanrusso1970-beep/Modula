// src/lib/healthScore.ts
import { Installation } from '../types';

export type AlertStatus = 'critical' | 'warning' | 'ok';

export interface HealthResult {
  score: number;         // 0-100
  status: AlertStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  details: {
    ebitdaScore: number;
    inspectionScore: number;
    sellScore: number;
  };
}

const INSPECTION_WARNING_MONTHS = 3;

export function isExpiredDate(dateString?: string): boolean {
  if (!dateString) return false;
  const parts = dateString.split(/[-/]/);
  if (parts.length !== 3) return false;
  let year: number, month: number, day: number;
  if (parts[0].length === 4) {
    year = parseInt(parts[0]); month = parseInt(parts[1]) - 1; day = parseInt(parts[2]);
  } else {
    day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]);
  }
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  return diffMonths > 24;
}

export function isExpiringSoon(dateString?: string): boolean {
  if (!dateString) return false;
  const parts = dateString.split(/[-/]/);
  if (parts.length !== 3) return false;
  let year: number, month: number, day: number;
  if (parts[0].length === 4) {
    year = parseInt(parts[0]); month = parseInt(parts[1]) - 1; day = parseInt(parts[2]);
  } else {
    day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]);
  }
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  // Expired = 24+ months old, expiring soon = expires within warning window
  const expiryDate = new Date(d.getFullYear() + 2, d.getMonth(), d.getDate());
  const msUntilExpiry = expiryDate.getTime() - now.getTime();
  const monthsUntilExpiry = msUntilExpiry / (1000 * 60 * 60 * 24 * 30.44);
  return monthsUntilExpiry >= 0 && monthsUntilExpiry <= INSPECTION_WARNING_MONTHS;
}

export function getAlertStatus(inst: Installation): AlertStatus {
  const hasExpired = inst.rows.some(r => isExpiredDate(r['Ultima Verifica Erogatore']));
  const hasExpiringSoon = inst.rows.some(r => isExpiringSoon(r['Ultima Verifica Erogatore']));
  if (hasExpired && inst.ebitda < 0) return 'critical';
  if (hasExpired || inst.ebitda < 0) return 'warning';
  if (hasExpiringSoon) return 'warning';
  return 'ok';
}

export function calculateHealthScore(
  inst: Installation,
  maxSell: number
): HealthResult {
  // EBITDA score (40%)
  let ebitdaScore = 0;
  if (inst.ebitda > 100000) ebitdaScore = 40;
  else if (inst.ebitda > 50000) ebitdaScore = 35;
  else if (inst.ebitda > 0) ebitdaScore = 25;
  else if (inst.ebitda > -50000) ebitdaScore = 10;
  else ebitdaScore = 0;

  // Inspection score (35%)
  const hasExpired = inst.rows.some(r => isExpiredDate(r['Ultima Verifica Erogatore']));
  const hasExpiringSoon = inst.rows.some(r => isExpiringSoon(r['Ultima Verifica Erogatore']));
  let inspectionScore = 0;
  if (!hasExpired && !hasExpiringSoon) inspectionScore = 35;
  else if (!hasExpired && hasExpiringSoon) inspectionScore = 20;
  else inspectionScore = 0;

  // Sell score (25%)
  const sellRatio = maxSell > 0 ? Math.min(inst.sell / maxSell, 1) : 0;
  const sellScore = Math.round(sellRatio * 25);

  const score = Math.min(100, ebitdaScore + inspectionScore + sellScore);
  const alertStatus = getAlertStatus(inst);

  let label: string;
  let color: string;
  let bgColor: string;
  let borderColor: string;
  let emoji: string;

  if (score >= 70) {
    label = 'Eccellente'; color = '#10b981'; bgColor = '#f0fdf4'; borderColor = '#bbf7d0'; emoji = '🟢';
  } else if (score >= 40) {
    label = 'Attenzione'; color = '#f59e0b'; bgColor = '#fffbeb'; borderColor = '#fde68a'; emoji = '🟡';
  } else {
    label = 'Critico'; color = '#ef4444'; bgColor = '#fef2f2'; borderColor = '#fecaca'; emoji = '🔴';
  }

  return { score, status: alertStatus, label, color, bgColor, borderColor, emoji, details: { ebitdaScore, inspectionScore, sellScore } };
}
