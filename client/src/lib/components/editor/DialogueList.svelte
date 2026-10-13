<script>
	import { tick } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { confirm } from '$lib/components/ui/confirm.svelte.js';
	import { getEditor } from '$lib/story/store.svelte.js';

	const editor = getEditor();

	/** Graph whose name is being edited. @type {string | null} */
	let renamingId = $state(null);

	/** @param {string} id */
	async function startRename(id) {
		renamingId = id;
		await tick();
		/** @type {HTMLInputElement | null} */ (
			document.querySelector(`[data-rename-graph="${CSS.escape(id)}"]`)
		)?.select();
	}

	function add() {
		startRename(editor.addGraph().id);
	}

	/** @param {Event & { currentTarget: HTMLInputElement }} event @param {string} id */
	function commit(event, id) {
		if (renamingId !== id) return;
		editor.renameGraph(id, event.currentTarget.value);
		renamingId = null;
	}

	/** @param {any} graph */
	async function remove(graph) {
		const lines = editor.linesIn(graph);
		const ok = await confirm({
			title: `Delete “${graph.name}”?`,
			message: lines
				? `This deletes its ${lines} line${lines === 1 ? '' : 's'}. Export the story first if you want to keep them.`
				: undefined,
			confirmLabel: 'Delete',
			danger: true
		});
		if (ok) editor.removeGraph(graph.id);
	}
</script>

<div class="border-b border-stone-200 p-4">
	<div class="flex items-center justify-between">
		<h2 class="text-sm font-semibold text-stone-900">Dialogues</h2>
		<Button variant="ghost" size="sm" onclick={add} title="Create a new dialogue graph">
			<Icon name="plus" class="size-4" /> New dialogue
		</Button>
	</div>
	<ul class="mt-2 max-h-48 space-y-0.5 overflow-y-auto">
		{#each editor.graphs as graph (graph.id)}
			{@const active = graph.id === editor.activeGraphId}
			<li>
				{#if renamingId === graph.id}
					<input
						data-rename-graph={graph.id}
						value={graph.name}
						onblur={(event) => commit(event, graph.id)}
						onkeydown={(event) => {
							if (event.key === 'Enter') event.currentTarget.blur();
							if (event.key === 'Escape') renamingId = null;
						}}
						aria-label="Dialogue name"
						class="w-full rounded-md border-stone-300 px-2 py-1.5 text-sm focus:border-accent-500 focus:ring-accent-500"
					/>
				{:else}
					<div
						class="group flex items-center gap-1 rounded-lg pr-1 {active
							? 'bg-accent-50 text-accent-700'
							: 'text-stone-700 hover:bg-stone-100'}"
					>
						<button
							type="button"
							onclick={() => editor.selectGraph(graph.id)}
							ondblclick={() => startRename(graph.id)}
							aria-current={active}
							title="Open – double-click to rename"
							class="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm font-medium"
						>
							<Icon name="chat" class="size-4 shrink-0 {active ? '' : 'text-stone-400'}" />
							<span class="truncate">{graph.name}</span>
						</button>
						<span
							class="flex opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
						>
							<button
								type="button"
								onclick={() => startRename(graph.id)}
								aria-label="Rename {graph.name}"
								class="rounded p-1 text-stone-500 hover:bg-white hover:text-stone-900"
							>
								<Icon name="pencil" class="size-4" />
							</button>
							{#if editor.graphs.length > 1}
								<button
									type="button"
									onclick={() => remove(graph)}
									aria-label="Delete {graph.name}"
									class="rounded p-1 text-stone-500 hover:bg-white hover:text-red-600"
								>
									<Icon name="trash" class="size-4" />
								</button>
							{/if}
						</span>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
</div>
