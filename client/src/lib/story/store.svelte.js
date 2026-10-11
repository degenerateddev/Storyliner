import { getContext, setContext } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { api } from '$lib/api/client';
import { exportStory } from '$lib/export';
import { emptyStory, newId, normalizeCharacter, normalizeStory } from './model';

const CONTEXT_KEY = Symbol('editor');
const CACHE_KEY = 'storyliner:story';
const SAVE_DELAY = 800;
const RETRY_DELAY = 5000;

/** @typedef {'saved' | 'saving' | 'error' | 'offline'} SaveStatus */

function readCache() {
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		return cached ? JSON.parse(cached) : null;
	} catch {
		return null;
	}
}

/** @param {string} serialized */
function writeCache(serialized) {
	try {
		localStorage.setItem(CACHE_KEY, serialized);
	} catch {
		// Storage full or unavailable: the server copy is still the source of truth.
	}
}

/**
 * @param {string} filename
 * @param {string} content
 * @param {string} mime
 */
function download(filename, content, mime) {
	const blob = new Blob([content], { type: `${mime};charset=utf-8` });
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

/**
 * Owns the story and the characters, and persists them (debounced) to the API
 * with a localStorage cache for offline use.
 */
export class EditorStore {
	/** @type {import('./model').Character[]} */
	characters = $state([]);
	/** Top-level story fields except `sections` (name, custom keys). */
	info = $state(/** @type {Record<string, any>} */ ({ name: 'Untitled story' }));
	/** Story the canvas is built from; replaced on import. */
	story = $state.raw(/** @type {any} */ (emptyStory()));
	/** Bumped whenever `story` is replaced so the canvas rebuilds. */
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
	#inFlight = false;

	/** @param {{ story: unknown, characters: unknown[] | null, offline: boolean }} data */
	constructor({ story, characters, offline }) {
		const initial = offline ? (readCache() ?? story) : story;
		this.load(initial ?? emptyStory());
		this.#savedSerialized = offline ? '' : JSON.stringify(this.story);
		this.characters = (characters ?? []).map(normalizeCharacter);
		if (offline) this.#fail('offline', 'Server unreachable – working from the local copy.');
	}

	/** @param {unknown} raw */
	load(raw) {
		const story = normalizeStory(raw);
		const { sections: _sections, ...info } = story;
		this.story = story;
		this.info = info;
		this.revision++;
	}

	/** Called by the canvas whenever the graph changes. Cheap when nothing changed. */
	queueSave(/** @type {unknown} */ story) {
		const serialized = JSON.stringify(story);
		if (serialized === this.#latestSerialized) return;

		this.#latest = story;
		this.#latestSerialized = serialized;
		writeCache(serialized);

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

	/** Save immediately (also used for Ctrl+S). */
	async flush() {
		clearTimeout(this.#timer);
		if (this.#inFlight || !this.hasUnsavedChanges) return;

		this.#inFlight = true;
		const serialized = this.#latestSerialized;
		const result = await api.saveStory(this.#latest);
		this.#inFlight = false;

		if (result.ok) {
			this.#savedSerialized = serialized;
			if (this.hasUnsavedChanges) {
				this.flush();
			} else {
				this.status = 'saved';
				this.message = '';
			}
			return;
		}

		this.#handleError(result.status, 'Could not save the story.');
		this.#timer = setTimeout(() => this.flush(), RETRY_DELAY);
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
		const result = await api.deleteCharacter(id);
		// 404: it never reached the server (e.g. created while offline) – nothing to delete.
		if (!result.ok && result.status !== 404)
			this.#handleError(result.status, 'Could not delete the character.');
	}

	/** @param {string} id */
	character(id) {
		return this.characters.find((c) => c.id === id);
	}

	/** @param {string} formatId - see EXPORT_FORMATS */
	exportAs(formatId) {
		// Twine needs a stable story id; it is stored with the story so re-exports keep it.
		if (formatId === 'twee' && !this.info.ifid) this.info.ifid = newId().toUpperCase();
		const story = {
			.../** @type {object} */ (this.#latest ?? this.story),
			...$state.snapshot(this.info)
		};
		const { content, extension, mime } = exportStory(formatId, { story });
		download(`${slug(this.info.name)}.${extension}`, content, mime);
	}

	exportCharacters() {
		const characters = JSON.stringify($state.snapshot(this.characters), null, 4) + '\n';
		download('characters.json', characters, 'application/json');
	}

	/** @param {import('./model').Character} character */
	async #saveCharacter(character) {
		const result = await api.saveCharacter($state.snapshot(character));
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
