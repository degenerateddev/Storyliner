<script>
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import {
		changeFieldType,
		cleanKey,
		cleanOptions,
		FIELD_KINDS,
		FIELD_TYPES,
		fieldValue,
		newId
	} from '$lib/story/model';
	import { getEditor } from '$lib/story/store.svelte.js';

	/** @type {{ open: boolean }} */
	let { open = $bindable() } = $props();

	const editor = getEditor();
	const TYPE_LABELS = { text: 'Text', number: 'Number', boolean: 'Yes/No', dropdown: 'Dropdown' };
	/** @type {Record<import('$lib/story/model').FieldKind, { label: string, example: string }>} */
	const KINDS = {
		choice: { label: 'Choices', example: 'condition' },
		node: { label: 'Nodes', example: 'mood' }
	};
	const KIND_IDS = /** @type {import('$lib/story/model').FieldKind[]} */ (['choice', 'node']);
	const input =
		'rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-900 placeholder:text-stone-400 focus:border-accent-500 focus:ring-accent-500';

	/** @type {HTMLDialogElement | undefined} */
	let element = $state();

	/** Which presets are edited. @type {import('$lib/story/model').FieldKind} */
	let kind = $state('choice');
	/**
	 * Working copy: half-typed keys stay visible here, while only valid ones are saved.
	 * @type {import('$lib/story/model').Preset[]}
	 */
	let draft = $state([]);
	/** True once `draft` holds the current presets, so a stale copy is never saved. */
	let editing = $state(false);

	/** Switch to the presets of `next` (kind and draft change together). @param {import('$lib/story/model').FieldKind} next */
	function edit(next) {
		kind = next;
		draft = structuredClone($state.snapshot(editor.presets(next)));
	}

	$effect(() => {
		if (!element) return;
		if (open && !element.open) {
			edit(kind);
			editing = true;
			element.showModal();
		}
		if (!open && element.open) element.close();
		if (!open) editing = false;
	});

	// Every edit is saved right away with the story.
	$effect(() => {
		const presets = $state.snapshot(draft);
		if (editing) editor.setPresets(kind, presets);
	});

	function addPreset() {
		draft.push({
			id: newId(),
			name: `Preset ${draft.length + 1}`,
			default: draft.length === 0,
			fields: [{ key: KINDS[kind].example, type: 'text', value: '' }]
		});
	}

	/** @param {import('$lib/story/model').Preset} preset */
	function addField(preset) {
		let n = 1;
		while (preset.fields.some((field) => field.key === `key${n}`)) n++;
		preset.fields.push({ key: `key${n}`, type: 'text', value: '' });
	}

	/** @param {import('$lib/story/model').Preset} preset */
	function toggleDefault(preset) {
		const isDefault = !preset.default;
		for (const other of draft) other.default = false;
		preset.default = isDefault;
	}

	/**
	 * Why a key will not be saved, if it will not.
	 * @param {import('$lib/story/model').Preset} preset
	 * @param {number} index
	 */
	function keyProblem(preset, index) {
		const { reserved } = FIELD_KINDS[kind];
		const raw = preset.fields[index].key;
		const key = cleanKey(raw, reserved);
		if (!key)
			return reserved.includes(raw.trim()) ? `"${raw.trim()}" is used by Storyliner` : 'Empty';
		if (preset.fields.slice(0, index).some((field) => cleanKey(field.key, reserved) === key))
			return 'Duplicate key';
		return '';
	}

	/** @param {import('$lib/story/model').Field} field @param {string} text - comma separated */
	function setOptions(field, text) {
		field.options = cleanOptions(text);
		field.value = fieldValue('dropdown', field.value, field.options);
	}
</script>

<dialog
	bind:this={element}
	onclose={() => (open = false)}
	class="w-full max-w-xl rounded-xl bg-white p-0 shadow-xl backdrop:bg-stone-900/40 backdrop:backdrop-blur-sm"
>
	<div class="border-b border-stone-200 p-5">
		<div class="flex items-center justify-between gap-3">
			<h2 class="text-base font-semibold text-stone-900">Presets</h2>
			<div class="flex rounded-lg bg-stone-100 p-0.5" role="tablist" aria-label="Presets for">
				{#each KIND_IDS as id (id)}
					<button
						type="button"
						role="tab"
						aria-selected={kind === id}
						onclick={() => edit(id)}
						class="rounded-md px-3 py-1 text-sm font-medium {kind === id
							? 'bg-white text-stone-900 shadow-sm'
							: 'text-stone-500 hover:text-stone-900'}"
					>
						{KINDS[id].label}
					</button>
				{/each}
			</div>
		</div>
		<p class="mt-2 text-sm text-stone-600">
			{#if kind === 'choice'}
				A preset is a set of custom keys – e.g. <code class="font-mono text-xs">condition</code> to
				lock a choice behind a stat, or <code class="font-mono text-xs">effect</code> for what it
				does. Apply presets with the
				<Icon name="tag" class="inline size-4 align-text-bottom" /> button on a choice; the default preset
				is added to every new choice. Any choice can also get keys of its own.
			{:else}
				A preset is a set of custom keys for dialogue nodes – e.g. a
				<code class="font-mono text-xs">mood</code> dropdown for the speaker's expression, or an
				<code class="font-mono text-xs">audio</code> file. Apply presets with the
				<Icon name="tag" class="inline size-4 align-text-bottom" /> button in a node's header; the default
				preset is added to every new node. Any node can also get keys of its own.
			{/if}
		</p>
	</div>

	<div class="max-h-[60vh] space-y-3 overflow-y-auto p-5">
		{#each draft as preset, presetIndex (preset.id)}
			<section class="rounded-lg p-3 ring-1 ring-stone-200">
				<div class="flex items-center gap-2">
					<input
						bind:value={preset.name}
						aria-label="Preset name"
						placeholder="Preset name"
						class="{input} min-w-0 flex-1 font-medium"
					/>
					<button
						type="button"
						onclick={() => toggleDefault(preset)}
						aria-pressed={preset.default}
						title="New {kind === 'choice'
							? 'choices'
							: 'nodes'} start with the keys of the default preset"
						class="rounded-full px-2.5 py-1 text-xs font-medium ring-1 {preset.default
							? 'bg-accent-600 text-white ring-accent-600'
							: 'text-stone-500 ring-stone-300 hover:text-stone-900'}"
					>
						Default
					</button>
					<button
						type="button"
						onclick={() => draft.splice(presetIndex, 1)}
						aria-label="Delete preset {preset.name}"
						title="Delete preset ({kind === 'choice' ? 'choices' : 'nodes'} keep their keys)"
						class="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-red-600"
					>
						<Icon name="trash" class="size-4" />
					</button>
				</div>

				{#if preset.fields.length}
					<div
						class="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5"
					>
						<span class="text-xs font-medium text-stone-500">Key</span>
						<span class="text-xs font-medium text-stone-500">Type</span>
						<span class="text-xs font-medium text-stone-500">Default value</span>
						<span></span>
						{#each preset.fields as field, index (index)}
							{@const problem = keyProblem(preset, index)}
							<input
								bind:value={field.key}
								aria-label="Key"
								aria-invalid={!!problem}
								title={problem || 'Key'}
								spellcheck="false"
								class="{input} font-mono {problem ? '!border-red-400' : ''}"
							/>
							<select
								value={field.type}
								onchange={(event) =>
									(preset.fields[index] = changeFieldType(
										$state.snapshot(field),
										/** @type {import('$lib/story/model').FieldType} */ (event.currentTarget.value)
									))}
								aria-label="Type"
								class="{input} pr-8"
							>
								{#each FIELD_TYPES as type (type)}
									<option value={type}>{TYPE_LABELS[type]}</option>
								{/each}
							</select>
							{#if field.type === 'boolean'}
								<label class="flex items-center gap-2 px-1 text-sm text-stone-600">
									<input
										type="checkbox"
										checked={field.value === true}
										onchange={(event) => (field.value = event.currentTarget.checked)}
										class="rounded border-stone-300 text-accent-600 focus:ring-accent-500"
									/>
									{field.value ? 'true' : 'false'}
								</label>
							{:else if field.type === 'dropdown'}
								<select bind:value={field.value} aria-label="Default value" class="{input} pr-8">
									<option value="">(none)</option>
									{#each field.options ?? [] as option (option)}
										<option value={option}>{option}</option>
									{/each}
								</select>
							{:else if field.type === 'number'}
								<input
									type="number"
									bind:value={field.value}
									aria-label="Default value"
									class={input}
								/>
							{:else}
								<input
									bind:value={field.value}
									aria-label="Default value"
									placeholder="(empty)"
									class={input}
								/>
							{/if}
							<button
								type="button"
								onclick={() => preset.fields.splice(index, 1)}
								aria-label="Remove key"
								class="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-red-600"
							>
								<Icon name="x" class="size-4" />
							</button>
							{#if field.type === 'dropdown'}
								<input
									value={(field.options ?? []).join(', ')}
									onchange={(event) => setOptions(field, event.currentTarget.value)}
									aria-label="Options of {field.key}"
									placeholder="Options, comma separated – e.g. happy, sad, angry"
									spellcheck="false"
									class="{input} col-span-3 mb-1 text-xs"
								/>
								<span></span>
							{/if}
						{/each}
					</div>
				{/if}
				<Button variant="ghost" size="sm" class="mt-2" onclick={() => addField(preset)}>
					<Icon name="plus" class="size-4" /> Key
				</Button>
			</section>
		{:else}
			<p class="py-4 text-center text-sm text-stone-500">No presets yet.</p>
		{/each}
		<Button variant="secondary" size="sm" onclick={addPreset}>
			<Icon name="plus" class="size-4" /> New preset
		</Button>
	</div>

	<div class="flex justify-end rounded-b-xl bg-stone-50 px-5 py-3">
		<Button onclick={() => (open = false)}>Done</Button>
	</div>
</dialog>
