<script>
	import { untrack } from 'svelte';
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import { beforeNavigate, goto } from '$app/navigation';
	import { EditorStore, setEditor } from '$lib/story/store.svelte.js';
	import Canvas from './Canvas.svelte';
	import CharacterPanel from './CharacterPanel.svelte';
	import Toolbar from './Toolbar.svelte';

	/** @type {{ data: ConstructorParameters<typeof EditorStore>[0] }} */
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

	// Save before going to another page of the app, so it shows the current names.
	// A failed save does not block: the changes stay in the local cache and are retried.
	let leaving = false;
	beforeNavigate(({ to, cancel, type }) => {
		if (leaving || type === 'leave' || !to || !editor.hasUnsavedChanges) return;
		cancel();
		leaving = true;
		// `to.url` is the navigation SvelteKit already resolved.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		editor.flush().finally(() => goto(to.url));
	});
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
