interface Props {
  label: string;
  value: string;
  sub?: string;
  accent?: 'teal' | 'green' | 'orange';
}

const accentBorder = { teal: 'border-rebijoux-teal', green: 'border-rebijoux-green', orange: 'border-rebijoux-orange' };

export function StatCard({ label, value, sub, accent = 'teal' }: Props) {
  return (
    <div className={`bg-white rounded-lg border-l-4 ${accentBorder[accent]} shadow-sm p-6`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 font-serif">{value}</p>
      {sub && <p className="mt-1 text-sm text-gray-400">{sub}</p>}
    </div>
  );
}
