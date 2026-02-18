// ── TransactionsPage ─────────────────────────────────────────────────────────

import { fetchTransactions } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { PageLoader } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { formatEur, formatDate } from '../../utils/format';
import clsx from 'clsx';

export function TransactionsPage() {
  const { data, loading, error } = useAsync(() => fetchTransactions(100));

  if (loading) return <PageLoader />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-gray-900">Transaction History</h2>
        <p className="mt-1 text-sm text-gray-500">All token distributions and transfers with blockchain references</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                {['Date', 'Type', 'Tokens', 'Gold (g)', 'Price', 'Total', 'Status', 'TX Hash'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">{formatDate(tx.transactionDate)}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rebijoux-teal/10 text-rebijoux-teal capitalize">
                      {tx.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 text-right">{tx.tokenAmount.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 text-right">{tx.goldGrams.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 text-right">{formatEur(tx.pricePerToken)}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900 text-right">{formatEur(tx.totalCost)}</td>
                  <td className="px-5 py-3.5">
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', tx.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">
                    {tx.transactionHash ? `${tx.transactionHash.slice(0, 12)}…` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
