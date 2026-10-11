<script>
	import { onMount } from 'svelte';
	import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';
	import { getEditor } from '$lib/story/store.svelte.js';
	import { characterColor } from '$lib/story/characters';
	import Icon from '$lib/components/ui/Icon.svelte';

	/** @type {{ id: string, data: any, selected?: boolean }} */
	let { id, data, selected = false } = $props();

	const editor = getEditor();
	const { updateNodeData } = useSvelteFlow();

	const characterId = $derived(data.character?.id ?? '');
	const known = $derived(editor.character(characterId));
	const name = $derived(known?.name ?? data.character?.name ?? 'Narrator');
	const color = $derived(characterColor(characterId || undefined));

	/** @type {HTMLTextAreaElement | undefined} */
	let textarea;
	onMount(() => {
		// Svelte Flow hides nodes until they are measured, so wait a frame before focusing.
		if (data.focus) requestAnimationFrame(() => requestAnimationFrame(() => textarea?.focus()));
	});

	/** @param {Event & { currentTarget: HTMLSelectElement }} event */
	function changeCharacter(event) {
		const character = editor.character(event.currentTarget.value);
		updateNodeData(id, { character: character ? { ...character } : null });
	}
</script>

<div
	class="w-64 rounded-lg bg-white shadow-sm ring-1 transition-shadow hover:shadow-md {selected
		? 'ring-2 ring-accent-500'
		: 'ring-stone-300'}"
>
	<div
		class="flex cursor-move items-center gap-2 rounded-t-lg px-3 py-1.5"
		style:background-color={color}
	>
		<select
			value={characterId}
			onchange={changeCharacter}
			aria-label="Speaker"
			class="nodrag min-w-0 max-w-[11rem] cursor-pointer appearance-none truncate border-0 bg-transparent !bg-none p-0 pr-1 text-xs font-semibold uppercase tracking-wide text-white [field-sizing:content] focus:ring-0"
		>
			<option value="" class="text-stone-900">Narrator</option>
			{#if characterId && !known}
				<option value={characterId} class="text-stone-900">{name} (deleted)</option>
			{/if}
			{#each editor.characters as character (character.id)}
				<option value={character.id} class="text-stone-900">{character.name}</option>
			{/each}
		</select>
		<span class="-ml-1 text-[10px] text-white/80" aria-hidden="true">▾</span>
		<span class="flex-1"></span>
		<span title="Drag to move"><Icon name="grip" class="size-4 text-white/60" /></span>
	</div>
	<textarea
		bind:this={textarea}
		value={data.content}
		oninput={(event) => updateNodeData(id, { content: event.currentTarget.value })}
		placeholder="Write a line…"
		rows="3"
		class="nodrag nowheel block max-h-64 min-h-[4.5rem] w-full resize-none rounded-b-lg border-0 bg-transparent px-3 py-2 text-sm leading-relaxed text-stone-800 [field-sizing:content] placeholder:text-stone-400 focus:ring-0"
	></textarea>

	<Handle type="target" position={Position.Left} />
	<Handle type="source" position={Position.Right} />
</div>
