import { MarkerType } from '@xyflow/svelte';
import {
	CHOICE_KEYS,
	CHOICE_PREFIX,
	formatPair,
	fromFields,
	LINE_KEYS,
	normalizeCharacter,
	parsePair,
	readableId,
	SECTION_SIZE,
	splitFields,
	toFields,
	withOptions
} from './model';

export const EDGE_DEFAULTS = {
	type: 'smoothstep',
	markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 }
};

/**
 * @param {string} source
 * @param {string} target
 * @param {string | null} [sourceHandle] - choice id when the edge starts at a choice
 */
export const makeEdge = (source, target, sourceHandle = null) => ({
	...EDGE_DEFAULTS,
	id: sourceHandle ? `${source}:${sourceHandle}->${target}` : `${source}->${target}`,
	source,
	target,
	sourceHandle
});

/** @param {string} line @param {string} choice */
const choiceKey = (line, choice) => JSON.stringify([line, choice]);

/**
 * Dialogue graph -> Svelte Flow nodes/edges. Sections always precede their texts.
 * `data.raw` keeps the original object so unknown keys survive a save; the editable
 * custom keys of a line or choice live in its `fields`.
 * A line with choices has no plain outgoing handle, so its plain arrows become extra choices
 * (without text, like the option the export would make of them).
 * @param {{ sections: any[] }} graph - a graph of a normalized story
 * @param {Iterable<string>} [reserved] - ids used elsewhere (other graphs), not to be generated
 */
export function storyToFlow(graph, reserved = []) {
	/** @type {any[]} */
	const nodes = [];
	/** @type {any[]} */
	const edges = [];
	const taken = new Set([
		...reserved,
		...graph.sections.flatMap((/** @type {any} */ section) =>
			section.texts.flatMap((/** @type {any} */ text) => [
				text.meta.id,
				...text.data.choices.map((/** @type {any} */ choice) => choice.id)
			])
		)
	]);

	for (const { texts, ...section } of graph.sections) {
		const [x, y] = parsePair(section.meta.position, [0, 0]);
		const [width, height] = parsePair(section.meta.size, [SECTION_SIZE.width, SECTION_SIZE.height]);
		nodes.push({
			id: section.meta.id,
			type: 'section',
			position: { x, y },
			width,
			height,
			data: { label: section.label, raw: section }
		});

		for (const text of texts) {
			const [tx, ty] = parsePair(text.meta.position, [0, 0]);
			/** @type {any[]} */
			const choices = [...text.data.choices];
			const next = choices.length ? [] : text.data.next;
			if (choices.length) {
				for (const target of text.data.next) {
					const id = readableId(CHOICE_PREFIX, taken);
					taken.add(id);
					choices.push({ id, text: '', next: target });
				}
			}

			const line = splitFields(text.data, LINE_KEYS);
			nodes.push({
				id: text.meta.id,
				type: 'text',
				parentId: section.meta.id,
				position: { x: tx, y: ty },
				data: {
					character: text.data.character,
					content: text.data.content,
					fields: toFields(line.values, text.meta.options),
					choices: choices.map((choice) => {
						const { values, rest } = splitFields(choice, CHOICE_KEYS);
						return {
							id: choice.id,
							text: choice.text,
							fields: toFields(values, choice.meta?.options),
							raw: rest
						};
					}),
					raw: { ...text, data: line.rest }
				}
			});
			for (const target of next) edges.push(makeEdge(text.meta.id, target));
			for (const choice of choices) {
				if (choice.next) edges.push(makeEdge(text.meta.id, choice.next, choice.id));
			}
		}
	}

	return { nodes, edges };
}

/**
 * Svelte Flow nodes/edges -> dialogue graph JSON. The canvas is the single source of truth while
 * editing, so positions, sizes and `next` links can never drift out of sync.
 * @param {any[]} nodes
 * @param {any[]} edges
 * @param {import('./model').Character[]} characters - current character list (names may have changed)
 * @param {Record<string, unknown>} [info] - other fields of the graph (id, name, ...)
 */
export function flowToStory(nodes, edges, characters, info = {}) {
	const charactersById = new Map(characters.map((c) => [c.id, c]));

	/** Plain arrows, keyed by source line. @type {Map<string, string[]>} */
	const nextBySource = new Map();
	/** Choice arrows, keyed by choiceKey(line, choice). @type {Map<string, string>} */
	const nextByChoice = new Map();
	for (const edge of edges) {
		if (edge.sourceHandle) {
			nextByChoice.set(choiceKey(edge.source, edge.sourceHandle), edge.target);
			continue;
		}
		const list = nextBySource.get(edge.source) ?? [];
		if (!list.includes(edge.target)) list.push(edge.target);
		nextBySource.set(edge.source, list);
	}

	/** @type {Map<string, any>} */
	const sections = new Map();
	for (const node of nodes) {
		if (node.type !== 'section') continue;
		const raw = node.data.raw ?? {};
		sections.set(node.id, {
			...raw,
			meta: {
				...raw.meta,
				id: node.id,
				type: 'section',
				position: formatPair(node.position.x, node.position.y),
				size: formatPair(
					node.width ?? node.measured?.width ?? SECTION_SIZE.width,
					node.height ?? node.measured?.height ?? SECTION_SIZE.height
				)
			},
			label: node.data.label,
			texts: []
		});
	}

	for (const node of nodes) {
		const section = node.type === 'text' && sections.get(node.parentId);
		if (!section) continue;
		const raw = node.data.raw ?? {};
		const character = node.data.character
			? normalizeCharacter(charactersById.get(node.data.character.id) ?? node.data.character)
			: null;

		const line = fromFields(node.data.fields ?? []);

		section.texts.push({
			...raw,
			meta: withOptions(
				{
					...raw.meta,
					id: node.id,
					type: 'text',
					parentId: node.parentId,
					position: formatPair(node.position.x, node.position.y)
				},
				line.options
			),
			data: {
				...raw.data,
				...line.values,
				character,
				content: node.data.content ?? '',
				next: nextBySource.get(node.id) ?? [],
				choices: (node.data.choices ?? []).map((/** @type {any} */ choice) => {
					const { meta: oldMeta, ...rest } = choice.raw ?? {};
					const own = fromFields(choice.fields ?? []);
					const meta = withOptions(oldMeta, own.options);
					return {
						...rest,
						...own.values,
						...(Object.keys(meta).length ? { meta } : {}),
						id: choice.id,
						text: choice.text ?? '',
						next: nextByChoice.get(choiceKey(node.id, choice.id)) ?? ''
					};
				})
			}
		});
	}

	return { ...info, sections: [...sections.values()] };
}
