import { getContext, setContext } from 'svelte';

const CONTEXT_KEY = Symbol('canvas-actions');

/**
 * Graph edits a node cannot do with `updateNodeData` alone, because they change ids
 * or touch edges. Rename functions return false when the id is empty or already used.
 * @typedef {{
 *   addChoice: (lineId: string) => string,
 *   removeChoice: (lineId: string, choiceId: string) => void,
 *   renameChoice: (lineId: string, choiceId: string, value: string) => boolean,
 *   renameLine: (lineId: string, value: string) => boolean
 * }} CanvasActions
 */

/** @param {CanvasActions} actions */
export const setCanvasActions = (actions) => setContext(CONTEXT_KEY, actions);

/** @returns {CanvasActions} */
export const getCanvasActions = () => getContext(CONTEXT_KEY);
