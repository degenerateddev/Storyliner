<script>
	import { onMount, tick } from 'svelte';
	import { Handle, Position, useSvelteFlow, useUpdateNodeInternals } from '@xyflow/svelte';
	import { getEditor } from '$lib/story/store.svelte.js';
	import { characterColor } from '$lib/story/characters';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { getCanvasActions } from './canvas-actions';

	/** @type {{ id: string, data: any, selected?: boolean }} */
	let { id, data, selected = false } = $props();

	const editor = getEditor();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();
	const actions = getCanvasActions();

	/** @type {{ id: string, text: string }[]} */
	const choices = $derived(data.choices ?? []);

	// Choice handles come and go with their rows, so Svelte Flow has to re-measure them.
	const handleKey = $derived(JSON.stringify(choices.map((choice) => choice.id)));
	$effect(() => {
		void handleKey;
		tick().then(() => updateNodeInternals(id));
	});

	/** @type {HTMLDivElement | undefined} */
	let choiceList = $state();

	async function addChoice() {
		const choiceId = actions.addChoice(id);
		await tick();
		/** @type {HTMLInputElement | null | undefined} */ (
			choiceList?.querySelector(`[data-choice="${CSS.escape(choiceId)}"]`)
		)?.focus();
	}

	/** @param {string} choiceId @param {string} text */
	const setChoiceText = (choiceId, text) =>
		updateNodeData(id, {
			choices: choices.map((choice) => (choice.id === choiceId ? { ...choice, text } : choice))
		});

	/**
	 * Commit an edited id; an empty or duplicate id is rejected and the old one restored.
	 * @param {HTMLInputElement} input
	 * @param {(value: string) => boolean} rename
	 * @param {string} current
	 */
	function commitId(input, rename, current) {
		if (rename(input.value)) return;
		input.value = current;
		input.animate(
			[
				{ transform: 'translateX(0)' },
				{ transform: 'translateX(-3px)' },
				{ transform: 'translateX(3px)' },
				{ transform: 'translateX(0)' }
			],
			{ duration: 200 }
		);
	}

	/** @param {KeyboardEvent & { currentTarget: HTMLInputElement }} event @param {string} current */
	function idKeydown(event, current) {
		if (event.key === 'Enter') event.currentTarget.blur();
		if (event.key === 'Escape') {
			event.currentTarget.value = current;
			event.currentTarget.blur();
		}
	}

	const characterId = $derived(data.character?.id ?? '');
	const known = $derived(editor.character(characterId));
	const name = $derived(known?.name ?? data.character?.name ?? 'Narrator');
	const color = $derived(characterColor(characterId || undefined));

	/** @type {HTMLTextAreaElement | undefined} */
	let textarea;
	onMount(() => {
		// Svelte Flow hides nodes until they are measured, so wait a frame before focusing.
		if (data.focus) requestAnimationFrame(() => requestAnimationFrame(() => textarea?.focus()));
	});

	/** @param {Event & { currentTarget: HTMLSelectElement }} event */
	function changeCharacter(event) {
		const character = editor.character(event.currentTarget.value);
		updateNodeData(id, { character: character ? { ...character } : null });
	}
</script>

<div
	class="group relative w-64 rounded-lg bg-white shadow-sm ring-1 transition-shadow hover:shadow-md {selected
		? 'ring-2 ring-accent-500'
		: 'ring-stone-300'}"
>
	<div
		class="flex cursor-move items-center gap-2 rounded-t-lg px-3 py-1.5"
		style:background-color={color}
	>
		<select
			value={characterId}
			onchange={changeCharacter}
			aria-label="Speaker"
			class="nodrag min-w-0 max-w-[11rem] cursor-pointer appearance-none truncate border-0 bg-transparent !bg-none p-0 pr-1 text-xs font-semibold uppercase tracking-wide text-white [field-sizing:content] focus:ring-0"
		>
			<option value="" class="text-stone-900">Narrator</option>
			{#if characterId && !known}
				<option value={characterId} class="text-stone-900">{name} (deleted)</option>
			{/if}
			{#each editor.characters as character (character.id)}
				<option value={character.id} class="text-stone-900">{character.name}</option>
			{/each}
		</select>
		<span class="-ml-1 text-[10px] text-white/80" aria-hidden="true">▾</span>
		<span class="flex-1"></span>
		<input
			value={id}
			onblur={(event) =>
				commitId(event.currentTarget, (value) => actions.renameLine(id, value), id)}
			onkeydown={(event) => idKeydown(event, id)}
			aria-label="Line id"
			title="Line id – click to edit"
			spellcheck="false"
			class="nodrag min-w-[1.5rem] max-w-[6rem] rounded border-0 bg-black/15 px-1.5 py-0 text-right font-mono text-[10px] text-white [field-sizing:content] placeholder:text-white/60 focus:bg-white focus:text-stone-900 focus:ring-0"
		/>
		<span title="Drag to move"><Icon name="grip" class="size-4 text-white/60" /></span>
	</div>
	<div class="relative">
		<textarea
			bind:this={textarea}
			value={data.content}
			oninput={(event) => updateNodeData(id, { content: event.currentTarget.value })}
			placeholder="Write a line…"
			rows="3"
			class="nodrag nowheel block max-h-64 min-h-[4.5rem] w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-relaxed text-stone-800 [field-sizing:content] placeholder:text-stone-400 focus:ring-0 {choices.length
				? ''
				: 'rounded-b-lg'}"
		></textarea>
		<Handle type="target" position={Position.Left} />
		<Handle type="source" position={Position.Right} />
	</div>

	{#if choices.length}
		<div bind:this={choiceList} class="border-t border-stone-200 pb-3">
			<p class="px-3 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
				Choices
			</p>
			{#each choices as choice (choice.id)}
				<div class="relative flex items-center gap-1.5 py-1 pl-3 pr-4">
					<input
						value={choice.id}
						onblur={(event) =>
							commitId(
								event.currentTarget,
								(value) => actions.renameChoice(id, choice.id, value),
								choice.id
							)}
						onkeydown={(event) => idKeydown(event, choice.id)}
						aria-label="Choice id"
						title="Choice id – click to edit"
						spellcheck="false"
						class="nodrag min-w-[1.5rem] max-w-[5rem] shrink-0 rounded border-0 bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-500 [field-sizing:content] focus:bg-white focus:text-stone-900 focus:ring-1 focus:ring-accent-500"
					/>
					<input
						data-choice={choice.id}
						value={choice.text}
						oninput={(event) => setChoiceText(choice.id, event.currentTarget.value)}
						onkeydown={(event) => {
							if (event.key === 'Enter') addChoice();
						}}
						placeholder="Choice text…"
						aria-label="Choice text"
						class="nodrag min-w-0 flex-1 rounded border-0 bg-transparent px-1 py-0.5 text-sm text-stone-800 placeholder:text-stone-400 focus:bg-stone-50 focus:ring-1 focus:ring-accent-500"
					/>
					<button
						type="button"
						onclick={() => actions.removeChoice(id, choice.id)}
						title="Remove choice"
						aria-label="Remove choice"
						class="nodrag rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-red-600"
					>
						<Icon name="x" class="size-3.5" />
					</button>
					<Handle type="source" position={Position.Right} id={choice.id} />
				</div>
			{/each}
		</div>
	{/if}

	<button
		type="button"
		onclick={addChoice}
		title="Add a player choice"
		aria-label="Add a player choice"
		class="nodrag absolute -bottom-3 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full bg-white text-stone-500 shadow ring-1 ring-stone-300 transition hover:bg-accent-600 hover:text-white hover:ring-accent-600 {selected
			? 'opacity-100'
			: 'opacity-60 group-hover:opacity-100'}"
	>
		<Icon name="plus" class="size-4" />
	</button>
</div>
