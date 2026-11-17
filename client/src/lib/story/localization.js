/**
 * Localized versions of dialogue graphs.
 *
 * A graph may name its own language (`language`) and carry localized copies in
 * `localizations: [{ language, sections }]`. Every copy shares the structure of the graph
 * (sections, lines, choices, arrows, speakers, custom keys, all with the same ids), so a line id
 * identifies the same line in every language; only the text (line content, choice text) differs.
 * The structure is copied from one version to another on demand (`syncSections`).
 */

/** Variant key of the graph's own (original) sections. */
export const ORIGINAL = '';

/** Languages offered when adding a localization (BCP 47 codes). */
export const LANGUAGE_CODES = [
	'en',
	'de',
	'fr',
	'es',
	'it',
	'pt',
	'pt-BR',
	'nl',
	'sv',
	'da',
	'no',
	'fi',
	'is',
	'pl',
	'cs',
	'sk',
	'hu',
	'ro',
	'bg',
	'el',
	'hr',
	'sr',
	'sl',
	'uk',
	'ru',
	'tr',
	'ar',
	'he',
	'fa',
	'hi',
	'bn',
	'th',
	'vi',
	'id',
	'ms',
	'tl',
	'ja',
	'ko',
	'zh-Hans',
	'zh-Hant',
	'ca',
	'eu',
	'gl',
	'et',
	'lv',
	'lt'
];

/** @type {Intl.DisplayNames | null} */
let displayNames = null;
try {
	displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
} catch {
	// Old browser: codes are shown as they are.
}

/** Readable name of a language code ("de" -> "German"). @param {string} code */
export function languageName(code) {
	if (!code) return 'Original';
	try {
		return displayNames?.of(code) ?? code;
	} catch {
		return code;
	}
}

/**
 * A usable language code: trimmed, no whitespace. Empty when unusable.
 * @param {unknown} value
 */
export function cleanLanguage(value) {
	const code = String(value ?? '')
		.trim()
		.replace(/[\s_]+/g, '-');
	if (!code) return '';
	try {
		return Intl.getCanonicalLocales(code)[0];
	} catch {
		return code;
	}
}

/** @param {any} value */
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Normalize the localizations of a graph: unique languages different from the graph's own,
 * sections normalized with `normalizeSections`.
 * @param {any} graph
 * @param {(raw: unknown) => any[]} normalizeSections
 */
export function normalizeLocalizations(graph, normalizeSections) {
	const language = cleanLanguage(graph.language);
	const seen = new Set([language]);
	const localizations = (Array.isArray(graph.localizations) ? graph.localizations : [])
		.filter(isObject)
		.map((/** @type {any} */ localization) => ({
			...localization,
			language: cleanLanguage(localization.language)
		}))
		.filter((/** @type {any} */ localization) => {
			if (!localization.language || seen.has(localization.language)) return false;
			seen.add(localization.language);
			return true;
		})
		.map((/** @type {any} */ localization) => ({
			...localization,
			sections: normalizeSections(localization.sections)
		}));
	return { language, localizations };
}

/** Languages of all versions of a graph, the original first (as ORIGINAL). @param {any} graph */
export const variantsOf = (graph) => [
	ORIGINAL,
	...(graph.localizations ?? []).map((/** @type {any} */ l) => l.language)
];

/**
 * Sections of one version of a graph (the original when the language has no localization).
 * @param {any} graph
 * @param {string} language
 * @returns {any[]}
 */
export function sectionsOf(graph, language) {
	if (language === ORIGINAL) return graph.sections;
	return (
		(graph.localizations ?? []).find((/** @type {any} */ l) => l.language === language)?.sections ??
		graph.sections
	);
}

/**
 * Copy of a graph with the sections of one version replaced.
 * @param {any} graph
 * @param {string} language
 * @param {any[]} sections
 */
export function withSections(graph, language, sections) {
	if (language === ORIGINAL) return { ...graph, sections };
	return {
		...graph,
		localizations: (graph.localizations ?? []).map((/** @type {any} */ l) =>
			l.language === language ? { ...l, sections } : l
		)
	};
}

/** Key of a choice in `textsOf(...).choices` (choice ids are only unique within a line). @param {string} lineId @param {string} choiceId */
export const choiceKey = (lineId, choiceId) => JSON.stringify([lineId, choiceId]);

/** Text of every line and choice of some sections, keyed by id. @param {any[]} sections */
export function textsOf(sections) {
	/** @type {Map<string, string>} */
	const lines = new Map();
	/** @type {Map<string, string>} */
	const choices = new Map();
	for (const section of sections) {
		for (const text of section.texts) {
			lines.set(text.meta.id, text.data.content);
			for (const choice of text.data.choices)
				choices.set(choiceKey(text.meta.id, choice.id), choice.text);
		}
	}
	return { lines, choices };
}

/**
 * The structure of `source` with the text of `target`: lines and choices that exist in both
 * keep the target's text, new ones start without text, and lines and choices missing from
 * `source` are dropped (listed in `removed`).
 * @param {any[]} source
 * @param {any[]} target
 */
export function syncSections(source, target) {
	const texts = textsOf(target);
	const kept = { lines: new Set(), choices: new Set() };
	const sections = structuredClone(source).map((/** @type {any} */ section) => ({
		...section,
		texts: section.texts.map((/** @type {any} */ text) => {
			const lineId = text.meta.id;
			kept.lines.add(lineId);
			return {
				...text,
				data: {
					...text.data,
					content: texts.lines.get(lineId) ?? '',
					choices: text.data.choices.map((/** @type {any} */ choice) => {
						const key = choiceKey(lineId, choice.id);
						kept.choices.add(key);
						return { ...choice, text: texts.choices.get(key) ?? '' };
					})
				}
			};
		})
	}));

	const removed = {
		/** @type {{ id: string, content: string }[]} */
		lines: [],
		/** @type {{ id: string, lineId: string, text: string }[]} */
		choices: []
	};
	for (const section of target) {
		for (const text of section.texts) {
			if (!kept.lines.has(text.meta.id)) {
				removed.lines.push({ id: text.meta.id, content: text.data.content });
				continue;
			}
			for (const choice of text.data.choices) {
				if (!kept.choices.has(choiceKey(text.meta.id, choice.id)))
					removed.choices.push({ id: choice.id, lineId: text.meta.id, text: choice.text });
			}
		}
	}
	return { sections, removed };
}
