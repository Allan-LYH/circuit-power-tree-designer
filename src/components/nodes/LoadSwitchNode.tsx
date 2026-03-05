
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { usePowerTreeStore } from '../../stores/usePowerTreeStore';
import { useShallow } from 'zustand/react/shallow';
import type { PowerNode, LoadSwitchData } from '../../stores/usePowerTreeStore';
import { ToggleRight, AlertCircle, Settings2, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

import { NodeInput } from '../NodeInput';

export default function LoadSwitchNode({ id, data, selected }: NodeProps<PowerNode & { data: LoadSwitchData }>) {
    const { viewMode, moveNodeVertical, updateNodeData, removeNode } = usePowerTreeStore(
        useShallow((state) => ({
            viewMode: state.viewMode,
            moveNodeVertical: state.moveNodeVertical,
            updateNodeData: state.updateNodeData,
            removeNode: state.removeNode,
        }))
    );

    const handleUpdate = (field: string, val: string) => {
        let num = parseFloat(val);
        if (!isNaN(num)) {
            updateNodeData(id, { [field]: num });
        }
    };

    return (
        <div className={`w-[280px] rounded-xl border-2 bg-zinc-900 p-2 shadow-xl transition-colors flex flex-col gap-2 ${selected ? 'border-indigo-500 shadow-indigo-500/20' : data.error ? 'border-red-500' : 'border-zinc-700'
            }`}>
            <Handle
                type="target"
                position={Position.Left}
                className="!h-5 !w-5 !bg-zinc-900 !border-[3px] !border-fuchsia-500 rounded-full hover:scale-125 transition-colors cursor-crosshair relative before:content-[''] before:absolute before:inset-[-12px] before:rounded-full before:bg-transparent"
            />

            <div className={`flex items-center gap-2 ${viewMode === 'compact' ? 'pb-0' : 'border-b border-zinc-800/80 pb-2'}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/20">
                    <ToggleRight size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-sm text-zinc-100 truncate leading-tight">{data.label}</h3>
                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest text-fuchsia-500/80">Load Switch L{data.level}</p>
                </div>
                <div className="flex items-center gap-0.5 bg-zinc-950/40 border border-zinc-800/80 rounded-md p-0.5">
                    <button onClick={(e) => { e.stopPropagation(); moveNodeVertical(id, 'up'); }} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"><ChevronUp size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveNodeVertical(id, 'down'); }} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"><ChevronDown size={12} /></button>
                    <div className="w-px h-3 bg-zinc-800 mx-0.5" />
                    <button
                        onClick={(e) => { e.stopPropagation(); removeNode(id); }}
                        className="p-1 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                        title="Delete Node"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-zinc-950/60 px-2 py-1.5 border border-zinc-800/60 shadow-inner flex flex-col justify-between">
                    {viewMode !== 'compact' && <p className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-wider">Set R_ON (mΩ)</p>}
                    <div className="flex items-baseline justify-end">
                        <NodeInput
                            value={data.rOn}
                            onUpdate={(v) => handleUpdate('rOn', v)}
                            step="1"
                            className="w-16 bg-transparent text-base font-bold text-fuchsia-400 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 text-right cursor-text"
                        />
                        <span className="text-[10px] text-fuchsia-600 font-bold ml-0.5">mΩ</span>
                    </div>
                </div>
                <div className="rounded-md bg-zinc-950/60 px-2 py-1.5 border border-zinc-800/60 shadow-inner flex flex-col justify-between">
                    {viewMode !== 'compact' && <p className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-wider">Load Draw</p>}
                    <div className="flex items-baseline justify-end">
                        <p className="text-base font-bold font-mono tracking-tight text-fuchsia-100/80">{(data.calcCurrent || 0).toFixed(2)}</p>
                        <span className="text-[10px] text-zinc-500 font-bold ml-0.5">A</span>
                    </div>
                </div>
                {viewMode !== 'compact' && (
                    <div className="col-span-2 grid grid-cols-[1fr_auto_1fr] items-center rounded-md bg-zinc-950/80 px-2 py-1.5 border border-zinc-800/80 shadow-inner mt-0.5 h-[34px]">
                        <div className="flex items-baseline justify-between w-full overflow-hidden gap-1">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase whitespace-nowrap">V_OUT (~):</p>
                            <p className="text-sm font-bold text-zinc-100 truncate">{data.calcVoltage?.toFixed(2) || '0.00'}V</p>
                        </div>
                        <div className="w-px h-4 bg-zinc-800/80 mx-2" />
                        <div className="flex items-baseline justify-between w-full overflow-hidden gap-1">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase whitespace-nowrap">Pd Loss:</p>
                            <div className="flex items-baseline whitespace-nowrap">
                                <span className="text-sm font-bold text-rose-400">{(data.calcPower || 0).toFixed(2)}</span>
                                <span className="text-[10px] text-rose-500/70 font-bold ml-0.5">W</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {((viewMode === 'full' && data.showControlLogic && data.controlInterface) || (viewMode !== 'compact' && data.error)) && (
                <div className="flex flex-col gap-2">
                    {viewMode === 'full' && data.showControlLogic && data.controlInterface && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20 uppercase tracking-wider">
                            <Settings2 size={10} />
                            <span>CTL: {data.controlInterface}</span>
                        </div>
                    )}
                    {data.error && (
                        <div className="flex items-start gap-2 text-[10px] font-bold text-red-100 bg-red-500/20 p-2 rounded-md border border-red-500/30">
                            <AlertCircle size={12} className="shrink-0 mt-0.5" />
                            <span>{data.error}</span>
                        </div>
                    )}
                </div>
            )}

            <Handle
                type="source"
                position={Position.Right}
                className="!h-5 !w-5 !bg-zinc-900 !border-[3px] !border-fuchsia-500 rounded-full hover:scale-125 transition-colors cursor-crosshair relative before:content-[''] before:absolute before:inset-[-12px] before:rounded-full before:bg-transparent"
            />
        </div>
    );
}
