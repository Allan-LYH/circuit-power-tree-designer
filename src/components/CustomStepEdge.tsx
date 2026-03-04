import { BaseEdge, type EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { usePowerTreeStore } from '../stores/usePowerTreeStore';

export default function CustomStepEdge(props: EdgeProps) {
    const {
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        style = {},
        markerEnd,
        source,
    } = props;

    // Get the source node to find its level for absolute grid alignment
    const sourceNode = usePowerTreeStore.getState().nodes.find(n => n.id === source);
    const sourceLevel = (sourceNode?.data as any)?.level ?? 0;

    // Use absolute grid center for the vertical bus: (level * 360) + 280 + 40
    const centerX = sourceLevel * 360 + 320;

    const deltaX = Math.abs(targetX - sourceX);
    const deltaY = Math.abs(targetY - sourceY);

    // Fixed radius for professional look, reduce only if vertically extremely tight
    const safeBorderRadius = Math.min(8, deltaX / 4, deltaY / 2);

    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: safeBorderRadius,
        centerX,
    });

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 2 }} />
        </>
    );
}
