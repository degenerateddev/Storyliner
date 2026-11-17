import { getContext, setContext } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { api } from '$lib/api/client';
import { exportStory } from '$lib/export';
import { createZip } from '$lib/export/zip';
import {
	emptyGraph,
	emptyStory,
	FIELD_KINDS,
	GRAPH_PREFIX,
	graphName,
	newId,
	normalizeCharacter,
	normalizePresets,
	normalizeStory,
	readableId
} from './model';
import {
	cleanLanguage,
	ORIGINAL,
	sectionsOf,
	syncSections,
	variantsOf,
	withSections
} from './localization';

const CONTEXT_KEY = Symbol('editor');
/** @param {string | number} projectId */
const cacheKey = (projectId) => `storyliner:story:${projectId}`;
const SAVE_DELAY = 800;
const RETRY_DELAY = 5000;

/** @typedef {'saved' | 'saving' | 'error' | 'offline'} SaveStatus */

/** @param {string | number} projectId */
function readCache(projectId) {
	try {
		const cached = localStorage.getItem(cacheKey(projectId));
		return cached ? JSON.parse(cached) : null;
	} catch {
		return null;
	}
}

/** @param {string | number} projectId @param {string} serialized */
function writeCache(projectId, serialized) {
	try {
		localStorage.setItem(cacheKey(projectId), serialized);
	} catch {
		// Storage full or unavailable: the server copy is still the source of truth.
	}
}

/**
 * @param {string} filename
 * @param {string | Uint8Array} content
 * @param {string} mime
 */
function download(filename, content, mime) {
	const type = typeof content === 'string' ? `${mime};charset=utf-8` : mime;
	const blob = new Blob([/** @type {BlobPart} */ (content)], { type });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

/** @param {string} name */
const slug = (name) =>
	name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '') || 'story';

/** Ids of all lines and choices of some sections. @param {any[]} sections @returns {string[]} */
const idsOf = (sections) =>
	sections.flatMap((/** @type {any} */ section) =>
		section.texts.flatMap((/** @type {any} */ text) => [
			text.meta.id,
			...text.data.choices.map((/** @type {any} */ choice) => choice.id)
		])
	);

/**
 * Owns one story (project) with its dialogue graphs and characters, and persists them (debounced)
 * to the API with a localStorage cache for offline use.
 */
export class EditorStore {
	/** Server id of the story; characters and saves go to this project. */
	projectId;
	/** @type {import('./model').Character[]} */
	characters = $state([]);
	/** Top-level story fields except `graphs` (name, presets, custom keys). */
	info = $state(/** @type {Record<string, any>} */ ({ name: 'Untitled story' }));
	/**
	 * Dialogue graphs `{ id, name, sections }`. The canvas of the active graph writes its
	 * sections back; the others stay as they are.
	 * @type {any[]}
	 */
	graphs = $state.raw([]);
	/** Graph shown on the canvas. */
	activeGraphId = $state('');
	/**
	 * Language picked for the canvas (ORIGINAL for the graph's own sections). Kept when switching
	 * graphs; a graph without that localization shows its original.
	 */
	language = $state(ORIGINAL);
	/** Bumped whenever the story is replaced so the canvas rebuilds. */
	revision = $state(0);
	/** @type {SaveStatus} */
	status = $state('saved');
	message = $state('');

	/** @type {unknown} */
	#latest = null;
	#latestSerialized = '';
	#savedSerialized = '';
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	#timer;
	/** @type {Promise<void> | null} */
	#flushing = null;

	/**
	 * @param {{ projectId: string | number, story: unknown, characters: unknown[] | null, offline: boolean }} data
	 */
	constructor({ projectId, story, characters, offline }) {
		this.projectId = projectId;
		const initial = offline ? (readCache(projectId) ?? story) : story;
		this.load(initial ?? emptyStory());
		this.#savedSerialized = offline ? '' : JSON.stringify(this.serialize());
		this.characters = (characters ?? []).map(normalizeCharacter);
		if (offline) this.#fail('offline', 'Server unreachable – working from the local copy.');
	}

	/** @param {unknown} raw */
	load(raw) {
		const { graphs, ...info } = normalizeStory(raw);
		this.graphs = graphs;
		this.info = info;
		this.activeGraphId = graphs[0].id;
		this.language = ORIGINAL;
		this.revision++;
	}

	/** The whole story as saved. Reading it tracks every change (for the save effect). */
	serialize() {
		return { ...$state.snapshot(this.info), graphs: this.graphs };
	}

	/** The graph shown on the canvas. */
	get graph() {
		return this.graphs.find((graph) => graph.id === this.activeGraphId) ?? this.graphs[0];
	}

	/** Language of the version on the canvas (ORIGINAL when the graph lacks the picked one). */
	get activeLanguage() {
		return variantsOf(this.graph).includes(this.language) ? this.language : ORIGINAL;
	}

	/** Sections of the version on the canvas. */
	get sections() {
		return sectionsOf(this.graph, this.activeLanguage);
	}

	/** @param {string} language - ORIGINAL or a localization of the active graph */
	selectLanguage(language) {
		this.language = language;
	}

	/**
	 * @param {string} id
	 * @param {(graph: any) => any} change
	 */
	#updateGraph(id, change) {
		this.graphs = this.graphs.map((graph) => (graph.id === id ? change(graph) : graph));
	}

	/**
	 * Set the language of the active graph's own sections. @param {string} language
	 * @returns {boolean} false when the code is unusable or taken by a localization
	 */
	setOriginalLanguage(language) {
		const code = cleanLanguage(language);
		if (code && variantsOf(this.graph).includes(code)) return false;
		this.#updateGraph(this.graph.id, ({ language: _old, ...graph }) =>
			code ? { ...graph, language: code } : graph
		);
		return true;
	}

	/**
	 * Add a localization of the active graph with the structure of the version on the canvas
	 * (without its text), and show it.
	 * @param {string} language
	 * @returns {boolean} false when the code is unusable or already used by this graph
	 */
	addLocalization(language) {
		const code = cleanLanguage(language);
		const graph = this.graph;
		if (!code || code === graph.language || variantsOf(graph).includes(code)) return false;
		const { sections } = syncSections(this.sections, []);
		this.#updateGraph(graph.id, (g) => ({
			...g,
			localizations: [...(g.localizations ?? []), { language: code, sections }]
		}));
		this.language = code;
		return true;
	}

	/** @param {string} language - a localization of the active graph */
	removeLocalization(language) {
		if (language === ORIGINAL) return;
		this.#updateGraph(this.graph.id, ({ localizations = [], ...graph }) => {
			const rest = localizations.filter((/** @type {any} */ l) => l.language !== language);
			return rest.length ? { ...graph, localizations: rest } : graph;
		});
		if (this.language === language) this.language = ORIGINAL;
	}

	/**
	 * What syncing the structure of the version on the canvas into another version of the graph
	 * would produce (and remove).
	 * @param {string} target - ORIGINAL or a localization of the active graph
	 */
	previewSync(target) {
		return syncSections(this.sections, sectionsOf(this.graph, target));
	}

	/**
	 * Copy the structure of the version on the canvas into another version of the graph; that
	 * version keeps its text for lines and choices that exist in both.
	 * @param {string} target
	 */
	syncTo(target) {
		if (target === this.activeLanguage || !variantsOf(this.graph).includes(target)) return;
		const { sections } = this.previewSync(target);
		this.#updateGraph(this.graph.id, (graph) => withSections(graph, target, sections));
	}

	/** @param {string} id */
	selectGraph(id) {
		if (this.graphs.some((graph) => graph.id === id)) this.activeGraphId = id;
	}

	/** Add an empty graph and show it. */
	addGraph() {
		const ids = this.graphs.map((graph) => graph.id);
		let n = this.graphs.length + 1;
		while (this.graphs.some((graph) => graph.name === graphName(n))) n++;
		const graph = emptyGraph(readableId(GRAPH_PREFIX, ids), graphName(n));
		this.graphs = [...this.graphs, graph];
		this.activeGraphId = graph.id;
		return graph;
	}

	/** @param {string} id @param {string} name */
	renameGraph(id, name) {
		const trimmed = name.trim();
		if (!trimmed) return;
		this.graphs = this.graphs.map((graph) =>
			graph.id === id ? { ...graph, name: trimmed } : graph
		);
	}

	/** The last graph cannot be removed. @param {string} id */
	removeGraph(id) {
		if (this.graphs.length < 2) return;
		const index = this.graphs.findIndex((graph) => graph.id === id);
		this.graphs = this.graphs.filter((graph) => graph.id !== id);
		if (this.activeGraphId === id) this.activeGraphId = this.graphs[Math.max(0, index - 1)].id;
	}

	/**
	 * Called by the canvas whenever its graph changes.
	 * @param {string} id
	 * @param {string} language - version shown on the canvas
	 * @param {any[]} sections
	 */
	setSections(id, language, sections) {
		this.#updateGraph(id, (graph) => withSections(graph, language, sections));
	}

	/**
	 * Line and choice ids of all other graphs and of the other versions of this graph: ids are
	 * unique across the story (the versions of a graph share them for the same line), so every id
	 * works as a localization key, and a line added to one version only is not mistaken for
	 * another when syncing.
	 * @param {string} id
	 * @param {string} [language]
	 */
	idsOutside(id, language = ORIGINAL) {
		return this.graphs.flatMap((graph) =>
			variantsOf(graph)
				.filter((variant) => graph.id !== id || variant !== language)
				.flatMap((variant) => idsOf(sectionsOf(graph, variant)))
		);
	}

	/** @param {any} graph */
	linesIn(graph) {
		return graph.sections.reduce(
			(/** @type {number} */ sum, /** @type {any} */ section) => sum + section.texts.length,
			0
		);
	}

	/** Called whenever the story changes. Cheap when nothing changed. */
	queueSave(/** @type {unknown} */ story) {
		const serialized = JSON.stringify(story);
		if (serialized === this.#latestSerialized) return;

		this.#latest = story;
		this.#latestSerialized = serialized;
		writeCache(this.projectId, serialized);

		clearTimeout(this.#timer);
		if (serialized === this.#savedSerialized) {
			this.status = 'saved';
			return;
		}
		this.status = 'saving';
		this.#timer = setTimeout(() => this.flush(), SAVE_DELAY);
	}

	get hasUnsavedChanges() {
		return this.#latestSerialized !== '' && this.#latestSerialized !== this.#savedSerialized;
	}

	/**
	 * Save immediately (also used for Ctrl+S). Resolves once everything is saved or the save
	 * failed (it is then retried later).
	 */
	flush() {
		clearTimeout(this.#timer);
		this.#flushing ??= this.#save().finally(() => (this.#flushing = null));
		return this.#flushing;
	}

	async #save() {
		// Changes made while a request is in flight are sent right after it.
		while (this.hasUnsavedChanges) {
			const serialized = this.#latestSerialized;
			const result = await api.saveProject(this.projectId, this.#latest);
			if (result.status === 404) {
				this.#fail('error', 'This story was deleted – export it to keep your changes.');
				return;
			}
			if (!result.ok) {
				this.#handleError(result.status, 'Could not save the story.');
				this.#timer = setTimeout(() => this.flush(), RETRY_DELAY);
				return;
			}
			this.#savedSerialized = serialized;
		}
		this.status = 'saved';
		this.message = '';
	}

	/** @param {string} name @param {string} meta */
	async addCharacter(name, meta) {
		const character = { id: newId(), name, meta };
		this.characters.push(character);
		await this.#saveCharacter(character);
		return character;
	}

	/** @param {string} id @param {{ name?: string, meta?: string }} changes */
	async updateCharacter(id, changes) {
		const character = this.characters.find((c) => c.id === id);
		if (!character) return;
		Object.assign(character, changes);
		await this.#saveCharacter(character);
	}

	/** @param {string} id */
	async removeCharacter(id) {
		this.characters = this.characters.filter((c) => c.id !== id);
		const result = await api.deleteCharacter(this.projectId, id);
		// 404: it never reached the server (e.g. created while offline) – nothing to delete.
		if (!result.ok && result.status !== 404)
			this.#handleError(result.status, 'Could not delete the character.');
	}

	/** @param {string} id */
	character(id) {
		return this.characters.find((c) => c.id === id);
	}

	/**
	 * Presets of custom keys for choices or nodes (stored with the story).
	 * @param {import('./model').FieldKind} kind
	 * @returns {import('./model').Preset[]}
	 */
	presets(kind) {
		return this.info[FIELD_KINDS[kind].presetsKey] ?? [];
	}

	/**
	 * The preset new choices (nodes) start with.
	 * @param {import('./model').FieldKind} kind
	 */
	defaultPreset(kind) {
		return this.presets(kind).find((preset) => preset.default);
	}

	/**
	 * Replaced as a whole, so the save effect notices the change.
	 * @param {import('./model').FieldKind} kind
	 * @param {unknown} presets
	 */
	setPresets(kind, presets) {
		const { presetsKey, reserved } = FIELD_KINDS[kind];
		this.info[presetsKey] = normalizePresets(presets, reserved);
	}

	/**
	 * The Storyliner JSON backup holds every graph with all its localizations; the engine formats
	 * export the graph on the canvas, in the language on the canvas or (`allLanguages`) once per
	 * version of the graph, bundled in a ZIP.
	 * @param {string} formatId - see EXPORT_FORMATS
	 * @param {{ allLanguages?: boolean }} [options]
	 */
	exportAs(formatId, { allLanguages = false } = {}) {
		// Twine needs a stable story id; it is stored with the story so re-exports keep it.
		if (formatId === 'twee' && !this.info.ifid) this.info.ifid = newId().toUpperCase();
		const info = $state.snapshot(this.info);
		if (formatId === 'storyliner') {
			const { content, extension, mime } = exportStory(formatId, {
				story: { ...info, graphs: this.graphs }
			});
			download(`${slug(this.info.name)}.${extension}`, content, mime);
			return;
		}

		const base =
			this.graphs.length < 2
				? slug(this.info.name)
				: `${slug(this.info.name)}-${slug(this.graph.name)}`;
		const variants = variantsOf(this.graph);
		/** @param {string} language */
		const render = (language) => {
			// Engine formats get one version as a plain graph.
			const { localizations: _localizations, ...graph } = this.graph;
			const code = language === ORIGINAL ? graph.language : language;
			const view = {
				...graph,
				sections: sectionsOf(this.graph, language),
				...(code ? { language: code } : {})
			};
			return { code, ...exportStory(formatId, { story: { ...info, graphs: [view] } }) };
		};

		if (!allLanguages || variants.length < 2) {
			const language = this.activeLanguage;
			const { content, extension, mime } = render(language);
			const suffix = language === ORIGINAL ? '' : `.${language}`;
			download(`${base}${suffix}.${extension}`, content, mime);
			return;
		}

		const files = variants.map((language) => {
			const { code, content, extension } = render(language);
			return { name: `${base}.${code || 'original'}.${extension}`, content };
		});
		download(`${base}.languages.zip`, createZip(files), 'application/zip');
	}

	exportCharacters() {
		const characters = JSON.stringify($state.snapshot(this.characters), null, 4) + '\n';
		download('characters.json', characters, 'application/json');
	}

	/** @param {import('./model').Character} character */
	async #saveCharacter(character) {
		const result = await api.saveCharacter(this.projectId, $state.snapshot(character));
		if (!result.ok) this.#handleError(result.status, `Could not save “${character.name}”.`);
	}

	/** @param {number} status @param {string} message */
	#handleError(status, message) {
		if (status === 401) {
			goto(resolve('/auth'));
			return;
		}
		if (status === 0)
			this.#fail('offline', 'Server unreachable – changes are kept locally and retried.');
		else this.#fail('error', message);
	}

	/** @param {SaveStatus} status @param {string} message */
	#fail(status, message) {
		this.status = status;
		this.message = message;
	}
}

/** @param {EditorStore} store */
export const setEditor = (store) => setContext(CONTEXT_KEY, store);

/** @returns {EditorStore} */
export const getEditor = () => getContext(CONTEXT_KEY);
