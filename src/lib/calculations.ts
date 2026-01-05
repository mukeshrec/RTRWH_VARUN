export interface ProjectInput {
  roofArea: number;
  roofType: 'GI Sheet' | 'Asbestos' | 'Tiles' | 'Concrete';
  householdSize: number;
  waterScarcityDays: number;
  annualRainfall: number;
  rainfallIntensity: number;
  aquiferType: 'Consolidated' | 'Semi-consolidated' | 'Unconsolidated';
  depthWaterPremonsoon?: number;
  depthWaterPostmonsoon?: number;
  soilType?: string;
  infiltrationRate?: number;
  availableSpace?: number;
}

export interface CalculationResults {
  waterAvailable: number;
  waterRequired: number;
  isFeasible: boolean;
  tankCapacity: number;
  tankDiameter: number;
  tankHeight: number;
  peakFlow: number;
  gutterDiameter: number;
  downpipeDiameter: number;
  firstFlushVolume: number;
  firstFlushPipeLength: number;
  filterType: 'Slow Sand' | 'Rapid Sand';
  filterArea: number;
  filterLength: number;
  filterWidth: number;
  rechargeStructureType: string;
  rechargeStructureDepth: number;
  rechargeStructureDiameter: number;
  warnings: string[];
  recommendations: string[];
}

export const RUNOFF_COEFFICIENTS: Record<string, number> = {
  'GI Sheet': 0.9,
  'Asbestos': 0.8,
  'Tiles': 0.75,
  'Concrete': 0.7,
};

export const TANK_SIZES = [
  { capacity: 1600, diameter: 1.21 },
  { capacity: 2400, diameter: 1.48 },
  { capacity: 3200, diameter: 1.71 },
  { capacity: 4000, diameter: 1.91 },
  { capacity: 6400, diameter: 2.41 },
  { capacity: 8000, diameter: 2.70 },
  { capacity: 10000, diameter: 3.00 },
  { capacity: 12000, diameter: 3.30 },
  { capacity: 16000, diameter: 3.81 },
  { capacity: 20000, diameter: 4.26 },
];

export const GUTTER_CAPACITIES = [
  { diameter: 100, capacity: 1.08 },
  { diameter: 150, capacity: 2.97 },
  { diameter: 200, capacity: 6.10 },
  { diameter: 250, capacity: 10.67 },
  { diameter: 300, capacity: 16.82 },
];

export function calculateWaterAvailable(
  roofArea: number,
  annualRainfall: number,
  roofType: string
): number {
  const runoffCoefficient = RUNOFF_COEFFICIENTS[roofType] || 0.7;
  return roofArea * annualRainfall * runoffCoefficient;
}

export function calculateWaterRequired(
  householdSize: number,
  waterScarcityDays: number
): number {
  const dailyRequirementPerPerson = 6;
  return householdSize * waterScarcityDays * dailyRequirementPerPerson;
}

export function calculateTankCapacity(waterRequired: number): number {
  return Math.ceil(waterRequired / 1000) * 1000;
}

export function getTankDimensions(capacity: number): { diameter: number; height: number } {
  let selectedTank = TANK_SIZES[0];

  for (const tank of TANK_SIZES) {
    if (capacity <= tank.capacity) {
      selectedTank = tank;
      break;
    }
  }

  if (capacity > TANK_SIZES[TANK_SIZES.length - 1].capacity) {
    selectedTank = TANK_SIZES[TANK_SIZES.length - 1];
  }

  return {
    diameter: selectedTank.diameter,
    height: 1.6,
  };
}

export function calculatePeakFlow(
  roofArea: number,
  rainfallIntensity: number,
  roofType: string
): number {
  const runoffCoefficient = RUNOFF_COEFFICIENTS[roofType] || 0.7;
  return (roofArea * rainfallIntensity * runoffCoefficient) / 3600;
}

export function getGutterDiameter(peakFlow: number): number {
  for (const gutter of GUTTER_CAPACITIES) {
    if (peakFlow <= gutter.capacity) {
      return gutter.diameter;
    }
  }
  return GUTTER_CAPACITIES[GUTTER_CAPACITIES.length - 1].diameter;
}

export function getDownpipeDiameter(peakFlow: number): number {
  if (peakFlow <= 1) return 50;
  if (peakFlow <= 3) return 75;
  return 100;
}

export function calculateFirstFlushVolume(roofArea: number): number {
  return roofArea * 0.5;
}

export function calculateFirstFlushPipeLength(
  volume: number,
  pipeDiameter: number
): number {
  const radius = pipeDiameter / 2000;
  const area = Math.PI * radius * radius;
  return volume / 1000 / area;
}

export function calculateFilterArea(
  peakFlow: number,
  filterType: 'Slow Sand' | 'Rapid Sand'
): number {
  const filtrationRate = filterType === 'Slow Sand' ? 150 : 4500;
  return (peakFlow * 3600) / filtrationRate;
}

export function getFilterDimensions(area: number): { length: number; width: number } {
  const side = Math.sqrt(area);
  return {
    length: Math.ceil(side * 10) / 10,
    width: Math.ceil(side * 10) / 10,
  };
}

export function getRechargeStructureType(
  aquiferType: string,
  depthWater?: number
): string {
  if (!depthWater) {
    return aquiferType === 'Consolidated' ? 'Recharge Shaft' : 'Recharge Pit';
  }

  if (depthWater < 5) {
    return 'Recharge Pit (Shallow)';
  } else if (depthWater < 15) {
    return 'Recharge Pit';
  } else {
    return aquiferType === 'Consolidated' ? 'Recharge Shaft' : 'Recharge Shaft';
  }
}

export function getRechargeStructureDimensions(
  structureType: string,
  depthWater?: number
): { depth: number; diameter: number } {
  if (structureType.includes('Pit')) {
    return {
      depth: Math.min(depthWater ? depthWater - 1 : 3, 5),
      diameter: 1.5,
    };
  } else {
    return {
      depth: Math.min(depthWater ? depthWater + 2 : 10, 15),
      diameter: 0.75,
    };
  }
}

export function generateWarnings(input: ProjectInput, results: CalculationResults): string[] {
  const warnings: string[] = [];

  if (input.annualRainfall < 500) {
    warnings.push('Low rainfall area (<500mm) - Storage system recommended over direct recharge');
  }

  if (input.depthWaterPremonsoon && input.depthWaterPremonsoon < 3) {
    warnings.push('Shallow water table (<3m) - Risk of water logging, avoid recharge pits');
  }

  if (input.roofArea < 20) {
    warnings.push('Small roof area - System may not be economically viable');
  }

  if (!results.isFeasible) {
    warnings.push('Water available from roof is insufficient for full scarcity period');
  }

  if (results.peakFlow > 10) {
    warnings.push('High peak flow - Consider multiple collection points or larger piping system');
  }

  if (input.aquiferType === 'Consolidated') {
    warnings.push('Consolidated rock aquifer - Recharge shafts required instead of pits');
  }

  return warnings;
}

export function generateRecommendations(input: ProjectInput, results: CalculationResults): string[] {
  const recommendations: string[] = [];

  if (input.annualRainfall > 1000) {
    recommendations.push('High rainfall area - Direct recharge to aquifer recommended in addition to storage');
  }

  if (results.isFeasible && results.waterAvailable > results.waterRequired * 1.5) {
    recommendations.push('Surplus water available - Consider artificial recharge structures for groundwater replenishment');
  }

  if (input.aquiferType === 'Unconsolidated') {
    recommendations.push('Unconsolidated aquifer - Excellent for artificial recharge through pits or shafts');
  }

  if (input.infiltrationRate && input.infiltrationRate > 20) {
    recommendations.push('High infiltration rate - Suitable for percolation pits and direct recharge');
  }

  recommendations.push('Implement pre-monsoon roof and gutter cleaning for optimal water quality');
  recommendations.push('Install mesh screens at gutter inlets to prevent debris entry');

  if (results.tankCapacity > 5000) {
    recommendations.push('Large storage capacity - Consider dividing into multiple tanks for better maintenance');
  }

  return recommendations;
}

export function performCompleteCalculation(input: ProjectInput): CalculationResults {
  const waterAvailable = calculateWaterAvailable(
    input.roofArea,
    input.annualRainfall,
    input.roofType
  );

  const waterRequired = calculateWaterRequired(
    input.householdSize,
    input.waterScarcityDays
  );

  const isFeasible = waterAvailable >= waterRequired;

  const tankCapacity = calculateTankCapacity(
    isFeasible ? waterRequired : waterAvailable
  );

  const tankDimensions = getTankDimensions(tankCapacity);

  const peakFlow = calculatePeakFlow(
    input.roofArea,
    input.rainfallIntensity,
    input.roofType
  );

  const gutterDiameter = getGutterDiameter(peakFlow);
  const downpipeDiameter = getDownpipeDiameter(peakFlow);

  const firstFlushVolume = calculateFirstFlushVolume(input.roofArea);
  const firstFlushPipeLength = calculateFirstFlushPipeLength(
    firstFlushVolume,
    downpipeDiameter
  );

  const filterType: 'Slow Sand' | 'Rapid Sand' = peakFlow > 2 ? 'Rapid Sand' : 'Slow Sand';
  const filterArea = calculateFilterArea(peakFlow, filterType);
  const filterDimensions = getFilterDimensions(filterArea);

  const rechargeStructureType = getRechargeStructureType(
    input.aquiferType,
    input.depthWaterPremonsoon
  );

  const rechargeStructureDimensions = getRechargeStructureDimensions(
    rechargeStructureType,
    input.depthWaterPremonsoon
  );

  const results: CalculationResults = {
    waterAvailable,
    waterRequired,
    isFeasible,
    tankCapacity,
    tankDiameter: tankDimensions.diameter,
    tankHeight: tankDimensions.height,
    peakFlow,
    gutterDiameter,
    downpipeDiameter,
    firstFlushVolume,
    firstFlushPipeLength,
    filterType,
    filterArea,
    filterLength: filterDimensions.length,
    filterWidth: filterDimensions.width,
    rechargeStructureType,
    rechargeStructureDepth: rechargeStructureDimensions.depth,
    rechargeStructureDiameter: rechargeStructureDimensions.diameter,
    warnings: [],
    recommendations: [],
  };

  results.warnings = generateWarnings(input, results);
  results.recommendations = generateRecommendations(input, results);

  return results;
}
