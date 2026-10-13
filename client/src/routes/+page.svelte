<script>
	import { untrack } from 'svelte';
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import Canvas from '$lib/components/editor/Canvas.svelte';
	import CharacterPanel from '$lib/components/editor/CharacterPanel.svelte';
	import Toolbar from '$lib/components/editor/Toolbar.svelte';
	import { EditorStore, setEditor } from '$lib/story/store.svelte.js';

	let { data } = $props();

	// The editor owns its state after the initial load.
	// svelte-ignore state_referenced_locally
	const editor = setEditor(new EditorStore(data));

	let panelOpen = $state(true);

	// Every change (canvas, graphs, story name, presets) is handed to the store, which debounces the save.
	$effect(() => {
		const story = editor.serialize();
		untrack(() => editor.queueSave(story));
	});

	/** @param {KeyboardEvent} event */
	function onKeydown(event) {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
			event.preventDefault();
			editor.flush();
		}
	}

	/** @param {BeforeUnloadEvent} event */
	function onBeforeUnload(event) {
		if (!editor.hasUnsavedChanges) return;
		editor.flush();
		event.preventDefault();
	}
</script>

<svelte:window onkeydown={onKeydown} onbeforeunload={onBeforeUnload} />
<svelte:head>
	<title>{editor.info.name} · Storyliner</title>
</svelte:head>

<div class="flex h-screen flex-col bg-stone-50">
	<SvelteFlowProvider>
		<Toolbar bind:panelOpen />
		<div class="flex min-h-0 flex-1">
			{#if panelOpen}
				<CharacterPanel />
			{/if}
			<main class="relative min-w-0 flex-1">
				{#key `${editor.revision}:${editor.activeGraphId}`}
					<Canvas />
				{/key}
			</main>
		</div>
	</SvelteFlowProvider>
</div>
