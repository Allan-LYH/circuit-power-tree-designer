import type { Edge } from '@xyflow/react';
import type { 
    PowerNode, 
    PowerNodeData, 
    MuxSwitchData, 
    ViewMode 
} from '../types/node.types';
import { getLayoutMetrics } from './layout.utils';

/**
 * Core Calculation and Layout Engine for the Power Tree Designer.
 * Contains pure functions to evaluate the power tree and position nodes.
 */

/**
 * Performs cycle detection and returns a set of cyclic edge IDs.
 */
export const detectCycles = (nodes: PowerNode[], edges: Edge[]): Set<string> => {
    const cyclicEdgeIds = new Set<string>();
    const visitState = new Map<string, 0 | 1 | 2>();
    nodes.forEach(n => visitState.set(n.id, 0));

    const dfs = (nodeId: string) => {
        visitState.set(nodeId, 1);
        edges.filter(e => e.source === nodeId).forEach(edge => {
            const targetId = edge.target;
            const state = visitState.get(targetId);
            if (state === 1) {
                cyclicEdgeIds.add(edge.id);
            } else if (state === 0) {
                dfs(targetId);
            }
        });
        visitState.set(nodeId, 2);
    };

    // Start DFS from natural roots (nodes with no incoming edges)
    nodes.filter(n => !edges.some(e => e.target === n.id)).forEach(r => {
        if (visitState.get(r.id) === 0) dfs(r.id);
    });
    // Catch isolated pure-cycle components
    nodes.forEach(n => {
        if (visitState.get(n.id) === 0) dfs(n.id);
    });

    return cyclicEdgeIds;
};

/**
 * Recalculates all topological levels, voltages, currents, and power metrics.
 * Returns updated nodes and edges arrays.
 */
export const calculatePowerTree = (nodes: PowerNode[], edges: Edge[]): { updatedNodes: PowerNode[], updatedEdges: Edge[] } => {
    const cyclicEdgeIds = detectCycles(nodes, edges);

    // 1. Build Adjacency Maps
    const fullAdj = new Map<string, string[]>();
    const fullRevAdj = new Map<string, string[]>();
    const calcAdj = new Map<string, string[]>();
    const calcRevAdj = new Map<string, string[]>();

    nodes.forEach(n => { 
        fullAdj.set(n.id, []); fullRevAdj.set(n.id, []); 
        calcAdj.set(n.id, []); calcRevAdj.set(n.id, []); 
    });

    const styledEdges = edges.map(e => {
        if (cyclicEdgeIds.has(e.id)) return { ...e, style: { ...e.style, strokeDasharray: '5,5', opacity: 0.5 } };
        
        let isMuted = false;
        const sourceNode = nodes.find(n => n.id === e.source);
        const targetNode = nodes.find(n => n.id === e.target);
        
        if (sourceNode?.type === 'muxSwitch' && e.sourceHandle) {
            const disabled = (sourceNode.data as MuxSwitchData).disabledPorts || [];
            if (disabled.includes(e.sourceHandle)) isMuted = true;
        }
        if (!isMuted && targetNode?.type === 'muxSwitch' && e.targetHandle) {
            const disabled = (targetNode.data as MuxSwitchData).disabledPorts || [];
            if (disabled.includes(e.targetHandle)) isMuted = true;
        }

        if (isMuted) {
            return { 
                ...e, 
                style: { 
                    ...e.style, 
                    opacity: 0.4, 
                    strokeDasharray: '5,5' 
                }
            };
        } else {
            const newStyle = { ...(e.style || {}) } as any;
            delete newStyle.strokeDasharray;
            delete newStyle.opacity;
            return { ...e, style: newStyle };
        }
    });

    styledEdges.forEach(e => {
        if (cyclicEdgeIds.has(e.id)) return;
        
        if (fullAdj.has(e.source)) fullAdj.get(e.source)!.push(e.target);
        if (fullRevAdj.has(e.target)) fullRevAdj.get(e.target)!.push(e.source);
        
        const edgeStyle = (e.style || {}) as any;
        const isMuted = edgeStyle.strokeDasharray === '5,5';

        if (!isMuted) {
            if (calcAdj.has(e.source)) calcAdj.get(e.source)!.push(e.target);
            if (calcRevAdj.has(e.target)) calcRevAdj.get(e.target)!.push(e.source);
        }
    });

    const newNodes = nodes.map(n => ({
        ...n,
        data: { ...n.data, error: undefined, calcVoltage: undefined, calcCurrent: 0, calcPower: 0, level: 0 } as PowerNodeData
    }));
    const nodeMap = new Map(newNodes.map(n => [n.id, n]));

    // 2. Assign Levels (Topological Depth via BFS)
    const roots = newNodes.filter(n => (fullRevAdj.get(n.id) || []).length === 0);
    const queue: { id: string, level: number }[] = roots.map(r => ({ id: r.id, level: 0 }));

    while (queue.length > 0) {
        const { id, level } = queue.shift()!;
        const node = nodeMap.get(id)!;
        node.data.level = Math.max(node.data.level, level);

        (fullAdj.get(id) || []).forEach(childId => {
            queue.push({ id: childId, level: node.data.level + 1 });
        });
    }

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

    // 3. Voltage Propagation (Forward Topo Sort)
    const calcRoots = newNodes.filter(n => (calcRevAdj.get(n.id) || []).length === 0);
    const topoQueue = [...calcRoots.map(r => r.id)];
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
            const parents = calcRevAdj.get(currId) || [];
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
            const parents = calcRevAdj.get(currId) || [];
            if (parents.length > 0) {
                const inV = nodeMap.get(parents[0])?.data.calcVoltage;
                curr.data.calcVoltage = inV;
                if (inV !== undefined && curr.data.type === 'loadSwitch') {
                    if (curr.data.minInVoltage !== undefined && curr.data.minInVoltage > 0 && inV < curr.data.minInVoltage) {
                        curr.data.error = `Vin Too Low: ${inV.toFixed(1)}V < ${curr.data.minInVoltage}V`;
                    } else if (curr.data.maxInVoltage !== undefined && curr.data.maxInVoltage > 0 && inV > curr.data.maxInVoltage) {
                        curr.data.error = `Vin Too High: ${inV.toFixed(1)}V > ${curr.data.maxInVoltage}V`;
                    }
                }
            }
        } else if (curr.data.type === 'load') {
            const parents = calcRevAdj.get(currId) || [];
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
        (calcAdj.get(currId) || []).forEach(cid => topoQueue.push(cid));
    }

    // 4. Current Aggregation (Backward Topo Sort)
    const inDegree = new Map<string, number>();
    newNodes.forEach(n => inDegree.set(n.id, (calcAdj.get(n.id) || []).length));
    const backQueue = newNodes.filter(n => (inDegree.get(n.id) || 0) === 0).map(n => n.id);

    while (backQueue.length > 0) {
        const currId = backQueue.shift()!;
        const curr = nodeMap.get(currId)!;

        if (curr.data.type === 'load') {
            curr.data.calcCurrent = curr.data.reqCurrent;
            curr.data.calcPower = (curr.data.calcVoltage || 0) * curr.data.reqCurrent;
        } else if (curr.data.type === 'converter') {
            let outCurrent = 0;
            (calcAdj.get(currId) || []).forEach(cid => outCurrent += nodeMap.get(cid)!.data.calcCurrent || 0);
            curr.data.calcCurrent = outCurrent;
            const outP = curr.data.outVoltage * outCurrent;
            const inP = outP / (curr.data.efficiency || 1);
            curr.data.calcPower = inP - outP;

            const parents = calcRevAdj.get(currId) || [];
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
            (calcAdj.get(currId) || []).forEach(cid => outCurrent += nodeMap.get(cid)!.data.calcCurrent || 0);
            curr.data.calcCurrent = outCurrent;

            const rOnOhms = (curr.data.rOn || 0) / 1000;
            const vDrop = outCurrent * rOnOhms;
            curr.data.calcPower = outCurrent * outCurrent * rOnOhms;

            if (curr.data.calcVoltage !== undefined) {
                curr.data.calcVoltage = Math.max(0, curr.data.calcVoltage - vDrop);
            }

            const parents = calcRevAdj.get(currId) || [];
            if (parents.length > 0) {
                const p = nodeMap.get(parents[0])!;
                p.data.calcCurrent = (p.data.calcCurrent || 0) + outCurrent;
            }

            if (curr.data.maxCurrent !== undefined && curr.data.maxCurrent > 0 && outCurrent > curr.data.maxCurrent) {
                curr.data.error = (curr.data.error ? curr.data.error + ' | ' : '') + `Over-current: ${outCurrent.toFixed(1)}A > ${curr.data.maxCurrent}A`;
            }
        } else if (curr.data.type === 'muxSwitch') {
            let outCurrent = 0;
            (calcAdj.get(currId) || []).forEach(cid => outCurrent += nodeMap.get(cid)!.data.calcCurrent || 0);
            curr.data.calcCurrent = outCurrent;

            const parents = calcRevAdj.get(currId) || [];
            if (parents.length > 0) {
                const perParentCurrent = outCurrent / parents.length;
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

        (calcRevAdj.get(currId) || []).forEach(pid => {
            inDegree.set(pid, (inDegree.get(pid) || 1) - 1);
            if (inDegree.get(pid) === 0) backQueue.push(pid);
        });
    }

    // 5. Update Vertical Indices
    const vIndexMap = new Map<string, number>();
    let currentNextY = 0;

    const assignY = (nodeId: string, startY: number, targetMap: Map<string, number>, globalMap?: Map<string, number>): number => {
        if (targetMap.has(nodeId) || (globalMap && globalMap.has(nodeId))) return 0;

        const children = fullAdj.get(nodeId) || [];
        if (children.length <= 1) {
            targetMap.set(nodeId, startY);
            let heightConsumed = 1;
            if (children.length === 1) {
                const childConsumed = assignY(children[0], startY, targetMap, globalMap);
                heightConsumed = Math.max(1, childConsumed);
            }
            return heightConsumed;
        }

        targetMap.set(nodeId, startY);
        let childStartY = startY;
        const sortedChildren = [...children].sort((a, b) => (nodeMap.get(a)!.data.verticalIndex || 0) - (nodeMap.get(b)!.data.verticalIndex || 0));

        for (const childId of sortedChildren) {
            if (targetMap.has(childId) || (globalMap && globalMap.has(childId))) continue;
            const consumed = assignY(childId, childStartY, targetMap, globalMap);
            childStartY += consumed;
        }
        return Math.max(1, childStartY - startY);
    };

    const sourceRoots = [...roots]
        .filter(r => r.data.type === 'powerSource')
        .sort((a, b) => ((a.data as any).verticalIndex || 0) - ((b.data as any).verticalIndex || 0));

    sourceRoots.forEach(r => {
        const consumed = assignY(r.id, currentNextY, vIndexMap);
        currentNextY += consumed;
    });

    const disconnectedNodes = newNodes.filter(n => !vIndexMap.has(n.id))
        .sort((a, b) => ((a.data as any).verticalIndex || 0) - ((b.data as any).verticalIndex || 0));

    disconnectedNodes.forEach(n => {
        if (vIndexMap.has(n.id)) return;
        const occupiedGrid = new Set<string>();
        for (const [id, y] of vIndexMap.entries()) {
            occupiedGrid.add(`${nodeMap.get(id)!.data.level},${y}`);
        }

        let testY = 0;
        let success = false;
        while (!success) {
            const testMap = new Map<string, number>();
            assignY(n.id, testY, testMap, vIndexMap);
            let collision = false;
            for (const [simId, simY] of testMap.entries()) {
                const level = nodeMap.get(simId)!.data.level;
                if (occupiedGrid.has(`${level},${simY}`)) {
                    collision = true;
                    break;
                }
            }
            if (!collision) {
                for (const [simId, simY] of testMap.entries()) {
                    vIndexMap.set(simId, simY);
                }
                let maxTreeY = testY;
                for (const y of testMap.values()) maxTreeY = Math.max(maxTreeY, y);
                currentNextY = Math.max(currentNextY, maxTreeY + 1);
                success = true;
            } else {
                testY++;
            }
        }
    });

    newNodes.forEach(n => {
        n.data.verticalIndex = vIndexMap.get(n.id) || 0;
    });

    // 6. Highlight cyclic edges
    const finalEdges = styledEdges.map(e => {
        const isCyclic = cyclicEdgeIds.has(e.id);
        const currentlyCyclic = !!(e.data as any)?.isCyclic;

        if (isCyclic) {
            return {
                ...e,
                animated: true,
                style: { ...e.style, stroke: '#ef4444', strokeWidth: 3 },
                data: { ...e.data, isCyclic: true }
            };
        } else if (currentlyCyclic) {
            const newStyle = { ...e.style } as any;
            delete newStyle.stroke;
            delete newStyle.strokeWidth;
            const newData = { ...e.data } as any;
            delete newData.isCyclic;

            return {
                ...e,
                animated: false,
                style: Object.keys(newStyle).length > 0 ? newStyle : undefined,
                data: newData
            };
        }
        return e;
    });

    return { updatedNodes: newNodes, updatedEdges: finalEdges };
};

/**
 * Positions nodes based on their calculated levels and vertical indices.
 */
export const applyAutoLayout = (nodes: PowerNode[], viewMode: ViewMode): PowerNode[] => {
    const { columnWidth, rowHeight } = getLayoutMetrics(viewMode);

    return nodes.map(node => {
        const newX = node.data.level * columnWidth;
        const newY = node.data.verticalIndex * rowHeight;
        const positionChanged = node.position.x !== newX || node.position.y !== newY;

        return {
            ...node,
            position: positionChanged ? { x: newX, y: newY } : node.position
        };
    });
};
