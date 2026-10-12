/**
 * Story JSON format (see README):
 * { name, sections: [{ meta: { id, position: "x,y", size: "w,h", type }, label,
 *   texts: [{ meta: { id, position: "x,y", parentId, type },
 *     data: { character, content, next: [ids], choices: [{ id, text, next: id | "" }] } }] }] }
 * Unknown keys are preserved so engine-specific data survives a round trip.
 */

export const SECTION_SIZE = { width: 640, height: 400 };
export const TEXT_WIDTH = 256;

export const newId = () => crypto.randomUUID();

/** Prefixes of the readable ids generated for lines and choices (ids stay editable). */
export const LINE_PREFIX = 'L';
export const CHOICE_PREFIX = 'C';

/**
 * Smallest readable id `<prefix><n>` that is not taken yet.
 * @param {string} prefix
 * @param {Iterable<string>} taken
 */
export function readableId(prefix, taken) {
	const used = new Set(taken);
	let n = 1;
	while (used.has(`${prefix}${n}`)) n++;
	return `${prefix}${n}`;
}

/**
 * Cleaned-up user input for an id: trimmed, no whitespace. Empty when unusable.
 * @param {unknown} value
 */
export const cleanId = (value) =>
	String(value ?? '')
		.trim()
		.replace(/\s+/g, '_');

/**
 * Parse an "a,b" string into two numbers.
 * @param {unknown} value
 * @param {[number, number]} fallback
 * @returns {[number, number]}
 */
export function parsePair(value, fallback) {
	const [a, b] = String(value ?? '')
		.split(',')
		.map(Number);
	return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : fallback;
}

/** @param {number} a @param {number} b */
export const formatPair = (a, b) => `${Math.round(a)},${Math.round(b)}`;

export const emptyStory = () => ({ name: 'Untitled story', sections: [] });

/** @param {any} value */
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * @typedef {{ id: string, name: string, meta: string }} Character
 * @param {any} raw - a character from the API (`_id`), the editor (`id`) or a legacy story (plain id string)
 * @returns {Character}
 */
export function normalizeCharacter(raw) {
	if (!isObject(raw)) return { id: String(raw ?? ''), name: String(raw ?? ''), meta: '' };
	const meta = raw.meta ?? '';
	return {
		id: String(raw.id ?? raw._id ?? ''),
		name: String(raw.name ?? ''),
		meta: typeof meta === 'string' ? meta : JSON.stringify(meta)
	};
}

/** @param {unknown} next */
function toIdList(next) {
	if (next === undefined || next === null || next === '') return [];
	return (Array.isArray(next) ? next.flat(Infinity) : [next])
		.map((item) => (isObject(item) ? item.id : item))
		.filter((id) => id !== undefined && id !== null && id !== '')
		.map(String);
}

/**
 * Player choices of a line: `{ id, text, next }`, `next` being a single line id or "".
 * @param {unknown} choices
 * @param {string} lineId - used to build ids for choices that have none
 */
function toChoices(choices, lineId) {
	if (!Array.isArray(choices)) return [];
	const ids = new Set();
	return choices.filter(isObject).map((choice, index) => {
		let id = cleanId(choice.id) || `${lineId}_${CHOICE_PREFIX}${index + 1}`;
		while (ids.has(id)) id = `${id}_`;
		ids.add(id);
		return {
			...choice,
			id,
			text: typeof choice.text === 'string' ? choice.text : '',
			next: toIdList(choice.next)[0] ?? ''
		};
	});
}

/**
 * Bring any (legacy) story into the current shape: `next` is always an id array without
 * dangling references, `choices` always an array, ids are strings, sections have a size.
 * @param {any} raw
 */
export function normalizeStory(raw) {
	const story = isObject(raw) ? structuredClone(raw) : {};
	story.name = typeof story.name === 'string' && story.name ? story.name : 'Untitled story';

	/** @type {any[]} */
	const sections = (Array.isArray(story.sections) ? story.sections : []).filter(
		(/** @type {any} */ section) =>
			isObject(section) && isObject(section.meta) && section.meta.id != null
	);

	story.sections = sections.map((section) => {
		const id = String(section.meta.id);
		const [x, y] = parsePair(section.meta.position, [0, 0]);
		const [width, height] = parsePair(section.meta.size, [SECTION_SIZE.width, SECTION_SIZE.height]);
		/** @type {any[]} */
		const texts = (Array.isArray(section.texts) ? section.texts : []).filter(
			(/** @type {any} */ text) => isObject(text) && isObject(text.meta) && text.meta.id != null
		);

		return {
			...section,
			meta: {
				...section.meta,
				id,
				type: 'section',
				position: formatPair(x, y),
				size: formatPair(width, height)
			},
			label: typeof section.label === 'string' ? section.label : 'Section',
			texts: texts.map((text) => {
				const data = isObject(text.data) ? text.data : {};
				const [tx, ty] = parsePair(text.meta.position, [24, 56]);
				return {
					...text,
					meta: {
						...text.meta,
						id: String(text.meta.id),
						type: 'text',
						parentId: id,
						position: formatPair(tx, ty)
					},
					data: {
						...data,
						character: data.character ? normalizeCharacter(data.character) : null,
						content: typeof data.content === 'string' ? data.content : '',
						next: toIdList(data.next),
						choices: toChoices(data.choices, String(text.meta.id))
					}
				};
			})
		};
	});

	const textIds = new Set(
		story.sections.flatMap((/** @type {any} */ s) =>
			s.texts.map((/** @type {any} */ t) => t.meta.id)
		)
	);
	for (const section of story.sections) {
		for (const text of section.texts) {
			text.data.next = [...new Set(text.data.next)].filter(
				(id) => textIds.has(id) && id !== text.meta.id
			);
			for (const choice of text.data.choices) {
				if (!textIds.has(choice.next) || choice.next === text.meta.id) choice.next = '';
			}
		}
	}

	return story;
}
