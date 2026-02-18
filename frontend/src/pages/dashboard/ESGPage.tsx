import { fetchEsg } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { PageLoader } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { formatEur, timeAgo } from '../../utils/format';

interface ImpactCardProps {
  emoji:       string;
  label:       string;
  value:       string;
  description: string;
  color:       string;
}

function ImpactCard({ emoji, label, value, description, color }: ImpactCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${color} p-6`}>
      <div className="flex items-start gap-4">
        <span className="text-4xl">{emoji}</span>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 font-serif">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function ESGPage() {
  const { data: esg, loading, error } = useAsync(fetchEsg);

  if (loading) return <PageLoader />;
  if (error && !error.includes('not yet available')) {
    return <Alert type="error" message={error} />;
  }

  // Use zeros if no ESG data yet
  const data = esg ?? {
    sustainabilityScore:       0,
    totalRecycledGoldGrams:    0,
    forestSavedHectares:       0,
    mercuryAvoidedKg:          0,
    soilErosionAvoidedM3:      0,
    environmentalCostSavedEur: 0,
    lastCalculated:            new Date().toISOString(),
  };

  const hasData = data.sustainabilityScore > 0;

  const scoreColor = data.sustainabilityScore >= 70
    ? 'from-rebijoux-green to-emerald-600'
    : data.sustainabilityScore >= 40
    ? 'from-rebijoux-teal to-cyan-600'
    : 'from-rebijoux-orange to-amber-600';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-gray-900">ESG Impact Report</h2>
        <p className="mt-1 text-sm text-gray-500">
          {hasData
            ? `Environmental and sustainability metrics for your recycled gold holdings · Updated ${timeAgo(data.lastCalculated)}`
            : 'ESG metrics will appear here once you hold ReGold tokens'}
        </p>
      </div>

      {/* Score banner */}
      <div className={`rounded-xl bg-gradient-to-r ${scoreColor} p-8 text-white text-center shadow`}>
        <p className="text-sm font-medium uppercase tracking-wider opacity-80">Sustainability Score</p>
        <p className="mt-2 text-7xl font-bold">{data.sustainabilityScore.toFixed(0)}</p>
        <p className="mt-1 text-sm opacity-70">out of 100</p>
        <div className="mt-4 mx-auto max-w-xs bg-white/20 rounded-full h-2">
          <div className="bg-white rounded-full h-2" style={{ width: `${data.sustainabilityScore}%` }} />
        </div>
      </div>

      {/* Totals */}
      <div className="bg-rebijoux-teal/5 border border-rebijoux-teal/20 rounded-lg p-5">
        <p className="text-sm font-medium text-rebijoux-teal">
          {hasData
            ? <>Your portfolio represents <span className="font-bold">{data.totalRecycledGoldGrams.toFixed(2)} grams</span> of recycled gold — avoiding all of the environmental damage that primary extraction of that gold would have caused.</>
            : 'Your ESG impact will be calculated automatically when you receive ReGold tokens.'}
        </p>
      </div>

      {/* Impact grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ImpactCard emoji="🌳" label="Forest Preservation"      value={`${data.forestSavedHectares.toFixed(3)} hectares`}          description="Deforestation prevented through recycled gold use"              color="border-rebijoux-green"  />
        <ImpactCard emoji="⚗️" label="Mercury Reduction"        value={`${data.mercuryAvoidedKg.toFixed(3)} kg`}                   description="Mercury pollution avoided vs. primary mining"                  color="border-rebijoux-teal"   />
        <ImpactCard emoji="🏔️" label="Soil Protection"          value={`${data.soilErosionAvoidedM3.toLocaleString()} m³`}         description="Soil erosion and sedimentation prevented"                     color="border-blue-500"        />
        <ImpactCard emoji="💰" label="Environmental Cost Saved" value={formatEur(data.environmentalCostSavedEur)}                   description="Estimated damage costs avoided (Conservation Strategy Fund)"  color="border-rebijoux-orange" />
      </div>

      {/* Methodology note */}
      <div className="bg-gray-50 rounded-lg p-5 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-1">Methodology</p>
        <p>Impact figures are calculated using the Conservation Strategy Fund mining calculator
          (miningcalculator.conservation-strategy.org). Per 1 kg of recycled gold: 7 ha forest saved,
          2.6 kg mercury avoided, 14,492.75 m³ soil erosion prevented, €215,371 environmental cost saved.
          Sustainability score = min(gold_kg × 10, 100).
        </p>
      </div>
    </div>
  );
}