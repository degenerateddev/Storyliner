<script>
	import Editor from '$lib/components/editor/Editor.svelte';

	let { data } = $props();
</script>

<!-- A new editor (and store) for every story, also when switching stories without leaving the page. -->
{#key data.projectId}
	<Editor {data} />
{/key}
