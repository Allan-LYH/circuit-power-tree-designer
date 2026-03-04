import { useEffect, useRef } from 'react';
import { ReactFlow, Background, Controls, Panel, ReactFlowProvider, BackgroundVariant, ConnectionLineType } from '@xyflow/react';
import { usePowerTreeStore } from './stores/usePowerTreeStore';
import type { NodeType } from './stores/usePowerTreeStore';
import PowerSourceNode from './components/nodes/PowerSourceNode';
import ConverterNode from './components/nodes/ConverterNode';
import LoadNode from './components/nodes/LoadNode';
import LoadSwitchNode from './components/nodes/LoadSwitchNode';
import MuxSwitchNode from './components/nodes/MuxSwitchNode';
import PropertiesPanel from './components/PropertiesPanel';
import { Spline, Square, Download, Upload } from 'lucide-react';
import CustomStepEdge from './components/CustomStepEdge';

const nodeTypes = {
  powerSource: PowerSourceNode,
  converter: ConverterNode,
  load: LoadNode,
  loadSwitch: LoadSwitchNode,
  muxSwitch: MuxSwitchNode,
};

const edgeTypes = {
  step: CustomStepEdge,
};

function FlowApp() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, calculateTree, viewMode, setViewMode, edgeStyle, setEdgeStyle, exportProject, importProject } = usePowerTreeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial calculation and layout
  useEffect(() => {
    calculateTree();
  }, [calculateTree]);

  const handleAddNode = (nodeType: NodeType) => {
    addNode(nodeType);
  };

  const handleExport = () => {
    const jsonString = exportProject();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `power-tree-project-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          importProject(content);
        }
      };
      reader.readAsText(file);
    }
    // Reset file input so the same file could be loaded again if needed
    if (event.target) event.target.value = '';
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 text-white">
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Power Tree Designer</h1>
          <p className="text-xs text-zinc-500">Hierarchical Grid Mode</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex bg-zinc-800 rounded-lg p-1 border border-zinc-700">
            <button
              onClick={() => setEdgeStyle('bezier')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${edgeStyle === 'bezier' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
              title="Curve (Bezier)"
            >
              <Spline size={14} />
              <span>Curve</span>
            </button>
            <button
              onClick={() => setEdgeStyle('step')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${edgeStyle === 'step' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
              title="Orthogonal (Step)"
            >
              <Square size={14} />
              <span>Orthogonal</span>
            </button>
          </div>
          <div className="h-4 w-[1px] bg-zinc-700 mx-1" />
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="full">Full View</option>
            <option value="power_only">Power Only</option>
          </select>
          <div className="h-4 w-[1px] bg-zinc-700 mx-1" />
          <div className="flex bg-zinc-800 rounded-lg p-1 border border-zinc-700">
            <button
              onClick={handleImportClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
              title="Open Project (JSON)"
            >
              <Upload size={14} />
              <span>Open</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-emerald-400 hover:bg-zinc-700 hover:text-emerald-300 transition-colors"
              title="Save Project (JSON)"
            >
              <Download size={14} />
              <span>Save</span>
            </button>
          </div>
          <div className="h-4 w-[1px] bg-zinc-700 mx-1" />
          <button className="rounded-md bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors">
            Export Report
          </button>
        </div>
      </header>
      <main className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          deleteKeyCode={['Backspace', 'Delete']}
          nodeTypes={nodeTypes as any}
          edgeTypes={edgeTypes as any}
          connectionLineType={edgeStyle === 'step' ? ConnectionLineType.Step : ConnectionLineType.Bezier}
          fitView
          colorMode="dark"
          nodesDraggable={false} // Enforce grid position
          nodesConnectable={true}
          elementsSelectable={true}
        >
          <Background color="#18181b" gap={20} variant={BackgroundVariant.Lines} />
          <Controls />

          <Panel position="top-left" className="flex gap-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-2 shadow-lg backdrop-blur flex gap-2">
              <button
                onClick={() => handleAddNode('powerSource')}
                className="rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-zinc-700 transition-colors border border-emerald-500/20"
              >
                + Source
              </button>
              <button
                onClick={() => handleAddNode('converter')}
                className="rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-zinc-700 transition-colors border border-sky-500/20"
              >
                + Converter
              </button>
              <button
                onClick={() => handleAddNode('loadSwitch')}
                className="rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-fuchsia-400 hover:bg-zinc-700 transition-colors border border-fuchsia-500/20"
              >
                + Load Switch
              </button>
              <button
                onClick={() => handleAddNode('muxSwitch')}
                className="rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-zinc-700 transition-colors border border-indigo-500/20"
              >
                + MUX Switch
              </button>
              <button
                onClick={() => handleAddNode('load')}
                className="rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-amber-500 hover:bg-zinc-700 transition-colors border border-amber-500/20"
              >
                + Load
              </button>
            </div>
          </Panel>

          <PropertiesPanel />
        </ReactFlow>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowApp />
    </ReactFlowProvider>
  );
}
