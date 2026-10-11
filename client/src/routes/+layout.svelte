<script>
	import '../app.css';
	import '@fontsource/bungee-shade';
	import '@fontsource/poppins/400.css';
	import '@fontsource/poppins/500.css';
	import '@fontsource/poppins/600.css';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

	let { children } = $props();
</script>

{@render children()}
<ConfirmDialog />
