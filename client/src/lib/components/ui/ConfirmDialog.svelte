<script>
	import Button from './Button.svelte';
	import { dialog } from './confirm.svelte.js';

	/** @type {HTMLDialogElement | undefined} */
	let element = $state();

	$effect(() => {
		if (!element) return;
		if (dialog.current && !element.open) element.showModal();
		if (!dialog.current && element.open) element.close();
	});
</script>

<dialog
	bind:this={element}
	onclose={() => dialog.current?.resolve(false)}
	class="w-full max-w-sm rounded-xl bg-white p-0 shadow-xl backdrop:bg-stone-900/40 backdrop:backdrop-blur-sm"
>
	{#if dialog.current}
		{@const current = dialog.current}
		<div class="p-5">
			<h2 class="text-base font-semibold text-stone-900">{current.title}</h2>
			{#if current.message}
				<p class="mt-2 text-sm text-stone-600">{current.message}</p>
			{/if}
		</div>
		<div class="flex justify-end gap-2 rounded-b-xl bg-stone-50 px-5 py-3">
			<Button variant="secondary" onclick={() => current.resolve(false)}>Cancel</Button>
			<Button
				variant={current.danger ? 'danger' : 'primary'}
				autofocus
				onclick={() => current.resolve(true)}
			>
				{current.confirmLabel ?? 'Confirm'}
			</Button>
		</div>
	{/if}
</dialog>
