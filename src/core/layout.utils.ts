import type { ViewMode } from '../types/node.types';
import { LAYOUT_CONSTANTS } from './constants';

/**
 * Calculates the column width and row height for a given view mode.
 */
export const getLayoutMetrics = (mode: ViewMode) => {
    const columnWidth = LAYOUT_CONSTANTS.NODE_WIDTH + LAYOUT_CONSTANTS.HORIZONTAL_GAP;
    switch (mode) {
        case 'compact':
            return {
                columnWidth,
                rowHeight: LAYOUT_CONSTANTS.NODE_HEIGHT_COMPACT + LAYOUT_CONSTANTS.VERTICAL_GAP_COMPACT
            };
        case 'readonly':
            return {
                columnWidth,
                rowHeight: LAYOUT_CONSTANTS.NODE_HEIGHT_READONLY + LAYOUT_CONSTANTS.VERTICAL_GAP_READONLY
            };
        case 'full':
        default:
            return {
                columnWidth,
                rowHeight: LAYOUT_CONSTANTS.NODE_HEIGHT_FULL + LAYOUT_CONSTANTS.VERTICAL_GAP_FULL
            };
    }
};
