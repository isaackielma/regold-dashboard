import axios, { AxiosError } from 'axios';
import type {
  Holdings, Transaction, TaxLot, TaxSummary,
  EsgMetrics, PortfolioSnapshot, Investor,
} from '../types';

const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:5001/api';

const http = axios.create({ baseURL: BASE_URL });

// Attach JWT on every request if present
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap Axios errors into plain messages
function handleError(err: unknown): never {
  if (err instanceof AxiosError && err.response?.data?.error) {
    throw new Error(err.response.data.error as string);
  }
  throw err;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<{ token: string; investor: Investor }> {
  try {
    const res = await http.post<{ token: string; investor: Investor }>('/auth/login', { email, password });
    return res.data;
  } catch (err) { return handleError(err); }
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  entityType: string;
  countryCode: string;
  jurisdiction: string;
}): Promise<{ message: string }> {
  try {
    const res = await http.post<{ message: string }>('/auth/register', data);
    return res.data;
  } catch (err) { return handleError(err); }
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  try {
    const res = await http.get<{ message: string }>(`/auth/verify-email?token=${token}`);
    return res.data;
  } catch (err) { return handleError(err); }
}

// ── Holdings ──────────────────────────────────────────────────────────────────

export async function fetchHoldings(): Promise<Holdings> {
  try {
    const res = await http.get<Holdings>('/holdings');
    return res.data;
  } catch (err) { return handleError(err); }
}

export async function fetchHistory(days = 90): Promise<PortfolioSnapshot[]> {
  try {
    const res = await http.get<PortfolioSnapshot[]>(`/holdings/history?days=${days}`);
    return res.data;
  } catch (err) { return handleError(err); }
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function fetchTransactions(limit = 50): Promise<Transaction[]> {
  try {
    const res = await http.get<Transaction[]>(`/transactions?limit=${limit}`);
    return res.data;
  } catch (err) { return handleError(err); }
}

// ── Tax Lots ──────────────────────────────────────────────────────────────────

export async function fetchTaxLots(): Promise<TaxLot[]> {
  try {
    const res = await http.get<TaxLot[]>('/tax-lots');
    return res.data;
  } catch (err) { return handleError(err); }
}

export async function fetchTaxSummary(): Promise<TaxSummary> {
  try {
    const res = await http.get<TaxSummary>('/tax-lots/summary');
    return res.data;
  } catch (err) { return handleError(err); }
}

// ── ESG ───────────────────────────────────────────────────────────────────────

export async function fetchEsg(): Promise<EsgMetrics> {
  try {
    const res = await http.get<EsgMetrics>('/esg');
    return res.data;
  } catch (err) { return handleError(err); }
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function getExcelReportUrl(): string {
  return `${BASE_URL}/reports/excel`;
}

export function getCsvReportUrl(sheet: 'transactions' | 'tax-lots'): string {
  return `${BASE_URL}/reports/csv/${sheet}`;
}

export async function downloadReport(url: string, filename: string): Promise<void> {
  const token = localStorage.getItem('token');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to generate report');
  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function fetchOrders(limit = 50): Promise<import('../types').Order[]> {
  try {
    const res = await http.get<import('../types').Order[]>(`/orders?limit=${limit}`);
    return res.data;
  } catch (err) { return handleError(err); }
}

export async function createOrder(input: import('../types').CreateOrderInput): Promise<import('../types').Order> {
  try {
    const res = await http.post<import('../types').Order>('/orders', input);
    return res.data;
  } catch (err) { return handleError(err); }
}

export async function cancelOrder(id: string): Promise<import('../types').Order> {
  try {
    const res = await http.patch<import('../types').Order>(`/orders/${id}/cancel`);
    return res.data;
  } catch (err) { return handleError(err); }
}
