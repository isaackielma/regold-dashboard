import { fetchTaxLots, fetchTaxSummary } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { PageLoader } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { StatCard } from '../../components/ui/StatCard';
import { formatEur, formatDate, gainLossClass } from '../../utils/format';
import clsx from 'clsx';

export function TaxLotsPage() {
  const lotsAsync    = useAsync(fetchTaxLots);
  const summaryAsync = useAsync(fetchTaxSummary);

  if (lotsAsync.loading || summaryAsync.loading) return <PageLoader />;
  if (lotsAsync.error) return <Alert type="error" message={lotsAsync.error} />;

  const lots = lotsAsync.data ?? [];
  const s = summaryAsync.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-gray-900">Tax Lot Tracking</h2>
        <p className="mt-1 text-sm text-gray-500">Cost basis and unrealized gains/losses by acquisition tranche</p>
      </div>

      {s && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Total Cost Basis" value={formatEur(s.totalCostBasis)} sub={`${s.lotCount} open lots`} accent="teal" />
          <StatCard label="Total Tokens" value={s.totalTokens.toFixed(2)} sub="ReGold across all lots" accent="teal" />
          <StatCard
            label="Unrealized Gain / Loss"
            value={formatEur(s.totalUnrealizedGainLoss)}
            sub="vs. current gold price"
            accent={s.totalUnrealizedGainLoss >= 0 ? 'green' : 'orange'}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                {['Lot No.', 'Acquired', 'Tokens', 'Cost Basis/Token', 'Total Cost Basis', 'Unrealized G/L', 'Period', 'Jurisdiction'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lots.map((lot) => (
                <tr key={lot.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{lot.lotNumber}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">{formatDate(lot.acquisitionDate)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 text-right">{lot.tokensRemaining.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 text-right">{formatEur(lot.costBasisPerToken)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 text-right">{formatEur(lot.totalCostBasis)}</td>
                  <td className={clsx('px-5 py-3.5 text-sm font-semibold text-right', gainLossClass(lot.unrealizedGainLoss))}>
                    {lot.unrealizedGainLoss >= 0 ? '+' : ''}{formatEur(lot.unrealizedGainLoss)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', lot.holdingPeriodType === 'long_term' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')}>
                      {lot.holdingPeriodType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{lot.jurisdiction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
