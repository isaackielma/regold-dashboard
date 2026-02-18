// Tests the ESG impact constants and calculation logic independently of the DB.

const IMPACT_PER_KG = {
  forestHectares: 7,
  mercuryKg: 2.6,
  soilErosionM3: 14_492.75,
  environmentalCostEur: 215_371.08,
};

function calculateImpact(goldGrams: number) {
  const goldKg = goldGrams / 1000;
  return {
    forestSavedHectares: goldKg * IMPACT_PER_KG.forestHectares,
    mercuryAvoidedKg: goldKg * IMPACT_PER_KG.mercuryKg,
    soilErosionAvoidedM3: goldKg * IMPACT_PER_KG.soilErosionM3,
    environmentalCostSavedEur: goldKg * IMPACT_PER_KG.environmentalCostEur,
    sustainabilityScore: Math.min(goldKg * 10, 100),
  };
}

describe('ESG impact calculation', () => {
  it('calculates correct impact for 1000g (1kg) of recycled gold', () => {
    const result = calculateImpact(1000);
    expect(result.forestSavedHectares).toBe(7);
    expect(result.mercuryAvoidedKg).toBe(2.6);
    expect(result.soilErosionAvoidedM3).toBe(14_492.75);
    expect(result.environmentalCostSavedEur).toBe(215_371.08);
  });

  it('sustainability score caps at 100 for large holdings', () => {
    const result = calculateImpact(100_000); // 100 kg
    expect(result.sustainabilityScore).toBe(100);
  });

  it('sustainability score is proportional below cap', () => {
    const result = calculateImpact(500); // 0.5 kg
    expect(result.sustainabilityScore).toBe(5);
  });

  it('returns zeros for 0 grams', () => {
    const result = calculateImpact(0);
    expect(result.forestSavedHectares).toBe(0);
    expect(result.sustainabilityScore).toBe(0);
  });
});
