<script>
	import { tick } from 'svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { getEditor } from '$lib/story/store.svelte.js';

	const editor = getEditor();

	/** Graph whose name is being edited. @type {string | null} */
	let renamingId = $state(null);

	/** @param {string} id */
	async function startRename(id) {
		renamingId = id;
		await tick();
		/** @type {HTMLInputElement | null} */ (
			document.querySelector(`[data-rename-tab="${CSS.escape(id)}"]`)
		)?.select();
	}

	/** @param {Event & { currentTarget: HTMLInputElement }} event @param {string} id */
	function commit(event, id) {
		if (renamingId !== id) return;
		editor.renameGraph(id, event.currentTarget.value);
		renamingId = null;
	}
</script>

<nav
	class="flex h-10 shrink-0 items-end gap-1 overflow-x-auto border-b border-stone-200 bg-stone-100 px-3"
	aria-label="Dialogues"
>
	{#each editor.graphs as graph (graph.id)}
		{@const active = graph.id === editor.activeGraphId}
		{#if renamingId === graph.id}
			<input
				data-rename-tab={graph.id}
				value={graph.name}
				onblur={(event) => commit(event, graph.id)}
				onkeydown={(event) => {
					if (event.key === 'Enter') event.currentTarget.blur();
					if (event.key === 'Escape') renamingId = null;
				}}
				aria-label="Dialogue name"
				class="mb-1 h-8 w-40 shrink-0 rounded-md border-stone-300 px-2 text-sm focus:border-accent-500 focus:ring-accent-500"
			/>
		{:else}
			<button
				type="button"
				onclick={() => editor.selectGraph(graph.id)}
				ondblclick={() => startRename(graph.id)}
				aria-current={active ? 'page' : undefined}
				title="{graph.name} – double-click to rename"
				class="flex h-8 max-w-[14rem] shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 px-3 text-sm font-medium {active
					? '-mb-px h-[calc(2rem+1px)] border-stone-200 bg-stone-50 text-stone-900'
					: 'border-transparent text-stone-500 hover:bg-stone-200/60 hover:text-stone-800'}"
			>
				<Icon name="chat" class="size-4 shrink-0 {active ? 'text-accent-600' : ''}" />
				<span class="truncate">{graph.name}</span>
			</button>
		{/if}
	{/each}
	<button
		type="button"
		onclick={() => startRename(editor.addGraph().id)}
		title="New dialogue"
		aria-label="New dialogue"
		class="mb-1 flex size-7 shrink-0 items-center justify-center rounded-md text-stone-500 hover:bg-stone-200 hover:text-stone-900"
	>
		<Icon name="plus" class="size-4" />
	</button>
</nav>
