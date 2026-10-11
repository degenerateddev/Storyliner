/**
 * @typedef {{ title: string, message?: string, confirmLabel?: string, danger?: boolean }} ConfirmOptions
 */

/** Currently open dialog (rendered by ConfirmDialog.svelte in the root layout). */
export const dialog = $state({
	/** @type {(ConfirmOptions & { resolve: (ok: boolean) => void }) | null} */
	current: null
});

/**
 * Ask the user to confirm an action.
 * @param {ConfirmOptions} options
 * @returns {Promise<boolean>}
 */
export function confirm(options) {
	dialog.current?.resolve(false);
	return new Promise((resolve) => {
		dialog.current = {
			...options,
			resolve: (ok) => {
				dialog.current = null;
				resolve(ok);
			}
		};
	});
}
