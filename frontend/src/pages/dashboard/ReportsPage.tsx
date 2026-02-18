import { useState } from 'react';
import { downloadReport, getExcelReportUrl, getCsvReportUrl } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

interface ReportCard {
  title: string;
  description: string;
  action: () => Promise<void>;
  label: string;
}

export function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function trigger(key: string, fn: () => Promise<void>) {
    setLoading(key);
    setError(null);
    setSuccess(null);
    try {
      await fn();
      setSuccess(`${key} downloaded successfully`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  const reports: ReportCard[] = [
    {
      title: 'Full Report (Excel)',
      description: 'Complete portfolio snapshot: holdings, all transactions, tax lots, and ESG metrics in a formatted spreadsheet. Ideal for quarterly reviews.',
      label: 'Download .xlsx',
      action: () => downloadReport(getExcelReportUrl(), 'regold-report.xlsx'),
    },
    {
      title: 'Transactions CSV',
      description: 'Raw transaction history with blockchain references. Compatible with most accounting and portfolio management software.',
      label: 'Download .csv',
      action: () => downloadReport(getCsvReportUrl('transactions'), 'regold-transactions.csv'),
    },
    {
      title: 'Tax Lots CSV',
      description: 'Cost basis, holding periods, and unrealized gains/losses by acquisition tranche. Ready to share with your tax advisor.',
      label: 'Download .csv',
      action: () => downloadReport(getCsvReportUrl('tax-lots'), 'regold-tax-lots.csv'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-gray-900">Reports & Export</h2>
        <p className="mt-1 text-sm text-gray-500">Download your data for accounting, compliance, and tax filing</p>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {reports.map((r) => (
          <div key={r.title} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col">
            <h3 className="text-base font-semibold text-gray-900">{r.title}</h3>
            <p className="mt-2 text-sm text-gray-500 flex-1">{r.description}</p>
            <div className="mt-5">
              <Button
                variant="secondary"
                className="w-full"
                loading={loading === r.title}
                onClick={() => trigger(r.title, r.action)}
              >
                {r.label}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
