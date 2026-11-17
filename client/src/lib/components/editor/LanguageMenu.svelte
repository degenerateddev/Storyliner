<script>
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { confirm } from '$lib/components/ui/confirm.svelte.js';
	import {
		cleanLanguage,
		LANGUAGE_CODES,
		languageName,
		ORIGINAL,
		variantsOf
	} from '$lib/story/localization';
	import { getEditor } from '$lib/story/store.svelte.js';

	const editor = getEditor();
	const OTHER = '__other__';
	const MAX_LISTED = 6;
	const input =
		'w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-accent-500 focus:ring-accent-500';

	let open = $state(false);
	/** @type {HTMLDivElement | undefined} */
	let root;
	/** @type {HTMLDialogElement | undefined} */
	let dialog = $state();

	const graph = $derived(editor.graph);
	const variants = $derived(variantsOf(graph));
	const active = $derived(editor.activeLanguage);
	const others = $derived(variants.filter((variant) => variant !== active));

	/** Name of a version of the active graph. @param {string} variant */
	const label = (variant) =>
		variant === ORIGINAL
			? graph.language
				? `${languageName(graph.language)} (original)`
				: 'Original'
			: languageName(variant);

	// Add-localization form.
	let picked = $state('');
	let custom = $state('');
	let original = $state('');
	let error = $state('');
	const used = $derived(new Set([graph.language, ...variants].filter(Boolean)));
	const choices = $derived(LANGUAGE_CODES.filter((code) => !used.has(code)));

	function openAdd() {
		open = false;
		picked = choices.find((code) => code !== 'en') ?? OTHER;
		custom = '';
		original = graph.language ?? '';
		error = '';
		dialog?.showModal();
	}

	/** @param {SubmitEvent} event */
	function add(event) {
		event.preventDefault();
		const code = cleanLanguage(picked === OTHER ? custom : picked);
		const base = cleanLanguage(original);
		if (!code) return void (error = 'Pick a language.');
		if (code === base)
			return void (error = 'The localization needs another language than the original.');
		if (variants.includes(code))
			return void (error = `This dialogue already has ${languageName(code)}.`);
		if (base !== (graph.language ?? '') && !editor.setOriginalLanguage(base))
			return void (error = `${languageName(base)} is already a localization of this dialogue.`);
		if (!editor.addLocalization(code)) return void (error = 'Could not add this language.');
		dialog?.close();
	}

	/** Summary of what a sync would delete, or "" when nothing. @param {ReturnType<typeof editor.previewSync>['removed']} removed */
	function describeRemoval({ lines, choices }) {
		/** @param {number} n @param {string} word */
		const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
		const parts = [];
		if (lines.length) {
			const ids = lines.slice(0, MAX_LISTED).map((line) => line.id);
			const more = lines.length > MAX_LISTED ? `, … (+${lines.length - MAX_LISTED})` : '';
			parts.push(`${count(lines.length, 'line')} (${ids.join(', ')}${more})`);
		}
		if (choices.length) {
			const ids = choices.slice(0, MAX_LISTED).map((choice) => `${choice.lineId}/${choice.id}`);
			const more = choices.length > MAX_LISTED ? `, … (+${choices.length - MAX_LISTED})` : '';
			parts.push(`${count(choices.length, 'choice')} (${ids.join(', ')}${more})`);
		}
		return parts.join(' and ');
	}

	/** Copy the structure of the version on the canvas to other versions. @param {string[]} targets */
	async function sync(targets) {
		open = false;
		const source = label(active);
		const removals = targets
			.map((target) => ({ target, text: describeRemoval(editor.previewSync(target).removed) }))
			.filter((removal) => removal.text);
		const names = targets.map(label).join(', ');

		const ok = await confirm(
			removals.length
				? {
						title: `Remove nodes from ${removals.map((r) => label(r.target)).join(', ')}?`,
						message:
							`${source} does not have ${removals.map((r) => (removals.length > 1 ? `${label(r.target)}: ${r.text}` : r.text)).join('; ')}. ` +
							'Syncing deletes them together with their text. Everything else keeps its text; new lines and choices start empty.',
						confirmLabel: 'Sync and remove',
						danger: true
					}
				: {
						title: `Sync ${names} with ${source}?`,
						message:
							'Sections, lines, choices, arrows, speakers and custom keys are copied. Existing lines and choices keep their text; new ones start empty.',
						confirmLabel: 'Sync'
					}
		);
		if (ok) for (const target of targets) editor.syncTo(target);
	}

	/** @param {string} variant */
	async function remove(variant) {
		open = false;
		const ok = await confirm({
			title: `Delete the ${languageName(variant)} localization?`,
			message: `Its translated text for “${graph.name}” is lost. The original and other languages stay as they are.`,
			confirmLabel: 'Delete',
			danger: true
		});
		if (ok) editor.removeLocalization(variant);
	}

	/** @param {MouseEvent} event */
	function onWindowClick(event) {
		if (open && root && !root.contains(/** @type {Node} */ (event.target))) open = false;
	}

	const item =
		'flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-stone-50 focus:bg-stone-50 focus:outline-none';
</script>

<svelte:window
	onclick={onWindowClick}
	onkeydown={(event) => event.key === 'Escape' && (open = false)}
/>

<div class="relative" bind:this={root}>
	<Button
		variant="ghost"
		size="sm"
		onclick={() => (open = !open)}
		aria-haspopup="menu"
		aria-expanded={open}
		title="Localized versions of “{graph.name}”"
	>
		<Icon name="language" class="size-4" />
		<span class="hidden max-w-[9rem] truncate lg:inline">
			{variants.length > 1 || active !== ORIGINAL ? label(active) : 'Languages'}
		</span>
		<span class="text-[10px] text-stone-400" aria-hidden="true">▾</span>
	</Button>

	{#if open}
		<div
			role="menu"
			class="absolute right-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-stone-200"
		>
			<p class="truncate px-4 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-stone-400">
				{graph.name}
			</p>
			{#each variants as variant (variant)}
				{@const current = variant === active}
				<div class="group flex items-center pr-2 {current ? 'bg-accent-50' : ''}">
					<button
						type="button"
						role="menuitemradio"
						aria-checked={current}
						onclick={() => {
							open = false;
							editor.selectLanguage(variant);
						}}
						class="{item} min-w-0 flex-1 {current
							? 'font-medium text-accent-700 hover:bg-accent-50'
							: 'text-stone-800'}"
					>
						<Icon name="check" class="size-4 shrink-0 {current ? '' : 'invisible'}" />
						<span class="truncate">{label(variant)}</span>
						{#if variant !== ORIGINAL}
							<span class="ml-auto font-mono text-xs text-stone-400">{variant}</span>
						{/if}
					</button>
					{#if variant !== ORIGINAL}
						<button
							type="button"
							onclick={() => remove(variant)}
							aria-label="Delete the {languageName(variant)} localization"
							title="Delete this localization"
							class="rounded p-1 text-stone-400 opacity-0 hover:bg-white hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
						>
							<Icon name="trash" class="size-4" />
						</button>
					{/if}
				</div>
			{/each}

			<div class="my-1 border-t border-stone-100"></div>
			<button type="button" role="menuitem" onclick={openAdd} class="{item} text-stone-800">
				<Icon name="plus" class="size-4 shrink-0" />
				<span>
					<span class="block font-medium">Add localization…</span>
					<span class="block text-xs text-stone-500"
						>Same structure as {label(active)}, no text</span
					>
				</span>
			</button>

			{#if others.length}
				<div class="my-1 border-t border-stone-100"></div>
				<p class="px-4 pb-1 pt-1 text-xs font-medium uppercase tracking-wide text-stone-400">
					Sync structure of {label(active)} to
				</p>
				{#each others as target (target)}
					<button
						type="button"
						role="menuitem"
						onclick={() => sync([target])}
						class="{item} text-stone-800"
					>
						<Icon name="sync" class="size-4 shrink-0" />
						<span class="truncate">{label(target)}</span>
					</button>
				{/each}
				{#if others.length > 1}
					<button
						type="button"
						role="menuitem"
						onclick={() => sync(others)}
						class="{item} text-stone-800"
					>
						<Icon name="sync" class="size-4 shrink-0" />
						<span>All other versions</span>
					</button>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<dialog
	bind:this={dialog}
	class="w-full max-w-sm rounded-xl bg-white p-0 shadow-xl backdrop:bg-stone-900/40 backdrop:backdrop-blur-sm"
>
	<form onsubmit={add}>
		<div class="space-y-4 p-5">
			<div>
				<h2 class="text-base font-semibold text-stone-900">Add a localization</h2>
				<p class="mt-1 text-sm text-stone-600">
					A copy of “{graph.name}” with the structure of {label(active)} and empty text, ready to translate.
					The original text is shown as a hint in empty fields.
				</p>
			</div>

			<label class="block text-sm font-medium text-stone-700">
				Language
				<select bind:value={picked} class="{input} mt-1">
					{#each choices as code (code)}
						<option value={code}>{languageName(code)} ({code})</option>
					{/each}
					<option value={OTHER}>Other (enter a code)…</option>
				</select>
			</label>
			{#if picked === OTHER}
				<label class="block text-sm font-medium text-stone-700">
					Language code
					<input
						bind:value={custom}
						placeholder="e.g. en-GB, pt-PT, x-pirate"
						spellcheck="false"
						class="{input} mt-1 font-mono"
					/>
				</label>
			{/if}

			<label class="block text-sm font-medium text-stone-700">
				Original language
				<select bind:value={original} class="{input} mt-1">
					<option value="">Not set</option>
					{#if original && !LANGUAGE_CODES.includes(original)}
						<option value={original}>{languageName(original)} ({original})</option>
					{/if}
					{#each LANGUAGE_CODES as code (code)}
						<option value={code}>{languageName(code)} ({code})</option>
					{/each}
				</select>
				<span class="mt-1 block text-xs font-normal text-stone-500">
					The language “{graph.name}” was written in.
				</span>
			</label>

			{#if error}
				<p class="text-sm text-red-600" role="alert">{error}</p>
			{/if}
		</div>
		<div class="flex justify-end gap-2 rounded-b-xl bg-stone-50 px-5 py-3">
			<Button variant="secondary" type="button" onclick={() => dialog?.close()}>Cancel</Button>
			<Button variant="primary" type="submit">Add localization</Button>
		</div>
	</form>
</dialog>
