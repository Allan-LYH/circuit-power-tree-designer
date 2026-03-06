import { useEffect, useRef } from 'react';
import { 
  ReactFlow, Controls, Panel, ReactFlowProvider, 
  ConnectionLineType, getNodesBounds, getViewportForBounds,
  useReactFlow
} from '@xyflow/react';
import { usePowerTreeStore } from './stores/usePowerTreeStore';
import { useShallow } from 'zustand/react/shallow';
import type { NodeType } from './types/node.types';
import PowerSourceNode from './components/nodes/PowerSourceNode';
import ConverterNode from './components/nodes/ConverterNode';
import LoadNode from './components/nodes/LoadNode';
import LoadSwitchNode from './components/nodes/LoadSwitchNode';
import MuxSwitchNode from './components/nodes/MuxSwitchNode';
import PropertiesPanel from './components/PropertiesPanel';
import { 
  Spline, CornerDownRight, Download, Upload, Undo2, Redo2, FilePlus2, 
  Image as ImageIcon, FileText, Table, Sun, Moon 
} from 'lucide-react';
import CustomStepEdge from './components/CustomStepEdge';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
    const { 
        nodes, edges, onNodesChange, onEdgesChange, onConnect, 
        addNode, 
        undo, redo, undoStack, redoStack, resetCanvas,
        autoLayout, setAutoLayout,
        viewMode, setViewMode,
        edgeStyle, setEdgeStyle,
        calculateTree, getReportData,
        exportProject, importProject,
        theme, setTheme,
        showControlFlow, setShowControlFlow
    } = usePowerTreeStore(useShallow((state) => ({
        nodes: state.nodes,
        edges: state.edges,
        onNodesChange: state.onNodesChange,
        onEdgesChange: state.onEdgesChange,
        onConnect: state.onConnect,
        addNode: state.addNode,
        undo: state.undo,
        redo: state.redo,
        undoStack: state.undoStack,
        redoStack: state.redoStack,
        resetCanvas: state.resetCanvas,
        autoLayout: state.autoLayout,
        setAutoLayout: state.setAutoLayout,
        viewMode: state.viewMode,
        setViewMode: state.setViewMode,
        edgeStyle: state.edgeStyle,
        setEdgeStyle: state.setEdgeStyle,
        calculateTree: state.calculateTree,
        getReportData: state.getReportData,
        exportProject: state.exportProject,
        importProject: state.importProject,
        theme: state.theme,
        setTheme: state.setTheme,
        showControlFlow: state.showControlFlow,
        setShowControlFlow: state.setShowControlFlow
    })));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fitView } = useReactFlow();

  // Initial calculation and layout
  useEffect(() => {
    calculateTree();
  }, [calculateTree]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleAddNode = (nodeType: NodeType) => {
    addNode(nodeType);
  };

    const handleNewCanvas = () => {
      if (confirm('Are you sure you want to create a new canvas? Current work will be lost.')) {
        resetCanvas();
      }
    };

    const handleExportPNG = () => {
        if (nodes.length === 0) return;
        
        const nodesBounds = getNodesBounds(nodes);
        const margin = 30;
        const width = nodesBounds.width + margin * 2;
        const height = nodesBounds.height + margin * 2;
        
        const viewport = getViewportForBounds(
            nodesBounds,
            width,
            height,
            1, // Strict 1:1 scale
            1, // Strict 1:1 scale
            0
        );

        const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
        const rfContainer = document.querySelector('.react-flow') as HTMLElement;
        if (!viewportElement || !rfContainer) return;

        // Fix missing SVG markers (arrowheads) by cloning all defs from the container into viewport SVGs
        const allDefs = rfContainer.querySelectorAll('defs');
        const clonedDefs: Node[] = [];
        
        if (allDefs.length > 0) {
            viewportElement.querySelectorAll('svg').forEach(svg => {
                allDefs.forEach(originalDef => {
                    const clone = originalDef.cloneNode(true);
                    svg.prepend(clone);
                    clonedDefs.push(clone);
                });
            });
        }
        
        toPng(viewportElement, {
            backgroundColor: theme === 'light' ? '#ffffff' : '#09090b',
            width: width,
            height: height,
            pixelRatio: 2,
            style: {
                width: `${width}px`,
                height: `${height}px`,
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            },
        }).then((dataUrl) => {
            // Clean up cloned defs
            clonedDefs.forEach(d => {
                if (d.parentElement) d.parentElement.removeChild(d);
            });
            
            const link = document.createElement('a');
            link.download = `power-tree-${new Date().toISOString().slice(0,10)}.png`;
            link.href = dataUrl;
            link.click();
        });
    };

    const handleExportPDF = () => {
        const data = getReportData();
        const doc = new jsPDF() as any;
        
        doc.setFontSize(18);
        doc.text('Power Tree Design Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        
        doc.autoTable({
            startY: 40,
            head: [['Label', 'Type', 'Vin (V)', 'Vout (V)', 'Iout (A)', 'Power (W)', 'Status']],
            body: data.map(d => [
                d.Label, 
                d.Type, 
                d.InputVoltage, 
                d.OutputVoltage, 
                d.Current, 
                d.Power, 
                d.Status
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
        });
        
        doc.save(`power-tree-report-${new Date().toISOString().slice(0,10)}.pdf`);
    };

    const handleExportExcel = () => {
        const data = getReportData();
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Power Tree Data');
        XLSX.writeFile(workbook, `power-tree-data-${new Date().toISOString().slice(0,10)}.xlsx`);
    };

  /**
   * Serializes the current project state into a JSON Blob and triggers a browser download.
   */
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

  /**
   * Programs a click on the hidden text input to open the file selection dialog.
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Reads the selected JSON file and attempts to parse and import it into the Zustand store.
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          importProject(content);
          // Auto-fit view after import
          setTimeout(() => {
            fitView({ duration: 800, padding: 0.2 });
          }, 100);
        }
      };
      reader.readAsText(file);
    }
    // Reset file input so the same file could be loaded again if needed
    if (event.target) event.target.value = '';
  };

    return (
    <div className={`flex h-screen w-screen flex-col transform-gpu transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
      <header className={`flex items-center justify-between border-b px-5 py-3 transition-colors ${theme === 'dark' ? 'border-zinc-800 bg-[#121214]' : 'border-zinc-200 bg-white'}`}>
        {/* Left: Brand & Document Control */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              ⚡
            </div>
            <div className="flex flex-col">
              <h1 className={`text-sm font-semibold tracking-tight leading-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>Power Tree</h1>
              <span className={`text-[10px] font-bold tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>DESIGNER</span>
            </div>
          </div>

          <div className={`h-6 w-[1px] border-l ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`} />

          {/* File Operations */}
          <div className={`flex items-center rounded-md p-0.5 border ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-zinc-100/50 border-zinc-200'}`}>
            <button
              onClick={handleNewCanvas}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transform-gpu text-[13px] font-medium transition-all ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100' : 'text-zinc-600 hover:bg-white hover:text-zinc-900 shadow-sm'}`}
              title="New Canvas (Reset)"
            >
              <FilePlus2 size={15} />
              <span>New</span>
            </button>
            <div className={`w-[1px] h-4 mx-1 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            <button
              onClick={handleImportClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transform-gpu text-[13px] font-medium transition-all ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100' : 'text-zinc-600 hover:bg-white hover:text-zinc-900 shadow-sm'}`}
              title="Open Project (JSON)"
            >
              <Upload size={15} />
              <span>Open</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <div className={`w-[1px] h-4 mx-1 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            <button
              onClick={handleExport}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transform-gpu text-[13px] font-medium transition-all ${theme === 'dark' ? 'text-emerald-500 hover:bg-zinc-800 hover:text-emerald-400' : 'text-emerald-600 hover:bg-white hover:text-emerald-700 shadow-sm'}`}
              title="Save Project (JSON)"
            >
              <Download size={15} />
              <span>Save</span>
            </button>
          </div>

          {/* History Operations */}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className={`flex items-center justify-center h-8 w-8 rounded-md transition-colors ${undoStack.length > 0 ? (theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900') : (theme === 'dark' ? 'text-zinc-700' : 'text-zinc-300')} cursor-pointer disabled:cursor-not-allowed`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className={`flex items-center justify-center h-8 w-8 rounded-md transition-colors ${redoStack.length > 0 ? (theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900') : (theme === 'dark' ? 'text-zinc-700' : 'text-zinc-300')} cursor-pointer disabled:cursor-not-allowed`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>
          </div>
        </div>

        {/* Right: View Settings & Export */}
        <div className="flex gap-3 items-center">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`flex items-center justify-center p-2 rounded-md border transition-all ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-100' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className={`h-6 w-[1px] mx-1 ${theme === 'dark' ? 'border-l border-zinc-800' : 'border-l border-zinc-200'}`} />

          {/* View Mode */}
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className={`h-8 rounded-md border px-3 py-1 text-[13px] font-medium focus:outline-none transition-colors cursor-pointer ${theme === 'dark' ? 'border-zinc-800/80 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/80 focus:border-indigo-500/50' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 focus:border-indigo-500'}`}
          >
            <option value="full">Full View</option>
            <option value="compact">Compact View</option>
            <option value="readonly">Read-only View</option>
          </select>

          {/* Edge Style */}
          <div className={`flex items-center rounded-md p-0.5 border ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200'}`}>
            <button
              onClick={() => setEdgeStyle('bezier')}
              className={`flex items-center justify-center p-1.5 w-8 rounded transition-all ${edgeStyle === 'bezier' ? (theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm') : (theme === 'dark' ? 'text-zinc-50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-700')}`}
              title="Curve Edge"
            >
              <Spline size={16} />
            </button>
            <button
              onClick={() => setEdgeStyle('step')}
              className={`flex items-center justify-center p-1.5 w-8 rounded transition-all ${edgeStyle === 'step' ? (theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm') : (theme === 'dark' ? 'text-zinc-50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-700')}`}
              title="Orthogonal Edge"
            >
              <CornerDownRight size={14} />
            </button>
          </div>

          {/* Auto Layout Toggle */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors cursor-pointer group ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700' : 'bg-zinc-100 border-zinc-200 hover:border-zinc-300'}`}
            onClick={() => setAutoLayout(!autoLayout)}
          >
            <span className={`text-[13px] font-medium select-none transition-colors ${theme === 'dark' ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-zinc-600 group-hover:text-zinc-900'}`}>Auto Layout</span>
            <button
              className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${autoLayout ? 'bg-indigo-500' : (theme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300')}`}
              title="Toggle Auto-Layout Grid"
            >
              <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${autoLayout ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
            </button>
          </div>

          {/* Control Flow Toggle */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors cursor-pointer group ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700' : 'bg-zinc-100 border-zinc-200 hover:border-zinc-300'}`}
            onClick={() => setShowControlFlow(!showControlFlow)}
          >
            <span className={`text-[13px] font-medium select-none transition-colors ${theme === 'dark' ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-zinc-600 group-hover:text-zinc-900'}`}>Control Flow</span>
            <button
              className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${showControlFlow ? 'bg-indigo-500' : (theme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300')}`}
              title="Toggle Control Logic Visualization"
            >
              <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${showControlFlow ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
            </button>
          </div>

          <div className={`h-6 w-[1px] mx-1 ${theme === 'dark' ? 'border-l border-zinc-800' : 'border-l border-zinc-200'}`} />

          {/* Export Options */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportPNG}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transform-gpu text-[13px] font-medium transition-all ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
              title="Export as PNG Image"
            >
              <ImageIcon size={15} />
              <span>PNG</span>
            </button>
            <button
              onClick={handleExportPDF}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transform-gpu text-[13px] font-medium transition-all ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
              title="Export PDF Report"
            >
              <FileText size={15} />
              <span>PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transform-gpu text-[13px] font-medium transition-all ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
              title="Export Excel Data"
            >
              <Table size={15} />
              <span>Excel</span>
            </button>
          </div>
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
          connectionLineStyle={{ stroke: theme === 'dark' ? '#4f46e5' : '#a1a1aa', strokeWidth: 2 }}
          defaultEdgeOptions={{ 
            style: { stroke: theme === 'dark' ? '#4f46e5' : '#a1a1aa', strokeWidth: 2 },
            type: edgeStyle === 'step' ? 'step' : 'bezier'
          }}
          fitView
          colorMode={theme === 'dark' ? 'dark' : 'light'}
          nodesDraggable={false} // Enforce grid position unconditionally according to user request
          nodesConnectable={true}
          elementsSelectable={true}
          style={{ backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff' }}
        >
          <Controls />

          <Panel position="top-left" className="!top-1/2 !-translate-y-1/2 flex gap-2 ml-2">
            <div className={`rounded-lg border p-2 shadow-lg backdrop-blur flex flex-col gap-2 transition-colors ${
              theme === 'dark' ? 'border-zinc-800 bg-zinc-900/90' : 'border-zinc-200 bg-white/90'
            }`}>
              <button
                onClick={() => handleAddNode('powerSource')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors border ${
                  theme === 'dark' 
                    ? 'bg-zinc-800 text-emerald-400 hover:bg-zinc-700 border-emerald-500/20' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                }`}
              >
                + Source
              </button>
              <button
                onClick={() => handleAddNode('converter')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors border ${
                  theme === 'dark' 
                    ? 'bg-zinc-800 text-sky-400 hover:bg-zinc-700 border-sky-500/20' 
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200'
                }`}
              >
                + Converter
              </button>
              <button
                onClick={() => handleAddNode('loadSwitch')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors border ${
                  theme === 'dark' 
                    ? 'bg-zinc-800 text-fuchsia-400 hover:bg-zinc-700 border-fuchsia-500/20' 
                    : 'bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 border-fuchsia-200'
                }`}
              >
                + Load Switch
              </button>
              <button
                onClick={() => handleAddNode('muxSwitch')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors border ${
                  theme === 'dark' 
                    ? 'bg-zinc-800 text-indigo-400 hover:bg-zinc-700 border-indigo-500/20' 
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
                }`}
              >
                + MUX Switch
              </button>
              <button
                onClick={() => handleAddNode('load')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors border ${
                  theme === 'dark' 
                    ? 'bg-zinc-800 text-amber-500 hover:bg-zinc-700 border-amber-500/20' 
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                }`}
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
