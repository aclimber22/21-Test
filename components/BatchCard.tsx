
import React from 'react';
import { BatchCalculated, Stage } from '../types';
import { format } from 'date-fns';

interface BatchCardProps {
  batch: BatchCalculated;
  onClick: (batch: BatchCalculated) => void;
  isToday?: boolean;
}

const BatchCard: React.FC<BatchCardProps> = ({ batch, onClick, isToday }) => {
  const getStatusColor = () => {
    if (batch.isLanded) return 'bg-emerald-100 border-emerald-300 text-emerald-800';
    if (batch.isHalfLanded) return 'bg-amber-100 border-amber-300 text-amber-800';
    return 'bg-slate-100 border-slate-300 text-slate-500';
  };

  const getStageBadge = (stage: Stage) => {
    const colors: Record<string, string> = {
      [Stage.MATING]: 'bg-purple-100 text-purple-700',
      [Stage.LACTATION]: 'bg-blue-100 text-blue-700',
      [Stage.NURSERY]: 'bg-cyan-100 text-cyan-700',
      [Stage.PIGLET]: 'bg-green-100 text-green-700',
      [Stage.GROWER]: 'bg-orange-100 text-orange-700',
      [Stage.FINISHER]: 'bg-red-100 text-red-700',
      [Stage.SOLD]: 'bg-slate-200 text-slate-600',
    };
    return colors[stage] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div 
      onClick={() => onClick(batch)}
      className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${getStatusColor()} ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-lg">{batch.batchId}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStageBadge(batch.currentStage)}`}>
          {batch.currentStage}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="opacity-70 text-xs">分娩日期</p>
          <p className="font-medium">{format(batch.farrowDate, 'MM/dd')}</p>
        </div>
        <div>
          <p className="opacity-70 text-xs">週齡 (W)</p>
          <p className="font-medium">W{batch.weekIndex}</p>
        </div>
        <div>
          <p className="opacity-70 text-xs">庫存</p>
          <p className="font-bold text-base">{batch.inventory} <span className="text-xs font-normal">頭</span></p>
        </div>
        <div>
          <p className="opacity-70 text-xs">舍別</p>
          <p className="font-medium truncate">{batch.currentBarn || '未定'}</p>
        </div>
      </div>

      {batch.giltInventory > 0 && (
        <div className="mt-2 pt-2 border-t border-emerald-200 flex justify-between items-center text-xs">
          <span className="text-emerald-700 font-semibold">新女豬分流</span>
          <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full">{batch.giltInventory} 頭</span>
        </div>
      )}
    </div>
  );
};

export default BatchCard;
