/**
 * Stable, readable color for a character id.
 * @param {string | undefined} id
 */
export function characterColor(id) {
	if (!id) return 'hsl(30 6% 55%)';
	let hash = 0;
	for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	return `hsl(${hash % 360} 60% 42%)`;
}

/** DataTransfer type used when dragging a character onto the canvas. */
export const CHARACTER_MIME = 'application/x-storyliner-character';

/**
 * Same color as `characterColor`, as #rrggbb (for engines that need hex colors).
 * @param {string | undefined} id
 */
export function characterHex(id) {
	const [h, s, l] = (characterColor(id).match(/[\d.]+/g) ?? ['0', '0', '50']).map(Number);
	const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
	/** @param {number} n */
	const channel = (n) => {
		const k = (n + h / 30) % 12;
		const value = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
		return Math.round(value * 255)
			.toString(16)
			.padStart(2, '0');
	};
	return `#${channel(0)}${channel(8)}${channel(4)}`;
}
