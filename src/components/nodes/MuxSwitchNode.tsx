import { useEffect } from 'react';
import { Handle, Position, type NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { usePowerTreeStore } from '../../stores/usePowerTreeStore';
import { useShallow } from 'zustand/react/shallow';
import type { PowerNode, MuxSwitchData } from '../../stores/usePowerTreeStore';
import { GitMerge, AlertCircle, Settings2, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

import { NodeInput } from '../NodeInput';

export default function MuxSwitchNode({ id, data, selected }: NodeProps<PowerNode & { data: MuxSwitchData }>) {
    const { viewMode, moveNodeVertical, updateNodeData, removeNode } = usePowerTreeStore(
        useShallow((state) => ({
            viewMode: state.viewMode,
            moveNodeVertical: state.moveNodeVertical,
            updateNodeData: state.updateNodeData,
            removeNode: state.removeNode,
        }))
    );

    const handleUpdate = (field: string, val: string) => {
        let num = parseInt(val, 10);
        if (!isNaN(num)) {
            if (num < 1) num = 1;
            if (num > 8) num = 8;
            updateNodeData(id, { [field]: num });
        }
    };

    const inPorts = Math.max(1, data.inPorts || 1);
    const outPorts = Math.max(1, data.outPorts || 1);

    // When handle counts change, we must tell XYFlow to re-calculate edges
    // because the handle positions (based on percentage) have shifted.
    // useUpdateNodeInternals explicitly tells React Flow to read the new handle DOM positions.
    const calculateTree = usePowerTreeStore(state => state.calculateTree);
    const updateNodeInternals = useUpdateNodeInternals();

    useEffect(() => {
        // Use a short delay to ensure React has fully rendered the new Handle DOM elements
        // before we tell XYFlow to re-read their positions and recalculate the tree.
        const timer = setTimeout(() => {
            updateNodeInternals(id);
            calculateTree();
        }, 10);

        return () => clearTimeout(timer);
    }, [inPorts, outPorts, id, updateNodeInternals, calculateTree]);

    return (
        <div className={`w-[280px] rounded-xl border-2 bg-zinc-900 p-2 shadow-xl transition-colors flex flex-col gap-2 ${selected ? 'border-indigo-500 shadow-indigo-500/20' : data.error ? 'border-red-500' : 'border-zinc-700'
            }`}>

            {/* Control Input Handle */}
            <Handle
                type="target"
                id="ctrl"
                position={Position.Top}
                className="!h-3 !w-6 !bg-zinc-800 border-2 border-indigo-400 rounded-sm hover:scale-110 transition-transform cursor-crosshair"
            />

            {/* Multiple Input Handles */}
            {Array.from({ length: inPorts }).map((_, i) => (
                <Handle
                    key={`in-${i}`}
                    id={`in-${i}`}
                    type="target"
                    position={Position.Left}
                    style={{ top: `${((i + 1) * 100) / (inPorts + 1)}%` }}
                    className="!h-4 !w-4 !bg-zinc-900 !border-[3px] !border-indigo-500 rounded-full hover:scale-125 transition-transform cursor-crosshair"
                />
            ))}

            {/* Multiple Output Handles */}
            {Array.from({ length: outPorts }).map((_, i) => (
                <Handle
                    key={`out-${i}`}
                    id={`out-${i}`}
                    type="source"
                    position={Position.Right}
                    style={{ top: `${((i + 1) * 100) / (outPorts + 1)}%` }}
                    className="!h-4 !w-4 !bg-zinc-900 !border-[3px] !border-indigo-500 rounded-full hover:scale-125 transition-transform cursor-crosshair"
                />
            ))}

            <div className={`flex items-center gap-2 ${viewMode === 'compact' ? 'pb-0' : 'border-b border-zinc-800/80 pb-2'}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
                    <GitMerge size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-sm text-zinc-100 truncate leading-tight">{data.label}</h3>
                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest text-indigo-500/80">MUX Switch L{data.level}</p>
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
                    {viewMode !== 'compact' && <p className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-wider">IN Ports</p>}
                    <div className="flex items-baseline justify-end">
                        <NodeInput
                            value={data.inPorts || 1}
                            onUpdate={(v) => handleUpdate('inPorts', v)}
                            step="1"
                            className="w-10 bg-transparent text-base font-bold text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-right cursor-text"
                        />
                        <span className="text-[10px] text-indigo-600 font-bold ml-0.5">CH</span>
                    </div>
                </div>
                <div className="rounded-md bg-zinc-950/60 px-2 py-1.5 border border-zinc-800/60 shadow-inner flex flex-col justify-between">
                    {viewMode !== 'compact' && <p className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-wider">OUT Ports</p>}
                    <div className="flex items-baseline justify-end">
                        <NodeInput
                            value={data.outPorts || 1}
                            onUpdate={(v) => handleUpdate('outPorts', v)}
                            step="1"
                            className="w-10 bg-transparent text-base font-bold text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-right cursor-text"
                        />
                        <span className="text-[10px] text-indigo-600 font-bold ml-0.5">CH</span>
                    </div>
                </div>

                {viewMode !== 'compact' && (
                    <div className="col-span-2 grid grid-cols-[1fr_auto_1fr] items-center rounded-md bg-zinc-950/80 px-2 py-1.5 border border-zinc-800/80 shadow-inner mt-0.5">
                        <div className="flex items-baseline justify-between w-full overflow-hidden gap-1">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase whitespace-nowrap">V_PASS (~):</p>
                            <p className="text-sm font-bold text-zinc-100 truncate">{data.calcVoltage?.toFixed(2) || '0.00'}V</p>
                        </div>
                        <div className="w-px h-4 bg-zinc-800/80 mx-2" />
                        <div className="flex items-baseline justify-between w-full overflow-hidden gap-1">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase whitespace-nowrap">Total I:</p>
                            <div className="flex items-baseline whitespace-nowrap">
                                <span className="text-sm font-bold font-mono tracking-tight text-indigo-100/80">{(data.calcCurrent || 0).toFixed(2)}</span>
                                <span className="text-[10px] text-zinc-500 font-bold ml-0.5">A</span>
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
        </div>
    );
}
