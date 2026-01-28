
export enum Stage {
  MATING = '配種',
  LACTATION = '哺乳',
  NURSERY = '保育',
  PIGLET = '小豬',
  GROWER = '中豬',
  FINISHER = '大豬',
  GILT = '新女',
  SOLD = '已售罄'
}

export interface BiologicalConfig {
  gestationDays: number;
  lactationDays: number;
  giltSplitAtDay: number;
  stages: {
    stage: Stage;
    fromDay: number;
    toDay: number;
  }[];
}

export interface RotationConfig {
  units: string[];
  seedUnit: string;
}

export interface BatchBase {
  batchId: string;
  mateDate: string;
  farrowDate: string;
  breedQty: number;
  expectedFarrowQty: number;
  livebornQty: number;
  weanQty: number;
  nurseryBarn?: string;
  nurseryInQty: number;
  pigletBarn?: string;
  pigletInQty: number;
  growerBarn?: string;
  growerInQty: number;
  finisherBarn?: string;
  finisherInQty: number;
  giltInQty: number;
  saleTotalQty?: number;
}

export interface DailyRecord {
  recordDate: string;
  batchId: string;
  pigDeathQty?: number;
  pigSaleQty?: number;
  pigSaleAvgWeightKg?: number;
  sowAbortionQty?: number;
  sowLossQty?: number;
}

export interface Override {
  batchId: string;
  stage: string;
  assignedUnit: string;
  affectFollowing: boolean;
}

export interface AppConfig {
  farmId: string;
  intervalDays: number;
  anchorBatchId: string;
  anchorFarrowDate: string;
  biological: BiologicalConfig;
  rotations: Record<string, RotationConfig>;
}

export interface BatchCalculated {
  batchId: string;
  mateDate: Date;
  farrowDate: Date;
  ageDays: number;
  weekIndex: number;
  currentStage: Stage;
  currentBarn: string;
  inventory: number;
  giltInventory: number;
  isLanded: boolean;
  isHalfLanded: boolean;
  isTheoretical: boolean;
  base?: BatchBase;
  records: DailyRecord[];
  isClosed: boolean;
}
