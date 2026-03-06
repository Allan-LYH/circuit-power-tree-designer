/**
 * Hardware and layout constants for the power tree designer.
 * The layout engine dynamically accesses these to allow different spacing per viewing mode.
 */
export const LAYOUT_CONSTANTS = {
    NODE_WIDTH: 280,
    NODE_HEIGHT_FULL: 150,     // Approximate height of a fully expanded node
    NODE_HEIGHT_COMPACT: 98,   // Exact calculated height of a compact node
    NODE_HEIGHT_READONLY: 44,  // Height of a single-row readonly node
    HORIZONTAL_GAP: 80,
    VERTICAL_GAP_FULL: 40,
    VERTICAL_GAP_COMPACT: 12,
    VERTICAL_GAP_READONLY: 8,
};
