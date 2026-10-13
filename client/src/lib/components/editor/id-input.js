/**
 * Commit an edited id or key; an empty or duplicate value is rejected and the old one restored.
 * @param {HTMLInputElement} input
 * @param {(value: string) => boolean} rename
 * @param {string} current
 */
export function commitId(input, rename, current) {
	if (rename(input.value)) return;
	input.value = current;
	input.animate(
		[
			{ transform: 'translateX(0)' },
			{ transform: 'translateX(-3px)' },
			{ transform: 'translateX(3px)' },
			{ transform: 'translateX(0)' }
		],
		{ duration: 200 }
	);
}

/**
 * Enter commits, Escape restores the old value.
 * @param {KeyboardEvent & { currentTarget: HTMLInputElement }} event
 * @param {string} current
 */
export function idKeydown(event, current) {
	if (event.key === 'Enter') event.currentTarget.blur();
	if (event.key === 'Escape') {
		event.currentTarget.value = current;
		event.currentTarget.blur();
	}
}
