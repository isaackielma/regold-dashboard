import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchHoldings, fetchHistory, fetchEsg } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { StatCard } from '../../components/ui/StatCard';
import { PageLoader } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { formatEur, formatGrams, formatTokens, formatDate } from '../../utils/format';

export default function DashboardPage() {
  const holdingsAsync = useAsync(fetchHoldings);
  const historyAsync  = useAsync(() => fetchHistory(90));
  const esgAsync      = useAsync(fetchEsg);

  const loading = holdingsAsync.loading || historyAsync.loading || esgAsync.loading;

  if (loading) return <PageLoader />;

  // Only show a hard error for unexpected failures (not missing data — that shows zeros)
  if (holdingsAsync.error && !holdingsAsync.error.includes('not found')) {
    return <Alert type="error" message={holdingsAsync.error} />;
  }

  const h = holdingsAsync.data ?? {
    walletAddress:   '—',
    tokenBalance:    0,
    goldGrams:       0,
    pricePerGramEur: 0,
    currentValueEur: 0,
    lastUpdated:     new Date().toISOString(),
  };

  const esg = esgAsync.data ?? {
    sustainabilityScore:       0,
    forestSavedHectares:       0,
    mercuryAvoidedKg:          0,
    environmentalCostSavedEur: 0,
  };

  const history = historyAsync.data ?? [];
  const hasHoldings = h.tokenBalance > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-gray-900">Portfolio Overview</h2>
        <p className="mt-1 text-sm text-gray-500">
          {hasHoldings
            ? `As of ${formatDate(h.lastUpdated)} · XRPL wallet ${h.walletAddress}`
            : 'No holdings yet — your portfolio will appear here once tokens are allocated'}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="ReGold Tokens"    value={formatTokens(h.tokenBalance)}   sub="MPToken balance"         accent="teal"   />
        <StatCard label="Gold Equivalent"  value={formatGrams(h.goldGrams)}        sub="999 fine recycled gold"  accent="teal"   />
        <StatCard label="Portfolio Value"  value={formatEur(h.currentValueEur)}    sub={h.pricePerGramEur > 0 ? `${formatEur(h.pricePerGramEur)}/gram` : 'Price unavailable'} accent="orange" />
        <StatCard label="ESG Score"        value={`${esg.sustainabilityScore.toFixed(1)} / 100`} sub="Sustainability rating" accent="green" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-5">Portfolio Value — Last 90 Days (EUR)</h3>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 py-16 text-center">No history data available yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={history} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="snapshotDate"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(d: string) => formatDate(d)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`}
                width={56}
              />
              <Tooltip
                formatter={(v: number) => [formatEur(v), 'Value']}
                labelFormatter={(l: string) => formatDate(l)}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="portfolioValueEur" stroke="#1B9AAA" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ESG highlights */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">ESG Impact Highlights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <span className="text-3xl">🌳</span>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Forest saved</p>
              <p className="text-lg font-semibold text-gray-900">{esg.forestSavedHectares.toFixed(2)} ha</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <span className="text-3xl">⚗️</span>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Mercury avoided</p>
              <p className="text-lg font-semibold text-gray-900">{esg.mercuryAvoidedKg.toFixed(2)} kg</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <span className="text-3xl">💰</span>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Environmental cost saved</p>
              <p className="text-lg font-semibold text-gray-900">{formatEur(esg.environmentalCostSavedEur)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}