export const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const provinceMap: Record<string, string> = {
  'AG': 'Agrigento', 'AL': 'Alessandria', 'AN': 'Ancona', 'AO': 'Aosta', 'AR': 'Arezzo', 'AP': 'Ascoli Piceno', 'AT': 'Asti', 'AV': 'Avellino', 'BA': 'Bari', 'BT': 'Barletta-Andria-Trani', 'BL': 'Belluno', 'BN': 'Benevento', 'BG': 'Bergamo', 'BI': 'Biella', 'BO': 'Bologna', 'BZ': 'Bolzano', 'BS': 'Brescia', 'BR': 'Brindisi', 'CA': 'Cagliari', 'CL': 'Caltanissetta', 'CB': 'Campobasso', 'CE': 'Caserta', 'CT': 'Catania', 'CZ': 'Catanzaro', 'CH': 'Chieti', 'CO': 'Como', 'CS': 'Cosenza', 'CR': 'Cremona', 'KR': 'Crotone', 'CN': 'Cuneo', 'EN': 'Enna', 'FM': 'Fermo', 'FE': 'Ferrara', 'FI': 'Firenze', 'FG': 'Foggia', 'FC': 'Forlì-Cesena', 'FR': 'Frosinone', 'GE': 'Genova', 'GO': 'Gorizia', 'GR': 'Grosseto', 'IM': 'Imperia', 'IS': 'Isernia', 'SP': 'La Spezia', 'AQ': 'L\'Aquila', 'LT': 'Latina', 'LE': 'Lecce', 'LC': 'Lecco', 'LI': 'Livorno', 'LO': 'Lodi', 'LU': 'Lucca', 'MC': 'Macerata', 'MN': 'Mantova', 'MS': 'Massa-Carrara', 'MT': 'Matera', 'ME': 'Messina', 'MI': 'Milano', 'MO': 'Modena', 'MB': 'Monza e della Brianza', 'NA': 'Napoli', 'NO': 'Novara', 'NU': 'Nuoro', 'OR': 'Oristano', 'PD': 'Padova', 'PA': 'Palermo', 'PR': 'Parma', 'PV': 'Pavia', 'PG': 'Perugia', 'PU': 'Pesaro e Urbino', 'PE': 'Pescara', 'PC': 'Piacenza', 'PI': 'Pisa', 'PT': 'Pistoia', 'PN': 'Pordenone', 'PZ': 'Potenza', 'PO': 'Prato', 'RG': 'Ragusa', 'RA': 'Ravenna', 'RC': 'Reggio Calabria', 'RE': 'Reggio Emilia', 'RI': 'Rieti', 'RN': 'Rimini', 'RM': 'Roma', 'RO': 'Rovigo', 'SA': 'Salerno', 'SS': 'Sassari', 'SV': 'Savona', 'SI': 'Siena', 'SR': 'Siracusa', 'SO': 'Sondrio', 'SU': 'Sud Sardegna', 'TA': 'Taranto', 'TE': 'Teramo', 'TR': 'Terni', 'TO': 'Torino', 'TP': 'Trapani', 'TN': 'Trento', 'TV': 'Treviso', 'TS': 'Trieste', 'UD': 'Udine', 'VA': 'Varese', 'VE': 'Venezia', 'VB': 'Verbano-Cusio-Ossola', 'VC': 'Vercelli', 'VR': 'Verona', 'VV': 'Vibo Valentia', 'VI': 'Vicenza', 'VT': 'Viterbo'
};

export const preMapped: Record<string, { lat: number, lng: number }> = {
  'CT': { lat: 37.5079, lng: 15.0830 },
  'PA': { lat: 38.1157, lng: 13.3615 },
  'ME': { lat: 38.1938, lng: 15.5540 },
  'SR': { lat: 37.0755, lng: 15.2866 },
  'RG': { lat: 36.9269, lng: 14.7255 },
  'EN': { lat: 37.5670, lng: 14.2754 },
  'CL': { lat: 37.4903, lng: 14.0622 },
  'AG': { lat: 37.3107, lng: 13.5846 },
  'TP': { lat: 38.0176, lng: 12.5372 }
};
