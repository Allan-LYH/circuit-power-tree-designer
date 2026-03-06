import { usePowerTreeStore } from '../stores/usePowerTreeStore';
import type { PowerNodeData } from '../stores/usePowerTreeStore';
import { Panel } from '@xyflow/react';
import { Copy, ClipboardPaste, Trash2 } from 'lucide-react';
import { NodeInput } from './NodeInput';
import { useShallow } from 'zustand/react/shallow';

export default function PropertiesPanel() {
    const { nodes, updateNodeData, removeNode, copyNodeData, pasteNodeData, clipboard, theme } = usePowerTreeStore(
        useShallow((state) => ({
            nodes: state.nodes,
            updateNodeData: state.updateNodeData,
            removeNode: state.removeNode,
            copyNodeData: state.copyNodeData,
            pasteNodeData: state.pasteNodeData,
            clipboard: state.clipboard,
            theme: state.theme,
        }))
    );

    // Find selected node
    const selectedNode = nodes.find((n: any) => n.selected);
    const data = selectedNode?.data as PowerNodeData | undefined;

    if (!selectedNode || !data) return null;

    const canPaste = clipboard?.type === data.type;

    const handleChange = (key: keyof PowerNodeData, value: string | number | boolean) => {
        updateNodeData(selectedNode.id, { [key]: value });
    };

    return (
        <Panel position="top-right" className={`w-80 rounded-xl border p-4 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-right-4 transition-colors ${
            theme === 'dark' ? 'border-zinc-800 bg-zinc-900/95' : 'border-zinc-400 bg-white/95'
        }`}>
            <div className={`mb-4 flex flex-col gap-2 border-b pb-3 ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <div className="flex items-center justify-between">
                    <h2 className={`font-semibold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>Node Properties</h2>
                    <button
                        onClick={() => removeNode(selectedNode.id)}
                        className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded transition-colors ${
                            theme === 'dark' ? 'text-rose-500 hover:text-rose-400 hover:bg-rose-500/10' : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                        }`}
                        title="Delete Node"
                    >
                        <Trash2 size={14} />
                        <span>Delete</span>
                    </button>
                </div>

                {data.type !== 'powerSource' && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => copyNodeData(selectedNode.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-2 py-1.5 rounded transition-colors border ${
                                theme === 'dark' 
                                    ? 'text-zinc-300 hover:text-indigo-400 bg-zinc-800 hover:bg-zinc-700 border-zinc-700' 
                                    : 'text-zinc-600 hover:text-indigo-700 bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                            }`}
                        >
                            <Copy size={14} />
                            <span>Copy Parameters</span>
                        </button>
                        <button
                            onClick={() => pasteNodeData(selectedNode.id)}
                            disabled={!canPaste}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-2 py-1.5 rounded transition-colors border ${
                                canPaste
                                    ? (theme === 'dark' 
                                        ? 'text-zinc-300 hover:text-emerald-400 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 cursor-pointer'
                                        : 'text-zinc-600 hover:text-emerald-700 bg-zinc-50 hover:bg-zinc-100 border-zinc-200 cursor-pointer')
                                    : (theme === 'dark'
                                        ? 'text-zinc-600 bg-zinc-900 border-zinc-800 cursor-not-allowed'
                                        : 'text-zinc-300 bg-zinc-50 border-zinc-100 cursor-not-allowed')
                            }`}
                        >
                            <ClipboardPaste size={14} />
                            <span>Paste Parameters</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Name</label>
                    <input
                        type="text"
                        value={data.label}
                        onChange={e => handleChange('label', e.target.value)}
                        className={`w-full rounded border px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                            theme === 'dark' 
                                ? 'border-zinc-700 bg-zinc-950 text-zinc-200 focus:border-indigo-500' 
                                : 'border-zinc-200 bg-zinc-50 text-zinc-900 focus:border-indigo-500'
                        }`}
                    />
                </div>

                {data.type === 'powerSource' && (
                    <>
                        <div>
                            <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Output Voltage (V)</label>
                            <NodeInput
                                value={data.outVoltage}
                                onUpdate={v => handleChange('outVoltage', parseFloat(v))}
                                step="0.1"
                                className={`w-full rounded border px-3 py-1.5 text-sm text-left ${
                                    theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                                }`}
                            />
                        </div>
                        <div>
                            <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Max Current (A)</label>
                            <NodeInput
                                value={data.maxCurrent}
                                onUpdate={v => handleChange('maxCurrent', parseFloat(v))}
                                step="0.1"
                                className={`w-full rounded border px-3 py-1.5 text-sm text-left ${
                                    theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                                }`}
                            />
                        </div>
                    </>
                )}

                {data.type === 'converter' && (
                    <>
                        <div>
                            <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Output Voltage (V)</label>
                            <NodeInput
                                value={data.outVoltage}
                                onUpdate={v => handleChange('outVoltage', parseFloat(v))}
                                step="0.1"
                                className={`w-full rounded border px-3 py-1.5 text-sm text-left ${
                                    theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                                }`}
                            />
                        </div>
                        <div>
                            <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Efficiency (0.0 - 1.0)</label>
                            <NodeInput
                                value={data.efficiency}
                                onUpdate={v => handleChange('efficiency', parseFloat(v))}
                                step="0.05"
                                className={`w-full rounded border px-3 py-1.5 text-sm text-left ${
                                    theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                                }`}
                            />
                        </div>
                        <div>
                            <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Control Interface</label>
                            <input
                                type="text"
                                value={data.controlInterface}
                                onChange={e => handleChange('controlInterface', e.target.value)}
                                className={`w-full rounded border px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                                    theme === 'dark' 
                                        ? 'border-zinc-700 bg-zinc-950 text-zinc-200 focus:border-indigo-500' 
                                        : 'border-zinc-200 bg-zinc-50 text-zinc-900 focus:border-indigo-500'
                                }`}
                                placeholder="e.g. EN, I2C"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox" id="showCtrl"
                                checked={data.showControlLogic || false}
                                onChange={e => handleChange('showControlLogic', e.target.checked)}
                                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-indigo-500"
                            />
                            <label htmlFor="showCtrl" className={`text-sm font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>Show Control Logic on Node</label>
                        </div>
                        <div className={`pt-3 pb-1 border-t mt-4 ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'}`}>
                            <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Validation Limits</h3>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className={`mb-1 block text-[10px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Min Vin (V)</label>
                                    <NodeInput value={data.minInVoltage || 0} onUpdate={v => handleChange('minInVoltage', parseFloat(v) || 0)} step="0.1" className={`w-full rounded border px-2 py-1 text-xs text-left ${theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} />
                                </div>
                                <div>
                                    <label className={`mb-1 block text-[10px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Max Vin (V)</label>
                                    <NodeInput value={data.maxInVoltage || 0} onUpdate={v => handleChange('maxInVoltage', parseFloat(v) || 0)} step="0.1" className={`w-full rounded border px-2 py-1 text-xs text-left ${theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} />
                                </div>
                            </div>
                            <div>
                                <label className={`mb-1 block text-[10px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Max Output Current (A)</label>
                                <NodeInput value={data.maxOutCurrent || 0} onUpdate={v => handleChange('maxOutCurrent', parseFloat(v) || 0)} step="0.1" className={`w-full rounded border px-2 py-1 text-xs text-left ${theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} />
                            </div>
                        </div>
                    </>
                )}

                {data.type === 'load' && (
                    <>
                        <div>
                            <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Required Voltage (V)</label>
                            <NodeInput
                                value={data.reqVoltage}
                                onUpdate={v => handleChange('reqVoltage', parseFloat(v))}
                                step="0.1"
                                className={`w-full rounded border px-3 py-1.5 text-sm text-left ${
                                    theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                                }`}
                            />
                        </div>
                        <div>
                            <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Required Current (A)</label>
                            <NodeInput
                                value={data.reqCurrent}
                                onUpdate={v => handleChange('reqCurrent', parseFloat(v))}
                                step="0.1"
                                className={`w-full rounded border px-3 py-1.5 text-sm text-left ${
                                    theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                                }`}
                            />
                        </div>
                        <div className={`pt-3 pb-1 border-t mt-4 ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'}`}>
                            <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Input Limits</h3>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className={`mb-1 block text-[10px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Min Vin (V)</label>
                                    <NodeInput value={data.minInVoltage || 0} onUpdate={v => handleChange('minInVoltage', parseFloat(v) || 0)} step="0.1" className={`w-full rounded border px-2 py-1 text-xs text-left ${theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} />
                                </div>
                                <div>
                                    <label className={`mb-1 block text-[10px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Max Vin (V)</label>
                                    <NodeInput value={data.maxInVoltage || 0} onUpdate={v => handleChange('maxInVoltage', parseFloat(v) || 0)} step="0.1" className={`w-full rounded border px-2 py-1 text-xs text-left ${theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {data.type === 'loadSwitch' && (
                    <>
                        <div>
                            <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>R_ON Resistance (mΩ)</label>
                            <NodeInput
                                value={data.rOn}
                                onUpdate={v => handleChange('rOn', parseFloat(v))}
                                step="1"
                                className={`w-full rounded border px-3 py-1.5 text-sm text-left ${
                                    theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                                }`}
                            />
                        </div>
                        <div>
                            <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Control Interface</label>
                            <input
                                type="text"
                                value={data.controlInterface}
                                onChange={e => handleChange('controlInterface', e.target.value)}
                                className={`w-full rounded border px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                                    theme === 'dark' 
                                        ? 'border-zinc-700 bg-zinc-950 text-zinc-200 focus:border-indigo-500' 
                                        : 'border-zinc-200 bg-zinc-50 text-zinc-900 focus:border-indigo-500'
                                }`}
                                placeholder="e.g. EN, GPIO"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox" id="showCtrl"
                                checked={data.showControlLogic || false}
                                onChange={e => handleChange('showControlLogic', e.target.checked)}
                                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-indigo-500"
                            />
                            <label htmlFor="showCtrl" className={`text-sm font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>Show Control Logic on Node</label>
                        </div>
                        <div className={`pt-3 pb-1 border-t mt-4 ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'}`}>
                            <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Validation Limits</h3>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className={`mb-1 block text-[10px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Min Vin (V)</label>
                                    <NodeInput value={data.minInVoltage || 0} onUpdate={v => handleChange('minInVoltage', parseFloat(v) || 0)} step="0.1" className={`w-full rounded border px-2 py-1 text-xs text-left ${theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} />
                                </div>
                                <div>
                                    <label className={`mb-1 block text-[10px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Max Vin (V)</label>
                                    <NodeInput value={data.maxInVoltage || 0} onUpdate={v => handleChange('maxInVoltage', parseFloat(v) || 0)} step="0.1" className={`w-full rounded border px-2 py-1 text-xs text-left ${theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} />
                                </div>
                            </div>
                            <div>
                                <label className={`mb-1 block text-[10px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Max Output Current (A)</label>
                                <NodeInput value={data.maxCurrent || 0} onUpdate={v => handleChange('maxCurrent', parseFloat(v) || 0)} step="0.1" className={`w-full rounded border px-2 py-1 text-xs text-left ${theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} />
                            </div>
                        </div>
                    </>
                )}

                {data.type === 'muxSwitch' && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>IN Ports</label>
                                <NodeInput
                                    value={data.inPorts || 1}
                                    onUpdate={v => handleChange('inPorts', parseInt(v, 10) || 1)}
                                    step="1"
                                    className={`w-full rounded border px-3 py-1.5 text-sm text-left ${
                                        theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>OUT Ports</label>
                                <NodeInput
                                    value={data.outPorts || 1}
                                    onUpdate={v => handleChange('outPorts', parseInt(v, 10) || 1)}
                                    step="1"
                                    className={`w-full rounded border px-3 py-1.5 text-sm text-left ${
                                        theme === 'dark' ? 'border-zinc-700 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                                    }`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={`mb-1 block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Control Interface</label>
                            <input
                                type="text"
                                value={data.controlInterface}
                                onChange={e => handleChange('controlInterface', e.target.value)}
                                className={`w-full rounded border px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                                    theme === 'dark' 
                                        ? 'border-zinc-700 bg-zinc-950 text-zinc-200 focus:border-indigo-500' 
                                        : 'border-zinc-200 bg-zinc-50 text-zinc-900 focus:border-indigo-500'
                                }`}
                                placeholder="e.g. SEL, EN"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox" id="showCtrl"
                                checked={data.showControlLogic || false}
                                onChange={e => handleChange('showControlLogic', e.target.checked)}
                                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-indigo-500"
                            />
                            <label htmlFor="showCtrl" className={`text-sm font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>Show Control Logic on Node</label>
                        </div>
                    </>
                )}
            </div>
        </Panel>
    );
}
