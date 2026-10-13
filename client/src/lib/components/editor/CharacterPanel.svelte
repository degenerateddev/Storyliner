<script>
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { confirm } from '$lib/components/ui/confirm.svelte.js';
	import { getEditor } from '$lib/story/store.svelte.js';
	import { CHARACTER_MIME, characterColor } from '$lib/story/characters';
	import DialogueList from './DialogueList.svelte';

	const editor = getEditor();

	let name = $state('');
	let meta = $state('');
	/** @type {string | null} */
	let editingId = $state(null);
	let editName = $state('');
	let editMeta = $state('');

	/** @param {SubmitEvent} event */
	async function add(event) {
		event.preventDefault();
		if (!name.trim()) return;
		await editor.addCharacter(name.trim(), meta.trim());
		name = '';
		meta = '';
	}

	/** @param {import('$lib/story/model').Character} character */
	function startEdit(character) {
		editingId = character.id;
		editName = character.name;
		editMeta = character.meta;
	}

	/** @param {SubmitEvent} event */
	async function saveEdit(event) {
		event.preventDefault();
		if (!editingId || !editName.trim()) return;
		const id = editingId;
		editingId = null;
		await editor.updateCharacter(id, { name: editName.trim(), meta: editMeta.trim() });
	}

	/** @param {import('$lib/story/model').Character} character */
	async function remove(character) {
		const ok = await confirm({
			title: `Delete “${character.name}”?`,
			message: 'Lines already written for this character stay on the canvas.',
			confirmLabel: 'Delete',
			danger: true
		});
		if (ok) await editor.removeCharacter(character.id);
	}

	/**
	 * @param {DragEvent} event
	 * @param {string} id
	 */
	function onDragStart(event, id) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData(CHARACTER_MIME, id);
		event.dataTransfer.effectAllowed = 'copy';
	}
</script>

<aside class="flex h-full w-72 shrink-0 flex-col border-r border-stone-200 bg-white">
	<DialogueList />
	<div class="border-b border-stone-200 p-4">
		<h2 class="text-sm font-semibold text-stone-900">Characters</h2>
		<form onsubmit={add} class="mt-3 space-y-2">
			<Input bind:value={name} placeholder="Name" aria-label="Character name" autocomplete="off" />
			<Input
				bind:value={meta}
				multiline
				placeholder="Notes (optional)"
				aria-label="Character notes"
			/>
			<Button type="submit" class="w-full" disabled={!name.trim()}>
				<Icon name="plus" class="size-4" /> Add character
			</Button>
		</form>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto p-2">
		{#if editor.characters.length === 0}
			<p class="px-2 py-6 text-center text-sm text-stone-500">No characters yet.</p>
		{:else}
			<p class="px-2 pb-2 pt-1 text-xs text-stone-500">
				Drag a character onto the canvas to add a line.
			</p>
			<ul class="space-y-1">
				{#each editor.characters as character (character.id)}
					<li>
						{#if editingId === character.id}
							<form
								onsubmit={saveEdit}
								class="space-y-2 rounded-lg bg-stone-50 p-2 ring-1 ring-stone-200"
							>
								<Input bind:value={editName} aria-label="Character name" autofocus />
								<Input
									bind:value={editMeta}
									multiline
									placeholder="Notes"
									aria-label="Character notes"
								/>
								<div class="flex justify-end gap-1">
									<Button variant="ghost" size="sm" onclick={() => (editingId = null)}
										>Cancel</Button
									>
									<Button type="submit" size="sm" disabled={!editName.trim()}>Save</Button>
								</div>
							</form>
						{:else}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								draggable="true"
								ondragstart={(event) => onDragStart(event, character.id)}
								title={character.meta || 'Drag onto the canvas'}
								class="group flex cursor-grab items-center gap-2 rounded-lg px-2 py-2 hover:bg-stone-100 active:cursor-grabbing"
							>
								<Icon
									name="grip"
									class="size-4 shrink-0 text-stone-300 group-hover:text-stone-400"
								/>
								<span
									class="size-3 shrink-0 rounded-full"
									style:background-color={characterColor(character.id)}
								></span>
								<span class="min-w-0 flex-1">
									<span class="block truncate text-sm font-medium text-stone-800"
										>{character.name}</span
									>
									{#if character.meta}
										<span class="block truncate text-xs text-stone-500">{character.meta}</span>
									{/if}
								</span>
								<span
									class="flex opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
								>
									<button
										type="button"
										onclick={() => startEdit(character)}
										aria-label="Edit {character.name}"
										class="rounded p-1 text-stone-500 hover:bg-white hover:text-stone-900"
									>
										<Icon name="pencil" class="size-4" />
									</button>
									<button
										type="button"
										onclick={() => remove(character)}
										aria-label="Delete {character.name}"
										class="rounded p-1 text-stone-500 hover:bg-white hover:text-red-600"
									>
										<Icon name="trash" class="size-4" />
									</button>
								</span>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</aside>
