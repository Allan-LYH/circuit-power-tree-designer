import { create } from 'zustand';
import {
    type Connection,
    type Edge,
    type EdgeChange,
    type Node as RFNode,
    type NodeChange,
    addEdge,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

export type NodeType = 'powerSource' | 'converter' | 'load' | 'loadSwitch' | 'muxSwitch';

export interface BaseNodeData extends Record<string, unknown> {
    label: string;
    type: NodeType;
    calcVoltage?: number;
    calcCurrent?: number;
    calcPower?: number;
    error?: string;
    showControlLogic?: boolean;
    level: number;
    verticalIndex: number;
}

export interface PowerSourceData extends BaseNodeData {
    type: 'powerSource';
    outVoltage: number;
    maxCurrent: number;
}

export interface ConverterData extends BaseNodeData {
    type: 'converter';
    outVoltage: number;
    efficiency: number;
    controlInterface: string;
    minInVoltage?: number;
    maxInVoltage?: number;
    maxOutCurrent?: number;
}

export interface LoadData extends BaseNodeData {
    type: 'load';
    reqVoltage: number;
    reqCurrent: number;
    minInVoltage?: number;
    maxInVoltage?: number;
}

export interface LoadSwitchData extends BaseNodeData {
    type: 'loadSwitch';
    rOn: number; // in mOhms
    maxCurrent: number;
    controlInterface: string;
    minInVoltage?: number;
    maxInVoltage?: number;
}

export interface MuxSwitchData extends BaseNodeData {
    type: 'muxSwitch';
    inPorts: number;
    outPorts: number;
    controlInterface: string;
}

export type PowerNodeData = PowerSourceData | ConverterData | LoadData | LoadSwitchData | MuxSwitchData;
export type PowerNode = RFNode<PowerNodeData>;

export type ViewMode = 'full' | 'power_only';
export type EdgeStyle = 'bezier' | 'step';

interface PowerTreeState {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    edgeStyle: EdgeStyle;
    setEdgeStyle: (style: EdgeStyle) => void;
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
}

const COLUMN_WIDTH = 360;
const ROW_HEIGHT = 220;

export const usePowerTreeStore = create<PowerTreeState>((set, get) => ({
    viewMode: 'full',
    setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
    edgeStyle: 'bezier',
    setEdgeStyle: (style: EdgeStyle) => {
        set({ edgeStyle: style });
        // Update all existing edges
        const updatedEdges = get().edges.map(edge => ({
            ...edge,
            type: style === 'step' ? 'step' : 'default'
        }));
        set({ edges: updatedEdges });
    },

    exportProject: () => {
        const state = get();
        const projectData = {
            nodes: state.nodes,
            edges: state.edges,
            viewMode: state.viewMode,
            edgeStyle: state.edgeStyle,
            version: '1.0' // For future compatibility
        };
        return JSON.stringify(projectData, null, 2);
    },

    importProject: (jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            if (!data.nodes || !data.edges) {
                throw new Error("Invalid project file: missing nodes or edges.");
            }

            // Apply loaded data
            set({
                nodes: data.nodes,
                edges: data.edges,
                viewMode: data.viewMode || 'full',
                edgeStyle: data.edgeStyle || 'bezier',
            });

            // Recalculate tree safely after import
            get().calculateTree();
        } catch (error) {
            console.error("Failed to import project:", error);
            alert("Failed to import project. The file might be corrupted or invalid.");
        }
    },

    nodes: [
        {
            id: 's1',
            type: 'powerSource',
            position: { x: 0, y: 0 },
            data: { label: 'DC Input', type: 'powerSource', outVoltage: 12, maxCurrent: 10, level: 0, verticalIndex: 0 },
        }
    ],
    edges: [],

    onNodesChange: (changes: NodeChange<PowerNode>[]) => {
        // Prevent manual dragging from updating position permanently if we want strict grid
        const cleanedChanges = changes.filter(c => c.type !== 'position');
        set({
            nodes: applyNodeChanges(cleanedChanges, get().nodes),
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
        get().calculateTree();
    },

    onConnect: (connection: Connection) => {
        const edgeStyle = get().edgeStyle;
        const newEdge = {
            ...connection,
            type: edgeStyle === 'step' ? 'step' : 'default',
        };
        set({
            edges: addEdge(newEdge, get().edges),
        });
        get().calculateTree();
    },

    addNode: (type: NodeType) => {
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
                ...(type === 'converter' ? { outVoltage: 5, efficiency: 0.9, controlInterface: '' } : {}),
                ...(type === 'load' ? { reqVoltage: 5, reqCurrent: 1 } : {}),
                ...(type === 'loadSwitch' ? { rOn: 50, maxCurrent: 2, controlInterface: '' } : {}),
                ...(type === 'muxSwitch' ? { inPorts: 2, outPorts: 1, controlInterface: 'SEL' } : {}),
            } as PowerNodeData,
        };
        set({ nodes: [...get().nodes, newNode] });
        get().calculateTree();
    },

    removeNode: (id: string) => {
        set({
            nodes: get().nodes.filter(n => n.id !== id),
            edges: get().edges.filter(e => e.source !== id && e.target !== id),
        });
        get().calculateTree();
    },

    updateNodeData: (id: string, data: Partial<PowerNodeData>) => {
        const nodes = get().nodes;
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        // Special handling for MuxSwitch port reduction
        let edgesToRemove: string[] = [];
        if (node.type === 'muxSwitch' && (data.inPorts !== undefined || data.outPorts !== undefined)) {
            const oldData = node.data as MuxSwitchData;
            const newInPorts = data.inPorts !== undefined ? (data.inPorts as number) : oldData.inPorts;
            const newOutPorts = data.outPorts !== undefined ? (data.outPorts as number) : oldData.outPorts;

            // Remove input edges if inPorts decreased
            if (newInPorts < oldData.inPorts) {
                get().edges.forEach(edge => {
                    if (edge.target === id && edge.targetHandle?.startsWith('in-')) {
                        const index = parseInt(edge.targetHandle.split('-')[1]);
                        if (index >= newInPorts) edgesToRemove.push(edge.id);
                    }
                });
            }

            // Remove output edges if outPorts decreased
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
            set({
                edges: get().edges.filter(edge => !edgesToRemove.includes(edge.id))
            });
        }

        set({
            nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } as PowerNodeData } : n)),
        });
        get().calculateTree();
    },

    removeEdge: (id: string) => {
        set({
            edges: get().edges.filter(e => e.id !== id)
        });
        get().calculateTree();
    },

    moveNodeVertical: (id: string, direction: 'up' | 'down') => {
        const { nodes } = get();
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        const levelNodes = nodes.filter(n => n.data.level === node.data.level)
            .sort((a, b) => a.data.verticalIndex - b.data.verticalIndex);

        const currentIndex = levelNodes.findIndex(n => n.id === id);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex >= 0 && targetIndex < levelNodes.length) {
            const otherNode = levelNodes[targetIndex];

            // Swap vertical indices with proper immutability
            const newNodes = nodes.map(n => {
                if (n.id === node.id) return { ...n, data: { ...n.data, verticalIndex: otherNode.data.verticalIndex } };
                if (n.id === otherNode.id) return { ...n, data: { ...n.data, verticalIndex: node.data.verticalIndex } };
                return n;
            });

            set({ nodes: newNodes });
            // Crucial: Call calculateTree (not just applyLayout) so downstream nodes follow the new sort order!
            get().calculateTree();
        }
    },

    calculateTree: () => {
        const { nodes, edges } = get();

        // 1. Build Adjacency
        const adj = new Map<string, string[]>();
        const revAdj = new Map<string, string[]>();
        nodes.forEach(n => { adj.set(n.id, []); revAdj.set(n.id, []); });
        edges.forEach(e => {
            if (adj.has(e.source)) adj.get(e.source)!.push(e.target);
            if (revAdj.has(e.target)) revAdj.get(e.target)!.push(e.source);
        });

        const newNodes = nodes.map(n => ({
            ...n,
            data: { ...n.data, error: undefined as any, calcVoltage: undefined as any, calcCurrent: 0, calcPower: 0, level: 0 } as PowerNodeData
        }));
        const nodeMap = new Map(newNodes.map(n => [n.id, n]));

        // 2. Assign Levels (Topological Depth)
        const roots = newNodes.filter(n => (revAdj.get(n.id) || []).length === 0);
        const queue: { id: string, level: number }[] = roots.map(r => ({ id: r.id, level: 0 }));

        while (queue.length > 0) {
            const { id, level } = queue.shift()!;
            const node = nodeMap.get(id)!;
            node.data.level = Math.max(node.data.level, level);

            (adj.get(id) || []).forEach(childId => {
                queue.push({ id: childId, level: node.data.level + 1 });
            });
        }

        // All loads should be placed in a dedicated column on the far right
        let maxNonLoadLevel = 0;
        newNodes.forEach(n => {
            if (n.data.type !== 'load') {
                maxNonLoadLevel = Math.max(maxNonLoadLevel, n.data.level);
            }
        });
        newNodes.forEach(n => {
            if (n.data.type === 'load') {
                n.data.level = maxNonLoadLevel + 1;
            }
        });

        // 3. Power Calcs (Voltage Forward)
        const topoQueue = [...roots.map(r => r.id)];
        const processedV = new Set<string>();
        while (topoQueue.length > 0) {
            const currId = topoQueue.shift()!;
            if (processedV.has(currId)) continue;
            processedV.add(currId);

            const curr = nodeMap.get(currId)!;
            if (curr.data.type === 'powerSource') {
                curr.data.calcVoltage = curr.data.outVoltage;
            } else if (curr.data.type === 'converter') {
                curr.data.calcVoltage = curr.data.outVoltage;
                const parents = revAdj.get(currId) || [];
                if (parents.length > 0) {
                    const inV = nodeMap.get(parents[0])?.data.calcVoltage;
                    if (inV !== undefined) {
                        if (curr.data.minInVoltage !== undefined && curr.data.minInVoltage > 0 && inV < curr.data.minInVoltage) {
                            curr.data.error = `Vin Too Low: ${inV.toFixed(1)}V < ${curr.data.minInVoltage}V`;
                        } else if (curr.data.maxInVoltage !== undefined && curr.data.maxInVoltage > 0 && inV > curr.data.maxInVoltage) {
                            curr.data.error = `Vin Too High: ${inV.toFixed(1)}V > ${curr.data.maxInVoltage}V`;
                        } else if (inV < curr.data.outVoltage) {
                            curr.data.error = `Under-voltage Input: ${inV.toFixed(1)}V < ${curr.data.outVoltage}V`;
                        }
                    }
                }
            } else if (curr.data.type === 'loadSwitch' || curr.data.type === 'muxSwitch') {
                const parents = revAdj.get(currId) || [];
                if (parents.length > 0) {
                    const inV = nodeMap.get(parents[0])?.data.calcVoltage;
                    curr.data.calcVoltage = inV; // Will be adjusted by drop later if loadSwitch
                    if (inV !== undefined && curr.data.type === 'loadSwitch') {
                        if (curr.data.minInVoltage !== undefined && curr.data.minInVoltage > 0 && inV < curr.data.minInVoltage) {
                            curr.data.error = `Vin Too Low: ${inV.toFixed(1)}V < ${curr.data.minInVoltage}V`;
                        } else if (curr.data.maxInVoltage !== undefined && curr.data.maxInVoltage > 0 && inV > curr.data.maxInVoltage) {
                            curr.data.error = `Vin Too High: ${inV.toFixed(1)}V > ${curr.data.maxInVoltage}V`;
                        }
                    }
                }
            } else if (curr.data.type === 'load') {
                const parents = revAdj.get(currId) || [];
                if (parents.length > 0) {
                    const inV = nodeMap.get(parents[0])?.data.calcVoltage;
                    curr.data.calcVoltage = inV;
                    if (inV !== undefined) {
                        if (curr.data.minInVoltage !== undefined && curr.data.minInVoltage > 0 && inV < curr.data.minInVoltage) {
                            curr.data.error = `Vin Too Low: ${inV.toFixed(1)}V < ${curr.data.minInVoltage}V`;
                        } else if (curr.data.maxInVoltage !== undefined && curr.data.maxInVoltage > 0 && inV > curr.data.maxInVoltage) {
                            curr.data.error = `Vin Too High: ${inV.toFixed(1)}V > ${curr.data.maxInVoltage}V`;
                        } else if (!curr.data.minInVoltage && !curr.data.maxInVoltage && Math.abs(inV - curr.data.reqVoltage) > 0.1) {
                            curr.data.error = `Voltage Mismatch: Need ${curr.data.reqVoltage}V, got ${inV.toFixed(1)}V`;
                        }
                    }
                }
            }
            (adj.get(currId) || []).forEach(cid => topoQueue.push(cid));
        }

        // 4. Current Calcs (Backward)
        const inDegree = new Map<string, number>();
        newNodes.forEach(n => inDegree.set(n.id, (adj.get(n.id) || []).length));
        const backQueue = newNodes.filter(n => (inDegree.get(n.id) || 0) === 0).map(n => n.id);

        while (backQueue.length > 0) {
            const currId = backQueue.shift()!;
            const curr = nodeMap.get(currId)!;

            if (curr.data.type === 'load') {
                curr.data.calcCurrent = curr.data.reqCurrent;
                curr.data.calcPower = (curr.data.calcVoltage || 0) * curr.data.reqCurrent;
            } else if (curr.data.type === 'converter') {
                let outCurrent = 0;
                (adj.get(currId) || []).forEach(cid => outCurrent += nodeMap.get(cid)!.data.calcCurrent || 0);
                curr.data.calcCurrent = outCurrent;
                const outP = curr.data.outVoltage * outCurrent;
                const inP = outP / (curr.data.efficiency || 1);
                curr.data.calcPower = inP - outP;

                const parents = revAdj.get(currId) || [];
                if (parents.length > 0) {
                    const p = nodeMap.get(parents[0])!;
                    const pV = p.data.calcVoltage || (p.data as any).outVoltage || 1;
                    p.data.calcCurrent = (p.data.calcCurrent || 0) + (inP / pV);
                }

                if (curr.data.maxOutCurrent !== undefined && curr.data.maxOutCurrent > 0 && (curr.data.calcCurrent || 0) > curr.data.maxOutCurrent) {
                    curr.data.error = `Over-current: ${(curr.data.calcCurrent || 0).toFixed(1)}A > ${curr.data.maxOutCurrent}A`;
                }
            } else if (curr.data.type === 'loadSwitch') {
                let outCurrent = 0;
                (adj.get(currId) || []).forEach(cid => outCurrent += nodeMap.get(cid)!.data.calcCurrent || 0);
                curr.data.calcCurrent = outCurrent;

                const rOnOhms = (curr.data.rOn || 0) / 1000;
                const vDrop = outCurrent * rOnOhms;
                curr.data.calcPower = outCurrent * outCurrent * rOnOhms;

                if (curr.data.calcVoltage !== undefined) {
                    curr.data.calcVoltage = Math.max(0, curr.data.calcVoltage - vDrop);
                }

                const parents = revAdj.get(currId) || [];
                if (parents.length > 0) {
                    const p = nodeMap.get(parents[0])!;
                    p.data.calcCurrent = (p.data.calcCurrent || 0) + outCurrent;
                }

                if (curr.data.maxCurrent !== undefined && curr.data.maxCurrent > 0 && outCurrent > curr.data.maxCurrent) {
                    curr.data.error = (curr.data.error ? curr.data.error + ' | ' : '') + `Over-current: ${outCurrent.toFixed(1)}A > ${curr.data.maxCurrent}A`;
                }
            } else if (curr.data.type === 'muxSwitch') {
                let outCurrent = 0;
                (adj.get(currId) || []).forEach(cid => outCurrent += nodeMap.get(cid)!.data.calcCurrent || 0);
                curr.data.calcCurrent = outCurrent;

                const parents = revAdj.get(currId) || [];
                if (parents.length > 0) {
                    const perParentCurrent = outCurrent / parents.length; // Simplified: distribute load evenly to inputs
                    parents.forEach(pid => {
                        const p = nodeMap.get(pid)!;
                        p.data.calcCurrent = (p.data.calcCurrent || 0) + perParentCurrent;
                    });
                }
            } else if (curr.data.type === 'powerSource') {
                curr.data.calcPower = curr.data.outVoltage * (curr.data.calcCurrent || 0);
                if ((curr.data.calcCurrent || 0) > curr.data.maxCurrent) {
                    curr.data.error = `Over-current: ${curr.data.calcCurrent?.toFixed(1)}A > ${curr.data.maxCurrent}A`;
                }
            }

            (revAdj.get(currId) || []).forEach(pid => {
                inDegree.set(pid, (inDegree.get(pid) || 1) - 1);
                if (inDegree.get(pid) === 0) backQueue.push(pid);
            });
        }

        // 5. Update Vertical Indices based on tree structure (1-to-1 follow)
        // Reset all vertical indices to undefined initially (so we know what's unassigned)
        const vIndexMap = new Map<string, number>();
        let currentNextY = 0; // Tracks the next available row index for independent branches

        // Helper to recursively assign Y and return how much Y space this branch took
        const assignY = (nodeId: string, startY: number): number => {
            if (vIndexMap.has(nodeId)) return 0; // Already handled (e.g. multi-input)

            const children = adj.get(nodeId) || [];

            // If we have 1 child, we can align it directly with our startY
            if (children.length <= 1) {
                vIndexMap.set(nodeId, startY);
                let heightConsumed = 1;
                if (children.length === 1) {
                    // Dive into child, giving it our exact same startY line
                    const childConsumed = assignY(children[0], startY);
                    heightConsumed = Math.max(1, childConsumed);
                }
                return heightConsumed;
            }

            // We have multiple children. We need to stack them.
            vIndexMap.set(nodeId, startY);
            let childStartY = startY;

            // Sort children to preserve existing manual swapped vertical index relative ordering
            const sortedChildren = [...children].sort((a, b) => (nodeMap.get(a)!.data.verticalIndex || 0) - (nodeMap.get(b)!.data.verticalIndex || 0));

            for (const childId of sortedChildren) {
                // If the child already has a Y (because another parent reached it first), skip
                if (vIndexMap.has(childId)) continue;

                const consumed = assignY(childId, childStartY);
                childStartY += consumed; // Next child gets pushed down
            }

            // The total height consumed by this node's branch is the sum of its children's heights
            return Math.max(1, childStartY - startY);
        };

        // First, assign Y positions starting from the roots.
        // ONLY treat proper power sources as global trees that reserve full row space.
        // Other independent elements (like floating loads or isolated parts) will be packed tightly 
        // into empty slots in their respective columns later.
        const sourceRoots = [...roots]
            .filter(r => r.data.type === 'powerSource')
            .sort((a, b) => ((a.data as any).verticalIndex || 0) - ((b.data as any).verticalIndex || 0));

        sourceRoots.forEach(r => {
            const consumed = assignY(r.id, currentNextY);
            currentNextY += consumed;
        });

        // Any disconnected nodes or isolated subtrees that aren't tied to a main PowerSource
        // Place them at the first available open slot in their specific level column, 
        // effectively back-filling empty space.
        const disconnectedNodes = newNodes.filter(n => !vIndexMap.has(n.id))
            .sort((a, b) => ((a.data as any).verticalIndex || 0) - ((b.data as any).verticalIndex || 0));

        disconnectedNodes.forEach(n => {
            if (vIndexMap.has(n.id)) return; // Might be processed as a child of another disconnected node

            // Find currently occupied Y slots for this node's specific level
            const occupied = new Set<number>();
            newNodes.forEach(other => {
                if (other.data.level === n.data.level && vIndexMap.has(other.id)) {
                    occupied.add(vIndexMap.get(other.id)!);
                }
            });

            let testY = 0;
            while (occupied.has(testY)) {
                testY++;
            }

            // Assign this single node and any of its floating children starting from the empty slot
            assignY(n.id, testY);
        });

        // Apply calculated indices back to node data
        newNodes.forEach(n => {
            n.data.verticalIndex = vIndexMap.get(n.id) || 0;
        });

        set({ nodes: newNodes });
        get().applyLayout();
    },

    applyLayout: () => {
        const { nodes } = get();
        // 5. Final Layout updates
        const layoutedNodes = nodes.map(node => {
            const newX = node.data.level * COLUMN_WIDTH;
            const newY = node.data.verticalIndex * ROW_HEIGHT;
            const positionChanged = node.position.x !== newX || node.position.y !== newY;

            return {
                ...node,
                position: positionChanged ? { x: newX, y: newY } : node.position
            };
        });

        set({ nodes: layoutedNodes });
    }
}));
