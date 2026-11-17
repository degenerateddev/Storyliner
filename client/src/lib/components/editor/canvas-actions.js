import { getContext, setContext } from 'svelte';

const CONTEXT_KEY = Symbol('canvas-actions');

/**
 * Graph edits a node cannot do with `updateNodeData` alone, because they change ids
 * or touch edges. Rename functions return false when the id is empty or already used.
 * @typedef {{
 *   addChoice: (lineId: string) => string,
 *   removeChoice: (lineId: string, choiceId: string) => void,
 *   renameChoice: (lineId: string, choiceId: string, value: string) => boolean,
 *   renameLine: (lineId: string, value: string) => boolean,
 *   reference: (lineId: string, choiceId?: string) => string,
 *   referenceField: (lineId: string, key: string, choiceId?: string) => string
 * }} CanvasActions
 * `reference` is the text of a line (or choice) in the graph's original version, shown as a hint
 * while editing a localization ("" on the original); `referenceField` is the same for the value of
 * a translatable custom key.
 */

/** @param {CanvasActions} actions */
export const setCanvasActions = (actions) => setContext(CONTEXT_KEY, actions);

/** @returns {CanvasActions} */
export const getCanvasActions = () => getContext(CONTEXT_KEY);
