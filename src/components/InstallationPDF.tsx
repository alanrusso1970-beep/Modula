import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { Installation } from '../types';

// Register fonts for professional look
// Removed custom font registration due to format compatibility issues

const styles = StyleSheet.create({
  page: {
    padding: 60,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 900,
    color: '#0f172a',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 800,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  docId: {
    textAlign: 'right',
  },
  docIdLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  docIdValue: {
    fontSize: 12,
    fontWeight: 600,
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 40,
  },
  gridCol: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: 800,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  h2: {
    fontSize: 20,
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: 4,
  },
  text: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 900,
    color: '#0f172a',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 900,
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
  },
  planContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  planImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  table: {
    width: '100%',
    marginBottom: 40,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
    marginBottom: 5,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 800,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: '0 5px',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '10px 5px',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 11,
    color: '#475569',
    padding: '0 5px',
  },
  tableCellBold: {
    fontWeight: 700,
    color: '#0f172a',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0,
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    flex: 1,
    textAlign: 'right',
  },
  footerBrand: {
    fontSize: 10,
    fontWeight: 800,
    color: '#0f172a',
  },
  footerContact: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  footerLegal: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: 600,
  },
});

interface InstallationPDFProps {
  installation: Installation;
  planImage?: string | null;
}

export const InstallationPDF = ({ installation, planImage }: InstallationPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>MODULA</Text>
          <Text style={styles.subtitle}>Asset Intelligence Report</Text>
        </View>
        <View style={styles.docId}>
          <Text style={styles.docIdLabel}>ID Documento</Text>
          <Text style={styles.docIdValue}>{installation.pbl}-{new Date().getFullYear()}</Text>
        </View>
      </View>

      {/* Tank Visualization Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Visualizzazione Grafica Serbatoi</Text>
        <View style={styles.line} />
      </View>
      <View style={styles.planContainer}>
        {planImage && planImage.length > 5000 ? (
          <Image src={planImage} style={styles.planImage} />
        ) : (
          <Text style={{ fontSize: 10, color: '#94a3b8' }}>Visualizzazione in fase di caricamento... (Riprovare tra qualche secondo)</Text>
        )}
      </View>

      {/* Overview */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dettaglio Impianto</Text>
        <View style={styles.line} />
      </View>
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <Text style={styles.label}>Localizzazione Impianto</Text>
          <Text style={styles.h2}>{installation.city}</Text>
          <Text style={styles.text}>{installation.address}</Text>
          <Text style={styles.text}>{installation.cap} {installation.province}</Text>
        </View>
        <View style={[styles.gridCol, { flexDirection: 'row', flexWrap: 'wrap' }]}>
          <View style={{ width: '50%', marginBottom: 10 }}>
            <Text style={styles.label}>Codice PBL</Text>
            <Text style={[styles.text, { fontWeight: 700, color: '#0f172a' }]}>{installation.pbl}</Text>
          </View>
          <View style={{ width: '50%', marginBottom: 10 }}>
            <Text style={styles.label}>Gestore</Text>
            <Text style={[styles.text, { fontWeight: 700, color: '#0f172a' }]}>{installation.manager}</Text>
          </View>
          <View style={{ width: '50%' }}>
            <Text style={styles.label}>Data Report</Text>
            <Text style={[styles.text, { fontWeight: 700, color: '#0f172a' }]}>{new Date().toLocaleDateString('it-IT')}</Text>
          </View>
          <View style={{ width: '50%' }}>
            <Text style={styles.label}>Stato Moso</Text>
            <Text style={[styles.text, { fontWeight: 700, color: '#0f172a' }]}>{installation.moso}</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.label}>EBITDA Annuo Stimato</Text>
          <Text style={[styles.statValue, installation.ebitda < 0 ? { color: '#ef4444' } : {}]}>
            {installation.ebitda.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.label}>Volume Erogato Totale</Text>
          <Text style={styles.statValue}>
            {Math.round(installation.sell).toLocaleString('it-IT')} LITRI
          </Text>
        </View>
      </View>

      {/* Tanks Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>I Serbatoi dell'Impianto (Inventario Dotazioni)</Text>
        <View style={styles.line} />
      </View>
      
      {/* Tank Summary Stats */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
        {['Benzina', 'Gasolio', 'Supreme'].map(prod => {
          const total = installation.rows.reduce((acc, row) => {
            if ((row["Prodotto Serbatoio"] || '').toLowerCase().includes(prod.toLowerCase())) {
              return acc + (parseFloat(row["Volume Serbatoio"]?.replace(',', '.') || '0') || 0);
            }
            return acc;
          }, 0);
          if (total === 0) return null;
          return (
            <View key={prod} style={{ flex: 1, backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8 }}>
              <Text style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase' }}>Totale {prod}</Text>
              <Text style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{total.toLocaleString('it-IT')} Kl</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Serbatoio</Text>
          <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Prodotto</Text>
          <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Capacità</Text>
          <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Erogatore</Text>
          <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Modello</Text>
        </View>
        {installation.rows.map((row, idx) => (
          <View key={`${row["ID Serbatoio"]}-${row["Matricola Erogatore"]}-${idx}`} style={[styles.tableRow, idx % 2 !== 0 ? styles.tableRowOdd : styles.tableRowEven]}>
            <Text style={[styles.tableCell, styles.tableCellBold, { width: '15%' }]}>{row["ID Serbatoio"] || '-'}</Text>
            <Text style={[styles.tableCell, { width: '25%', fontWeight: 600 }]}>{row["Prodotto Serbatoio"] || '-'}</Text>
            <Text style={[styles.tableCell, { width: '20%', textAlign: 'right', fontWeight: 700, color: '#2563eb' }]}>{row["Volume Serbatoio"] || '-'} Kl</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>{row["Tipo Erogatore"] || '-'}</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>{row["Modello Erogatore"] || '-'}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerBrand}>MODULA S.p.A.</Text>
          <Text style={styles.footerContact}>{installation.email} • {installation.phone}</Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.footerLegal}>Documento confidenziale generato da MODULA AI</Text>
          <Text style={styles.footerLegal}>© {new Date().getFullYear()} Tutti i diritti riservati</Text>
        </View>
      </View>
    </Page>
  </Document>
);
