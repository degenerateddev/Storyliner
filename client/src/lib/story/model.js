/**
 * Story JSON format (see README):
 * { name, graphs: [{ id, name, sections: [{ meta: { id, position: "x,y", size: "w,h", type }, label,
 *   texts: [{ meta: { id, position: "x,y", parentId, type, options?, translatable? },
 *     data: { character, content, next: [ids],
 *       choices: [{ id, text, next: id | "", meta?: { options?, translatable? }, ...custom }],
 *       ...custom } }] }] }],
 *   language?, localizations?: [{ language, sections }] }],
 *   choicePresets?: [Preset], nodePresets?: [Preset] }
 * A graph's `localizations` are translated copies of its sections with the same structure and ids
 * (see localization.js); `language` is the language of the graph's own sections.
 * Preset: { id, name, default, fields: [{ key, type, value, options?, translatable? }] }
 * Unknown keys are preserved so engine-specific data survives a round trip; plain values among
 * them (on a choice, or in a line's `data`) are the custom keys the editor lets you edit.
 * `meta.options` maps a custom key to its dropdown options; `meta.translatable` lists the text
 * keys that hold player-facing text, which every localization keeps its own value for (like the
 * line content) instead of taking it over when the structure is synced. A story with top-level `sections`
 * (the format before dialogue graphs) is read as a single graph.
 */

import { normalizeLocalizations } from './localization';

export const SECTION_SIZE = { width: 640, height: 400 };
export const TEXT_WIDTH = 256;

export const newId = () => crypto.randomUUID();

/** Prefixes of the readable ids generated for lines, choices and dialogue graphs (ids stay editable). */
export const LINE_PREFIX = 'L';
export const CHOICE_PREFIX = 'C';
export const GRAPH_PREFIX = 'D';

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

/** @param {number} n */
export const graphName = (n) => `Dialogue ${n}`;

export const emptyGraph = (/** @type {string} */ id = `${GRAPH_PREFIX}1`, name = graphName(1)) => ({
	id,
	name,
	sections: []
});

export const emptyStory = () => ({ name: 'Untitled story', graphs: [emptyGraph()] });

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

/** Choice keys owned by Storyliner; every other plain value of a choice is a custom key. */
export const CHOICE_KEYS = ['id', 'text', 'next', 'meta'];
/** Keys of a line's `data` owned by Storyliner; every other plain value is a custom key. */
export const LINE_KEYS = ['character', 'content', 'next', 'choices'];

/** What custom keys can be added to, with the story key of its presets. */
export const FIELD_KINDS = {
	choice: { reserved: CHOICE_KEYS, presetsKey: 'choicePresets' },
	node: { reserved: LINE_KEYS, presetsKey: 'nodePresets' }
};
/** @typedef {keyof typeof FIELD_KINDS} FieldKind */

/** @typedef {'text' | 'number' | 'boolean' | 'dropdown'} FieldType */
/** @type {FieldType[]} */
export const FIELD_TYPES = ['text', 'number', 'boolean', 'dropdown'];

/** @typedef {string | number | boolean} FieldValue */
/**
 * A custom key as the editor shows it; `options` only for dropdowns, `translatable` only for text
 * keys (player-facing text that is translated per localization instead of copied when syncing).
 * @typedef {{ key: string, type: FieldType, value: FieldValue, options?: string[], translatable?: boolean }} Field
 */

/** @param {unknown} value @returns {value is FieldValue} */
const isFieldValue = (value) =>
	typeof value === 'string' ||
	typeof value === 'boolean' ||
	(typeof value === 'number' && Number.isFinite(value));

/** @param {FieldValue} value @returns {FieldType} */
export const fieldType = (value) =>
	typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'text';

/**
 * Dropdown options: trimmed, non-empty, unique strings. Accepts a list or comma-separated text.
 * @param {unknown} raw
 * @returns {string[]}
 */
export function cleanOptions(raw) {
	const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [];
	return [...new Set(list.filter(isFieldValue).map((option) => String(option).trim()))].filter(
		Boolean
	);
}

/**
 * @param {FieldType} type
 * @param {unknown} [value] - converted when possible
 * @param {string[]} [options] - for dropdowns: a value that is not an option becomes ""
 * @returns {FieldValue}
 */
export function fieldValue(type, value, options) {
	if (type === 'boolean') return value === true || value === 'true' || value === 1;
	if (type === 'number') {
		const number = typeof value === 'boolean' ? Number(value) : Number(value ?? 0);
		return Number.isFinite(number) ? number : 0;
	}
	const text = value === undefined || value === null ? '' : String(value);
	return type === 'dropdown' && options && !options.includes(text) ? '' : text;
}

/**
 * A field converted to another type; a value turning into a dropdown becomes its first option.
 * @param {Field} field
 * @param {FieldType} type
 * @returns {Field}
 */
export function changeFieldType({ key, value, options, translatable }, type) {
	if (type === 'text' && translatable)
		return { key, type, value: fieldValue(type, value), translatable: true };
	if (type !== 'dropdown') return { key, type, value: fieldValue(type, value) };
	const list = options ?? cleanOptions([value === '' || value === false ? '' : value]);
	return { key, type, value: fieldValue(type, value, list), options: list };
}

/**
 * A usable custom key: cleaned like an id and not one of Storyliner's own keys.
 * Empty when unusable.
 * @param {unknown} value
 * @param {string[]} [reserved]
 */
export function cleanKey(value, reserved = CHOICE_KEYS) {
	const key = cleanId(value);
	return reserved.includes(key) ? '' : key;
}

/**
 * Split a choice (or a line's `data`) into its custom keys (plain strings, numbers and booleans)
 * and everything else (Storyliner's keys and objects from other tools, kept in `rest`).
 * @param {Record<string, any>} object
 * @param {string[]} reserved
 */
export function splitFields(object, reserved) {
	/** @type {Record<string, FieldValue>} */
	const values = {};
	/** @type {Record<string, any>} */
	const rest = {};
	for (const [key, value] of Object.entries(object)) {
		if (!reserved.includes(key) && isFieldValue(value)) values[key] = value;
		else rest[key] = value;
	}
	return { values, rest };
}

/**
 * Keys listed in `meta.translatable` (player-facing text keys of a line or choice).
 * @param {unknown} meta
 * @returns {string[]}
 */
export function translatableKeys(meta) {
	const list = isObject(meta) ? /** @type {any} */ (meta).translatable : undefined;
	return Array.isArray(list) ? list.filter((key) => typeof key === 'string' && key) : [];
}

/**
 * Custom key values -> editor fields. A text value with options (from `meta.options`) is a dropdown;
 * a text value listed in `meta.translatable` is translatable.
 * @param {Record<string, FieldValue>} values
 * @param {any} options - `meta.options`
 * @param {unknown} [translatable] - `meta.translatable`
 * @returns {Field[]}
 */
export function toFields(values, options, translatable) {
	const translated = new Set(Array.isArray(translatable) ? translatable : []);
	return Object.entries(values).map(([key, value]) => {
		if (typeof value !== 'string' || !isObject(options) || !(key in options)) {
			const type = fieldType(value);
			return type === 'text' && translated.has(key)
				? { key, type, value, translatable: true }
				: { key, type, value };
		}
		const list = cleanOptions(options[key]);
		// Keep a value that is no longer an option rather than losing it.
		if (value && !list.includes(value)) list.push(value);
		return { key, type: 'dropdown', value, options: list };
	});
}

/**
 * Editor fields -> custom key values, plus the options of dropdowns (for `meta.options`) and the
 * translatable text keys (for `meta.translatable`).
 * @param {Field[]} fields
 */
export function fromFields(fields) {
	/** @type {Record<string, FieldValue>} */
	const values = {};
	/** @type {Record<string, string[]> | undefined} */
	let options;
	/** @type {string[] | undefined} */
	let translatable;
	for (const field of fields) {
		values[field.key] = field.value;
		if (field.type === 'dropdown') (options ??= {})[field.key] = [...(field.options ?? [])];
		if (field.type === 'text' && field.translatable) (translatable ??= []).push(field.key);
	}
	return { values, options, translatable };
}

/**
 * `meta` with its `options` and `translatable` replaced (each removed when there are none).
 * @param {unknown} meta
 * @param {Record<string, string[]> | undefined} options
 * @param {string[] | undefined} [translatable]
 * @returns {Record<string, any>}
 */
export function withOptions(meta, options, translatable) {
	const {
		options: _old,
		translatable: _oldTranslatable,
		...rest
	} = isObject(meta) ? /** @type {any} */ (meta) : {};
	return {
		...rest,
		...(options ? { options } : {}),
		...(translatable?.length ? { translatable } : {})
	};
}

/**
 * @typedef {{ id: string, name: string, default: boolean, fields: Field[] }} Preset
 */

/**
 * @param {any} field
 * @param {string[]} reserved
 * @returns {Field}
 */
function normalizeField(field, reserved) {
	/** @type {FieldType} */
	const type = FIELD_TYPES.includes(field.type) ? field.type : 'text';
	const key = cleanKey(field.key, reserved);
	if (type === 'text' && field.translatable === true)
		return { key, type, value: fieldValue(type, field.value), translatable: true };
	if (type !== 'dropdown') return { key, type, value: fieldValue(type, field.value) };
	const options = cleanOptions(field.options);
	return { key, type, value: fieldValue(type, field.value, options), options };
}

/**
 * Story-level presets: named sets of custom keys (with type and default value) for choices or
 * nodes. At most one preset is the default, which new choices (nodes) start with.
 * @param {unknown} raw
 * @param {string[]} [reserved] - keys a preset cannot use
 * @returns {Preset[]}
 */
export function normalizePresets(raw, reserved = CHOICE_KEYS) {
	if (!Array.isArray(raw)) return [];
	let hasDefault = false;
	return raw.filter(isObject).map((preset, index) => {
		const isDefault = preset.default === true && !hasDefault;
		hasDefault ||= isDefault;
		const keys = new Set();
		return {
			...preset,
			id: String(preset.id ?? '') || newId(),
			name: typeof preset.name === 'string' ? preset.name : `Preset ${index + 1}`,
			default: isDefault,
			fields: (Array.isArray(preset.fields) ? preset.fields : [])
				.filter(isObject)
				.map((/** @type {any} */ field) => normalizeField(field, reserved))
				.filter((/** @type {Field} */ field) => {
					if (!field.key || keys.has(field.key)) return false;
					keys.add(field.key);
					return true;
				})
		};
	});
}

/**
 * Add the keys of a preset that a choice (node) does not have yet, with their default values.
 * @param {Field[]} fields
 * @param {Preset | undefined} preset
 * @returns {Field[]}
 */
export function applyPreset(fields, preset) {
	const keys = new Set(fields.map((field) => field.key));
	return [
		...fields,
		...(preset?.fields ?? [])
			.filter((field) => !keys.has(field.key))
			// JSON round-trip instead of structuredClone: preset fields may be Svelte $state proxies
			.map((field) => JSON.parse(JSON.stringify(field)))
	];
}

/**
 * Player choices of a line: `{ id, text, next, ...custom keys }`, `next` being a single line id or "".
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
 * @param {unknown} raw
 * @returns {any[]}
 */
function normalizeSections(raw) {
	/** @type {any[]} */
	const sections = (Array.isArray(raw) ? raw : []).filter(
		(/** @type {any} */ section) =>
			isObject(section) && isObject(section.meta) && section.meta.id != null
	);

	const result = sections.map((section) => {
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

	// Arrows stay inside their graph.
	const textIds = new Set(
		result.flatMap((/** @type {any} */ s) => s.texts.map((/** @type {any} */ t) => t.meta.id))
	);
	for (const section of result) {
		for (const text of section.texts) {
			text.data.next = [...new Set(text.data.next)].filter(
				(id) => textIds.has(id) && id !== text.meta.id
			);
			for (const choice of text.data.choices) {
				if (!textIds.has(choice.next) || choice.next === text.meta.id) choice.next = '';
			}
		}
	}
	return result;
}

/**
 * Bring any (legacy) story into the current shape: at least one dialogue graph, `next` is always
 * an id array without dangling references, `choices` always an array, ids are strings,
 * sections have a size.
 * @param {any} raw
 */
export function normalizeStory(raw) {
	const story = isObject(raw) ? structuredClone(raw) : {};
	story.name = typeof story.name === 'string' && story.name ? story.name : 'Untitled story';
	for (const { reserved, presetsKey } of Object.values(FIELD_KINDS)) {
		if (story[presetsKey] !== undefined)
			story[presetsKey] = normalizePresets(story[presetsKey], reserved);
	}

	/** @type {any[]} */
	const graphs = (Array.isArray(story.graphs) ? story.graphs : []).filter(isObject);
	if (Array.isArray(story.sections)) graphs.unshift({ sections: story.sections });
	delete story.sections;
	if (!graphs.length) graphs.push({});

	const ids = new Set();
	story.graphs = graphs.map((graph, index) => {
		let id = cleanId(graph.id);
		if (!id || ids.has(id)) id = readableId(GRAPH_PREFIX, [...ids, ...graphs.map((g) => g.id)]);
		ids.add(id);
		const { language, localizations } = normalizeLocalizations(graph, normalizeSections);
		const { language: _language, localizations: _localizations, ...rest } = graph;
		return {
			...rest,
			id,
			name: typeof graph.name === 'string' && graph.name ? graph.name : graphName(index + 1),
			sections: normalizeSections(graph.sections),
			...(language ? { language } : {}),
			...(localizations.length ? { localizations } : {})
		};
	});

	return story;
}
