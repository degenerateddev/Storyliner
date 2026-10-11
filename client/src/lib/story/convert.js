import { MarkerType } from '@xyflow/svelte';
import { formatPair, normalizeCharacter, parsePair, SECTION_SIZE } from './model';

export const EDGE_DEFAULTS = {
	type: 'smoothstep',
	markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 }
};

/** @param {string} source @param {string} target */
export const makeEdge = (source, target) => ({
	...EDGE_DEFAULTS,
	id: `${source}->${target}`,
	source,
	target
});

/**
 * Story JSON -> Svelte Flow nodes/edges. Sections always precede their texts.
 * `data.raw` keeps the original object so unknown keys survive a save.
 * @param {any} story - a normalized story
 */
export function storyToFlow(story) {
	/** @type {any[]} */
	const nodes = [];
	/** @type {any[]} */
	const edges = [];

	for (const { texts, ...section } of story.sections) {
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
			nodes.push({
				id: text.meta.id,
				type: 'text',
				parentId: section.meta.id,
				position: { x: tx, y: ty },
				data: { character: text.data.character, content: text.data.content, raw: text }
			});
			for (const target of text.data.next) edges.push(makeEdge(text.meta.id, target));
		}
	}

	return { nodes, edges };
}

/**
 * Svelte Flow nodes/edges -> story JSON. The canvas is the single source of truth while
 * editing, so positions, sizes and `next` links can never drift out of sync.
 * @param {any[]} nodes
 * @param {any[]} edges
 * @param {import('./model').Character[]} characters - current character list (names may have changed)
 * @param {Record<string, unknown>} info - top-level story fields (name, ...)
 */
export function flowToStory(nodes, edges, characters, info) {
	const charactersById = new Map(characters.map((c) => [c.id, c]));

	/** @type {Map<string, string[]>} */
	const nextBySource = new Map();
	for (const edge of edges) {
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

		section.texts.push({
			...raw,
			meta: {
				...raw.meta,
				id: node.id,
				type: 'text',
				parentId: node.parentId,
				position: formatPair(node.position.x, node.position.y)
			},
			data: {
				...raw.data,
				character,
				content: node.data.content ?? '',
				next: nextBySource.get(node.id) ?? []
			}
		});
	}

	return { ...info, sections: [...sections.values()] };
}
