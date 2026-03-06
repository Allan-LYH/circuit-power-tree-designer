import { useEffect } from 'react';
import { Handle, Position, type NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { usePowerTreeStore } from '../../stores/usePowerTreeStore';
import { useShallow } from 'zustand/react/shallow';
import type { PowerNode, MuxSwitchData } from '../../types/node.types';
import { GitMerge, AlertCircle, Settings2, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

import { NodeInput } from '../NodeInput';

export default function MuxSwitchNode({ id, data, selected }: NodeProps<PowerNode & { data: MuxSwitchData }>) {
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
        let num = parseInt(val, 10);
        if (!isNaN(num)) {
            if (num < 1) num = 1;
            if (num > 8) num = 8;
            updateNodeData(id, { [field]: num });
        }
    };

    const inPorts = Math.max(1, data.inPorts || 1);
    const outPorts = Math.max(1, data.outPorts || 1);

    const calculateTree = usePowerTreeStore(state => state.calculateTree);
    const updateNodeInternals = useUpdateNodeInternals();

    useEffect(() => {
        const timer = setTimeout(() => {
            updateNodeInternals(id);
            calculateTree();
        }, 10);

        return () => clearTimeout(timer);
    }, [inPorts, outPorts, id, updateNodeInternals, calculateTree]);

    const handlePortToggle = (portId: string) => {
        if (viewMode === 'readonly') return;
        const currentDisabled = data.disabledPorts || [];
        const nextDisabled = currentDisabled.includes(portId)
            ? currentDisabled.filter(p => p !== portId)
            : [...currentDisabled, portId];
        updateNodeData(id, { disabledPorts: nextDisabled });
    };

    if (viewMode === 'readonly') {
        return (
            <div className={`w-[280px] rounded-lg border p-1.5 shadow-sm transition-all flex items-center gap-2 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-400'
            }`}>
                {/* Simplified Handles for Readonly */}
                <Handle type="target" id="ctrl" position={Position.Top} className="!w-2 !h-1 !bg-indigo-500 !border-none !rounded-none" />
                {Array.from({ length: inPorts }).map((_, i) => {
                    const portId = `in-${i}`;
                    const isDisabled = (data.disabledPorts || []).includes(portId);
                    return (
                        <Handle 
                            key={portId} 
                            id={portId} 
                            type="target" 
                            position={Position.Left} 
                            style={{ top: `${((i + 1) * 100) / (inPorts + 1)}%` }} 
                            className={`!w-1.5 !h-1.5 !border-none ${isDisabled ? '!bg-zinc-500 opacity-30' : '!bg-indigo-500'}`} 
                        />
                    );
                })}
                {Array.from({ length: outPorts }).map((_, i) => {
                    const portId = `out-${i}`;
                    const isDisabled = (data.disabledPorts || []).includes(portId);
                    return (
                        <Handle 
                            key={portId} 
                            id={portId} 
                            type="source" 
                            position={Position.Right} 
                            style={{ top: `${((i + 1) * 100) / (outPorts + 1)}%` }} 
                            className={`!w-1.5 !h-1.5 !border-none ${isDisabled ? '!bg-zinc-500 opacity-30' : '!bg-indigo-500'}`} 
                        />
                    );
                })}

                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded bg-indigo-500/10 text-indigo-500`}>
                    <GitMerge size={14} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-xs truncate leading-none ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{data.label}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-baseline">
                        <span className={`text-xs font-black ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{inPorts}:{outPorts}</span>
                        <span className="text-[10px] font-bold ml-0.5 opacity-50">CH</span>
                    </div>
                    <div className="w-px h-3 bg-zinc-700/30" />
                    <div className="flex items-baseline">
                        <span className={`text-xs font-bold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            {(data.calcCurrent || 0).toFixed(1)}
                        </span>
                        <span className="text-[10px] font-bold ml-0.5 opacity-50">A</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-[280px] rounded-xl border-2 p-2 shadow-xl transition-all flex flex-col gap-2 ${
            theme === 'dark' ? 'bg-zinc-900 shadow-black/40' : 'bg-white shadow-zinc-200/50'
        } ${selected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : data.error ? 'border-red-500' : (theme === 'dark' ? 'border-zinc-800' : 'border-zinc-400')}`}>

            {/* Control Input Handle */}
            <Handle
                type="target"
                id="ctrl"
                position={Position.Top}
                className={`!h-3 !w-6 border-2 border-indigo-400 rounded-sm hover:scale-110 transition-transform cursor-crosshair ${
                    theme === 'dark' ? '!bg-zinc-800' : '!bg-white'
                }`}
            />

            {/* Multiple Input Handles */}
            {Array.from({ length: inPorts }).map((_, i) => {
                const portId = `in-${i}`;
                const isDisabled = (data.disabledPorts || []).includes(portId);
                return (
                    <Handle
                        key={portId}
                        id={portId}
                        type="target"
                        position={Position.Left}
                        onMouseDown={(e) => {
                            if (e.button === 0) { // Left click
                                handlePortToggle(portId);
                            }
                        }}
                        style={{ top: `${((i + 1) * 100) / (inPorts + 1)}%` }}
                        className={`!h-4 !w-4 !border-[3px] rounded-full hover:scale-125 transition-all cursor-pointer ${
                            isDisabled 
                                ? '!border-zinc-500 !bg-zinc-400 opacity-50' 
                                : '!border-indigo-500 ' + (theme === 'dark' ? '!bg-zinc-900' : '!bg-white shadow-sm')
                        }`}
                        title={isDisabled ? "Port Disabled (Click to enable)" : "Port Enabled (Click to disable)"}
                    />
                );
            })}

            {/* Multiple Output Handles */}
            {Array.from({ length: outPorts }).map((_, i) => {
                const portId = `out-${i}`;
                const isDisabled = (data.disabledPorts || []).includes(portId);
                return (
                    <Handle
                        key={portId}
                        id={portId}
                        type="source"
                        position={Position.Right}
                        onMouseDown={(e) => {
                            if (e.button === 0) { // Left click
                                handlePortToggle(portId);
                            }
                        }}
                        style={{ top: `${((i + 1) * 100) / (outPorts + 1)}%` }}
                        className={`!h-4 !w-4 !border-[3px] rounded-full hover:scale-125 transition-all cursor-pointer ${
                            isDisabled 
                                ? '!border-zinc-500 !bg-zinc-400 opacity-50' 
                                : '!border-indigo-500 ' + (theme === 'dark' ? '!bg-zinc-900' : '!bg-white shadow-sm')
                        }`}
                        title={isDisabled ? "Port Disabled (Click to enable)" : "Port Enabled (Click to disable)"}
                    />
                );
            })}

            <div className={`flex items-center gap-2 ${viewMode === 'compact' ? 'pb-0' : `border-b pb-2 ${theme === 'dark' ? 'border-zinc-800/80' : 'border-zinc-100'}`}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${
                    theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                    <GitMerge size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1">
                        <h3 className={`font-semibold text-sm truncate leading-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{data.label}</h3>
                        {(data.disabledPorts?.length || 0) > 0 && (
                            <span className="text-[10px] px-1 rounded bg-zinc-500/20 text-zinc-500 font-bold">MUTED</span>
                        )}
                    </div>
                    <p className={`text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-indigo-500/80' : 'text-indigo-600/80'}`}>MUX Switch L{data.level}</p>
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
                    {viewMode !== 'compact' && <p className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>IN Ports</p>}
                    <div className="flex items-baseline justify-end">
                        <NodeInput
                            value={data.inPorts || 1}
                            onUpdate={(v) => handleUpdate('inPorts', v)}
                            step="1"
                            className={`w-10 bg-transparent text-base font-black focus:outline-none text-right cursor-text ${theme === 'dark' ? 'text-indigo-400 focus:ring-indigo-500/50' : 'text-indigo-600'}`}
                        />
                        <span className={`text-[10px] font-bold ml-0.5 ${theme === 'dark' ? 'text-indigo-600' : 'text-indigo-500'}`}>CH</span>
                    </div>
                </div>
                <div className={`rounded-md px-2 py-1.5 border shadow-inner flex flex-col justify-between ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-zinc-50 border-zinc-100'}`}>
                    {viewMode !== 'compact' && <p className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>OUT Ports</p>}
                    <div className="flex items-baseline justify-end">
                        <NodeInput
                            value={data.outPorts || 1}
                            onUpdate={(v) => handleUpdate('outPorts', v)}
                            step="1"
                            className={`w-10 bg-transparent text-base font-black focus:outline-none text-right cursor-text ${theme === 'dark' ? 'text-indigo-400 focus:ring-indigo-500/50' : 'text-indigo-600'}`}
                        />
                        <span className={`text-[10px] font-bold ml-0.5 ${theme === 'dark' ? 'text-indigo-600' : 'text-indigo-500'}`}>CH</span>
                    </div>
                </div>

                {viewMode !== 'compact' && (
                    <div className={`col-span-2 grid grid-cols-[1fr_auto_1fr] items-center rounded-md px-2 py-1.5 border shadow-inner mt-0.5 ${theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800/80' : 'bg-zinc-100/50 border-zinc-200/50'}`}>
                        <div className="flex items-baseline justify-between w-full overflow-hidden gap-1">
                            <p className={`text-[10px] font-bold uppercase whitespace-nowrap ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>V_PASS (~):</p>
                            <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{data.calcVoltage?.toFixed(2) || '0.00'}V</p>
                        </div>
                        <div className={`w-px h-4 mx-2 ${theme === 'dark' ? 'bg-zinc-800/80' : 'bg-zinc-200'}`} />
                        <div className="flex items-baseline justify-between w-full overflow-hidden gap-1">
                            <p className={`text-[10px] font-bold uppercase whitespace-nowrap ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Total I:</p>
                            <div className="flex items-baseline whitespace-nowrap">
                                <span className={`text-sm font-bold font-mono tracking-tight ${theme === 'dark' ? 'text-indigo-100/80' : 'text-zinc-900'}`}>{(data.calcCurrent || 0).toFixed(2)}</span>
                                <span className={`text-[10px] font-bold ml-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>A</span>
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
        </div>
    );
}
