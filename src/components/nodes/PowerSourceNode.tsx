
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { usePowerTreeStore } from '../../stores/usePowerTreeStore';
import { useShallow } from 'zustand/react/shallow';
import type { PowerNode, PowerSourceData } from '../../types/node.types';
import { Zap, AlertCircle, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

import { NodeInput } from '../NodeInput';

export default function PowerSourceNode({ id, data, selected }: NodeProps<PowerNode & { data: PowerSourceData }>) {
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
        const num = parseFloat(val);
        if (!isNaN(num)) {
            updateNodeData(id, { [field]: num });
        }
    };

    if (viewMode === 'readonly') {
        return (
            <div className={`w-[280px] rounded-lg border p-1.5 shadow-sm transition-all flex items-center gap-2 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-400'
            }`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-500`}>
                    <Zap size={14} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-xs truncate leading-none ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{data.label}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-baseline">
                        <span className={`text-xs font-black ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{data.outVoltage}</span>
                        <span className="text-[10px] font-bold ml-0.5 opacity-50">V</span>
                    </div>
                    <div className="w-px h-3 bg-zinc-700/30" />
                    <div className="flex items-baseline">
                        <span className={`text-xs font-bold ${
                            (data.calcCurrent || 0) > data.maxCurrent ? 'text-red-500' : (theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700')
                        }`}>
                            {(data.calcCurrent || 0).toFixed(1)}
                        </span>
                        <span className="text-[10px] font-bold ml-0.5 opacity-50">A</span>
                    </div>
                </div>
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-2 !h-2 !bg-emerald-500 !border-none"
                />
            </div>
        );
    }

    return (
        <div className={`w-[280px] rounded-xl border-2 p-2 shadow-xl transition-all flex flex-col gap-2 ${
            theme === 'dark' ? 'bg-zinc-900 shadow-black/40' : 'bg-white shadow-zinc-200/50'
        } ${selected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : data.error ? 'border-red-500' : (theme === 'dark' ? 'border-zinc-800' : 'border-zinc-400')}`}>
            <div className={`flex items-center gap-2 ${viewMode === 'compact' ? 'pb-0' : `border-b pb-2 ${theme === 'dark' ? 'border-zinc-800/80' : 'border-zinc-100'}`}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${
                    theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                    <Zap size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <h3 className={`font-semibold text-sm truncate leading-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{data.label}</h3>
                    <p className={`text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-emerald-500/80' : 'text-emerald-600/80'}`}>Source L{data.level}</p>
                </div>
                <div className={`flex items-center gap-0.5 border rounded-md p-0.5 ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'}`}>
                    <button onClick={(e) => { e.stopPropagation(); moveNodeVertical(id, 'up'); }} className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700'}`}><ChevronUp size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveNodeVertical(id, 'down'); }} className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700'}`}><ChevronDown size={12} /></button>
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
                        <NodeInput
                            value={data.outVoltage}
                            onUpdate={(v) => handleUpdate('outVoltage', v)}
                            step="0.1"
                            className={`w-14 bg-transparent text-base font-black focus:outline-none text-right cursor-text ${theme === 'dark' ? 'text-emerald-400 focus:ring-emerald-500/50' : 'text-emerald-600'}`}
                        />
                        <span className={`text-[10px] font-bold ml-0.5 ${theme === 'dark' ? 'text-emerald-600' : 'text-emerald-500'}`}>V</span>
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
                            (data.calcCurrent || 0) > data.maxCurrent 
                                ? 'text-red-500' 
                                : (theme === 'dark' ? 'text-emerald-100/80' : 'text-zinc-900')
                        }`}>
                            {(data.calcCurrent || 0).toFixed(2)}
                        </span>
                        <span className={`text-[10px] font-bold mx-0.5 ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-300'}`}>/</span>
                        <NodeInput
                            value={data.maxCurrent}
                            onUpdate={(v) => handleUpdate('maxCurrent', v)}
                            step="0.1"
                            className={`w-10 bg-transparent text-sm font-bold text-right focus:outline-none cursor-text ${
                                theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800/50' : 'text-zinc-600 hover:bg-zinc-200'
                            }`}
                        />
                        <span className={`text-[10px] font-bold ml-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>A</span>
                    </div>
                </div>
                {viewMode !== 'compact' && (
                    <div className={`col-span-2 flex justify-between items-center rounded-md px-2 py-1.5 border shadow-inner mt-0.5 h-[34px] ${theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800/80' : 'bg-zinc-100/50 border-zinc-200/50'}`}>
                        <p className={`text-[10px] font-bold uppercase whitespace-nowrap ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Total Power Output:</p>
                        <div className="flex items-baseline whitespace-nowrap">
                            <span className={`text-sm font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{(data.calcPower || 0).toFixed(2)}</span>
                            <span className={`text-[10px] font-bold ml-1 ${theme === 'dark' ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>W</span>
                        </div>
                    </div>
                )}
            </div>

            {viewMode !== 'compact' && data.error && (
                <div className={`flex items-start gap-2 text-[10px] font-semibold p-2 rounded-md border ${theme === 'dark' ? 'text-red-100 bg-red-500/20 border-red-500/30' : 'text-red-800 bg-red-50 border-red-100'}`}>
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    <span>{data.error}</span>
                </div>
            )}

            <Handle
                type="source"
                position={Position.Right}
                className={`!h-5 !w-5 !border-[3px] rounded-full hover:scale-125 transition-all cursor-crosshair relative before:content-[''] before:absolute before:inset-[-12px] before:rounded-full before:bg-transparent ${
                    theme === 'dark' ? '!bg-zinc-900 !border-emerald-500' : '!bg-white !border-emerald-500 shadow-md'
                }`}
            />
        </div>
    );
}
