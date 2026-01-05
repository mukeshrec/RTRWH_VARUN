import { CalculationResults } from './calculations';

export interface CostBreakdown {
  tankCost: number;
  pipingCost: number;
  filterCost: number;
  rechargeStructureCost: number;
  civilWorksCost: number;
  laborCost: number;
  totalCost: number;
}

export interface EconomicAnalysis {
  capitalCost: number;
  annualMaintenanceCost: number;
  annualWaterSavings: number;
  annualEnergySavings: number;
  totalAnnualBenefits: number;
  annualCostOfExpenditure: number;
  bcRatio: number;
  paybackPeriod: number;
  netPresentValue: number;
  bcRatioWithSubsidy: number;
  paybackPeriodWithSubsidy: number;
}

export interface CostEstimationInput {
  tankCapacity: number;
  roofArea: number;
  gutterLength: number;
  downpipeLength: number;
  filterArea: number;
  rechargeStructureType: string;
  rechargeStructureDepth: number;
  rechargeStructureDiameter: number;
  waterSavingsVolume: number;
  depthWaterPremonsoon?: number;
  region?: string;
}

const COST_RATES = {
  tank: {
    ferrocement: 13,
    masonry: 11,
    rcc: 17,
  },
  piping: {
    gutter: 300,
    downpipe: 200,
    firstFlush: 650,
  },
  filter: {
    slowSand: 3000,
    rapidSand: 4000,
  },
  recharge: {
    pit3m: 10000,
    shaft10m: 30000,
    filterMedia: 800,
  },
  civil: {
    excavation: 250,
    masonry: 500,
    pcc: 5500,
    rcc: 6500,
  },
  labor: {
    skilled: 700,
    unskilled: 450,
    plumber: 600,
  },
  maintenance: {
    annualCleaning: 1500,
    filterReplacement: 3000,
    disinfection: 750,
  },
  water: {
    alternativeSourceCost: 20,
    energyRate: 7,
  },
};

export function calculateTankCost(capacity: number): number {
  if (capacity <= 15000) {
    return capacity * COST_RATES.tank.ferrocement;
  } else if (capacity <= 50000) {
    return capacity * COST_RATES.tank.masonry;
  } else {
    return capacity * COST_RATES.tank.rcc;
  }
}

export function calculatePipingCost(
  gutterLength: number,
  downpipeLength: number
): number {
  const gutterCost = gutterLength * COST_RATES.piping.gutter;
  const downpipeCost = downpipeLength * COST_RATES.piping.downpipe;
  const firstFlushCost = COST_RATES.piping.firstFlush;
  return gutterCost + downpipeCost + firstFlushCost;
}

export function calculateFilterCost(filterType: string, filterArea: number): number {
  const baseFilterCost =
    filterType === 'Slow Sand'
      ? COST_RATES.filter.slowSand
      : COST_RATES.filter.rapidSand;

  const filterMediaVolume = filterArea * 0.9;
  const filterMediaCost = filterMediaVolume * COST_RATES.recharge.filterMedia;

  return baseFilterCost + filterMediaCost;
}

export function calculateRechargeStructureCost(
  structureType: string,
  depth: number,
  diameter: number
): number {
  const volume = Math.PI * Math.pow(diameter / 2, 2) * depth;

  if (structureType.includes('Pit')) {
    const excavationCost = volume * COST_RATES.civil.excavation;
    const filterMediaCost = volume * COST_RATES.recharge.filterMedia;
    const masonryCost = Math.PI * diameter * depth * 0.23 * COST_RATES.civil.masonry;
    return excavationCost + filterMediaCost + masonryCost;
  } else {
    const baseCost = (depth / 10) * COST_RATES.recharge.shaft10m;
    const casingCost = Math.PI * diameter * depth * 0.1 * COST_RATES.civil.pcc;
    return baseCost + casingCost;
  }
}

export function calculateCivilWorksCost(
  tankCapacity: number,
  tankDiameter: number,
  tankHeight: number
): number {
  const tankVolume = Math.PI * Math.pow(tankDiameter / 2, 2) * tankHeight;
  const foundationArea = Math.PI * Math.pow(tankDiameter / 2, 2);

  const excavationCost = tankVolume * COST_RATES.civil.excavation;
  const foundationCost = foundationArea * 0.15 * COST_RATES.civil.pcc;
  const plasteredArea = Math.PI * tankDiameter * tankHeight + foundationArea;
  const plasteringCost = plasteredArea * 50;

  return excavationCost + foundationCost + plasteringCost;
}

export function calculateLaborCost(totalMaterialCost: number): number {
  return totalMaterialCost * 0.12;
}

export function calculateCostBreakdown(input: CostEstimationInput): CostBreakdown {
  const tankCost = calculateTankCost(input.tankCapacity);

  const pipingCost = calculatePipingCost(
    input.gutterLength || input.roofArea * 0.4,
    input.downpipeLength || 5
  );

  const filterCost = calculateFilterCost(
    input.filterArea > 1 ? 'Rapid Sand' : 'Slow Sand',
    input.filterArea
  );

  const rechargeStructureCost = calculateRechargeStructureCost(
    input.rechargeStructureType,
    input.rechargeStructureDepth,
    input.rechargeStructureDiameter
  );

  const civilWorksCost = calculateCivilWorksCost(
    input.tankCapacity,
    Math.sqrt((input.tankCapacity / 1000) / (Math.PI * 1.6)) * 2,
    1.6
  );

  const materialCost =
    tankCost + pipingCost + filterCost + rechargeStructureCost + civilWorksCost;
  const laborCost = calculateLaborCost(materialCost);

  const totalCost = materialCost + laborCost;

  return {
    tankCost,
    pipingCost,
    filterCost,
    rechargeStructureCost,
    civilWorksCost,
    laborCost,
    totalCost,
  };
}

export function calculateAnnualBenefits(
  waterSavingsVolume: number,
  depthWaterReduction?: number
): number {
  const waterCostSavings = (waterSavingsVolume / 1000) * COST_RATES.water.alternativeSourceCost;

  let energySavings = 0;
  if (depthWaterReduction && depthWaterReduction > 0) {
    const energyPerCubicMeter = 0.5;
    energySavings =
      (waterSavingsVolume / 1000) * energyPerCubicMeter * COST_RATES.water.energyRate;
  }

  const pumpMaintenanceSavings = depthWaterReduction ? 2000 : 0;

  return waterCostSavings + energySavings + pumpMaintenanceSavings;
}

export function calculateAnnualCosts(capitalCost: number): {
  interestLoss: number;
  maintenanceRepair: number;
  depreciation: number;
  miscellaneous: number;
  total: number;
} {
  const interestLoss = capitalCost * 0.1;
  const maintenanceRepair = capitalCost * 0.025;
  const depreciation = capitalCost * 0.05;
  const miscellaneous = capitalCost * 0.01;

  return {
    interestLoss,
    maintenanceRepair,
    depreciation,
    miscellaneous,
    total: interestLoss + maintenanceRepair + depreciation + miscellaneous,
  };
}

export function performEconomicAnalysis(
  costBreakdown: CostBreakdown,
  annualBenefits: number,
  projectLifeYears: number = 20,
  discountRate: number = 0.08,
  subsidyPercent: number = 0
): EconomicAnalysis {
  const capitalCost = costBreakdown.totalCost;
  const capitalCostWithSubsidy = capitalCost * (1 - subsidyPercent);

  const annualCosts = calculateAnnualCosts(capitalCost);
  const annualCostOfExpenditure = annualCosts.total;

  const annualMaintenanceCost =
    COST_RATES.maintenance.annualCleaning +
    COST_RATES.maintenance.disinfection +
    COST_RATES.maintenance.filterReplacement / 3;

  const bcRatio = annualBenefits / annualCostOfExpenditure;
  const paybackPeriod = capitalCost / (annualBenefits - annualMaintenanceCost);

  const bcRatioWithSubsidy = annualBenefits / (annualCostOfExpenditure * (1 - subsidyPercent));
  const paybackPeriodWithSubsidy =
    capitalCostWithSubsidy / (annualBenefits - annualMaintenanceCost);

  let npv = -capitalCost;
  for (let year = 1; year <= projectLifeYears; year++) {
    const netAnnualBenefit = annualBenefits - annualMaintenanceCost;
    npv += netAnnualBenefit / Math.pow(1 + discountRate, year);
  }

  return {
    capitalCost,
    annualMaintenanceCost,
    annualWaterSavings: (annualBenefits * 2) / 3,
    annualEnergySavings: (annualBenefits * 1) / 3,
    totalAnnualBenefits: annualBenefits,
    annualCostOfExpenditure,
    bcRatio,
    paybackPeriod,
    netPresentValue: npv,
    bcRatioWithSubsidy,
    paybackPeriodWithSubsidy,
  };
}

export function getViabilityAssessment(bcRatio: number, paybackPeriod: number): {
  isViable: boolean;
  category: string;
  recommendation: string;
} {
  if (bcRatio >= 1.5 && paybackPeriod <= 10) {
    return {
      isViable: true,
      category: 'Highly Viable',
      recommendation: 'Excellent investment with strong economic returns. Proceed with implementation.',
    };
  } else if (bcRatio >= 1.0 && paybackPeriod <= 15) {
    return {
      isViable: true,
      category: 'Viable',
      recommendation: 'Good investment with positive returns. Recommended for implementation.',
    };
  } else if (bcRatio >= 0.75 && paybackPeriod <= 20) {
    return {
      isViable: true,
      category: 'Marginally Viable',
      recommendation: 'Acceptable for social/environmental projects. Consider with subsidy support.',
    };
  } else {
    return {
      isViable: false,
      category: 'Not Viable',
      recommendation: 'Economic returns are low. Consider alternative solutions or wait for better subsidy schemes.',
    };
  }
}
