<script>
	import { untrack } from 'svelte';
	import {
		Background,
		BackgroundVariant,
		Controls,
		MiniMap,
		SvelteFlow,
		useSvelteFlow
	} from '@xyflow/svelte';
	import TextNode from './TextNode.svelte';
	import SectionNode from './SectionNode.svelte';
	import { getEditor } from '$lib/story/store.svelte.js';
	import { EDGE_DEFAULTS, flowToStory, makeEdge, storyToFlow } from '$lib/story/convert';
	import { newId, SECTION_SIZE, TEXT_WIDTH } from '$lib/story/model';
	import { CHARACTER_MIME, characterColor } from '$lib/story/characters';
	import { confirm } from '$lib/components/ui/confirm.svelte.js';

	const nodeTypes = { text: TextNode, section: SectionNode };
	const SECTION_PADDING = { x: 24, top: 56, bottom: 24 };
	const TEXT_HEIGHT_ESTIMATE = 120;

	const editor = getEditor();
	const { screenToFlowPosition, getInternalNode } = useSvelteFlow();

	// The canvas is rebuilt (via {#key}) whenever the editor loads a new story.
	const initial = untrack(() => storyToFlow(editor.story));
	let nodes = $state.raw(initial.nodes);
	let edges = $state.raw(initial.edges);

	// Every graph change is serialized and handed to the store (which debounces the save).
	$effect(() => {
		const story = flowToStory(nodes, edges, editor.characters, editor.info);
		untrack(() => editor.queueSave(story));
	});

	/** @param {any} node */
	const sizeOf = (node) => ({
		width: node.width ?? node.measured?.width ?? SECTION_SIZE.width,
		height: node.height ?? node.measured?.height ?? SECTION_SIZE.height
	});

	/**
	 * Topmost section containing a flow position.
	 * @param {{ x: number, y: number }} point
	 */
	function sectionAt(point) {
		return nodes.findLast((node) => {
			if (node.type !== 'section') return false;
			const { width, height } = sizeOf(node);
			return (
				point.x >= node.position.x &&
				point.x <= node.position.x + width &&
				point.y >= node.position.y &&
				point.y <= node.position.y + height
			);
		});
	}

	/** @param {{ x: number, y: number }} point */
	function createSection(point) {
		const count = nodes.filter((node) => node.type === 'section').length;
		const section = {
			id: newId(),
			type: 'section',
			position: { x: point.x - SECTION_PADDING.x, y: point.y - SECTION_PADDING.top },
			...SECTION_SIZE,
			data: { label: `Section ${count + 1}`, raw: {} }
		};
		nodes = [...nodes, section];
		return section;
	}

	/**
	 * Add a text node at a flow position, inside the section under it (or a new one).
	 * Grows the section if the text would stick out.
	 * @param {{ x: number, y: number }} point - desired top-left of the text node
	 * @param {import('$lib/story/model').Character | null} character
	 */
	function addText(point, character) {
		const section = sectionAt(point) ?? createSection(point);
		const position = {
			x: Math.max(SECTION_PADDING.x, point.x - section.position.x),
			y: Math.max(SECTION_PADDING.top, point.y - section.position.y)
		};
		const { width, height } = sizeOf(section);
		const needed = {
			width: Math.max(width, position.x + TEXT_WIDTH + SECTION_PADDING.x),
			height: Math.max(height, position.y + TEXT_HEIGHT_ESTIMATE + SECTION_PADDING.bottom)
		};

		const text = {
			id: newId(),
			type: 'text',
			parentId: section.id,
			position,
			data: { character: character ? { ...character } : null, content: '', raw: {}, focus: true }
		};
		nodes = [
			...nodes.map((node) => (node.id === section.id ? { ...node, ...needed } : node)),
			text
		];
		return text;
	}

	/** @param {DragEvent} event */
	function onDragOver(event) {
		if (!event.dataTransfer?.types.includes(CHARACTER_MIME)) return;
		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';
	}

	/** @param {DragEvent} event */
	function onDrop(event) {
		const id = event.dataTransfer?.getData(CHARACTER_MIME);
		if (!id) return;
		event.preventDefault();
		const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
		addText({ x: point.x - 24, y: point.y - 16 }, editor.character(id) ?? null);
	}

	/** Dropping a connection on empty canvas creates a follow-up line by the same speaker. */
	/** @type {import('@xyflow/svelte').OnConnectEnd} */
	function onConnectEnd(event, connection) {
		if (connection.isValid || !connection.fromNode || connection.fromHandle?.type !== 'source')
			return;
		const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
		const point = screenToFlowPosition({ x: clientX, y: clientY });
		const source = connection.fromNode;
		const text = addText(
			{ x: point.x, y: point.y - 20 },
			/** @type {any} */ (source.data.character) ?? null
		);
		edges = [...edges, makeEdge(source.id, text.id)];
	}

	/** @param {any} connection */
	const isValidConnection = (connection) =>
		connection.source !== connection.target &&
		!edges.some((edge) => edge.source === connection.source && edge.target === connection.target);

	/** Moving a line onto another section moves it into that section. */
	/** @param {{ nodes: any[] }} event */
	function onNodeDragStop({ nodes: dragged }) {
		/** @type {Map<string, { parentId: string, position: { x: number, y: number } }>} */
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local, not reactive state
		const moves = new Map();

		for (const node of dragged) {
			if (node.type !== 'text') continue;
			const internal = getInternalNode(node.id);
			if (!internal) continue;
			const absolute = internal.internals.positionAbsolute;
			const center = {
				x: absolute.x + (internal.measured.width ?? TEXT_WIDTH) / 2,
				y: absolute.y + (internal.measured.height ?? 0) / 2
			};
			const target = sectionAt(center);
			if (target && target.id !== node.parentId) {
				moves.set(node.id, {
					parentId: target.id,
					position: { x: absolute.x - target.position.x, y: absolute.y - target.position.y }
				});
			}
		}
		if (moves.size === 0) return;

		// Children must come after their parent, so moved nodes go to the end.
		const updated = nodes.map((node) =>
			moves.has(node.id) ? { ...node, ...moves.get(node.id) } : node
		);
		nodes = [...updated.filter((n) => !moves.has(n.id)), ...updated.filter((n) => moves.has(n.id))];
	}

	/** @type {import('@xyflow/svelte').OnBeforeDelete} */
	async function onBeforeDelete({ nodes: removed }) {
		const sectionIds = new Set(removed.filter((n) => n.type === 'section').map((n) => n.id));
		if (sectionIds.size === 0) return true;

		const lines = nodes.filter((n) => n.type === 'text' && sectionIds.has(n.parentId)).length;
		return confirm({
			title: sectionIds.size === 1 ? 'Delete this section?' : `Delete ${sectionIds.size} sections?`,
			message: lines
				? `This also deletes the ${lines} line${lines === 1 ? '' : 's'} inside.`
				: undefined,
			confirmLabel: 'Delete',
			danger: true
		});
	}

	/** @param {any} node */
	const minimapColor = (node) =>
		node.type === 'section' ? 'rgba(216, 30, 91, 0.15)' : characterColor(node.data.character?.id);
</script>

<div class="relative h-full w-full" role="application" ondragover={onDragOver} ondrop={onDrop}>
	<SvelteFlow
		bind:nodes
		bind:edges
		{nodeTypes}
		{isValidConnection}
		defaultEdgeOptions={EDGE_DEFAULTS}
		fitView
		fitViewOptions={{ maxZoom: 1 }}
		minZoom={0.1}
		deleteKey={['Delete', 'Backspace']}
		onconnectend={onConnectEnd}
		onnodedragstop={onNodeDragStop}
		onbeforedelete={onBeforeDelete}
	>
		<Controls />
		<Background variant={BackgroundVariant.Dots} gap={20} />
		<MiniMap nodeColor={minimapColor} pannable zoomable />
	</SvelteFlow>

	{#if nodes.length === 0}
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
			<div
				class="max-w-md rounded-2xl bg-white/90 p-6 text-center shadow-lg ring-1 ring-stone-200 backdrop-blur"
			>
				<h2 class="text-lg font-semibold text-stone-900">Start your story</h2>
				<ol class="mt-4 space-y-2 text-left text-sm text-stone-600">
					<li>
						<span class="font-semibold text-accent-600">1.</span> Add a character in the panel on the
						left.
					</li>
					<li>
						<span class="font-semibold text-accent-600">2.</span> Drag the character onto the canvas
						to write a line.
					</li>
					<li>
						<span class="font-semibold text-accent-600">3.</span> Drag from a line's right handle to
						another line to connect them, or onto empty space to create the next line.
					</li>
				</ol>
			</div>
		</div>
	{/if}
</div>
