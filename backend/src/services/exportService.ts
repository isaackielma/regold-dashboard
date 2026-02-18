import ExcelJS from 'exceljs';
import { createObjectCsvStringifier } from 'csv-writer';
import { getHoldings } from './holdingsService';
import { getTransactions } from './transactionsService';
import { getTaxLots } from './taxLotsService';
import { getEsgMetrics } from './esgService';

const REBIJOUX_TEAL = 'FF1B9AAA';
const WHITE = 'FFFFFFFF';

export async function exportToExcel(investorId: string): Promise<Buffer> {
  const [holdings, transactions, taxLots, esg] = await Promise.all([
    getHoldings(investorId),
    getTransactions(investorId, 1000),
    getTaxLots(investorId),
    getEsgMetrics(investorId),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'ReGold by Rebijoux';
  wb.created = new Date();

  // ── Holdings sheet ──────────────────────────────────────────────────────────
  const holdingsSheet = wb.addWorksheet('Holdings');
  holdingsSheet.columns = [
    { header: 'Field', key: 'field', width: 30 },
    { header: 'Value', key: 'value', width: 30 },
  ];
  styleHeader(holdingsSheet);
  holdingsSheet.addRows([
    { field: 'Token Balance (ReGold)', value: holdings.tokenBalance },
    { field: 'Gold Equivalent (grams)', value: holdings.goldGrams },
    { field: 'Price per Gram (EUR)', value: holdings.pricePerGramEur },
    { field: 'Current Portfolio Value (EUR)', value: holdings.currentValueEur },
    { field: 'XRPL Wallet Address', value: holdings.walletAddress },
    { field: 'Last Updated', value: new Date(holdings.lastUpdated).toISOString() },
  ]);

  // ── Transactions sheet ───────────────────────────────────────────────────────
  const txSheet = wb.addWorksheet('Transactions');
  txSheet.columns = [
    { header: 'Date', key: 'date', width: 18 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Tokens', key: 'tokens', width: 14 },
    { header: 'Gold (g)', key: 'gold', width: 12 },
    { header: 'Price/Token (EUR)', key: 'price', width: 18 },
    { header: 'Total (EUR)', key: 'total', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'TX Hash', key: 'hash', width: 50 },
  ];
  styleHeader(txSheet);
  transactions.forEach((tx) => {
    txSheet.addRow({
      date: new Date(tx.transactionDate).toLocaleDateString('en-GB'),
      type: tx.type,
      tokens: tx.tokenAmount,
      gold: tx.goldGrams,
      price: tx.pricePerToken,
      total: tx.totalCost,
      status: tx.status,
      hash: tx.transactionHash ?? '—',
    });
  });

  // ── Tax Lots sheet ───────────────────────────────────────────────────────────
  const taxSheet = wb.addWorksheet('Tax Lots');
  taxSheet.columns = [
    { header: 'Lot Number', key: 'lot', width: 16 },
    { header: 'Acquisition Date', key: 'date', width: 18 },
    { header: 'Tokens', key: 'tokens', width: 12 },
    { header: 'Cost Basis/Token (EUR)', key: 'costPerToken', width: 22 },
    { header: 'Total Cost Basis (EUR)', key: 'totalCost', width: 22 },
    { header: 'Unrealized G/L (EUR)', key: 'gl', width: 22 },
    { header: 'Holding Period', key: 'period', width: 16 },
    { header: 'Jurisdiction', key: 'jurisdiction', width: 16 },
  ];
  styleHeader(taxSheet);
  taxLots.forEach((lot) => {
    const row = taxSheet.addRow({
      lot: lot.lotNumber,
      date: new Date(lot.acquisitionDate).toLocaleDateString('en-GB'),
      tokens: lot.tokensRemaining,
      costPerToken: lot.costBasisPerToken,
      totalCost: lot.totalCostBasis,
      gl: lot.unrealizedGainLoss,
      period: lot.holdingPeriodType.replace('_', ' '),
      jurisdiction: lot.jurisdiction,
    });
    const glCell = row.getCell('gl');
    if (glCell.value !== null && typeof glCell.value === 'number') {
      glCell.font = { color: { argb: glCell.value >= 0 ? 'FF4CAF50' : 'FFE53935' } };
    }
  });

  // ── ESG sheet ────────────────────────────────────────────────────────────────
  const esgSheet = wb.addWorksheet('ESG Impact');
  esgSheet.columns = [
    { header: 'Metric', key: 'metric', width: 35 },
    { header: 'Value', key: 'value', width: 25 },
    { header: 'Unit', key: 'unit', width: 15 },
  ];
  styleHeader(esgSheet);
  esgSheet.addRows([
    { metric: 'Total Recycled Gold', value: esg.totalRecycledGoldGrams, unit: 'grams' },
    { metric: 'Forest Saved', value: esg.forestSavedHectares.toFixed(4), unit: 'hectares' },
    { metric: 'Mercury Avoided', value: esg.mercuryAvoidedKg.toFixed(4), unit: 'kg' },
    { metric: 'Soil Erosion Prevented', value: esg.soilErosionAvoidedM3.toFixed(2), unit: 'm³' },
    { metric: 'Environmental Cost Saved', value: esg.environmentalCostSavedEur.toFixed(2), unit: 'EUR' },
    { metric: 'Sustainability Score', value: esg.sustainabilityScore.toFixed(1), unit: '/ 100' },
    { metric: 'Last Calculated', value: new Date(esg.lastCalculated).toISOString(), unit: '' },
  ]);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function exportToCsv(investorId: string, sheet: 'transactions' | 'tax-lots'): Promise<string> {
  if (sheet === 'transactions') {
    const rows = await getTransactions(investorId, 1000);
    const csv = createObjectCsvStringifier({
      header: [
        { id: 'transactionDate', title: 'Date' },
        { id: 'type', title: 'Type' },
        { id: 'tokenAmount', title: 'Tokens' },
        { id: 'goldGrams', title: 'Gold (g)' },
        { id: 'pricePerToken', title: 'Price/Token (EUR)' },
        { id: 'totalCost', title: 'Total (EUR)' },
        { id: 'status', title: 'Status' },
        { id: 'transactionHash', title: 'TX Hash' },
      ],
    });
    return csv.getHeaderString() + csv.stringifyRecords(rows);
  }

  const lots = await getTaxLots(investorId);
  const csv = createObjectCsvStringifier({
    header: [
      { id: 'lotNumber', title: 'Lot Number' },
      { id: 'acquisitionDate', title: 'Acquisition Date' },
      { id: 'tokensRemaining', title: 'Tokens' },
      { id: 'costBasisPerToken', title: 'Cost Basis/Token (EUR)' },
      { id: 'totalCostBasis', title: 'Total Cost Basis (EUR)' },
      { id: 'unrealizedGainLoss', title: 'Unrealized G/L (EUR)' },
      { id: 'holdingPeriodType', title: 'Holding Period' },
      { id: 'jurisdiction', title: 'Jurisdiction' },
    ],
  });
  return csv.getHeaderString() + csv.stringifyRecords(lots);
}

function styleHeader(sheet: ExcelJS.Worksheet): void {
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REBIJOUX_TEAL } };
    cell.font = { color: { argb: WHITE }, bold: true };
    cell.alignment = { vertical: 'middle' };
  });
  headerRow.height = 20;
}
