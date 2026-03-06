
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { usePowerTreeStore } from '../../stores/usePowerTreeStore';
import { useShallow } from 'zustand/react/shallow';
import type { PowerNode, ConverterData } from '../../types/node.types';
import { Cpu, AlertCircle, Settings2, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

import { NodeInput } from '../NodeInput';

export default function ConverterNode({ id, data, selected }: NodeProps<PowerNode & { data: ConverterData }>) {
  const { viewMode, moveNodeVertical, updateNodeData, removeNode, theme } = usePowerTreeStore(
    useShallow((state) => ({
      viewMode: state.viewMode,
      moveNodeVertical: state.moveNodeVertical,
      updateNodeData: state.updateNodeData,
      removeNode: state.removeNode,
      theme: state.theme,
    }))
  );

  const handleUpdate = (field: string, val: string) => {
    let num = parseFloat(val);
    if (!isNaN(num)) {
      if (field === 'efficiency' && num > 1 && num <= 100) num = num / 100;
      updateNodeData(id, { [field]: num });
    }
  };

  if (viewMode === 'readonly') {
    return (
      <div className={`w-[280px] rounded-lg border p-1.5 shadow-sm transition-all flex items-center gap-2 ${
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-400'
      }`}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !bg-sky-500 !border-none"
        />
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded bg-sky-500/10 text-sky-500`}>
          <Cpu size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-xs truncate leading-none ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{data.label}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-baseline">
            <span className={`text-xs font-black ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`}>{data.outVoltage}</span>
            <span className="text-[10px] font-bold ml-0.5 opacity-50">V</span>
          </div>
          <div className="w-px h-3 bg-zinc-700/30" />
          <div className="flex items-baseline">
            <span className={`text-xs font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{(data.efficiency * 100).toFixed(0)}</span>
            <span className="text-[10px] font-bold ml-0.5 opacity-50">%</span>
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2 !h-2 !bg-sky-500 !border-none"
        />
      </div>
    );
  }

  return (
    <div className={`w-[280px] rounded-xl border-2 p-2 shadow-xl transition-all flex flex-col gap-2 ${
      theme === 'dark' ? 'bg-zinc-900 shadow-black/40' : 'bg-white shadow-zinc-200/50'
    } ${selected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : data.error ? 'border-red-500' : (theme === 'dark' ? 'border-zinc-800' : 'border-zinc-400')}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={`!h-5 !w-5 !border-[3px] rounded-full hover:scale-125 transition-all cursor-crosshair relative before:content-[''] before:absolute before:inset-[-12px] before:rounded-full before:bg-transparent ${
          theme === 'dark' ? '!bg-zinc-900 !border-sky-500' : '!bg-white !border-sky-500 shadow-sm'
        }`}
      />

      <div className={`flex items-center gap-2 ${viewMode === 'compact' ? 'pb-0' : `border-b pb-2 ${theme === 'dark' ? 'border-zinc-800/80' : 'border-zinc-100'}`}`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${
          theme === 'dark' ? 'bg-sky-500/20 text-sky-400 border-sky-500/20' : 'bg-sky-50 text-sky-600 border-sky-100'
        }`}>
          <Cpu size={16} />
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className={`font-semibold text-sm truncate leading-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{data.label}</h3>
          <p className={`text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-sky-500/80' : 'text-sky-600/80'}`}>Buck/LDO L{data.level}</p>
        </div>
        <div className={`flex items-center gap-0.5 border rounded-md p-0.5 ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'}`}>
          <button onClick={(e) => { e.stopPropagation(); moveNodeVertical(id, 'up'); }} className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700'}`} title="Move Up"><ChevronUp size={12} /></button>
          <button onClick={(e) => { e.stopPropagation(); moveNodeVertical(id, 'down'); }} className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700'}`} title="Move Down"><ChevronDown size={12} /></button>
          <div className={`w-px h-3 mx-0.5 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
          <button
            onClick={(e) => { e.stopPropagation(); removeNode(id); }}
            className={`p-1 rounded transition-colors ${theme === 'dark' ? 'text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10' : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'}`}
            title="Delete Node"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-md px-2 py-1.5 border shadow-inner flex flex-col justify-between ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-zinc-50 border-zinc-100'}`}>
          {viewMode !== 'compact' && <p className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Set V_OUT</p>}
          <div className="flex items-baseline justify-end">
            {viewMode !== 'compact' && <span className={`text-[10px] font-semibold mr-auto ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>{data.calcVoltage?.toFixed(1) || '0.0'}V</span>}
            <div className="flex items-baseline">
              <NodeInput
                value={data.outVoltage}
                onUpdate={(v) => handleUpdate('outVoltage', v)}
                step="0.1"
                className={`w-14 bg-transparent text-base font-black focus:outline-none text-right cursor-text ${theme === 'dark' ? 'text-sky-400 focus:ring-sky-500/50' : 'text-sky-600'}`}
              />
              <span className={`text-[10px] font-bold ml-0.5 ${theme === 'dark' ? 'text-sky-600' : 'text-sky-500'}`}>V</span>
            </div>
          </div>
        </div>
        <div className={`rounded-md px-2 py-1.5 border shadow-inner flex flex-col justify-between ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-zinc-50 border-zinc-100'}`}>
          {viewMode !== 'compact' && (
            <div className="flex justify-between items-center mb-1">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Sys Load</p>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>/ Max</p>
            </div>
          )}
          <div className="flex items-baseline justify-end">
            <span className={`text-base font-bold font-mono tracking-tight mr-1 ${
              (data.calcCurrent || 0) > (data.maxOutCurrent || 999) 
                ? 'text-red-500' 
                : (theme === 'dark' ? 'text-sky-100/80' : 'text-zinc-900')
            }`}>
              {(data.calcCurrent || 0).toFixed(2)}
            </span>
            <span className={`text-[10px] font-bold mx-0.5 ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-300'}`}>/</span>
            <NodeInput
              value={data.maxOutCurrent || 3}
              onUpdate={(v) => handleUpdate('maxOutCurrent', v)}
              step="0.1"
              className={`w-10 bg-transparent text-sm font-bold text-right focus:outline-none cursor-text ${
                theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800/50' : 'text-zinc-600 hover:bg-zinc-200'
              }`}
            />
            <span className={`text-[10px] font-bold ml-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>A</span>
          </div>
        </div>
        {viewMode !== 'compact' && (
          <div className={`col-span-2 grid grid-cols-[1fr_auto_1fr] items-center rounded-md px-2 py-1.5 border shadow-inner mt-0.5 h-[34px] ${theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800/80' : 'bg-zinc-100/50 border-zinc-200/50'}`}>
            <div className="flex items-baseline justify-between w-full overflow-hidden gap-1">
              <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Eff:</p>
              <div className="flex items-baseline">
                <NodeInput
                  value={data.efficiency * 100}
                  onUpdate={(v) => handleUpdate('efficiency', v)}
                  step="1"
                  className={`w-10 bg-transparent text-sm font-black focus:outline-none text-right cursor-text !pb-0 leading-none h-5 ${
                    theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                  }`}
                />
                <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>%</span>
              </div>
            </div>
            <div className={`w-px h-4 mx-2 ${theme === 'dark' ? 'bg-zinc-800/80' : 'bg-zinc-200'}`} />
            <div className="flex items-baseline justify-between w-full overflow-hidden gap-1">
              <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Loss:</p>
              <div className="flex items-baseline whitespace-nowrap">
                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-rose-400' : 'text-rose-500'}`}>{(data.calcPower || 0).toFixed(2)}</span>
                <span className={`text-[10px] font-bold ml-0.5 ${theme === 'dark' ? 'text-rose-500/70' : 'text-rose-600/70'}`}>W</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {((viewMode === 'full' && data.showControlLogic && data.controlInterface) || (viewMode !== 'compact' && data.error)) && (
        <div className="flex flex-col gap-2">
          {viewMode === 'full' && data.showControlLogic && data.controlInterface && (
            <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${
              theme === 'dark' ? 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20' : 'text-indigo-700 bg-indigo-50 border-indigo-100'
            }`}>
              <Settings2 size={10} />
              <span>CTL: {data.controlInterface}</span>
            </div>
          )}
          {data.error && (
            <div className={`flex items-start gap-2 text-[10px] font-bold p-2 rounded-md border ${
              theme === 'dark' ? 'text-red-100 bg-red-500/20 border-red-500/30' : 'text-red-800 bg-red-50 border-red-100'
            }`}>
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              <span>{data.error}</span>
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className={`!h-5 !w-5 !border-[3px] rounded-full hover:scale-125 transition-all cursor-crosshair relative before:content-[''] before:absolute before:inset-[-12px] before:rounded-full before:bg-transparent ${
          theme === 'dark' ? '!bg-zinc-900 !border-sky-500' : '!bg-white !border-sky-500 shadow-sm'
        }`}
      />
    </div>
  );
}
