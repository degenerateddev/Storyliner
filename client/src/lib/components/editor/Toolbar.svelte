<script>
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { confirm } from '$lib/components/ui/confirm.svelte.js';
	import { getEditor } from '$lib/story/store.svelte.js';
	import ExportMenu from './ExportMenu.svelte';
	import GraphTabs from './GraphTabs.svelte';
	import PresetsDialog from './PresetsDialog.svelte';

	/** @type {{ panelOpen: boolean }} */
	let { panelOpen = $bindable() } = $props();

	const editor = getEditor();

	/** @type {HTMLInputElement | undefined} */
	let fileInput;
	let importError = $state('');
	let presetsOpen = $state(false);

	const statusText = $derived(
		{
			saved: 'All changes saved',
			saving: 'Saving…',
			error: 'Not saved',
			offline: 'Offline'
		}[editor.status]
	);

	/** @param {Event & { currentTarget: HTMLInputElement }} event */
	async function importStory(event) {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file) return;

		let story;
		try {
			story = JSON.parse(await file.text());
		} catch {
			importError = `“${file.name}” is not valid JSON.`;
			return;
		}
		if (!Array.isArray(story?.graphs) && !Array.isArray(story?.sections)) {
			importError = `“${file.name}” is not a Storyliner story (no "graphs" or "sections").`;
			return;
		}
		importError = '';

		const ok = await confirm({
			title: 'Replace the current story?',
			message: `The canvas will be replaced with “${file.name}”. Export the current story first if you want to keep it.`,
			confirmLabel: 'Replace',
			danger: true
		});
		if (ok) editor.load(story);
	}
</script>

<header class="flex h-14 shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-3">
	<Button
		variant="ghost"
		size="sm"
		onclick={() => (panelOpen = !panelOpen)}
		aria-label={panelOpen ? 'Hide sidebar' : 'Show sidebar'}
		aria-pressed={panelOpen}
	>
		<Icon name="panel" />
	</Button>

	<span class="hidden font-display text-xl text-accent-600 sm:block">Storyliner</span>
	<span class="hidden h-6 w-px bg-stone-200 sm:block"></span>

	<input
		bind:value={editor.info.name}
		aria-label="Story name"
		class="h-9 min-w-0 max-w-xs flex-1 rounded-md border-transparent bg-transparent px-2 text-sm font-semibold text-stone-900 hover:border-stone-200 focus:border-accent-500 focus:ring-accent-500"
	/>

	<button
		type="button"
		onclick={() => editor.flush()}
		title={editor.message || 'Ctrl+S to save now'}
		class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium {editor.status ===
		'saved'
			? 'text-stone-500'
			: editor.status === 'saving'
				? 'text-stone-500'
				: 'text-red-600'}"
	>
		<Icon
			name={editor.status === 'saved' ? 'check' : editor.status === 'saving' ? 'cloud' : 'warning'}
			class="size-4 {editor.status === 'saving' ? 'animate-pulse' : ''}"
		/>
		<span class="hidden md:inline">{statusText}</span>
	</button>

	{#if importError}
		<span class="flex items-center gap-1 truncate text-xs text-red-600" role="alert">
			{importError}
			<button
				type="button"
				onclick={() => (importError = '')}
				aria-label="Dismiss"
				class="rounded p-0.5 hover:bg-red-50"
			>
				<Icon name="x" class="size-3.5" />
			</button>
		</span>
	{/if}

	<div class="ml-auto flex items-center gap-1">
		<input
			bind:this={fileInput}
			type="file"
			accept="application/json,.json"
			class="hidden"
			onchange={importStory}
		/>
		<Button
			variant="ghost"
			size="sm"
			onclick={() => fileInput?.click()}
			title="Import a story JSON file"
		>
			<Icon name="upload" class="size-4" /> <span class="hidden lg:inline">Import</span>
		</Button>
		<Button
			variant="ghost"
			size="sm"
			onclick={() => (presetsOpen = true)}
			title="Custom keys for choices and nodes (conditions, effects, moods, ...)"
		>
			<Icon name="tag" class="size-4" /> <span class="hidden lg:inline">Presets</span>
		</Button>
		<ExportMenu />
		<form method="POST" action="/logout">
			<Button type="submit" variant="ghost" size="sm" aria-label="Log out" title="Log out">
				<Icon name="logout" />
			</Button>
		</form>
	</div>
</header>

{#if editor.graphs.length > 1}
	<GraphTabs />
{/if}

<PresetsDialog bind:open={presetsOpen} />
