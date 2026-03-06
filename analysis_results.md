# Codebase Maintainability Analysis

## Current Status
The project has grown significantly in functionality (Calculation Engine, Auto-layout, Multi-view, Themes, Exports). However, the code is currently concentrated in two main "God Files":

1. **`usePowerTreeStore.ts` (~1000 lines)**:
    - Defines all Data Types and Interfaces.
    - Manages global state (Zustand).
    - Contains the entire **Calculation Engine** (Directly inside the store).
    - Contains the **Auto-layout Engine** (Directly inside the store).
    - Hardcoded constants (Layout metrics, etc.).
    - Undo/Redo history logic.

2. **`App.tsx` (~500 lines)**:
    - Main UI Layout.
    - Export Handlers (PNG, PDF, Excel) with complex DOM manipulation.
    - Keyboard shortcut management.
    - State synchronization logic.

## Identified Risks
- **Testing Difficulty**: The core calculation logic is tightly coupled with the Zustand store, making unit testing near impossible without a full mock store.
- **Cognitive Load**: Finding specific logic (e.g., how MUX current is distributed) requires scrolling through 1000 lines.
- **Side Effects**: Modifying the layout logic might accidentally break the calculation logic because they share the same adjacency map building phase.
- **UI Bloat**: `App.tsx` should be for layout, but it's currently managing binary exports and file system interactions.

## Proposed Refactoring Architecture

I propose moving towards a **Modular Service-Oriented Architecture**:

### 1. Types Layer (`/src/types/`)
- `node.types.ts`: All node data interfaces (PowerSourceData, MuxSwitchData, etc.).
- `store.types.ts`: State and Action interfaces for the store.

### 2. Core Logic Layer (`/src/core/`)
- `calculation.ts`: Pure functions for topological sorting, voltage propagation, and current aggregation.
- `layout.ts`: Pure functions for calculating column widths, levels, and vertical indices.
- `constants.ts`: Layout metrics, theme-aware colors, etc.

### 3. Utilities Layer (`/src/utils/`)
- `exportUtils.ts`: PNG, PDF, and Excel export logic.
- `historyUtils.ts`: Helper for state snapshots.

### 4. Store Layer (`/src/stores/`)
- Use Zustand **Slices** to separate UI state (theme, viewMode) from Tree state (nodes, edges).
- Store becomes a thin wrapper that calls pure functions from the `core/` layer.

### 5. Components Layer (`/src/components/`)
- More specialized components with less business logic.

---

> [!IMPORTANT]
> This refactoring will not change any functionality but will significantly improve development speed and reliability for future features (like the Control Flow implementation).

> [!TIP]
> I recommend starting with **Types extraction** as it provides immediate clarity without breaking any logic.
