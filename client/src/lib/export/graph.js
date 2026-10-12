import { normalizeStory, parsePair } from '$lib/story/model';
import { identifier, optionLabel, uniqueNamer } from './text';

/**
 * @typedef {{ id: string, name: string, meta: string }} Speaker
 * @typedef {{
 *   id: string,
 *   section: { id: string, label: string },
 *   speaker: Speaker | null,
 *   text: string,
 *   next: string[],
 *   choices: { id: string, text: string, next: string }[],
 *   position: { x: number, y: number }
 * }} Line
 * @typedef {{
 *   id: string | null,
 *   label: string,
 *   target: Block | null,
 *   line: Line | null
 * }} Option - `id` is set for choices defined on the line; `target` is null when the choice ends the dialogue
 * @typedef {{ type: 'end' } | { type: 'goto', target: Block } | { type: 'choice', options: Option[] }} Exit
 * @typedef {{ name: string, section: Line['section'], lines: Line[], exit: Exit }} Block
 * @typedef {{ first: Line, lines: Line[] }} Draft
 * @typedef {{
 *   name: string,
 *   info: Record<string, any>,
 *   lines: Line[],
 *   blocks: Block[],
 *   entries: Block[],
 *   speakers: Speaker[]
 * }} CompiledStory
 */

/**
 * Turn the story graph into engine-friendly blocks:
 * - a block is a run of lines that simply follow each other (one `next`, one incoming link),
 * - a block ends with nothing (end of dialogue), a jump to another block, or a choice:
 *   a line with explicit `choices` (each one a player option with its own text and id)
 *   or with several `next` links (each target becomes an option labelled with its text).
 *   Plain links of a line with explicit choices are offered as additional options.
 * Every target of a jump or choice starts its own block, so all formats can express it.
 * @param {any} rawStory - Storyliner story JSON
 * @returns {CompiledStory}
 */
export function compileStory(rawStory) {
	const { sections, ...info } = normalizeStory(rawStory);

	/** @type {Line[]} */
	const lines = [];
	for (const section of sections) {
		const [sx, sy] = parsePair(section.meta.position, [0, 0]);
		// Dialogue flows left to right on the canvas.
		const texts = section.texts
			.map((/** @type {any} */ text) => ({ text, at: parsePair(text.meta.position, [0, 0]) }))
			.sort(
				(/** @type {{ at: number[] }} */ a, /** @type {{ at: number[] }} */ b) =>
					a.at[0] - b.at[0] || a.at[1] - b.at[1]
			);

		for (const { text, at } of texts) {
			lines.push({
				id: text.meta.id,
				section: { id: section.meta.id, label: section.label },
				speaker: text.data.character,
				text: text.data.content,
				next: text.data.next,
				choices: text.data.choices,
				position: { x: sx + at[0], y: sy + at[1] }
			});
		}
	}

	const byId = new Map(lines.map((line) => [line.id, line]));
	/** @param {Line} line */
	const hasChoice = (line) => line.choices.length > 0 || line.next.length > 1;
	/** Every line a line can lead to, in option order (choices, then plain links). @param {Line} line */
	const targetsOf = (line) => [
		...line.choices.map((choice) => choice.next).filter(Boolean),
		...line.next
	];

	const incoming = new Map(lines.map((line) => [line.id, 0]));
	const choiceTargets = new Set();
	for (const line of lines) {
		const targets = targetsOf(line);
		for (const target of targets) incoming.set(target, (incoming.get(target) ?? 0) + 1);
		if (hasChoice(line)) targets.forEach((target) => choiceTargets.add(target));
	}

	// Entry points: lines nobody leads to, plus the first line of any part of the graph that is
	// unreachable from those (e.g. a conversation whose opening line is also the target of a loop).
	const entryIds = new Set(
		lines.filter((line) => incoming.get(line.id) === 0).map((line) => line.id)
	);
	const reached = new Set();
	/** @param {string} id */
	const reach = (id) => {
		const stack = [id];
		while (stack.length) {
			const current = /** @type {string} */ (stack.pop());
			if (reached.has(current)) continue;
			reached.add(current);
			stack.push(...targetsOf(/** @type {Line} */ (byId.get(current))));
		}
	};
	entryIds.forEach(reach);
	for (const line of lines) {
		if (!reached.has(line.id)) {
			entryIds.add(line.id);
			reach(line.id);
		}
	}

	/** @param {Line} line */
	const startsBlock = (line) =>
		incoming.get(line.id) !== 1 || choiceTargets.has(line.id) || entryIds.has(line.id);

	/** @type {Map<string, Draft>} */
	const blockOf = new Map();
	/** @type {Draft[]} */
	const drafts = [];

	/** @param {Line} first */
	function buildBlock(first) {
		const draft = { first, lines: [first] };
		blockOf.set(first.id, draft);
		let current = first;
		while (current.next.length === 1 && !hasChoice(current)) {
			const following = /** @type {Line} */ (byId.get(current.next[0]));
			if (startsBlock(following) || blockOf.has(following.id)) break;
			draft.lines.push(following);
			blockOf.set(following.id, draft);
			current = following;
		}
		drafts.push(draft);
	}

	for (const line of lines) if (startsBlock(line)) buildBlock(line);

	// Reading order: follow jumps and choices from each entry point, depth first.
	/** @type {Draft[]} */
	const ordered = [];
	const placed = new Set();
	/** @param {Draft} draft */
	const place = (draft) => {
		if (placed.has(draft)) return;
		placed.add(draft);
		ordered.push(draft);
		const last = draft.lines[draft.lines.length - 1];
		for (const id of targetsOf(last)) place(/** @type {Draft} */ (blockOf.get(id)));
	};
	for (const draft of drafts) if (entryIds.has(draft.first.id)) place(draft);
	drafts.forEach(place);

	// Names: <Section>_<n>, valid identifiers in every target format.
	const uniqueName = uniqueNamer();
	/** @type {Map<string, number>} */
	const counters = new Map();
	/** @type {Map<Draft, Block>} */
	const blocks = new Map();
	for (const draft of ordered) {
		const base = identifier(draft.first.section.label, 'Section');
		const count = (counters.get(base) ?? 0) + 1;
		counters.set(base, count);
		blocks.set(draft, {
			name: uniqueName(`${base}_${count}`),
			section: draft.first.section,
			lines: draft.lines,
			exit: { type: 'end' }
		});
	}

	/** @param {string} id */
	const blockFor = (id) =>
		/** @type {Block} */ (blocks.get(/** @type {Draft} */ (blockOf.get(id))));

	for (const [draft, block] of blocks) {
		const last = draft.lines[draft.lines.length - 1];
		if (hasChoice(last)) {
			/** @type {Option[]} */
			const explicit = last.choices.map((choice) => {
				const line = choice.next ? /** @type {Line} */ (byId.get(choice.next)) : null;
				return {
					id: choice.id,
					label: choice.text.trim() || (line ? optionLabel(line) : 'Continue'),
					target: line ? blockFor(line.id) : null,
					line
				};
			});
			/** @type {Option[]} */
			const linked = last.next.map((id) => {
				const line = /** @type {Line} */ (byId.get(id));
				return { id: null, label: optionLabel(line), target: blockFor(id), line };
			});
			block.exit = { type: 'choice', options: [...explicit, ...linked] };
		} else if (last.next.length === 1) {
			block.exit = { type: 'goto', target: blockFor(last.next[0]) };
		}
	}

	const allBlocks = [...blocks.values()];
	const entries = allBlocks.filter((block) => entryIds.has(block.lines[0].id));

	/** @type {Map<string, Speaker>} */
	const speakers = new Map();
	for (const line of lines) {
		if (line.speaker && !speakers.has(line.speaker.id)) speakers.set(line.speaker.id, line.speaker);
	}

	return {
		name: String(info.name),
		info,
		lines: allBlocks.flatMap((block) => block.lines),
		blocks: allBlocks,
		entries,
		speakers: [...speakers.values()]
	};
}
