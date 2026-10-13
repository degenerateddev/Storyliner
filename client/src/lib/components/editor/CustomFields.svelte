<script>
	import { tick } from 'svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import {
		applyPreset,
		changeFieldType,
		cleanKey,
		cleanOptions,
		FIELD_KINDS,
		FIELD_TYPES,
		fieldValue
	} from '$lib/story/model';
	import { getEditor } from '$lib/story/store.svelte.js';
	import { commitId, idKeydown } from './id-input';

	/**
	 * Custom keys of one choice or node (e.g. a stat requirement, an effect or a mood).
	 * @type {{
	 *   kind: import('$lib/story/model').FieldKind,
	 *   fields: import('$lib/story/model').Field[],
	 *   onchange: (fields: import('$lib/story/model').Field[]) => void
	 * }}
	 */
	let { kind, fields, onchange } = $props();

	const editor = getEditor();
	const presets = $derived(editor.presets(kind));
	const TYPE_LABELS = { text: 'Abc', number: '123', boolean: 'Yes/No', dropdown: 'List' };

	/** Key whose dropdown options are being edited. @type {string | null} */
	let editingOptions = $state(null);

	/** @type {HTMLDivElement | undefined} */
	let list = $state();

	/** @param {string} selector */
	async function select(selector) {
		await tick();
		/** @type {HTMLInputElement | null | undefined} */ (list?.querySelector(selector))?.select();
	}

	function addKey() {
		let n = 1;
		while (fields.some((field) => field.key === `key${n}`)) n++;
		const key = `key${n}`;
		onchange([...fields, { key, type: 'text', value: '' }]);
		select(`[data-key="${CSS.escape(key)}"]`);
	}

	/**
	 * @param {string} key
	 * @param {(field: import('$lib/story/model').Field) => import('$lib/story/model').Field} change
	 */
	const update = (key, change) =>
		onchange(fields.map((field) => (field.key === key ? change(field) : field)));

	/** Rename a key in place, keeping the order. @param {string} key @param {string} value */
	function renameKey(key, value) {
		const next = cleanKey(value, FIELD_KINDS[kind].reserved);
		if (next === key) return true;
		if (!next || fields.some((field) => field.key === next)) return false;
		update(key, (field) => ({ ...field, key: next }));
		if (editingOptions === key) editingOptions = next;
		return true;
	}

	/** @param {string} key @param {import('$lib/story/model').FieldValue} value */
	const setValue = (key, value) => update(key, (field) => ({ ...field, value }));

	/** @param {import('$lib/story/model').Field} field @param {string} type */
	function setType(field, type) {
		const changed = changeFieldType(
			field,
			/** @type {import('$lib/story/model').FieldType} */ (type)
		);
		update(field.key, () => changed);
		if (changed.type === 'dropdown') {
			editingOptions = field.key;
			select(`[data-options="${CSS.escape(field.key)}"]`);
		} else if (editingOptions === field.key) editingOptions = null;
	}

	/** @param {import('$lib/story/model').Field} field @param {string} text - comma separated */
	function setOptions(field, text) {
		const options = cleanOptions(text);
		update(field.key, () => ({
			...field,
			options,
			value: fieldValue('dropdown', field.value, options)
		}));
	}

	/** @param {string} key */
	const removeKey = (key) => onchange(fields.filter((field) => field.key !== key));

	/** @param {Event & { currentTarget: HTMLSelectElement }} event */
	function applySelected(event) {
		const preset = presets.find((p) => p.id === event.currentTarget.value);
		event.currentTarget.value = '';
		if (preset) onchange(applyPreset(fields, preset));
	}

	const control =
		'nodrag min-w-0 flex-1 rounded border-0 bg-white px-1.5 py-0.5 text-xs text-stone-800 ring-1 ring-stone-200 placeholder:text-stone-400 focus:ring-accent-500';
</script>

<div
	bind:this={list}
	class="mx-3 mb-1 space-y-1 rounded-md bg-stone-50 p-1.5 ring-1 ring-stone-200"
>
	{#each fields as field (field.key)}
		{@const { key, type, value } = field}
		<div class="flex items-center gap-1">
			<input
				data-key={key}
				value={key}
				onblur={(event) => commitId(event.currentTarget, (v) => renameKey(key, v), key)}
				onkeydown={(event) => idKeydown(event, key)}
				aria-label="Key name"
				title="Key – click to rename"
				spellcheck="false"
				class="nodrag w-20 shrink-0 rounded border-0 bg-white px-1.5 py-0.5 font-mono text-[10px] text-stone-600 ring-1 ring-stone-200 focus:text-stone-900 focus:ring-accent-500"
			/>
			<select
				value={type}
				onchange={(event) => setType(field, event.currentTarget.value)}
				aria-label="Value type"
				title="Value type"
				class="nodrag shrink-0 cursor-pointer appearance-none rounded border-0 bg-transparent !bg-none px-1 py-0 text-[10px] text-stone-400 hover:text-stone-700 focus:ring-1 focus:ring-accent-500"
			>
				{#each FIELD_TYPES as option (option)}
					<option value={option}>{TYPE_LABELS[option]}</option>
				{/each}
			</select>
			{#if type === 'boolean'}
				<label class="nodrag flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 px-1">
					<input
						type="checkbox"
						checked={value === true}
						onchange={(event) => setValue(key, event.currentTarget.checked)}
						class="size-3.5 rounded border-stone-300 text-accent-600 focus:ring-accent-500"
					/>
					<span class="text-xs text-stone-500">{value ? 'true' : 'false'}</span>
				</label>
			{:else if type === 'dropdown'}
				<select
					{value}
					onchange={(event) => setValue(key, event.currentTarget.value)}
					aria-label="Value of {key}"
					class="{control} cursor-pointer !bg-none"
				>
					<option value="">–</option>
					{#each field.options ?? [] as option (option)}
						<option value={option}>{option}</option>
					{/each}
				</select>
				<button
					type="button"
					onclick={() => (editingOptions = editingOptions === key ? null : key)}
					title="Edit the options"
					aria-label="Edit the options of {key}"
					aria-expanded={editingOptions === key}
					class="nodrag rounded p-0.5 hover:bg-white hover:text-accent-600 {editingOptions === key
						? 'text-accent-600'
						: 'text-stone-400'}"
				>
					<Icon name="pencil" class="size-3" />
				</button>
			{:else}
				<input
					type={type === 'number' ? 'number' : 'text'}
					{value}
					oninput={(event) => {
						// A number field is briefly empty while typing; keep the last number until then.
						if (type === 'number' && !Number.isFinite(event.currentTarget.valueAsNumber)) return;
						setValue(key, fieldValue(type, event.currentTarget.value));
					}}
					placeholder="value"
					aria-label="Value of {key}"
					spellcheck="false"
					class={control}
				/>
			{/if}
			<button
				type="button"
				onclick={() => removeKey(key)}
				title="Remove key"
				aria-label="Remove key {key}"
				class="nodrag rounded p-0.5 text-stone-400 hover:bg-white hover:text-red-600"
			>
				<Icon name="x" class="size-3" />
			</button>
		</div>
		{#if type === 'dropdown' && editingOptions === key}
			<input
				data-options={key}
				value={(field.options ?? []).join(', ')}
				onchange={(event) => setOptions(field, event.currentTarget.value)}
				onkeydown={(event) => {
					if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur();
				}}
				placeholder="Options, comma separated"
				aria-label="Options of {key}"
				title="Options, comma separated"
				spellcheck="false"
				class="{control} block w-full"
			/>
		{/if}
	{/each}
	<div class="flex items-center gap-2">
		<button
			type="button"
			onclick={addKey}
			class="nodrag flex items-center gap-0.5 rounded px-1 py-0.5 text-[11px] font-medium text-stone-500 hover:bg-white hover:text-accent-600"
		>
			<Icon name="plus" class="size-3" /> Key
		</button>
		{#if presets.length}
			<select
				value=""
				onchange={applySelected}
				aria-label="Apply a preset"
				class="nodrag ml-auto min-w-0 cursor-pointer appearance-none truncate rounded border-0 bg-transparent !bg-none px-1 py-0.5 text-[11px] font-medium text-stone-500 hover:bg-white hover:text-accent-600 focus:ring-1 focus:ring-accent-500"
			>
				<option value="" disabled>Apply preset ▾</option>
				{#each presets as preset (preset.id)}
					<option value={preset.id} class="text-stone-900">{preset.name || 'Untitled'}</option>
				{/each}
			</select>
		{/if}
	</div>
</div>
