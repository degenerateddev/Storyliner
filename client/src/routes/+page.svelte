<script>
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { confirm } from '$lib/components/ui/confirm.svelte.js';

	let { data } = $props();

	let busy = $state(false);
	let error = $state('');

	/** @type {HTMLInputElement | undefined} */
	let fileInput;

	const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
	/** @type {[Intl.RelativeTimeFormatUnit, number][]} */
	const units = [
		['year', 31536000],
		['month', 2592000],
		['week', 604800],
		['day', 86400],
		['hour', 3600],
		['minute', 60]
	];

	/** @param {string} iso */
	function edited(iso) {
		const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
		for (const [unit, size] of units) {
			if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
		}
		return 'just now';
	}

	/** @param {number} n @param {string} word */
	const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

	/** @param {{ ok: boolean, status: number }} result @param {string} message */
	function failed(result, message) {
		if (result.status === 401) goto(resolve('/auth'));
		error = result.status === 0 ? 'Server unreachable – try again later.' : message;
	}

	/** @param {{ name?: string, json?: unknown }} [body] */
	async function create(body) {
		busy = true;
		const result = await api.createProject(body);
		busy = false;
		if (result.ok) goto(resolve('/projects/[id]', { id: String(result.data.id) }));
		else failed(result, 'Could not create the story.');
	}

	/** @param {Event & { currentTarget: HTMLInputElement }} event */
	async function importStory(event) {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file) return;

		let story;
		try {
			story = JSON.parse(await file.text());
		} catch {
			error = `“${file.name}” is not valid JSON.`;
			return;
		}
		if (!Array.isArray(story?.graphs) && !Array.isArray(story?.sections)) {
			error = `“${file.name}” is not a Storyliner story (no "graphs" or "sections").`;
			return;
		}
		error = '';
		if (!story.name) story.name = file.name.replace(/\.json$/i, '');
		create({ json: story });
	}

	/** @param {import('./$types').PageData['projects'][number]} project */
	async function remove(project) {
		const ok = await confirm({
			title: `Delete “${project.name}”?`,
			message: `This deletes its ${count(project.dialogues, 'dialogue')} and ${count(project.characters, 'character')}. Export the story first if you want to keep it.`,
			confirmLabel: 'Delete',
			danger: true
		});
		if (!ok) return;
		const result = await api.deleteProject(project.id);
		if (result.ok || result.status === 404) invalidateAll();
		else failed(result, `Could not delete “${project.name}”.`);
	}
</script>

<svelte:head>
	<title>Your stories · Storyliner</title>
</svelte:head>

<div class="min-h-screen bg-stone-50">
	<header class="flex h-14 items-center gap-3 border-b border-stone-200 bg-white px-4">
		<span class="font-display text-xl text-accent-600">Storyliner</span>
		<form method="POST" action="/logout" class="ml-auto">
			<Button type="submit" variant="ghost" size="sm" aria-label="Log out" title="Log out">
				<Icon name="logout" />
			</Button>
		</form>
	</header>

	<main class="mx-auto max-w-5xl px-4 py-8">
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-2xl font-semibold text-stone-900">Your stories</h1>
			<div class="ml-auto flex items-center gap-2">
				<input
					bind:this={fileInput}
					type="file"
					accept="application/json,.json"
					class="hidden"
					onchange={importStory}
				/>
				<Button
					variant="secondary"
					onclick={() => fileInput?.click()}
					disabled={busy}
					title="Create a story from a Storyliner JSON file"
				>
					<Icon name="upload" class="size-4" /> Import
				</Button>
				<Button onclick={() => create()} disabled={busy}>
					<Icon name="plus" class="size-4" /> New story
				</Button>
			</div>
		</div>

		{#if error || data.offline}
			<p
				class="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
				role="alert"
			>
				<Icon name="warning" class="size-4 shrink-0" />
				{error || 'Server unreachable – your stories could not be loaded.'}
			</p>
		{/if}

		{#if data.projects.length === 0 && !data.offline}
			<div
				class="mt-8 flex flex-col items-center rounded-2xl border-2 border-dashed border-stone-200 px-6 py-16 text-center"
			>
				<Icon name="book" class="size-10 text-stone-300" />
				<h2 class="mt-3 font-semibold text-stone-900">No stories yet</h2>
				<p class="mt-1 max-w-sm text-sm text-stone-500">
					Each story has its own dialogues and characters. Create one to start writing.
				</p>
				<Button class="mt-6" onclick={() => create()} disabled={busy}>
					<Icon name="plus" class="size-4" /> New story
				</Button>
			</div>
		{:else}
			<ul class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.projects as project (project.id)}
					<li
						class="group relative rounded-xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:shadow-md hover:ring-accent-300"
					>
						<a
							href={resolve('/projects/[id]', { id: String(project.id) })}
							class="block rounded-xl p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
						>
							<Icon name="book" class="size-6 text-accent-500" />
							<h2 class="mt-3 truncate pr-8 font-semibold text-stone-900">{project.name}</h2>
							<p class="mt-1 text-sm text-stone-500">
								{count(project.dialogues, 'dialogue')} · {count(project.characters, 'character')}
							</p>
							<p class="mt-3 text-xs text-stone-400">Edited {edited(project.updated_at)}</p>
						</a>
						<button
							type="button"
							onclick={() => remove(project)}
							aria-label="Delete {project.name}"
							title="Delete"
							class="absolute right-3 top-3 rounded-md p-1.5 text-stone-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
						>
							<Icon name="trash" class="size-4" />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</main>
</div>
