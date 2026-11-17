<script>
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { EXPORT_FORMATS } from '$lib/export';
	import { languageName, ORIGINAL, variantsOf } from '$lib/story/localization';
	import { getEditor } from '$lib/story/store.svelte.js';

	const editor = getEditor();

	/** Whether engine formats are exported for every version of the open dialogue. */
	let allLanguages = $state(false);
	const variants = $derived(variantsOf(editor.graph));
	const currentName = $derived(
		editor.activeLanguage === ORIGINAL
			? editor.graph.language
				? languageName(editor.graph.language)
				: 'Original'
			: languageName(editor.activeLanguage)
	);
	const scopes = $derived([
		{ all: false, label: currentName, title: 'Export the language on the canvas' },
		{
			all: true,
			label: `All ${variants.length}`,
			title: 'Export every language of this dialogue, one file each, as a ZIP'
		}
	]);

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
			{#if variants.length > 1}
				<div class="flex items-center gap-3 px-4 pb-2 pt-1">
					<span class="text-xs font-medium text-stone-500">Language</span>
					<div
						role="radiogroup"
						aria-label="Languages to export"
						class="flex flex-1 rounded-lg bg-stone-100 p-0.5"
					>
						{#each scopes as scope (scope.all)}
							<button
								type="button"
								role="radio"
								aria-checked={allLanguages === scope.all}
								title={scope.title}
								onclick={() => (allLanguages = scope.all)}
								class="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-xs font-medium {allLanguages ===
								scope.all
									? 'bg-white text-stone-900 shadow-sm'
									: 'text-stone-500 hover:text-stone-800'}"
							>
								{scope.label}
							</button>
						{/each}
					</div>
				</div>
			{/if}
			{#each EXPORT_FORMATS as format (format.id)}
				{@const zipped = allLanguages && variants.length > 1 && format.id !== 'storyliner'}
				<button
					type="button"
					role="menuitem"
					onclick={() => choose(() => editor.exportAs(format.id, { allLanguages }))}
					class="flex w-full items-baseline gap-3 px-4 py-2 text-left hover:bg-stone-50 focus:bg-stone-50 focus:outline-none"
				>
					<span class="min-w-0 flex-1">
						<span class="block text-sm font-medium text-stone-900">{format.label}</span>
						<span class="block text-xs text-stone-500">{format.engines}</span>
					</span>
					<span class="font-mono text-xs text-stone-400">
						{zipped ? `.zip (${variants.length} × .${format.extension})` : `.${format.extension}`}
					</span>
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
