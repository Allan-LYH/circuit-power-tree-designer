import { type Node as RFNode } from '@xyflow/react';

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
    disabledPorts?: string[]; // Array of handle IDs (e.g., 'in-0', 'out-1')
}

export type PowerNodeData = PowerSourceData | ConverterData | LoadData | LoadSwitchData | MuxSwitchData;
export type PowerNode = RFNode<PowerNodeData>;

export type ViewMode = 'full' | 'compact' | 'readonly';
export type EdgeStyle = 'bezier' | 'step';
