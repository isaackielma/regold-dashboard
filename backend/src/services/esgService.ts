import pool from '../db/pool';
import { EsgMetrics } from '../types/domain';

// Impact factors sourced from Conservation Strategy Fund mining calculator
// https://miningcalculator.conservation-strategy.org/
const IMPACT_PER_KG = {
  forestHectares: 7,
  mercuryKg: 2.6,
  soilErosionM3: 14_492.75,
  environmentalCostEur: 215_371.08,
} as const;

const EMPTY_ESG = (investorId: string): EsgMetrics => ({
  investorId,
  totalRecycledGoldGrams:    0,
  forestSavedHectares:       0,
  mercuryAvoidedKg:          0,
  soilErosionAvoidedM3:      0,
  environmentalCostSavedEur: 0,
  sustainabilityScore:       0,
  lastCalculated:            new Date(),
});

export async function getEsgMetrics(investorId: string): Promise<EsgMetrics> {
  const result = await pool.query(
    `SELECT
       investor_id                     AS "investorId",
       total_recycled_gold_grams::float AS "totalRecycledGoldGrams",
       forest_saved_hectares::float     AS "forestSavedHectares",
       mercury_avoided_kg::float        AS "mercuryAvoidedKg",
       soil_erosion_avoided_m3::float   AS "soilErosionAvoidedM3",
       environmental_cost_saved_eur::float AS "environmentalCostSavedEur",
       sustainability_score::float      AS "sustainabilityScore",
       last_calculated                  AS "lastCalculated"
     FROM esg_metadata
     WHERE investor_id = $1`,
    [investorId],
  );

  // No ESG row yet — return zeros instead of crashing
  if (!result.rowCount) return EMPTY_ESG(investorId);

  return result.rows[0] as EsgMetrics;
}

// Called by admin to recalculate ESG from current holdings.
// The DB trigger covers most cases; this is a manual override for admin use.
export async function recalculate(investorId: string): Promise<EsgMetrics> {
  const holdingResult = await pool.query(
    'SELECT COALESCE(SUM(gold_grams), 0) AS total_grams FROM holdings WHERE investor_id = $1',
    [investorId],
  );

  const totalGrams: number = holdingResult.rows[0].total_grams;
  const goldKg = totalGrams / 1000;

  const metrics = {
    totalRecycledGoldGrams:    totalGrams,
    forestSavedHectares:       goldKg * IMPACT_PER_KG.forestHectares,
    mercuryAvoidedKg:          goldKg * IMPACT_PER_KG.mercuryKg,
    soilErosionAvoidedM3:      goldKg * IMPACT_PER_KG.soilErosionM3,
    environmentalCostSavedEur: goldKg * IMPACT_PER_KG.environmentalCostEur,
    sustainabilityScore:       Math.min(goldKg * 10, 100),
  };

  await pool.query(
    `INSERT INTO esg_metadata
       (investor_id, total_recycled_gold_grams, forest_saved_hectares,
        mercury_avoided_kg, soil_erosion_avoided_m3, environmental_cost_saved_eur,
        sustainability_score, last_calculated)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
     ON CONFLICT (investor_id) DO UPDATE SET
       total_recycled_gold_grams    = EXCLUDED.total_recycled_gold_grams,
       forest_saved_hectares        = EXCLUDED.forest_saved_hectares,
       mercury_avoided_kg           = EXCLUDED.mercury_avoided_kg,
       soil_erosion_avoided_m3      = EXCLUDED.soil_erosion_avoided_m3,
       environmental_cost_saved_eur = EXCLUDED.environmental_cost_saved_eur,
       sustainability_score         = EXCLUDED.sustainability_score,
       last_calculated              = NOW()`,
    [
      investorId,
      metrics.totalRecycledGoldGrams,
      metrics.forestSavedHectares,
      metrics.mercuryAvoidedKg,
      metrics.soilErosionAvoidedM3,
      metrics.environmentalCostSavedEur,
      metrics.sustainabilityScore,
    ],
  );

  return getEsgMetrics(investorId);
}
