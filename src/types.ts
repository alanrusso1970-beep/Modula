export interface InstallationRow {
  PBL: string;
  Città: string;
  Provincia: string;
  Indirizzo: string;
  CAP: string;
  Regione: string;
  EBITDA2025: string;
  Sell2025: string;
  Gestore: string;
  Email: string;
  Telefono: string;
  Contratto: string;
  MoSo: string;
  TLS: string;
  "ID Serbatoio": string;
  "Prodotto Serbatoio": string;
  "Volume Serbatoio": string;
  "Note Serbatoio": string;
  "ID Erogatore": string;
  "Tipo Erogatore": string;
  "Matricola Erogatore": string;
  "Modello Erogatore": string;
  "Pistole Erogatore": string;
  "Ultima Verifica Erogatore": string;
}

export interface Installation {
  pbl: string;
  city: string;
  province: string;
  address: string;
  cap: string;
  region: string;
  ebitda: number;
  sell: number;
  manager: string;
  email: string;
  phone: string;
  contract: string;
  moso: string;
  tls: string;
  rows: InstallationRow[];
  lat?: number;
  lng?: number;
  revenue?: number;
}

export interface RealTimeData {
  mese: string;
  prodotto: string;
  sellin: number;
  servito: number;
  sellinPY: number;
}
