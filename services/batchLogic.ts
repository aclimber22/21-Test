
import { addDays, differenceInDays, startOfDay, format, parseISO } from 'date-fns';
// Added RotationConfig to the import list
import { AppConfig, BatchBase, DailyRecord, Override, BatchCalculated, Stage, RotationConfig } from '../types';

export const calculateBatchTimeline = (
  asOfDate: Date,
  config: AppConfig,
  bases: BatchBase[],
  records: DailyRecord[],
  overrides: Override[]
): BatchCalculated[] => {
  const { intervalDays, anchorFarrowDate, anchorBatchId, biological, rotations } = config;
  const anchorFDate = parseISO(anchorFarrowDate);

  // 1. Identify Anchor Index
  // For simplicity, we assume batch IDs are continuous and anchor is G11
  // We need to generate a range of indices to cover the 19 batches
  
  // Find n0: farrowDate(n0) <= D and is closest
  const diffDaysFromAnchor = differenceInDays(asOfDate, anchorFDate);
  const n0 = Math.floor(diffDaysFromAnchor / intervalDays);

  const startN = n0 - 12;
  const endN = n0 + 7;

  const results: BatchCalculated[] = [];

  for (let i = startN; i <= endN; i++) {
    const theoreticalFarrow = addDays(anchorFDate, i * intervalDays);
    const theoreticalMate = addDays(theoreticalFarrow, -biological.gestationDays);
    
    // Batch ID deduction: This is tricky with Year-GX logic, 
    // for mock we use a simpler offset relative to anchorBatchId
    const batchId = generateBatchId(anchorBatchId, i);
    
    const base = bases.find(b => b.batchId === batchId);
    const farrowDate = base ? parseISO(base.farrowDate) : theoreticalFarrow;
    const mateDate = base ? parseISO(base.mateDate) : theoreticalMate;

    const ageDays = differenceInDays(asOfDate, farrowDate);
    const weekIndex = Math.floor(ageDays / 7);

    // Filter relevant records
    const batchRecords = records.filter(r => r.batchId === batchId && parseISO(r.recordDate) <= asOfDate);

    // Calculate Inventory
    // Initial qty based on stage
    let inventory = 0;
    let giltInventory = 0;
    
    if (ageDays < 0) {
      // Sow stage
      inventory = base?.breedQty || 0;
    } else if (ageDays < biological.lactationDays) {
      inventory = base?.livebornQty || 0;
    } else {
      // Start with weanQty or nurseryInQty
      inventory = base?.weanQty || base?.nurseryInQty || 0;
      
      // Gilt Diversion logic (W11 / Day 77)
      if (ageDays >= biological.giltSplitAtDay) {
        // If we have base data, use explicitly split amounts
        if (base && (base.pigletInQty !== undefined || base.giltInQty !== undefined)) {
           inventory = base.pigletInQty || 0;
           giltInventory = base.giltInQty || 0;
        } else {
           // Theoretical: No split data, assume all are in piglet pool for now
           giltInventory = 0;
        }
      }
    }

    // Apply deaths/sales from records
    batchRecords.forEach(r => {
      inventory -= (r.pigDeathQty || 0);
      inventory -= (r.pigSaleQty || 0);
      // For sow losses, it depends on perspective. Here we track pig inventory.
    });

    // Current Stage
    let currentStage = Stage.MATING;
    if (ageDays >= 0) {
      const stageConfig = biological.stages.find(s => ageDays >= s.fromDay && ageDays < s.toDay);
      if (stageConfig) currentStage = stageConfig.stage;
      else currentStage = Stage.FINISHER; // Fallback for very old pigs
    }

    if (inventory <= 0 && ageDays > 150) {
      currentStage = Stage.SOLD;
    }

    // Barn Logic with Overrides
    const barnOverride = overrides.find(o => o.batchId === batchId && o.stage === currentStage);
    let currentBarn = barnOverride?.assignedUnit || getBaseBarn(base, currentStage) || '';

    if (!currentBarn) {
      currentBarn = calculateDefaultBarn(batchId, currentStage, i, rotations, overrides);
    }

    results.push({
      batchId,
      mateDate,
      farrowDate,
      ageDays,
      weekIndex,
      currentStage,
      currentBarn,
      inventory,
      giltInventory,
      isLanded: !!base && !!base.farrowDate && !!base.weanQty,
      isHalfLanded: !!base && !base.weanQty,
      isTheoretical: !base,
      base,
      records: batchRecords,
      isClosed: currentStage === Stage.SOLD || inventory <= 0 && ageDays > 100
    });
  }

  return results;
};

const getBaseBarn = (base: BatchBase | undefined, stage: Stage): string => {
  if (!base) return '';
  switch (stage) {
    case Stage.NURSERY: return base.nurseryBarn || '';
    case Stage.PIGLET: return base.pigletBarn || '';
    case Stage.GROWER: return base.growerBarn || '';
    case Stage.FINISHER: return base.finisherBarn || '';
    default: return '';
  }
};

const calculateDefaultBarn = (
  batchId: string,
  stage: Stage,
  index: number,
  rotations: Record<string, RotationConfig>,
  overrides: Override[]
): string => {
  const config = rotations[stage];
  if (!config) return '未指定';
  
  // Handover/Relay logic:
  // Find last override for this stage that has affectFollowing = true and is before this batch
  // For mock, we'll just use the basic rotation
  const N = config.units.length;
  const seedIdx = config.units.indexOf(config.seedUnit);
  
  // Find the last affecting override
  // This requires a strict ordering of batch IDs
  const lastAffecting = overrides
    .filter(o => o.stage === stage && o.affectFollowing)
    .sort((a, b) => a.batchId.localeCompare(b.batchId))
    .reverse()
    .find(o => o.batchId < batchId);

  if (lastAffecting) {
    const lastAffectingIdx = config.units.indexOf(lastAffecting.assignedUnit);
    // Rough calculation of distance between batches
    // In a real system, we'd count actual batches in the sequence
    return config.units[(lastAffectingIdx + 1) % N]; 
  }

  return config.units[(seedIdx + Math.abs(index)) % N];
};

const generateBatchId = (anchor: string, offset: number): string => {
  // Simple Mock: 2025-G11 + offset
  // Real logic would handle year wrap and G count
  const [yearStr, gStr] = anchor.split('-G');
  let year = parseInt(yearStr);
  let g = parseInt(gStr) + offset;
  
  while (g > 17) {
    year += 1;
    g -= 17;
  }
  while (g < 1) {
    year -= 1;
    g += 17;
  }
  
  return `${year}-G${g.toString().padStart(2, '0')}`;
};
