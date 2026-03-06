import { create } from 'zustand';
import {
    type Connection,
    type Edge,
    type EdgeChange,
    type NodeChange,
    addEdge,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

import type {
    NodeType,
    PowerNodeData,
    PowerNode,
    ViewMode,
    EdgeStyle,
    MuxSwitchData
} from '../types/node.types';
import { getLayoutMetrics } from '../core/layout.utils';
import { calculatePowerTree, applyAutoLayout } from '../core/engine';

interface PowerTreeState {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    edgeStyle: EdgeStyle;
    setEdgeStyle: (style: EdgeStyle) => void;
    autoLayout: boolean;
    setAutoLayout: (enabled: boolean) => void;
    showControlFlow: boolean;
    setShowControlFlow: (enabled: boolean) => void;
    nodes: PowerNode[];
    edges: Edge[];
    onNodesChange: OnNodesChange<PowerNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (type: NodeType) => void;
    removeNode: (id: string) => void;
    updateNodeData: (id: string, data: Partial<PowerNodeData>) => void;
    moveNodeVertical: (id: string, direction: 'up' | 'down') => void;
    removeEdge: (id: string) => void;
    calculateTree: () => void;
    applyLayout: () => void;
    exportProject: () => string;
    importProject: (jsonString: string) => void;
    clipboard: Partial<PowerNodeData> | null;
    copyNodeData: (id: string) => void;
    pasteNodeData: (id: string) => void;
    undoStack: string[];
    redoStack: string[];
    undo: () => void;
    redo: () => void;
    resetCanvas: () => void;
    takeSnapshot: () => void;
    getReportData: () => any[];
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
}

export const usePowerTreeStore = create<PowerTreeState>((set, get) => ({
    viewMode: 'full',
    setViewMode: (mode: ViewMode) => {
        set({ viewMode: mode });
        get().applyLayout();
    },
    edgeStyle: 'step',
    setEdgeStyle: (style: EdgeStyle) => {
        set({ edgeStyle: style });
        const updatedEdges = get().edges.map(edge => ({
            ...edge,
            type: style === 'step' ? 'step' : 'default'
        }));
        set({ edges: updatedEdges });
    },
    theme: 'light',
    setTheme: (theme: 'light' | 'dark') => set({ theme }),
    autoLayout: true,
    setAutoLayout: (enabled: boolean) => {
        set({ autoLayout: enabled });
        if (enabled) {
            get().applyLayout();
        }
    },
    showControlFlow: false,
    setShowControlFlow: (enabled: boolean) => set({ showControlFlow: enabled }),

    nodes: [
        {
            id: 's1',
            type: 'powerSource',
            position: { x: 0, y: 0 },
            data: { label: 'DC Input', type: 'powerSource', outVoltage: 12, maxCurrent: 10, level: 0, verticalIndex: 0 },
        }
    ],
    edges: [],

    undoStack: [],
    redoStack: [],

    takeSnapshot: () => {
        const { nodes, edges } = get();
        const snapshot = JSON.stringify({ nodes, edges });
        set((state) => ({
            undoStack: [...state.undoStack, snapshot].slice(-50),
            redoStack: []
        }));
    },

    undo: () => {
        const { undoStack, nodes, edges } = get();
        if (undoStack.length === 0) return;
        const currentSnapshot = JSON.stringify({ nodes, edges });
        const lastSnapshot = JSON.parse(undoStack[undoStack.length - 1]);
        set((state) => ({
            nodes: lastSnapshot.nodes,
            edges: lastSnapshot.edges,
            undoStack: state.undoStack.slice(0, -1),
            redoStack: [currentSnapshot, ...state.redoStack]
        }));
        get().calculateTree();
    },

    redo: () => {
        const { redoStack, nodes, edges } = get();
        if (redoStack.length === 0) return;
        const currentSnapshot = JSON.stringify({ nodes, edges });
        const nextSnapshot = JSON.parse(redoStack[0]);
        set((state) => ({
            nodes: nextSnapshot.nodes,
            edges: nextSnapshot.edges,
            undoStack: [...state.undoStack, currentSnapshot],
            redoStack: state.redoStack.slice(1)
        }));
        get().calculateTree();
    },

    resetCanvas: () => {
        get().takeSnapshot();
        set({
            nodes: [
                {
                    id: 's1',
                    type: 'powerSource',
                    position: { x: 0, y: 0 },
                    data: { label: 'DC Input', type: 'powerSource', outVoltage: 12, maxCurrent: 10, level: 0, verticalIndex: 0 },
                }
            ],
            edges: [],
            undoStack: [],
            redoStack: []
        });
        get().calculateTree();
    },

    getReportData: () => {
        const { nodes } = get();
        return nodes.map(node => {
            const d = node.data;
            return {
                Label: d.label,
                Type: d.type,
                InputVoltage: d.type === 'powerSource' ? '-' : (d.calcVoltage?.toFixed(2) || 'N/A'),
                OutputVoltage: (d as any).outVoltage !== undefined ? (d as any).outVoltage : (d.calcVoltage?.toFixed(2) || '-'),
                InputCurrent: d.calcInCurrent?.toFixed(3) || '0.000',
                OutputCurrent: d.calcCurrent?.toFixed(3) || '0.000',
                PowerLoss: d.calcPower?.toFixed(3) || '0.000',
                Status: d.error ? `Error: ${d.error}` : 'OK'
            };
        });
    },

    exportProject: () => {
        const { nodes, edges, viewMode, edgeStyle } = get();
        return JSON.stringify({ nodes, edges, viewMode, edgeStyle, version: '1.0' }, null, 2);
    },

    importProject: (jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            if (!data.nodes || !data.edges) throw new Error("Invalid project file");
            set({
                nodes: data.nodes,
                edges: data.edges,
                viewMode: data.viewMode || 'full',
                edgeStyle: data.edgeStyle || 'step',
            });
            get().calculateTree();
        } catch (error) {
            console.error("Failed to import project:", error);
            alert("Failed to import project.");
        }
    },

    clipboard: null,
    copyNodeData: (id: string) => {
        const node = get().nodes.find(n => n.id === id);
        if (node) {
            const dataToCopy = JSON.parse(JSON.stringify(node.data));
            delete dataToCopy.level;
            delete dataToCopy.verticalIndex;
            delete dataToCopy.calcVoltage;
            delete dataToCopy.calcCurrent;
            delete dataToCopy.calcPower;
            delete dataToCopy.error;
            set({ clipboard: dataToCopy });
        }
    },
    pasteNodeData: (id: string) => {
        const clipboard = get().clipboard;
        if (!clipboard) return;
        const node = get().nodes.find(n => n.id === id);
        if (node && node.data.type === clipboard.type) {
            get().updateNodeData(id, clipboard);
        }
    },

    onNodesChange: (changes: NodeChange<PowerNode>[]) => {
        const cleanedChanges = changes.filter(c => c.type !== 'position');
        if (cleanedChanges.some(c => c.type === 'remove')) get().takeSnapshot();
        set({ nodes: applyNodeChanges(cleanedChanges, get().nodes) });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        if (changes.some(c => c.type === 'remove')) get().takeSnapshot();
        set({ edges: applyEdgeChanges(changes, get().edges) });
        get().calculateTree();
    },

    onConnect: (connection: Connection) => {
        get().takeSnapshot();
        const edgeStyle = get().edgeStyle;
        const newEdge = { ...connection, type: edgeStyle === 'step' ? 'step' : 'default' };
        set({ edges: addEdge(newEdge, get().edges) });
        get().calculateTree();
    },

    addNode: (type: NodeType) => {
        get().takeSnapshot();
        const id = uuidv4();
        const newNode: PowerNode = {
            id,
            type,
            position: { x: 0, y: 0 },
            data: {
                label: `New ${type}`,
                type,
                level: 0,
                verticalIndex: 0,
                ...(type === 'powerSource' ? { outVoltage: 12, maxCurrent: 2 } : {}),
                ...(type === 'converter' ? { outVoltage: 5, efficiency: 0.9, controlInterface: '', maxOutCurrent: 3 } : {}),
                ...(type === 'load' ? { reqVoltage: 5, reqCurrent: 1 } : {}),
                ...(type === 'loadSwitch' ? { rOn: 50, maxCurrent: 2, controlInterface: '' } : {}),
                ...(type === 'muxSwitch' ? { inPorts: 2, outPorts: 1, controlInterface: 'SEL', disabledPorts: [] } : {}),
            } as PowerNodeData,
        };
        set({ nodes: [...get().nodes, newNode] });
        get().calculateTree();
    },

    removeNode: (id: string) => {
        get().takeSnapshot();
        set({
            nodes: get().nodes.filter(n => n.id !== id),
            edges: get().edges.filter(e => e.source !== id && e.target !== id),
        });
        get().calculateTree();
    },

    updateNodeData: (id: string, data: Partial<PowerNodeData>) => {
        get().takeSnapshot();
        const nodes = get().nodes;
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        let edgesToRemove: string[] = [];
        if (node.type === 'muxSwitch' && (data.inPorts !== undefined || data.outPorts !== undefined)) {
            const oldData = node.data as MuxSwitchData;
            const newInPorts = data.inPorts !== undefined ? (data.inPorts as number) : oldData.inPorts;
            const newOutPorts = data.outPorts !== undefined ? (data.outPorts as number) : oldData.outPorts;

            if (newInPorts < oldData.inPorts) {
                get().edges.forEach(edge => {
                    if (edge.target === id && edge.targetHandle?.startsWith('in-')) {
                        const index = parseInt(edge.targetHandle.split('-')[1]);
                        if (index >= newInPorts) edgesToRemove.push(edge.id);
                    }
                });
            }
            if (newOutPorts < oldData.outPorts) {
                get().edges.forEach(edge => {
                    if (edge.source === id && edge.sourceHandle?.startsWith('out-')) {
                        const index = parseInt(edge.sourceHandle.split('-')[1]);
                        if (index >= newOutPorts) edgesToRemove.push(edge.id);
                    }
                });
            }
        }

        if (edgesToRemove.length > 0) {
            set({ edges: get().edges.filter(edge => !edgesToRemove.includes(edge.id)) });
        }

        set({
            nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } as PowerNodeData } : n)),
        });
        get().calculateTree();
    },

    removeEdge: (id: string) => {
        get().takeSnapshot();
        set({ edges: get().edges.filter(e => e.id !== id) });
        get().calculateTree();
    },

    moveNodeVertical: (id: string, direction: 'up' | 'down') => {
        const { nodes, edges, autoLayout, viewMode } = get();
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        if (!autoLayout) {
            const { rowHeight } = getLayoutMetrics(viewMode);
            const deltaY = direction === 'up' ? -rowHeight : rowHeight;
            const targetY = node.position.y + deltaY;
            const targetX = node.position.x;

            const occupyingNode = nodes.find(n =>
                n.id !== id &&
                Math.abs(n.position.x - targetX) < 5 &&
                Math.abs(n.position.y - targetY) < 5
            );

            const newNodes = nodes.map(n => {
                if (n.id === node.id) return { ...n, position: { ...n.position, y: targetY } };
                if (occupyingNode && n.id === occupyingNode.id) return { ...n, position: { ...n.position, y: node.position.y } };
                return n;
            });
            set({ nodes: newNodes });
            get().calculateTree();
            return;
        }

        const incomingEdges = edges.filter(e => e.target === id && !(e.data as any)?.isCyclic);
        const parentIds = incomingEdges.map(e => e.source);
        let siblings = parentIds.length === 0 
            ? nodes.filter(n => !edges.some(e => e.target === n.id && !(e.data as any)?.isCyclic))
            : nodes.filter(n => edges.filter(e => e.target === n.id && !(e.data as any)?.isCyclic).some(e => parentIds.includes(e.source)));

        const sortedSiblings = siblings.sort((a, b) => (a.data.verticalIndex || 0) - (b.data.verticalIndex || 0));
        const currentIndex = sortedSiblings.findIndex(n => n.id === id);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex >= 0 && targetIndex < sortedSiblings.length) {
            get().takeSnapshot();
            const otherNode = sortedSiblings[targetIndex];
            const newNodes = nodes.map(n => {
                if (n.id === node.id) return { ...n, data: { ...n.data, verticalIndex: otherNode.data.verticalIndex } };
                if (n.id === otherNode.id) return { ...n, data: { ...n.data, verticalIndex: node.data.verticalIndex } };
                return n;
            });
            set({ nodes: newNodes });
            get().calculateTree();
        }
    },

    calculateTree: () => {
        const { nodes, edges, autoLayout, viewMode } = get();
        const { updatedNodes, updatedEdges } = calculatePowerTree(nodes, edges);
        let finalNodes = updatedNodes;
        if (autoLayout) finalNodes = applyAutoLayout(updatedNodes, viewMode);
        set({ nodes: finalNodes, edges: updatedEdges });
    },

    applyLayout: () => {
        const { nodes, viewMode, autoLayout } = get();
        if (!autoLayout) return;
        set({ nodes: applyAutoLayout(nodes, viewMode) });
    }
}));
