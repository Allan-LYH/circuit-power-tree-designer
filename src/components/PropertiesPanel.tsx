import { usePowerTreeStore } from '../stores/usePowerTreeStore';
import type { PowerNodeData } from '../stores/usePowerTreeStore';
import { Panel } from '@xyflow/react';

export default function PropertiesPanel() {
    const nodes = usePowerTreeStore(state => state.nodes);
    const updateNodeData = usePowerTreeStore(state => state.updateNodeData);
    const removeNode = usePowerTreeStore(state => state.removeNode);

    // Find selected node
    const selectedNode = nodes.find((n: any) => n.selected);
    const data = selectedNode?.data as PowerNodeData | undefined;

    if (!selectedNode || !data) return null;

    const handleChange = (key: keyof PowerNodeData, value: string | number | boolean) => {
        updateNodeData(selectedNode.id, { [key]: value });
    };

    return (
        <Panel position="top-right" className="w-80 rounded-xl border border-zinc-800 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-right-4">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-2">
                <h2 className="font-semibold text-zinc-100">Node Properties</h2>
                <button
                    onClick={() => removeNode(selectedNode.id)}
                    className="text-xs text-rose-500 hover:text-rose-400 font-medium px-2 py-1 hover:bg-rose-500/10 rounded"
                >
                    Delete
                </button>
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
                            <input
                                type="number" step="0.1"
                                value={data.outVoltage}
                                onChange={e => handleChange('outVoltage', parseFloat(e.target.value))}
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Max Current (A)</label>
                            <input
                                type="number" step="0.1"
                                value={data.maxCurrent}
                                onChange={e => handleChange('maxCurrent', parseFloat(e.target.value))}
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
                            />
                        </div>
                    </>
                )}

                {data.type === 'converter' && (
                    <>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Output Voltage (V)</label>
                            <input
                                type="number" step="0.1"
                                value={data.outVoltage}
                                onChange={e => handleChange('outVoltage', parseFloat(e.target.value))}
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Efficiency (0.0 - 1.0)</label>
                            <input
                                type="number" step="0.05" min="0" max="1"
                                value={data.efficiency}
                                onChange={e => handleChange('efficiency', parseFloat(e.target.value))}
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
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
                                    <input type="number" step="0.1" value={data.minInVoltage || ''} onChange={e => handleChange('minInVoltage', parseFloat(e.target.value) || 0)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200" placeholder="none" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] text-zinc-400">Max Vin (V)</label>
                                    <input type="number" step="0.1" value={data.maxInVoltage || ''} onChange={e => handleChange('maxInVoltage', parseFloat(e.target.value) || 0)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200" placeholder="none" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] text-zinc-400">Max Output Current (A)</label>
                                <input type="number" step="0.1" value={data.maxOutCurrent || ''} onChange={e => handleChange('maxOutCurrent', parseFloat(e.target.value) || 0)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200" placeholder="none" />
                            </div>
                        </div>
                    </>
                )}

                {data.type === 'load' && (
                    <>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Required Voltage (V)</label>
                            <input
                                type="number" step="0.1"
                                value={data.reqVoltage}
                                onChange={e => handleChange('reqVoltage', parseFloat(e.target.value))}
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">Required Current (A)</label>
                            <input
                                type="number" step="0.1"
                                value={data.reqCurrent}
                                onChange={e => handleChange('reqCurrent', parseFloat(e.target.value))}
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
                            />
                        </div>
                        <div className="pt-3 pb-1 border-t border-zinc-800 mt-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Input Limits (Overrides Need)</h3>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="mb-1 block text-[10px] text-zinc-400">Min Vin (V)</label>
                                    <input type="number" step="0.1" value={data.minInVoltage || ''} onChange={e => handleChange('minInVoltage', parseFloat(e.target.value) || 0)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200" placeholder="none" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] text-zinc-400">Max Vin (V)</label>
                                    <input type="number" step="0.1" value={data.maxInVoltage || ''} onChange={e => handleChange('maxInVoltage', parseFloat(e.target.value) || 0)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200" placeholder="none" />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {data.type === 'loadSwitch' && (
                    <>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">R_ON Resistance (mΩ)</label>
                            <input
                                type="number" step="1"
                                value={data.rOn}
                                onChange={e => handleChange('rOn', parseFloat(e.target.value))}
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
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
                                    <input type="number" step="0.1" value={data.minInVoltage || ''} onChange={e => handleChange('minInVoltage', parseFloat(e.target.value) || 0)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200" placeholder="none" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] text-zinc-400">Max Vin (V)</label>
                                    <input type="number" step="0.1" value={data.maxInVoltage || ''} onChange={e => handleChange('maxInVoltage', parseFloat(e.target.value) || 0)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200" placeholder="none" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] text-zinc-400">Max Output Current (A)</label>
                                <input type="number" step="0.1" value={data.maxCurrent || ''} onChange={e => handleChange('maxCurrent', parseFloat(e.target.value) || 0)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200" placeholder="none" />
                            </div>
                        </div>
                    </>
                )}

                {data.type === 'muxSwitch' && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-zinc-400">IN Ports</label>
                                <input
                                    type="number" step="1" min="1" max="8"
                                    value={data.inPorts || 1}
                                    onChange={e => handleChange('inPorts', parseInt(e.target.value, 10) || 1)}
                                    className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-zinc-400">OUT Ports</label>
                                <input
                                    type="number" step="1" min="1" max="8"
                                    value={data.outPorts || 1}
                                    onChange={e => handleChange('outPorts', parseInt(e.target.value, 10) || 1)}
                                    className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200"
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
