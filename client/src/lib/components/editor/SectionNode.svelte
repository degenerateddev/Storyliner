<script>
	import { NodeResizer, useSvelteFlow } from '@xyflow/svelte';

	/** @type {{ id: string, data: any, selected?: boolean }} */
	let { id, data, selected = false } = $props();

	const { updateNodeData } = useSvelteFlow();
	let editing = $state(false);

	/** @param {HTMLInputElement} input */
	function rename(input) {
		const label = input.value.trim();
		if (label && label !== data.label) updateNodeData(id, { label });
		editing = false;
	}

	/** @param {HTMLInputElement} input */
	function focusAndSelect(input) {
		input.focus();
		input.select();
	}
</script>

<NodeResizer minWidth={320} minHeight={200} isVisible={selected} color="#d81e5b" />

<div
	class="h-full w-full rounded-xl border-2 bg-accent-50/50 transition-colors {selected
		? 'border-accent-500'
		: 'border-dashed border-accent-300'}"
>
	<div class="flex h-11 items-center px-4">
		{#if editing}
			<input
				use:focusAndSelect
				value={data.label}
				aria-label="Section name"
				onblur={(/** @type {any} */ event) => rename(event.currentTarget)}
				onkeydown={(/** @type {any} */ event) => {
					if (event.key === 'Enter') rename(event.currentTarget);
					if (event.key === 'Escape') editing = false;
				}}
				class="nodrag h-8 w-64 rounded-md border-accent-300 px-2 text-sm font-semibold text-accent-800 focus:border-accent-500 focus:ring-accent-500"
			/>
		{:else}
			<button
				type="button"
				ondblclick={() => (editing = true)}
				title="Double-click to rename"
				class="truncate text-sm font-semibold uppercase tracking-wider text-accent-700"
			>
				{data.label}
			</button>
		{/if}
	</div>
</div>
