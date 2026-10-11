/**
 * Turn free text into an identifier that is valid in every export format
 * (letters, digits and underscores, starting with a letter).
 * @param {string} text
 * @param {string} fallback
 */
export function identifier(text, fallback) {
	const cleaned = String(text ?? '')
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^A-Za-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
	if (!cleaned) return fallback;
	return /^[A-Za-z]/.test(cleaned) ? cleaned : `${fallback}_${cleaned}`;
}

/** Returns a function that makes names unique by appending _2, _3, ... */
export function uniqueNamer() {
	const used = new Set();
	/** @param {string} name */
	return (name) => {
		let candidate = name;
		for (let i = 2; used.has(candidate.toLowerCase()); i++) candidate = `${name}_${i}`;
		used.add(candidate.toLowerCase());
		return candidate;
	};
}

/**
 * Split a node's content into the non-empty lines that get spoken one by one.
 * @param {string} text
 */
export const textLines = (text) =>
	String(text ?? '')
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

/**
 * Short label for a player option: the first line of the target's text.
 * @param {import('./graph').Line} line
 */
export const optionLabel = (line) => textLines(line.text)[0] ?? line.speaker?.name ?? 'Continue';

/**
 * Line id usable as a localization tag (`#line:...`, `[ID:...]`).
 * @param {string} id
 * @param {number} [part] - index when one node's text is split into several lines
 */
export const lineTag = (id, part = 0) =>
	`${String(id).replace(/[^A-Za-z0-9_]/g, '')}${part > 0 ? `_${part + 1}` : ''}`;

/**
 * Speaker name safe for "Name: text" formats (no colons or line breaks).
 * @param {{ name: string } | null} speaker
 */
export const speakerName = (speaker) =>
	speaker ? speaker.name.replace(/[:\r\n]+/g, ' ').trim() || 'Unknown' : '';

/** @param {string[]} parts */
export const joinLines = (parts) =>
	parts
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trimEnd() + '\n';
