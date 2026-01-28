
import { AppConfig, Stage } from './types';

export const DEFAULT_CONFIG: AppConfig = {
  farmId: 'YL',
  intervalDays: 21,
  anchorBatchId: '2025-G11',
  anchorFarrowDate: '2025-05-24',
  biological: {
    gestationDays: 115,
    lactationDays: 28,
    giltSplitAtDay: 77,
    stages: [
      { stage: Stage.LACTATION, fromDay: 0, toDay: 28 },
      { stage: Stage.NURSERY, fromDay: 28, toDay: 77 },
      { stage: Stage.PIGLET, fromDay: 77, toDay: 133 },
      { stage: Stage.GROWER, fromDay: 133, toDay: 168 },
      { stage: Stage.FINISHER, fromDay: 168, toDay: 9999 },
    ]
  },
  rotations: {
    [Stage.NURSERY]: {
      units: ['保一', '保二', '保三'],
      seedUnit: '保一'
    },
    [Stage.PIGLET]: {
      units: ['小一', '小二', '小三'],
      seedUnit: '小一'
    },
    [Stage.GROWER]: {
      units: ['中一', '中二'],
      seedUnit: '中一'
    },
    [Stage.FINISHER]: {
      units: ['大一', '大二'],
      seedUnit: '大一'
    }
  }
};
