import { usePowerTreeStore } from '../stores/usePowerTreeStore';
import type { PowerNodeData } from '../stores/usePowerTreeStore';
import { Panel } from '@xyflow/react';
import { Copy, ClipboardPaste, Trash2 } from 'lucide-react';
import { NodeInput } from './NodeInput';

export default function PropertiesPanel() {
    const nodes = usePowerTreeStore(state => state.nodes);
    const updateNodeData = usePowerTreeStore(state => state.updateNodeData);
    const removeNode = usePowerTreeStore(state => state.removeNode);
    const copyNodeData = usePowerTreeStore(state => state.copyNodeData);
    const pasteNodeData = usePowerTreeStore(state => state.pasteNodeData);
    const clipboard = usePowerTreeStore(state => state.clipboard);

    // Find selected node
    const selectedNode = nodes.find((n: any) => n.selected);
    const data = selectedNode?.data as PowerNodeData | undefined;

    if (!selectedNode || !data) return null;

    const canPaste = clipboard?.type === data.type;

    const handleChange = (key: keyof PowerNodeData, value: string | number | boolean) => {
        updateNodeData(selectedNode.id, { [key]: value });
    };

    return (
        <Panel position="top-right" className="w-80 rounded-xl border border-zinc-800 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-right-4">
            <div className="mb-4 flex flex-col gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-zinc-100">Node Properties</h2>
                    <button
                        onClick={() => removeNode(selectedNode.id)}
                        className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-400 font-medium px-2 py-1 hover:bg-rose-500/10 rounded transition-colors"
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
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs text-zinc-300 hover:text-indigo-400 font-medium px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors border border-zinc-700"
                        >
                            <Copy size={14} />
                            <span>Copy Parameters</span>
                        </button>
                        <button
                            onClick={() => pasteNodeData(selectedNode.id)}
                            disabled={!canPaste}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded transition-colors border ${canPaste
                                ? 'text-zinc-300 hover:text-emerald-400 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 cursor-pointer'
                                : 'text-zinc-600 bg-zinc-900 border-zinc-800 cursor-not-allowed'
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
                    <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
                    <input
                        type="text"
                        value={data.label}
                        onChange={e => handleChange('label', e.target.value)}
                        className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none"
                    />
                </div>

                {data.type === 'powerSource' && (
                    <>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Output Voltage (V)</label>
                            <NodeInput
                                value={data.outVoltage}
                                onUpdate={v => handleChange('outVoltage', parseFloat(v))}
                                step="0.1"
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 text-left"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Max Current (A)</label>
                            <NodeInput
                                value={data.maxCurrent}
                                onUpdate={v => handleChange('maxCurrent', parseFloat(v))}
                                step="0.1"
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 text-left"
                            />
                        </div>
                    </>
                )}

                {data.type === 'converter' && (
                    <>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Output Voltage (V)</label>
                            <NodeInput
                                value={data.outVoltage}
                                onUpdate={v => handleChange('outVoltage', parseFloat(v))}
                                step="0.1"
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 text-left"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Efficiency (0.0 - 1.0)</label>
                            <NodeInput
                                value={data.efficiency}
                                onUpdate={v => handleChange('efficiency', parseFloat(v))}
                                step="0.05"
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 text-left"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Control Interface</label>
                            <input
                                type="text"
                                value={data.controlInterface}
                                onChange={e => handleChange('controlInterface', e.target.value)}
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
                                placeholder="e.g. EN, I2C"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox" id="showCtrl"
                                checked={data.showControlLogic || false}
                                onChange={e => handleChange('showControlLogic', e.target.checked)}
                                className="rounded border-zinc-700 bg-zinc-950 accent-indigo-500"
                            />
                            <label htmlFor="showCtrl" className="text-sm text-zinc-300">Show Control Logic on Node</label>
                        </div>
                        <div className="pt-3 pb-1 border-t border-zinc-800 mt-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Validation Limits</h3>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="mb-1 block text-[10px] text-zinc-400">Min Vin (V)</label>
                                    <NodeInput value={data.minInVoltage || 0} onUpdate={v => handleChange('minInVoltage', parseFloat(v) || 0)} step="0.1" className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 text-left" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] text-zinc-400">Max Vin (V)</label>
                                    <NodeInput value={data.maxInVoltage || 0} onUpdate={v => handleChange('maxInVoltage', parseFloat(v) || 0)} step="0.1" className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 text-left" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] text-zinc-400">Max Output Current (A)</label>
                                <NodeInput value={data.maxOutCurrent || 0} onUpdate={v => handleChange('maxOutCurrent', parseFloat(v) || 0)} step="0.1" className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 text-left" />
                            </div>
                        </div>
                    </>
                )}

                {data.type === 'load' && (
                    <>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Required Voltage (V)</label>
                            <NodeInput
                                value={data.reqVoltage}
                                onUpdate={v => handleChange('reqVoltage', parseFloat(v))}
                                step="0.1"
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 text-left"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Required Current (A)</label>
                            <NodeInput
                                value={data.reqCurrent}
                                onUpdate={v => handleChange('reqCurrent', parseFloat(v))}
                                step="0.1"
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 text-left"
                            />
                        </div>
                        <div className="pt-3 pb-1 border-t border-zinc-800 mt-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Input Limits (Overrides Need)</h3>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="mb-1 block text-[10px] text-zinc-400">Min Vin (V)</label>
                                    <NodeInput value={data.minInVoltage || 0} onUpdate={v => handleChange('minInVoltage', parseFloat(v) || 0)} step="0.1" className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 text-left" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] text-zinc-400">Max Vin (V)</label>
                                    <NodeInput value={data.maxInVoltage || 0} onUpdate={v => handleChange('maxInVoltage', parseFloat(v) || 0)} step="0.1" className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 text-left" />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {data.type === 'loadSwitch' && (
                    <>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">R_ON Resistance (mΩ)</label>
                            <NodeInput
                                value={data.rOn}
                                onUpdate={v => handleChange('rOn', parseFloat(v))}
                                step="1"
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 text-left"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Control Interface</label>
                            <input
                                type="text"
                                value={data.controlInterface}
                                onChange={e => handleChange('controlInterface', e.target.value)}
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
                                placeholder="e.g. EN, GPIO"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox" id="showCtrl"
                                checked={data.showControlLogic || false}
                                onChange={e => handleChange('showControlLogic', e.target.checked)}
                                className="rounded border-zinc-700 bg-zinc-950 accent-indigo-500"
                            />
                            <label htmlFor="showCtrl" className="text-sm text-zinc-300">Show Control Logic on Node</label>
                        </div>
                        <div className="pt-3 pb-1 border-t border-zinc-800 mt-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Validation Limits</h3>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="mb-1 block text-[10px] text-zinc-400">Min Vin (V)</label>
                                    <NodeInput value={data.minInVoltage || 0} onUpdate={v => handleChange('minInVoltage', parseFloat(v) || 0)} step="0.1" className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 text-left" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] text-[10px] text-zinc-400">Max Vin (V)</label>
                                    <NodeInput value={data.maxInVoltage || 0} onUpdate={v => handleChange('maxInVoltage', parseFloat(v) || 0)} step="0.1" className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 text-left" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] text-zinc-400">Max Output Current (A)</label>
                                <NodeInput value={data.maxCurrent || 0} onUpdate={v => handleChange('maxCurrent', parseFloat(v) || 0)} step="0.1" className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 text-left" />
                            </div>
                        </div>
                    </>
                )}

                {data.type === 'muxSwitch' && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-zinc-400">IN Ports</label>
                                <NodeInput
                                    value={data.inPorts || 1}
                                    onUpdate={v => handleChange('inPorts', parseInt(v, 10) || 1)}
                                    step="1"
                                    className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 text-left"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-zinc-400">OUT Ports</label>
                                <NodeInput
                                    value={data.outPorts || 1}
                                    onUpdate={v => handleChange('outPorts', parseInt(v, 10) || 1)}
                                    step="1"
                                    className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 text-left"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Control Interface</label>
                            <input
                                type="text"
                                value={data.controlInterface}
                                onChange={e => handleChange('controlInterface', e.target.value)}
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
                                placeholder="e.g. SEL, EN"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox" id="showCtrl"
                                checked={data.showControlLogic || false}
                                onChange={e => handleChange('showControlLogic', e.target.checked)}
                                className="rounded border-zinc-700 bg-zinc-950 accent-indigo-500"
                            />
                            <label htmlFor="showCtrl" className="text-sm text-zinc-300">Show Control Logic on Node</label>
                        </div>
                    </>
                )}
            </div>
        </Panel>
    );
}
