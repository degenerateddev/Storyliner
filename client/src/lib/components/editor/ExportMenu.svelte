<script>
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { EXPORT_FORMATS } from '$lib/export';
	import { getEditor } from '$lib/story/store.svelte.js';

	const editor = getEditor();

	let open = $state(false);
	/** @type {HTMLDivElement | undefined} */
	let root;

	/** @param {() => void} action */
	function choose(action) {
		open = false;
		action();
	}

	/** @param {MouseEvent} event */
	function onWindowClick(event) {
		if (open && root && !root.contains(/** @type {Node} */ (event.target))) open = false;
	}
</script>

<svelte:window
	onclick={onWindowClick}
	onkeydown={(event) => event.key === 'Escape' && (open = false)}
/>

<div class="relative" bind:this={root}>
	<Button
		variant="secondary"
		size="sm"
		onclick={() => (open = !open)}
		aria-haspopup="menu"
		aria-expanded={open}
	>
		<Icon name="download" class="size-4" /> Export
		<span class="text-[10px] text-stone-400" aria-hidden="true">▾</span>
	</Button>

	{#if open}
		<div
			role="menu"
			class="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-stone-200"
		>
			<p class="px-4 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-stone-400">Story</p>
			{#each EXPORT_FORMATS as format (format.id)}
				<button
					type="button"
					role="menuitem"
					onclick={() => choose(() => editor.exportAs(format.id))}
					class="flex w-full items-baseline gap-3 px-4 py-2 text-left hover:bg-stone-50 focus:bg-stone-50 focus:outline-none"
				>
					<span class="min-w-0 flex-1">
						<span class="block text-sm font-medium text-stone-900">{format.label}</span>
						<span class="block text-xs text-stone-500">{format.engines}</span>
					</span>
					<span class="font-mono text-xs text-stone-400">.{format.extension}</span>
				</button>
			{/each}
			<div class="my-1 border-t border-stone-100"></div>
			<button
				type="button"
				role="menuitem"
				onclick={() => choose(() => editor.exportCharacters())}
				class="flex w-full items-baseline gap-3 px-4 py-2 text-left hover:bg-stone-50 focus:bg-stone-50 focus:outline-none"
			>
				<span class="flex-1 text-sm font-medium text-stone-900">Characters</span>
				<span class="font-mono text-xs text-stone-400">.json</span>
			</button>
		</div>
	{/if}
</div>
